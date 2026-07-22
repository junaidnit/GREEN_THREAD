"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SavedIndicator } from "@/components/saved";
import { LogoMark } from "@/components/animated-logo";

/**
 * The Fibre Set header, toa.st-inspired: quiet utility line, the heritage
 * ribbon mark beside a letter-spaced wordmark, category mega-menus, and the
 * three actions that matter. Search, Fabric Check, Install Extension.
 */

const WOMEN_SUBS = ["dresses", "tops", "knitwear", "shirts", "trousers", "jeans", "skirts"];
const MEN_SUBS = ["t-shirts", "shirts", "knitwear", "trousers", "jeans", "shorts"];
const FIBRES: Array<[string, string]> = [
  ["linen", "Linen"], ["hemp", "Hemp"], ["organic_cotton", "Organic Cotton"],
  ["merino_wool", "Merino Wool"], ["peace_silk", "Silk"], ["tencel_lyocell", "TENCEL Lyocell"],
];
/* Kept as plain data rather than imported from the registry: this is a client
   component, and the registry pulls in the whole rule engine. */
const CONDITION_LINKS: Array<[string, string]> = [
  ["eczema", "Eczema-friendly"],
  ["psoriasis", "Psoriasis-friendly"],
  ["synthetic-fibre-allergy", "Textile contact allergy"],
  ["night-sweats", "Night sweats"],
];

function Caret() {
  return (
    <svg viewBox="0 0 10 6" className="ml-1 inline size-2 opacity-60" aria-hidden="true">
      <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function MegaItem({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="group relative">
      <Link
        href={href}
        className="flex items-center py-2 text-[14px] tracking-wide text-foreground/80 transition-colors hover:text-primary"
      >
        {label}
        {children && <Caret />}
      </Link>
      {children && (
        <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
          <div className="rounded-sm border border-border bg-surface p-4 shadow-[0_20px_40px_-24px_rgba(58,58,85,.4)]">
            {children}
          </div>
        </div>
      )}
    </li>
  );
}

function SubLinks({ items, base }: { items: Array<[string, string]>; base: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map(([slug, label]) => (
        <li key={slug}>
          <Link
            href={`${base}${slug}`}
            className="block py-1.5 text-[14px] font-light text-muted-foreground transition-colors hover:text-primary"
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setSearchOpen(false);
    // a pasted link goes to Fabric Check; otherwise a catalogue search
    if (/^https?:\/\//i.test(term)) router.push(`/analyze?url=${encodeURIComponent(term)}`);
    else router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  const cap = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md">
      {/* utility line */}
      <div className="bg-foreground py-2 text-center text-[12px] font-medium uppercase tracking-[0.16em] text-background">
        Natural fibres, chosen for how they feel and wear · Check any label, free
      </div>

      <div className="border-b border-border">
        <div className="mx-auto flex h-[70px] max-w-[1280px] items-center justify-between gap-3 px-4 sm:gap-6 sm:px-10">
          {/* brand lockup, heritage ribbon mark + wordmark */}
          <Link href="/" aria-label="The Fibre Set, home" className="flex shrink-0 items-center gap-3 text-foreground">
            <span className="text-[#141414]">
              <LogoMark size={34} animate={false} />
            </span>
            <span className="hidden font-display text-[16px] font-semibold uppercase tracking-[0.2em] sm:inline">
              The&nbsp;Fibre&nbsp;Set
            </span>
          </Link>

          {/* category nav */}
          <nav className="hidden lg:block">
            <ul className="flex items-center gap-7">
              <MegaItem label="Women" href="/search?gender=women">
                <SubLinks items={WOMEN_SUBS.map((s) => [s, cap(s)])} base="/search?gender=women&category=" />
              </MegaItem>
              <MegaItem label="Men" href="/search?gender=men">
                <SubLinks items={MEN_SUBS.map((s) => [s, cap(s)])} base="/search?gender=men&category=" />
              </MegaItem>
              <MegaItem label="Children" href="/children">
                <p className="text-[14px] font-light leading-relaxed text-muted-foreground">
                  Little-skin edit, GOTS organic cotton &amp; muslin.
                  <span className="mt-1 block text-rose">Coming soon.</span>
                </p>
              </MegaItem>
              <MegaItem label="Materials" href="/fabric/linen">
                <SubLinks items={FIBRES} base="/fabric/" />
              </MegaItem>
              <MegaItem label="Conditions" href="/conditions">
                <SubLinks items={CONDITION_LINKS} base="/condition/" />
              </MegaItem>
              <MegaItem label="Magazine" href="/magazine" />
            </ul>
          </nav>

          {/* actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              className="tap-target flex h-11 items-center gap-2 rounded-full border border-border bg-surface-2 px-4 text-[14px] tracking-wide text-muted-foreground transition-colors hover:border-slate hover:text-foreground"
            >
              <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">Search</span>
            </button>
            <Link
              href="/analyze"
              className="hidden h-11 items-center rounded-full border border-border px-4 text-[14px] tracking-wide text-foreground transition-colors hover:border-slate md:flex"
            >
              Fabric Check
            </Link>
            <Link
              href="/extension"
              className="hidden h-11 items-center rounded-full bg-primary px-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:opacity-90 sm:flex"
            >
              Install Extension
            </Link>
            <SavedIndicator />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              className="tap-target lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* search drawer */}
      {searchOpen && (
        <div className="border-b border-border bg-surface">
          <form onSubmit={submitSearch} className="mx-auto flex max-w-[1280px] items-center gap-3 px-5 py-4 sm:px-10">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a fibre or garment, or paste a product link to check its label"
              className="flex-1 border-b border-border bg-transparent py-2 text-[16px] font-light text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-slate"
            />
            <button type="submit" className="rounded-full bg-primary px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
              Go
            </button>
          </form>
        </div>
      )}

      {/* mobile menu */}
      {mobileOpen && (
        <div className="border-b border-border bg-surface lg:hidden">
          <ul className="mx-auto flex max-w-[1280px] flex-col gap-1 px-5 py-4 text-[16px] font-light">
            {[["Women", "/search?gender=women"], ["Men", "/search?gender=men"], ["Children", "/children"], ["Materials", "/fabric/linen"], ["Conditions", "/conditions"], ["Magazine", "/magazine"], ["Fabric Check", "/analyze"], ["Install Extension", "/extension"]].map(([label, href]) => (
              <li key={href}>
                <Link href={href} onClick={() => setMobileOpen(false)} className="block py-2 text-foreground">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
