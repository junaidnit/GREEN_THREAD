import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Concierge } from "@/components/concierge";
import { PageExtras } from "@/components/page-extras";
import { SiteJsonLd } from "@/components/json-ld";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { ledgerStats } from "@/lib/truth-server";

/* The Fibre Set is single-typeface — Montserrat, light for display. */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  // metadataBase was unset, so every relative image and canonical resolved
  // against localhost in metadata — and no page carried og:image at all,
  // which made every share and every AI preview a blank card.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Fibre Set — natural fibres, chosen well",
    template: "%s | The Fibre Set",
  },
  description:
    "Shop clothing and bedding in natural fibres — cotton, linen, hemp, wool, silk. Check any product's fabric composition, learn what each fibre does for your skin, and buy real pieces from brands we've read the label on.",
  // NO alternates here on purpose: metadata inherits, so a canonical in the
  // root layout would point every page in the site at "/" — worse than having
  // none at all. Each route declares its own.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_GB",
    url: SITE_URL,
    title: "The Fibre Set — natural fibres, chosen well",
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stats = ledgerStats();
  return (
    <html
      lang="en-GB"
      data-scroll-behavior="smooth"
      className={`${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteJsonLd ledger={stats ?? undefined} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Concierge />
        <PageExtras />
      </body>
    </html>
  );
}
