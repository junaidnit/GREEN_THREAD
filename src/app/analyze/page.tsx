import { Suspense } from "react";
import type { Metadata } from "next";
import { AnalyzeClient } from "./analyze-client";

export const metadata: Metadata = {
  title: "Fabric Check — paste any product link",
  description:
    "Paste a product URL from any clothing site and get its fabric composition, certifications and an honest sustainability read.",
  alternates: { canonical: "/analyze" },
};

export default function AnalyzePage() {
  return (
    <Suspense>
      <AnalyzeClient />
    </Suspense>
  );
}
