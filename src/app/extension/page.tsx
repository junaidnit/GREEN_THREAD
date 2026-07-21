import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The label-check extension — The Fibre Set",
  description:
    "Install The Fibre Set browser extension to read the fibre composition on any retailer's product page — see the plastic hiding in a 'linen' blend before you buy.",
};

const ZIP = "/downloads/the-fibre-set-extension.zip";

const INSTALL = [
  ["Download and unzip", "Save the file, then unzip it. You'll get a folder with the extension inside."],
  ["Open your extensions page", "In Chrome or Edge, go to chrome://extensions — then turn on Developer mode, top right."],
  ["Load unpacked", "Click 'Load unpacked' and pick the folder you unzipped. The ribbon appears on every shop page."],
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
          <a
            href={ZIP}
            download
            className="rounded-full bg-primary px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            Download for Chrome &amp; Edge
          </a>
          <Link
            href="/analyze"
            className="rounded-full border border-border px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-slate"
          >
            Or check a link on the web →
          </Link>
        </div>
        <p className="mx-auto mt-4 max-w-[54ch] text-[12px] font-light leading-relaxed text-muted-foreground">
          Free, and small enough to install in a minute. We&apos;re not in the Chrome Web Store yet, so
          it&apos;s a manual install — three steps below. Nothing to sign up for.
        </p>
      </div>

      {/* install steps */}
      <div className="mt-20 border-t border-border pt-16">
        <h2 className="text-center font-display text-[26px] text-foreground">Installing it</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {INSTALL.map(([h, p], i) => (
            <div key={h}>
              <p className="font-display text-[40px] font-light text-primary/40">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 font-display text-[19px] text-foreground">{h}</h3>
              <p className="mt-2 text-[14px] font-light leading-relaxed text-muted-foreground">{p}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-[60ch] text-center text-[12.5px] font-light leading-relaxed text-muted-foreground">
          Developer mode sounds technical, but it&apos;s only how browsers let you install an extension
          that isn&apos;t from a store yet. It stays on until you turn it off, and the extension keeps
          working. Once our Chrome Web Store listing is approved, this becomes a single click.
        </p>
      </div>

      {/* what it does */}
      <div className="mt-16 grid gap-8 border-t border-border pt-16 md:grid-cols-3">
        {[
          ["Shop anywhere", "Zara, ASOS, M&S — any online shop. The extension reads the label for you."],
          ["See what it's really made of", "Fibre composition, the plastic percentage, and a plain verdict — before you buy."],
          ["Find the honest version", "Where a garment is mostly plastic, it points you to the same piece in a natural fibre."],
        ].map(([h, p]) => (
          <div key={h}>
            <h3 className="font-display text-[19px] text-foreground">{h}</h3>
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
