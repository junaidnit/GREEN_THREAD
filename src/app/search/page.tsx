import { Suspense } from "react";
import type { Metadata } from "next";
import { getCatalogCards } from "@/lib/catalog";
import { SearchExperience } from "@/components/search-experience";
import { ProductCardSkeleton } from "@/components/product-card";

export const metadata: Metadata = {
  title: "Browse natural-fibre clothing",
  description:
    "Search real clothing by fibre, linen, organic cotton, hemp, wool, TENCEL. Every item's composition is read from the brand's own label before it appears here.",
  alternates: { canonical: "/search" },
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
  const products = await getCatalogCards();
  return (
    <>
      {/* The page had no h1 at all, so it carried no topical anchor for search.
          Visually hidden rather than shown: the filter UI is the interface
          here, and adding a visible heading would change Anita's layout. */}
      <h1 className="sr-only">
        Browse natural-fibre clothing, {products.length.toLocaleString("en-GB")} pieces with the
        label already read
      </h1>
      <Suspense fallback={<GridSkeleton />}>
        <SearchExperience products={products} />
      </Suspense>
    </>
  );
}
