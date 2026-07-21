import Link from "next/link";

/** On-brand placeholder for categories not yet stocked (Children, Home). */
export function ComingSoon({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-28 text-center sm:px-10">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="mx-auto mt-4 max-w-[16ch] font-display text-[40px] leading-tight text-foreground sm:text-[48px]">
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-[48ch] text-[16px] font-light leading-relaxed text-muted-foreground">
        {body}
      </p>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose">Coming soon</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href="/search?gender=women" className="rounded-full border border-border px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-slate">
          Shop Women
        </Link>
        <Link href="/search?gender=men" className="rounded-full border border-border px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-slate">
          Shop Men
        </Link>
      </div>
    </div>
  );
}
