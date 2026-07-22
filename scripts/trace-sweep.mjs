/**
 * Find the most faithful trace the bitmap can yield, by measurement.
 *
 * The idea that makes >native fidelity possible: the master PNG is
 * anti-aliased, and those soft edge pixels encode WHERE BETWEEN two pixels
 * the true boundary sits. A hard threshold at native size rounds that to the
 * pixel grid; upscaling the smooth image first and thresholding at higher
 * resolution recovers the sub-pixel boundary. (This is the opposite of the
 * old bug: upscaling a LOSSY JPEG amplified noise. Upscaling a clean
 * anti-aliased PNG interpolates real signal.)
 *
 * Every candidate is scored the same way: render the traced path back at
 * native resolution, threshold both, count differing pixels.
 *
 * Usage: node scripts/trace-sweep.mjs
 */
import sharp from "sharp";
import potrace from "potrace";

const SRC = "public/brand/logo-source.png";

const meta = await sharp(SRC).metadata();
const W = meta.width, H = meta.height;

// the reference: original at native res, hard-thresholded
const reference = await sharp(SRC)
  .flatten({ background: "#ffffff" })
  .greyscale()
  .threshold(128)
  .raw()
  .toBuffer();

async function score(d, vbW, vbH) {
  const rendered = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${vbW} ${vbH}"><rect width="${vbW}" height="${vbH}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`,
    ),
  )
    .greyscale()
    .threshold(128)
    .raw()
    .toBuffer();
  let diff = 0;
  for (let i = 0; i < reference.length; i++) if (reference[i] !== rendered[i]) diff++;
  return diff;
}

async function traceAt(scale, alphaMax, optTolerance) {
  const pipeline = sharp(SRC).flatten({ background: "#ffffff" }).greyscale();
  const scaled = scale === 1 ? pipeline : pipeline.resize({ width: Math.round(W * scale), kernel: "lanczos3" });
  const { data: png } = await scaled.threshold(128).png().toBuffer({ resolveWithObject: true });

  const svg = await new Promise((resolve, reject) => {
    potrace.trace(
      png,
      { threshold: 128, turdSize: 2 * scale * scale, alphaMax, optTolerance, turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY, color: "black" },
      (err, out) => (err ? reject(err) : resolve(out)),
    );
  });
  const d = svg.match(/d="([^"]+)"/)?.[1];
  if (!d) return null;
  return { d, vbW: Math.round(W * scale), vbH: Math.round(H * scale) };
}

const results = [];
for (const scale of [1, 2, 3]) {
  for (const alphaMax of [0.3, 0.55, 0.8, 1.0]) {
    for (const optTolerance of [0.05, 0.1, 0.2]) {
      const t = await traceAt(scale, alphaMax, optTolerance);
      if (!t) continue;
      const diff = await score(t.d, t.vbW, t.vbH);
      const curves = (t.d.match(/[CcSsQq]/g) ?? []).length;
      const lines = (t.d.match(/[LlHhVv]/g) ?? []).length;
      results.push({ scale, alphaMax, optTolerance, diff, chars: t.d.length, curves, lines });
      console.log(
        `scale=${scale} alphaMax=${alphaMax} tol=${optTolerance}  ` +
        `diff=${String(diff).padStart(5)} px (${((diff / reference.length) * 100).toFixed(4)}%)  ` +
        `${t.d.length} chars, ${curves}c/${lines}l`,
      );
    }
  }
}

results.sort((a, b) => a.diff - b.diff);
console.log("\nBEST:", JSON.stringify(results[0]));
console.log("(current shipped trace: 797 px, 0.0336%)");
