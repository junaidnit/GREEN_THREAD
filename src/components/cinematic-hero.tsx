import Link from "next/link";
import { HomeSearch } from "./home-search";
import { CountUp, RollingWord } from "./kinetic";

const HERO_WORDS = ["linen", "hemp", "TENCEL", "organic cotton", "merino"];

/* lightweight, hotlink-friendly Pexels CDN clips (SD, ~2–7MB each) */
const V = {
  nature: "https://videos.pexels.com/video-files/7211161/7211161-sd_960_540_30fps.mp4",
  weaving: "https://videos.pexels.com/video-files/6653414/6653414-sd_960_506_25fps.mp4",
  waste: "https://videos.pexels.com/video-files/3186589/3186589-sd_960_540_30fps.mp4",
};
const POSTER = {
  nature: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&h=1200&q=70",
  waste: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&h=1200&q=70",
};

/**
 * Cinematic split-screen video hero. Left: nature sourcing ↔ cloth-making
 * crossfade (the sustainable story). Right: a desaturated fast-fashion
 * waste clip (the contrast). Text sits on a heavy scrim for legibility;
 * posters + a graceful degrade mean it looks right even before clips load.
 */
export function CinematicHero({
  pieces,
  brands,
  fibres,
}: {
  pieces: number;
  brands: number;
  fibres: number;
}) {
  const vid = "absolute inset-0 h-full w-full object-cover";
  return (
    <section className="relative h-[92vh] min-h-[560px] w-full overflow-hidden bg-black">
      {/* ── background split ── */}
      <div className="absolute inset-0 grid grid-cols-[1.1fr_0.9fr]">
        {/* sustainable side — sourcing ↔ making */}
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video className={`${vid} cf-a`} autoPlay muted loop playsInline preload="auto" poster={POSTER.nature}>
            <source src={V.nature} type="video/mp4" />
          </video>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video className={`${vid} cf-b`} autoPlay muted loop playsInline preload="auto">
            <source src={V.weaving} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-transparent mix-blend-multiply" />
          <p className="eyebrow absolute bottom-5 left-5 z-10 !text-white/85">Grown &amp; made with care</p>
        </div>

        {/* fast-fashion side — the true cost */}
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            className={`${vid} [filter:grayscale(0.85)_contrast(1.05)_brightness(0.8)]`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={POSTER.waste}
          >
            <source src={V.waste} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/45" />
          <p className="eyebrow absolute bottom-5 right-5 z-10 !text-white/70">The true cost of fast fashion</p>
        </div>
      </div>

      {/* luminous divider */}
      <div className="hero-divider absolute inset-y-0 left-[55%] z-10 w-px bg-white/70 shadow-[0_0_20px_rgba(255,255,255,0.6)]" />

      {/* legibility scrim */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(0,0,0,0.55)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

      {/* ── overlaid content ── */}
      <div className="relative z-20 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-5 text-center text-white">
        <p className="eyebrow !text-white/75">Natural fibres, decoded — no plastic surprises</p>
        <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
          Wear more
          <br />
          <RollingWord words={HERO_WORDS} accentClass="text-[#7fe3b0]" />
        </h1>
        <div className="mt-9 w-full max-w-md">
          <HomeSearch />
        </div>
        <Link
          href="/search?pure=1"
          data-testid="hero-pure-cta"
          className="mt-4 rounded-full border border-white/40 px-5 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-white hover:text-black"
        >
          Shop 100% plastic-free →
        </Link>
        <div className="mt-9 flex gap-10">
          {[
            { n: pieces, label: "pieces" },
            { n: brands, label: "brands" },
            { n: fibres, label: "fibres" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-2xl font-bold">
                <CountUp to={s.n} />
              </p>
              <p className="eyebrow mt-0.5 !text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
