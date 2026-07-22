import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { getShopCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Home & Bedding",
  description: "Bedding in linen, hemp and wool, chosen for how you actually sleep. Coming soon.",
  alternates: { canonical: "/home" },
};

const HOMEWARE = /\b(cushion|blanket|bedding|duvet|sheet|pillow|towel|napkin|apron|throw)\b/i;
const CHILDRENS = /\b(baby|babies|kids?|child|children|infant|toddler)\b/i;

export default async function HomePage() {
  const products = await getShopCatalog();
  const images = products
    .filter((p) => HOMEWARE.test(p.title) && !CHILDRENS.test(p.title) && p.image_url)
    .map((p) => p.image_url!)
    .slice(0, 3);

  return (
    <ComingSoon
      eyebrow="Home & bedding"
      title="Fibres that earn the bed."
      body="Linen sheets that move heat away all night, wool fill that buffers humidity, bedding chosen for hot sleepers and light ones. Our home edit is on its way."
      images={images}
      caption={images.length > 0 ? "Linen and cotton pieces already on our record." : undefined}
    />
  );
}
