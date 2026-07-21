import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The label-check extension — The Fibre Set",
  description:
    "Install The Fibre Set browser extension to read the fibre composition on any retailer's product page — see the plastic hiding in a 'linen' blend before you buy.",
};

const STEPS = [
  ["Add it to your browser", "One click. It sits quietly until you're on a product page."],
  ["Shop anywhere", "Zara, ASOS, M&S — any online shop. The extension reads the label for you."],
  ["See what it's really made of", "Fibre composition, the plastic percentage, and a plain verdict — before you buy."],
];

export default function ExtensionPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-6 py-20 sm:px-10">
      <div className="text-center">
        <span className="eyebrow">The free tool</span>
        <h1 className="mx-auto mt-3 max-w-[18ch] font-display text-[40px] leading-tight text-foreground sm:text-[52px]">
          Check any fabric label, anywhere you shop.
        </h1>
        <p className="mx-auto mt-5 max-w-[52ch] text-[16px] font-light leading-relaxed text-muted-foreground">
          Most of the high street is oil-derived plastic dressed up as something natural. Our extension
          reads the fibre composition on any retailer&apos;s product page, so the truth is one glance away.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <span
            className="cursor-default rounded-full bg-primary/15 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary"
            title="Coming to the Chrome Web Store"
          >
            Chrome extension — coming soon
          </span>
          <Link
            href="/analyze"
            className="rounded-full bg-primary px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            Try it on the web now →
          </Link>
        </div>
        <p className="mt-3 text-[12px] font-light text-muted-foreground">
          Not in the store yet — paste any product link into <Link href="/analyze" className="underline underline-offset-2 hover:text-primary">Fabric Check</Link> to try the same reading today.
        </p>
      </div>

      <div className="mt-20 grid gap-8 border-t border-border pt-16 md:grid-cols-3">
        {STEPS.map(([h, p], i) => (
          <div key={h}>
            <p className="font-display text-[40px] font-light text-primary/40">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="mt-2 font-display text-[19px] text-foreground">{h}</h3>
            <p className="mt-2 text-[14px] font-light leading-relaxed text-muted-foreground">{p}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-sm border border-border bg-surface-2 p-8 text-center text-[13px] font-light leading-relaxed text-muted-foreground">
        Free, always. We earn through affiliate links when you choose to buy — never from what the
        extension tells you. It reads the label the same whether we&apos;re paid or not.
      </div>
    </div>
  );
}
