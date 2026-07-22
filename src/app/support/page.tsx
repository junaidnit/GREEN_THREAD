import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Help with the Fabric Check extension and The Fibre Set: installing it, why a first check can be slow, what we can and cannot see, and how to get in touch.",
  alternates: { canonical: "/support" },
};

/**
 * Required as the Support URL on the Chrome Web Store listing, and worth
 * having regardless. Answers the questions we have actually hit rather than
 * inventing a generic FAQ: the slow first scan, the stale saved endpoint, and
 * why the panel cannot appear by itself.
 */
const CONTACT = "support@thefibreset.com";

function QA({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border py-6">
      <h3 className="font-display text-[20px] leading-snug text-foreground">{q}</h3>
      <div className="mt-2 space-y-3 text-[16px] font-light leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-[760px] px-6 py-20 sm:px-10">
      <span className="eyebrow">Support</span>
      <h1 className="mt-3 font-display text-[clamp(2rem,4.6vw,2.5rem)] leading-tight text-foreground">
        Something not working?
      </h1>
      <p className="mt-5 text-[16px] font-light leading-relaxed text-muted-foreground">
        Write to{" "}
        <a href={`mailto:${CONTACT}`} className="underline underline-offset-2 hover:text-primary">
          {CONTACT}
        </a>{" "}
        and a person will read it. Below are the things that come up most.
      </p>

      <div className="mt-12">
        <QA q="The first check takes ages, then the rest are quick">
          <p>
            That is a cold start, and it is expected. Our server sleeps when nobody has used it for
            a while, and waking it takes about twenty seconds. Every check after that returns in
            around three.
          </p>
          <p>
            The panel tells you this while it waits rather than leaving you looking at a spinner. If
            it gives up entirely, click the ribbon again: the second attempt hits a server that is
            already awake.
          </p>
        </QA>

        <QA q="It says it could not reach The Fibre Set">
          <p>
            Almost always an old saved address. We changed domain from greenthread.info to
            thefibreset.com, and an extension installed before that kept the old one.
          </p>
          <p>
            Right-click the ribbon icon, choose <b className="text-foreground">Options</b>, and set
            the endpoint to <code className="text-foreground">https://thefibreset.com</code>. Newer
            versions correct this by themselves.
          </p>
        </QA>

        <QA q="The ribbon does not appear on the page">
          <p>
            By design. The extension can only see a page in the moment you click its icon in your
            toolbar, so nothing is injected until you ask. That is also why installing it shows no
            warning about reading your data.
          </p>
          <p>
            If the icon is hidden, click the puzzle-piece in your toolbar and pin The Fibre Set. It
            cannot work on browser pages such as chrome://extensions, the Web Store, or PDFs.
          </p>
        </QA>

        <QA q="It says no composition is disclosed, but the page shows one">
          <p>
            We only report what a page actually states, and some retailers load the composition
            after a delay or hide it behind a tab. Open the details section so the text is present,
            then click the ribbon again.
          </p>
          <p>
            If a page consistently fails, send us the link. Retailers change their markup often and
            a real example is the fastest way for us to fix it.
          </p>
        </QA>

        <QA q="A reading looks wrong">
          <p>
            Tell us, with the link. We would rather be corrected than be confidently wrong, and
            composition errors are the one thing this site cannot afford. Our method is published in
            full on the{" "}
            <Link href="/methodology" className="underline underline-offset-2 hover:text-primary">
              methodology page
            </Link>
            .
          </p>
          <p>
            One known limit: on lined or multi-part garments a single percentage is an estimate,
            because component percentages do not reveal fibre mass. Where we cannot read a fibre we
            record nothing rather than guess.
          </p>
        </QA>

        <QA q="What can you see about me?">
          <p>
            The page you click on, and only then. No browsing history, no other tabs, nothing in the
            background. We do not store the pages you check, and your saved items live in your own
            browser rather than on our servers.
          </p>
          <p>
            The full detail is on the{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-primary">
              privacy page
            </Link>
            .
          </p>
        </QA>

        <QA q="How do I remove it?">
          <p>
            Go to chrome://extensions and click Remove on The Fibre Set. Nothing of yours stays with
            us, because nothing of yours was ever sent to us beyond the pages you asked about, which
            we do not keep.
          </p>
        </QA>
      </div>

      <div className="mt-12 border-t border-border pt-8">
        <p className="text-[16px] font-light leading-relaxed text-muted-foreground">
          Still stuck? Email{" "}
          <a href={`mailto:${CONTACT}`} className="underline underline-offset-2 hover:text-primary">
            {CONTACT}
          </a>
          . Include the page link and what you expected to see, and we will get back to you.
        </p>
      </div>
    </div>
  );
}
