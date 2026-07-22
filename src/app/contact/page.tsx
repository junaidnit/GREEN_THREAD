import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with The Fibre Set, and the mohair family in the Eastern Cape the founder grew up in.",
  alternates: { canonical: "/contact" },
};

/**
 * Everything on this page about the family comes from the two sites Anita
 * supplied (barnardmohair.com/about-us and sundaychild.co.za/pages/about) and
 * is attributed to them in the copy, so a reader can check it rather than take
 * our word for it.
 *
 * STILL MISSING: anything in Anita's own voice. Nothing about her is stated
 * beyond what she wrote about her sisters, because writing a biography for a
 * real person and publishing it is not ours to do. If she sends a paragraph,
 * it belongs directly under the family history.
 */
const EMAIL = "Anita@thefibreset.com";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[760px] px-6 py-20 sm:px-10">
      <span className="eyebrow">Contact</span>
      <h1 className="mt-3 font-display text-[clamp(2rem,4.6vw,2.5rem)] leading-tight text-foreground">
        Talk to us.
      </h1>
      <p className="mt-5 text-[16px] font-light leading-relaxed text-muted-foreground">
        A person reads everything that arrives. Write to{" "}
        <a href={`mailto:${EMAIL}`} className="underline underline-offset-2 hover:text-primary">
          {EMAIL}
        </a>
        .
      </p>

      {/* what to write about, and where else to go */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {[
          ["A label looks wrong", "Send the link. We would rather be corrected than be confidently wrong.", "/support"],
          ["A brand we should read", "Tell us who. We check the whole catalogue before a brand goes on the site.", "/methodology"],
          ["Press and partnerships", "Fibre bodies, certifiers and retailers who want their disclosure read.", "/label-watch"],
          ["Help with the extension", "Installing it, or a check that will not run.", "/support"],
        ].map(([head, body, href]) => (
          <div key={head} className="border border-border p-5">
            <h2 className="font-display text-[20px] leading-snug text-foreground">{head}</h2>
            <p className="mt-2 text-[14px] font-light leading-relaxed text-muted-foreground">{body}</p>
            <Link
              href={href}
              className="mt-3 inline-block border-b border-slate pb-0.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate transition-colors hover:text-primary"
            >
              Read more
            </Link>
          </div>
        ))}
      </div>

      {/* the family this came out of */}
      <div className="mt-16 border-t border-border pt-12">
        <span className="eyebrow">Where this comes from</span>
        <h2 className="mt-3 font-display text-[28px] leading-tight text-foreground">
          A mohair family in the Eastern Cape.
        </h2>
        <div className="mt-5 space-y-4 text-[16px] font-light leading-relaxed text-muted-foreground">
          <p>
            In 1967 Jan Paul and Elsa Barnard started a mohair business on a farm in the mountains of
            the Eastern Cape, South Africa. He built it from hand looms. She had trained as a fashion
            designer in Germany, and designed the collections. What they made came off Angora goats
            kept on the land around them: yarn, handwoven carpets, blankets, knitwear.
          </p>
          <p>
            Their three daughters each took a different part of it forward. The eldest, Katrina, runs{" "}
            <a
              href="https://sundaychild.co.za/pages/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-primary"
            >
              SundayChild
            </a>
            , the handwoven carpet and blanket side her mother led until 2022. The youngest, Louise,
            runs{" "}
            <a
              href="https://barnardmohair.com/about-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-primary"
            >
              Barnard Mohair
            </a>
            , the blanket and clothing business their father built. Jan Paul died in 2024. Elsa still
            advises on the making.
          </p>
          <p>
            The Fibre Set is the third thread. Not a mill this time, but the same question the family
            has been answering since 1967: what is this actually made of, and will it wear.
          </p>
        </div>

        {/* the founder, in the facts she gave us and no further */}
        <div className="mt-10 border-t border-border pt-8">
          <span className="eyebrow">The founder</span>
          <h3 className="mt-3 font-display text-[20px] leading-snug text-foreground">
            Anita Barnard
          </h3>
          <div className="mt-3 space-y-4 text-[16px] font-light leading-relaxed text-muted-foreground">
            <p>
              The middle of the three sisters, raised in the family&apos;s natural-fibre business.
              She spent her career on the other side of the industry, in the part that decides how
              clothing gets talked about: she built &euro;2.5m of brand-funded content partnerships
              for adidas and Ralph Lauren, then led Red Bull&apos;s content-partnerships portfolio,
              worth &euro;12m a year.
            </p>
            <p>
              Which is a useful thing to have done before starting this. Knowing exactly how a
              garment is made to sound natural is what makes reading the label properly worth doing.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4 text-[16px] font-light leading-relaxed text-muted-foreground">
          <p className="text-[14px]">
            Family history as published by{" "}
            <a
              href="https://sundaychild.co.za/pages/about"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary"
            >
              SundayChild
            </a>{" "}
            and{" "}
            <a
              href="https://barnardmohair.com/about-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary"
            >
              Barnard Mohair
            </a>
            .
          </p>
        </div>
      </div>

      {/* the mark */}
      <div className="mt-14 border-t border-border pt-10">
        <h2 className="font-display text-[20px] text-foreground">About the mark</h2>
        <p className="mt-2 max-w-[60ch] text-[16px] font-light leading-relaxed text-muted-foreground">
          The ribbon at the top of every page is the family&apos;s own, drawn in the 1960s. It is
          reproduced here as an exact vector trace of the original artwork rather than a redrawing,
          so the loop, the crossing and the cut ends are the ones that were drawn then.
        </p>
      </div>
    </div>
  );
}
