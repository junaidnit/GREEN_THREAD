import Image from "next/image";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * About — the founder's story. Anita wrote and designed this page; her palette
 * and typeface are already the site's (Montserrat + the Fibre Set tones), so it
 * renders in the standard layout with the shared header and footer rather than
 * as a standalone HTML file. Copy is kept verbatim.
 */

const HERO = "https://barnardmohair.com/wp-content/uploads/2024/08/5.jpg";
const GRID = [
  "https://barnardmohair.com/wp-content/uploads/2024/08/1.jpg",
  "https://barnardmohair.com/wp-content/uploads/2024/08/2.jpg",
  "https://barnardmohair.com/wp-content/uploads/2024/08/3.jpg",
];

export const metadata: Metadata = {
  title: "About",
  description:
    "The Fibre Set was built by Anita Barnard, raised in a mohair family in the Eastern Cape — the tool she always wished she'd had for buying natural-fibre-only clothing.",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: "About — The Fibre Set",
    description: "A family history woven with natural fibre.",
    url: `${SITE_URL}/about`,
    images: [{ url: HERO }],
  },
};

export default function AboutPage() {
  return (
    <div>
      {/* full-bleed hero */}
      <div className="relative w-full bg-surface-2" style={{ height: "clamp(240px, 34vw, 430px)" }}>
        <Image
          src={HERO}
          alt="Natural fibre — Alicedale, Eastern Cape"
          fill
          priority
          sizes="100vw"
          className="object-contain"
        />
      </div>

      <div className="mx-auto max-w-[1080px] px-6 py-[clamp(3.5rem,7vw,5.5rem)] sm:px-8">
        <p className="eyebrow mb-5">About — The Fibre Set</p>
        <h1 className="mb-[44px] max-w-[18ch] text-[clamp(2rem,4.6vw,2.75rem)]">
          A family history woven with natural fibre.
        </h1>

        <p className="mb-[22px] max-w-[62ch] font-light">
          For over twenty years I&rsquo;ve tried to buy natural-fibre-only clothing on the high
          street. I was always surprised at how little the shops distinguished between oil-derived
          synthetics and natural fibres &mdash; styled and sold as though they were the same thing.
          Online it was worse: the composition buried, vague, or missing altogether.
        </p>

        <p
          className="my-[52px] max-w-[26ch] text-[clamp(1.375rem,2.4vw,1.5rem)] font-light leading-snug"
          style={{ color: "var(--mauve)" }}
        >
          But the instinct to choose natural was never really a choice for me. It&rsquo;s simply how
          I was raised.
        </p>

        <p className="mb-[22px] max-w-[62ch] font-light">
          I grew up in a mohair family. The Eastern Cape&rsquo;s Angora goats gave the fibre; my
          mother, a fashion designer from Germany, built collections in yarn spun and dyed by hand at
          my father&rsquo;s factory in Alicedale. High-quality, locally made and natural &mdash;
          it&rsquo;s the only way I ever learned to buy.
        </p>

        {/* The founder's own photographs, shown exactly as given — full frame,
            never cropped (object-contain), on the founder's request. */}
        <figure className="my-[52px]">
          <div className="overflow-hidden rounded-sm bg-surface-2">
            <Image
              src="/about/barnard-family.jpg"
              alt="The Barnard family at home in the Eastern Cape"
              width={1046}
              height={854}
              sizes="(max-width: 1080px) 100vw, 1080px"
              className="h-auto w-full object-contain"
              priority
            />
          </div>
          <figcaption className="mt-3 text-[13px] font-light text-muted-foreground">
            My family, at home in the Eastern Cape.
          </figcaption>
        </figure>

        <figure className="my-[44px] flex flex-col items-center gap-5 border-y border-border py-10 sm:flex-row sm:justify-center sm:gap-9">
          <Image
            src="/about/jan-paul-barnard-logo.png"
            alt="Jan Paul Barnard — the original family mark"
            width={295}
            height={185}
            className="h-auto w-[220px] shrink-0 object-contain"
          />
          <figcaption className="max-w-[32ch] text-center text-[14px] font-light leading-relaxed text-muted-foreground sm:text-left">
            My father&rsquo;s original mark &mdash; the woven ribbon our family has carried for
            decades, and the one The Fibre Set still wears.
          </figcaption>
        </figure>

        <div className="my-[52px] grid grid-cols-1 gap-4 sm:grid-cols-3">
          {GRID.map((src) => (
            <div key={src} className="relative bg-surface-2" style={{ height: "clamp(180px, 22vw, 300px)" }}>
              <Image
                src={src}
                alt="Barnard Mohair, Eastern Cape"
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-contain"
              />
            </div>
          ))}
        </div>

        <p className="mb-[22px] max-w-[62ch] font-light">
          So I built The Fibre Set: the tool I always wished I&rsquo;d had, made by someone who has
          spent a lifetime caring about what cloth is actually made of.
        </p>

        <p className="mt-9 text-[clamp(1.125rem,2vw,1.25rem)] font-light">
          Natural fibres, chosen well. The way I was raised to choose them.
          <span className="mt-3.5 block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Anita Barnard &middot; Founder
          </span>
        </p>
      </div>
    </div>
  );
}
