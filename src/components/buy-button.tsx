"use client";

import { recordPurchase } from "@/lib/diary";
import { ArrowUpRight } from "./icons";

/**
 * The buy CTA: records the purchase in the local Fibre Diary, then hands
 * off to the retailer checkout. Navigation must never wait on the diary.
 */
export function BuyButton({
  id,
  title,
  brand,
  price,
  plastic,
  natural,
  retailer,
}: {
  id: string;
  title: string;
  brand: string;
  price: number;
  plastic: number;
  natural: number;
  retailer: string;
}) {
  return (
    <a
      href={`/out/${id}`}
      data-testid="buy-button"
      onClick={() => recordPurchase({ id, title, brand, price, plastic, natural })}
      className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99]"
    >
      Buy at {retailer} <ArrowUpRight className="size-4" />
    </a>
  );
}
