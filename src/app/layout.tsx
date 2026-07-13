import type { Metadata } from "next";
import { Inter, Playfair_Display, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoLockup } from "@/components/animated-logo";
import { Concierge } from "@/components/concierge";
import { PageExtras } from "@/components/page-extras";
import { SavedIndicator } from "@/components/saved";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

/* the editorial voice — refined serif with true italics (Vogue, not fintech) */
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "GreenThread — shop by fabric, not just price",
  description:
    "Search sustainable clothing across retailers. Filter by fabric, see full composition and an explainable sustainability score for every garment.",
};

const themeInit = `(function(){try{var t=localStorage.getItem("gt-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${spaceGrotesk.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {/* persistent promo bar — the Fabric Check is the product's one-button hook */}
        <Link
          href="/analyze"
          className="block bg-[#101311] py-2 text-center text-[11px] font-medium tracking-wide text-white/85 transition-colors hover:text-white"
        >
          Paste any product link — we read the label for you <span className="opacity-60">·</span>{" "}
          <span className="underline underline-offset-2">Try Fabric Check</span>
        </Link>
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/" aria-label="GreenThread home">
              <LogoLockup size={26} />
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/brands"
                className="hidden rounded-full px-4 py-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:block"
              >
                Brands
              </Link>
              <Link
                href="/search"
                className="rounded-full px-4 py-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Browse
              </Link>
              <Link
                href="/diary"
                className="hidden rounded-full px-4 py-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:block"
              >
                Diary
              </Link>
              <Link
                href="/analyze"
                className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 font-medium text-background transition-transform hover:scale-[1.03]"
              >
                Fabric Check
              </Link>
              <SavedIndicator />
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground">
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4">
            <Link href="/methodology" className="underline-offset-2 hover:text-primary hover:underline">How we score</Link>
            <span className="opacity-40">·</span>
            <Link href="/analyze" className="underline-offset-2 hover:text-primary hover:underline">Fabric Check</Link>
            <span className="opacity-40">·</span>
            <Link href="/fabric/linen" className="underline-offset-2 hover:text-primary hover:underline">Fabric guides</Link>
            <span className="opacity-40">·</span>
            <span>
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px]">/</kbd> to search
            </span>
            <span className="opacity-40">·</span>
            <span className="opacity-70">LIVE items from brands&apos; own stores · rest is concept catalogue</span>
          </p>
        </footer>
        <Concierge />
        <PageExtras />
      </body>
    </html>
  );
}
