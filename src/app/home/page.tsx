import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Home & Bedding — The Fibre Set",
  description: "Bedding in linen, hemp and wool — chosen for how you actually sleep. Coming soon.",
};

export default function HomePage() {
  return (
    <ComingSoon
      eyebrow="Home & bedding"
      title="Fibres that earn the bed."
      body="Linen sheets that move heat away all night, wool fill that buffers humidity — bedding chosen for hot sleepers and light ones. Our home edit is on its way."
    />
  );
}
