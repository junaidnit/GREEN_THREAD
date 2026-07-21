import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Children — The Fibre Set",
  description: "The little-skin edit: GOTS organic cotton and muslin for babies and children. Coming soon.",
};

export default function ChildrenPage() {
  return (
    <ComingSoon
      eyebrow="For little skin"
      title="Soft enough for a first layer."
      body="GOTS organic cotton and muslin — soft, breathable and free of the finishes an immature skin barrier can't tolerate. We're choosing the pieces now."
    />
  );
}
