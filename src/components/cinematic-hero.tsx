import Link from "next/link";
import { HomeSearch } from "./home-search";
import { CountUp, RollingWord } from "./kinetic";

const HERO_WORDS = ["linen", "hemp", "organic cotton", "wool", "TENCEL"];

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
 * Editorial dark hero, Phia-style: the story films are ghosted layers behind
 * a serif-italic headline; one light pill CTA is the only accent; social
 * proof sits beside the point of decision. The split (grown-with-care vs
 * fast-fashion waste) survives as a whispered backdrop, not a shout.
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
    <section className="relative min-h-[88vh] w-full overflow-hidden bg-[#0c0f0d]">
      {/* ── ghosted film layers ── */}
      <div className="absolute inset-0 grid grid-cols-2 opacity-40">
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video className={`${vid} cf-a`} autoPlay muted loop playsInline preload="auto" poster={POSTER.nature}>
            <source src={V.nature} type="video/mp4" />
          </video>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video className={`${vid} cf-b`} autoPlay muted loop playsInline preload="auto">
            <source src={V.weaving} type="video/mp4" />
          </video>
        </div>
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            className={`${vid} [filter:grayscale(0.9)_brightness(0.75)]`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={POSTER.waste}
          >
            <source src={V.waste} type="video/mp4" />
          </video>
        </div>
      </div>

      {/* deep editorial scrim — type must float, imagery must whisper */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_42%,rgba(12,15,13,0.42)_0%,rgba(12,15,13,0.85)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0f0d]/70 via-transparent to-[#0c0f0d]" />

      {/* corner captions — the two worlds, named quietly */}
      <p className="eyebrow absolute bottom-6 left-6 z-10 !text-white/50">Grown &amp; made with care</p>
      <p className="eyebrow absolute bottom-6 right-6 z-10 !text-white/40">The true cost of fast fashion</p>

      {/* ── centred editorial content ── */}
      <div className="relative z-20 mx-auto flex min-h-[88vh] max-w-4xl flex-col items-center justify-center px-5 py-24 text-center text-white">
        <p className="eyebrow !text-white/60">Natural fibres, decoded</p>

        <h1 className="mt-6 font-serif text-6xl font-medium leading-[1.04] tracking-tight sm:text-8xl">
          Wear more
          <br />
          <span className="italic">
            <RollingWord words={HERO_WORDS} accentClass="text-[#d9e8d3]" />
          </span>
        </h1>

        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/65">
          Most high-street clothing is oil-derived plastic. We read the labels,
          so you don&apos;t have to.
        </p>

        {/* the one accent: a light pill, Phia-style */}
        <Link
          href="/analyze"
          data-testid="hero-check-cta"
          className="mt-9 rounded-full bg-[#f4f1e9] px-8 py-3.5 text-sm font-semibold text-[#141714] shadow-[0_8px_32px_-8px_rgba(244,241,233,0.45)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Check any label — it&apos;s free
        </Link>

        {/* social proof at the point of decision */}
        <p className="mt-4 text-xs tracking-wide text-white/50" data-testid="hero-proof">
          <CountUp to={pieces} /> pieces · <CountUp to={brands} /> brands ·{" "}
          <CountUp to={fibres} /> fibres — every label read
        </p>

        <div className="mt-10 w-full max-w-md">
          <HomeSearch />
        </div>
        <Link
          href="/search?pure=1"
          data-testid="hero-pure-cta"
          className="mt-4 text-xs font-medium tracking-wide text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          or shop 100% plastic-free →
        </Link>
      </div>
    </section>
  );
}
