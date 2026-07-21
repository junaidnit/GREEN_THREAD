import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Children — The Fibre Set",
  description: "The little-skin edit: GOTS organic cotton and muslin for babies and children. Coming soon.",
};

const CHILDRENS = /\b(baby|babies|kids?|child|children|infant|toddler)\b/i;

export default async function ChildrenPage() {
  const products = await getCatalog();
  const images = products
    .filter((p) => CHILDRENS.test(p.title) && p.image_url)
    .map((p) => p.image_url!)
    .slice(0, 3);

  return (
    <ComingSoon
      eyebrow="For little skin"
      title="Soft enough for a first layer."
      body="GOTS organic cotton and muslin — soft, breathable and free of the finishes an immature skin barrier can't tolerate. We're choosing the pieces now."
      images={images}
      caption={images.length > 0 ? "Organic cotton pieces already on our record." : undefined}
    />
  );
}
