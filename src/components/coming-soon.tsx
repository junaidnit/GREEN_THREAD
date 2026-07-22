import Link from "next/link";
import Image from "next/image";

/**
 * On-brand placeholder for categories not yet stocked (Children, Home).
 * Takes real photography where we have it — an empty page reads as broken,
 * and these categories are the ones people most want to see proof of.
 */
export function ComingSoon({
  eyebrow,
  title,
  body,
  images = [],
  caption,
}: {
  eyebrow: string;
  title: string;
  body: string;
  images?: string[];
  caption?: string;
}) {
  return (
    <div className="mx-auto max-w-[1080px] px-6 pb-24 pt-24 sm:px-10">
      <div className="mx-auto max-w-[720px] text-center">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mx-auto mt-4 max-w-[16ch] font-display text-[clamp(2rem,4.6vw,2.5rem)] leading-tight text-foreground">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-[48ch] text-[16px] font-light leading-relaxed text-muted-foreground">
          {body}
        </p>
        <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-rose">Coming soon</p>
      </div>

      {images.length > 0 && (
        <>
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {images.slice(0, 3).map((src, i) => (
              <div
                key={src}
                className={`relative aspect-[3/4] overflow-hidden bg-surface-2 ${i === 2 ? "hidden sm:block" : ""}`}
              >
                <Image
                  src={src}
                  alt={`${eyebrow} — natural-fibre pieces already on our record`}
                  fill
                  sizes="(max-width:640px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          {caption && (
            <p className="mt-4 text-center text-[14px] font-light text-muted-foreground">{caption}</p>
          )}
        </>
      )}

      <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
        <Link href="/search?gender=women" className="rounded-full border border-border px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-slate">
          Shop Women
        </Link>
        <Link href="/search?gender=men" className="rounded-full border border-border px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-slate">
          Shop Men
        </Link>
      </div>
    </div>
  );
}
