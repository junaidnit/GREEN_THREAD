import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Concierge } from "@/components/concierge";
import { PageExtras } from "@/components/page-extras";

/* The Fibre Set is single-typeface — Montserrat, light for display. */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "The Fibre Set — natural fibres, chosen well",
  description:
    "Shop clothing and bedding in natural fibres — cotton, linen, hemp, wool, silk. Check any product's fabric composition, learn what each fibre does for your skin, and buy real pieces from brands we've read the label on.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Concierge />
        <PageExtras />
      </body>
    </html>
  );
}
