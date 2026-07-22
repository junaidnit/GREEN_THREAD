import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What The Fibre Set and its Fabric Check extension collect, what we send to process a label, and what we never do.",
  alternates: { canonical: "/privacy" },
};

/**
 * Required for the Chrome Web Store listing, and it must stay TRUE to the
 * code. As built: the extension reads a page only on toolbar click
 * (activeTab), /api/extension/scan sends that text to Anthropic to extract
 * the composition, nothing is written to a database, and the server logs only
 * the hostname plus the result. If any of that changes, change this page.
 */
const CONTACT = "privacy@thefibreset.com";
const UPDATED = "21 July 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-[20px] text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-[16px] font-light leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[760px] px-6 py-20 sm:px-10">
      <span className="eyebrow">Privacy</span>
      <h1 className="mt-3 font-display text-[clamp(2rem,4.6vw,2.5rem)] leading-tight text-foreground">
        What we collect, and what we don&apos;t.
      </h1>
      <p className="mt-4 text-[16px] font-light leading-relaxed text-muted-foreground">
        Last updated {UPDATED}. This covers both thefibreset.com and the Fabric Check browser
        extension.
      </p>

      <Section title="The extension reads a page only when you ask it to">
        <p>
          Fabric Check uses a Chrome permission called <b className="text-foreground">activeTab</b>.
          In plain terms: it can see the page you are on <b className="text-foreground">only</b> in
          the moment you click our icon in your toolbar, and only that one tab. It cannot read pages
          you haven&apos;t asked about, it doesn&apos;t run in the background, and it has no view of
          your browsing history or your other tabs.
        </p>
        <p>
          That is why installing it shows no &ldquo;read and change all your data on all
          websites&rdquo; warning. We chose the narrower permission deliberately.
        </p>
      </Section>

      <Section title="What gets sent when you click">
        <p>When you click the icon on a product page, we send to our own server:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>the page&apos;s address and title</li>
          <li>the visible text of that page, which is where the fibre composition is written</li>
        </ul>
        <p>
          We use that text for one purpose: working out what the garment is made of, and finding a
          natural-fibre alternative. Nothing else.
        </p>
      </Section>

      <Section title="Who else sees it">
        <p>
          To read a label written in free text, that page text is sent to{" "}
          <b className="text-foreground">Anthropic</b>, which provides the model that extracts the
          composition. They process it to return a result and, under their API terms, do not use it
          to train models. Our site is hosted on <b className="text-foreground">Vercel</b>, and our
          product catalogue is stored with <b className="text-foreground">Supabase</b>.
        </p>
        <p>
          We do not sell your data, we do not share it with advertisers, and we do not use it for
          profiling or ad targeting.
        </p>
      </Section>

      <Section title="What we keep">
        <p>
          <b className="text-foreground">We do not store the page content.</b> It is held in memory
          long enough to return your answer and is then gone — there is no database record of the
          pages you check.
        </p>
        <p>
          Our server keeps an ordinary operational log of the request: the site&apos;s domain (for
          example <i>zara.com</i>), the score we returned and how many alternatives we found. That
          log contains no page text, no full addresses and nothing identifying you.
        </p>
      </Section>

      <Section title="What stays on your own device">
        <p>
          Your saved wardrobe, your Fibre Diary and the extension&apos;s settings live in your own
          browser&apos;s storage. They are never uploaded to us. Clearing your browser data deletes
          them, and we cannot recover them.
        </p>
      </Section>

      <Section title="Affiliate links">
        <p>
          When you follow a link to a retailer we may earn a commission, which is how the site is
          paid for. The retailer sees an ordinary referral. It never changes what the label check
          tells you —{" "}
          <Link href="/methodology" className="underline underline-offset-2 hover:text-primary">
            our scoring is published
          </Link>{" "}
          and is computed the same way whether we are paid or not.
        </p>
      </Section>

      <Section title="Children">
        <p>
          The Fibre Set is intended for adults. We do not knowingly collect data from children under
          13.
        </p>
      </Section>

      <Section title="Your rights and contact">
        <p>
          Because we hold no account and no stored page content, there is normally nothing of yours
          for us to retrieve or erase. If you have a question about this policy, or a UK GDPR request,
          write to{" "}
          <a href={`mailto:${CONTACT}`} className="underline underline-offset-2 hover:text-primary">
            {CONTACT}
          </a>
          . You also have the right to complain to the UK Information Commissioner&apos;s Office.
        </p>
      </Section>

      <p className="mt-12 border-t border-border pt-6 text-[14px] font-light text-muted-foreground">
        If we change what the extension collects, we will update this page and its date before the
        change ships.
      </p>
    </div>
  );
}
