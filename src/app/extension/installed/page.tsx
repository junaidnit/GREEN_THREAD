import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're set — The Fibre Set",
  description: "Fabric Check is installed. Here's how to use it on your next shop.",
  robots: { index: false },
};

/**
 * Opened once by the extension's onInstalled handler. The moment after
 * install is the only moment a new user is guaranteed to be paying attention,
 * so this page does one job: get them to pin the icon and try it once.
 */
export default function InstalledPage() {
  return (
    <div className="mx-auto max-w-[760px] px-6 py-24 text-center sm:px-10">
      <span className="eyebrow">Installed</span>
      <h1 className="mx-auto mt-3 max-w-[16ch] font-display text-[40px] leading-tight text-foreground sm:text-[48px]">
        You&apos;re set. Here&apos;s the one-minute version.
      </h1>
      <p className="mx-auto mt-5 max-w-[52ch] text-[16px] font-light leading-relaxed text-muted-foreground">
        Fabric Check reads a product page only when you ask it to — nothing runs in the background.
      </p>

      <ol className="mx-auto mt-14 grid max-w-[640px] gap-8 text-left sm:grid-cols-3">
        {[
          ["Pin the ribbon", "Click the puzzle-piece icon in your toolbar, then the pin beside The Fibre Set. It stays one click away."],
          ["Open any product page", "Any shop — Zara, ASOS, M&S. Your usual browsing, nothing new to learn."],
          ["Click the ribbon", "We read that page and tell you what it's really made of, plus a natural-fibre alternative."],
        ].map(([h, p], i) => (
          <li key={h}>
            <p className="font-display text-[36px] font-light text-primary/40">{String(i + 1).padStart(2, "0")}</p>
            <h2 className="mt-1 font-display text-[18px] text-foreground">{h}</h2>
            <p className="mt-2 text-[13.5px] font-light leading-relaxed text-muted-foreground">{p}</p>
          </li>
        ))}
      </ol>

      <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/search?gender=women"
          className="rounded-full bg-primary px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          Start browsing
        </Link>
        <Link
          href="/analyze"
          className="rounded-full border border-border px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-slate"
        >
          Or paste a link to try it →
        </Link>
      </div>

      <p className="mx-auto mt-10 max-w-[56ch] text-[12.5px] font-light leading-relaxed text-muted-foreground">
        We only ever see the page you click on.{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-primary">
          Read the privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
