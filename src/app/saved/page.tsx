import type { Metadata } from "next";
import { getCatalogCards } from "@/lib/catalog";
import { SavedList } from "./saved-list";

export const metadata: Metadata = {
  title: "Your wardrobe — saved items",
  robots: { index: false },
};

export default async function SavedPage() {
  const products = await getCatalogCards();
  return <SavedList products={products} />;
}
