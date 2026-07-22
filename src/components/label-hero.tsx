"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { HomeSearch } from "./home-search";
import { CountUp } from "./kinetic";
import { LogoMark } from "./animated-logo";

const HERO_IMG =
  "https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=760&h=1000&q=85";
const CARD_THUMB =
  "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=120&h=150&q=70";

/**
 * Phia-video-style hero, natural-fibre edition: warm paper backdrop, a
 * centred studio photo with ghosted serif type behind it, and the floating
 * label-verdict cards — their "price truth" card become our "fibre truth".
 */
export function LabelHero({
  pieces,
  brands,
  fibres,
}: {
  pieces: number;
  brands: number;
  fibres: number;
}) {
  return (
    <section className="relative overflow-hidden bg-[#f2efe7] dark:bg-[#161a17]">
      <div className="relative mx-auto grid min-h-[86vh] max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
        {/* left: the promise, serif with one italic word */}
        <div className="relative z-20 text-center lg:text-left">
          <div className="mb-5 hidden justify-center lg:flex lg:justify-start">
            <LogoMark size={40} animate />
          </div>
          <h1 className="font-serif text-5xl font-medium leading-[1.06] tracking-tight sm:text-6xl xl:text-7xl">
            Wear more
            <br />
            <span className="italic text-primary">natural</span>, every time
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-[16px] leading-relaxed text-muted-foreground lg:mx-0">
            Most high-street clothing is oil-derived plastic. We read every label, so you
            don&apos;t have to.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 lg:items-start">
            <Link
              href="/analyze"
              data-testid="hero-check-cta"
              className="rounded-full bg-foreground px-8 py-3.5 text-sm font-semibold text-background shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Check any label — it&apos;s free
            </Link>
            <p className="text-xs tracking-wide text-muted-foreground" data-testid="hero-proof">
              <CountUp to={pieces} /> pieces · <CountUp to={brands} /> brands ·{" "}
              <CountUp to={fibres} /> fibres — every label read
            </p>
          </div>
        </div>

        {/* centre: studio photo with ghosted serif behind + floating verdict cards */}
        <div className="relative z-10 mx-auto">
          {/* ghosted oversized serif, tucked behind the photo */}
          <span
            aria-hidden
            className="pointer-events-none absolute -left-24 top-8 z-0 hidden select-none font-serif text-[9rem] italic leading-none text-foreground/[0.06] lg:block"
          >
            linen
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute -right-28 bottom-16 z-0 hidden select-none font-serif text-[9rem] italic leading-none text-foreground/[0.06] lg:block"
          >
            wool
          </span>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-[300px] overflow-hidden rounded-[1.4rem] shadow-2xl shadow-black/10 sm:w-[340px]"
          >
            <Image
              src={HERO_IMG}
              alt="Studio portrait in a natural-fibre tee"
              width={680}
              height={900}
              priority
              className="h-auto w-full object-cover"
            />
          </motion.div>

          {/* the verdict card — Phia's price card, reborn as fibre truth */}
          <motion.div
            initial={{ opacity: 0, y: 16, x: -8 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="float-card absolute -left-10 bottom-14 z-20 flex w-64 items-center gap-3 rounded-2xl bg-white p-3 shadow-xl shadow-black/15 dark:bg-[#222824]"
            data-testid="hero-verdict-card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CARD_THUMB} alt="" aria-hidden className="h-14 w-11 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] uppercase tracking-wide text-muted-foreground">Beaumont Organic</p>
              <p className="truncate text-sm font-medium">Linen Shirt Dress</p>
              <span className="mt-1 inline-block rounded-full bg-grade-a px-2 py-0.5 text-[12px] font-bold text-white">
                100% natural
              </span>
            </div>
            <p className="shrink-0 text-sm font-semibold">£35</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16, x: 8 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="float-card-alt absolute -right-8 top-12 z-20 w-56 rounded-2xl bg-white p-3 shadow-xl shadow-black/15 dark:bg-[#222824]"
          >
            <p className="text-[12px] uppercase tracking-wide text-muted-foreground">Label check</p>
            <p className="mt-0.5 text-sm font-medium">&ldquo;Linen-blend&rdquo; tee</p>
            <span className="mt-1 inline-block rounded-full bg-grade-d px-2 py-0.5 text-[12px] font-bold text-white">
              ⚠ 72% plastic
            </span>
          </motion.div>
        </div>

        {/* right: how it works, whisper-quiet */}
        <div className="relative z-20 mx-auto max-w-xs text-center lg:text-left">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Paste any product link — we pull the label, name the fibres, and flag the
            plastic hiding in &ldquo;natural&rdquo; blends.
          </p>
          <div className="mt-6">
            <HomeSearch />
          </div>
          <Link
            href="/search?pure=1"
            data-testid="hero-pure-cta"
            className="mt-4 inline-block text-xs font-medium tracking-wide text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            or shop 100% plastic-free →
          </Link>
        </div>
      </div>
    </section>
  );
}
