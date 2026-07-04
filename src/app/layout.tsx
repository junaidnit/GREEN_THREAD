import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeToggle } from "@/components/theme-toggle";
import { Leaf } from "@/components/icons";
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
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Leaf className="size-4" />
              </span>
              GreenThread
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/search"
                className="rounded-full px-4 py-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Browse
              </Link>
              <Link
                href="/search?fabric=linen"
                className="hidden rounded-full px-4 py-2 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:block"
              >
                Linen
              </Link>
              <Link
                href="/analyze"
                className="flex items-center gap-1.5 rounded-full border border-primary/30 px-4 py-2 font-medium text-primary transition-colors hover:bg-accent"
              >
                Fabric Check
              </Link>
              <SavedIndicator />
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-16 border-t border-border py-10 text-center text-sm text-muted-foreground">
          <p className="mx-auto max-w-xl px-4">
            GreenThread MVP — demo catalog with illustrative brands and products.
            Sustainability scores are computed with a transparent rubric —{" "}
            <Link href="/methodology" className="text-primary underline-offset-2 hover:underline">
              see how scoring works
            </Link>
            .
          </p>
          <p className="mt-2 text-xs">
            <Link href="/analyze" className="underline-offset-2 hover:underline">Fabric Check</Link>
            <span className="mx-2">·</span>
            <Link href="/fabric/linen" className="underline-offset-2 hover:underline">Fabric guides</Link>
            <span className="mx-2">·</span>
            press <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px]">/</kbd> to search anywhere
          </p>
        </footer>
        <Concierge />
        <PageExtras />
      </body>
    </html>
  );
}
