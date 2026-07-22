import Link from "next/link";
import { LogoMark } from "@/components/animated-logo";

/**
 * The Fibre Set footer, deep navy, editorial, with the plain affiliate
 * disclosure the brief calls for. Not preachy, not salesy.
 */
const COLUMNS: Array<{ head: string; links: Array<[string, string]> }> = [
  {
    head: "Shop",
    links: [["Women", "/search?gender=women"], ["Men", "/search?gender=men"], ["Children, soon", "/children"], ["Home & Bedding, soon", "/home"]],
  },
  {
    head: "Fibres",
    links: [["Linen & Hemp", "/fabric/linen"], ["Merino & Wool", "/fabric/merino_wool"], ["Silk & TENCEL", "/fabric/peace_silk"], ["Organic Cotton", "/fabric/organic_cotton"]],
  },
  {
    head: "Learn",
    links: [["The Magazine", "/magazine"], ["Dressing for a condition", "/conditions"], ["Label Watch", "/label-watch"], ["Fabric Check", "/analyze"]],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-foreground text-background">
      <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-10">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <span className="flex items-center gap-3">
              <LogoMark size={30} animate={false} />
              <span className="font-display text-[16px] font-semibold uppercase tracking-[0.2em]">The&nbsp;Fibre&nbsp;Set</span>
            </span>
            <p className="mt-4 max-w-[34ch] text-[14px] font-light leading-relaxed opacity-70">
              Natural fibres, chosen for the skin they sit against. We read the label so you don&apos;t
              have to, informative, never preachy.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.head}>
              <h5 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] opacity-85">{col.head}</h5>
              <ul className="flex flex-col gap-2.5">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-[14px] font-light opacity-70 transition-opacity hover:opacity-100">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-background/15 pt-6 text-[12px] tracking-wide opacity-60 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} The Fibre Set · Privacy · Terms</span>
          <span>Disclosure: we earn money through affiliate links.</span>
        </div>
      </div>
    </footer>
  );
}
