import { Suspense } from "react";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { SearchExperience } from "@/components/search-experience";
import { ProductCardSkeleton } from "@/components/product-card";

export const metadata: Metadata = {
  title: "Browse sustainable clothing — GreenThread",
  description: "Instant search across sustainable fashion. Filter by fabric, certification and sustainability score.",
};

function GridSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default async function SearchPage() {
  const products = await getCatalog();
  return (
    <Suspense fallback={<GridSkeleton />}>
      <SearchExperience products={products} />
    </Suspense>
  );
}
