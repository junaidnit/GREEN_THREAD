"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/** localStorage-backed wardrobe (saved items) with a custom event bus. */
const KEY = "gt-saved";

export function getSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function setSaved(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("gt:saved"));
}

/** Subscribe to wardrobe changes (this tab + other tabs). */
function subscribeSaved(onChange: () => void): () => void {
  window.addEventListener("gt:saved", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("gt:saved", onChange);
    window.removeEventListener("storage", onChange);
  };
}

function Heart({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

/** Header heart with live count — the "wardrobe" the arc animation lands in. */
export function SavedIndicator() {
  const [count, setCount] = useState(0);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    const update = () => setCount(getSaved().length);
    update();
    const onSave = () => {
      update();
      setBump((b) => b + 1); // catch bounce
    };
    window.addEventListener("gt:saved", onSave);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("gt:saved", onSave);
      window.removeEventListener("storage", update);
    };
  }, []);

  return (
    <Link href="/saved" aria-label="Saved items" className="tap-target relative ml-1 flex rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
      <motion.span
        id="gt-heart"
        key={bump}
        initial={bump > 0 ? { scale: 1.45, rotate: -8 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 14 }}
        className="flex"
      >
        <Heart className="size-4" filled={count > 0} />
      </motion.span>
      {count > 0 && (
        <span data-testid="saved-count" className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}

/**
 * Save button with the "liquid" moment: a mini copy of the product image
 * arcs from the button into the header heart, which bounces on catch.
 */
export function SaveButton({ productId, imageUrl }: { productId: string; imageUrl: string }) {
  // derived from the wardrobe store — no setState-in-effect, and it stays in
  // sync if the item is saved/removed elsewhere (e.g. the /saved page)
  const saved = useSyncExternalStore(
    subscribeSaved,
    () => getSaved().includes(productId),
    () => false,
  );
  const [flying, setFlying] = useState<{ from: DOMRect; to: DOMRect } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function toggle() {
    const ids = getSaved();
    if (ids.includes(productId)) {
      setSaved(ids.filter((i) => i !== productId));
      return;
    }
    // launch the arc before the state lands — the reward IS the moment
    const from = btnRef.current?.getBoundingClientRect();
    const to = document.getElementById("gt-heart")?.getBoundingClientRect();
    if (from && to) setFlying({ from, to });
    setTimeout(() => {
      setSaved([...ids, productId]);
      setFlying(null);
    }, 620);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        data-testid="save-button"
        className={`flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors ${
          saved
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-surface hover:border-primary/40 hover:bg-accent"
        }`}
      >
        <Heart className="size-4" filled={saved} />
        {saved ? "In your wardrobe" : "Save"}
      </button>

      {flying && (
        <motion.img
          src={imageUrl}
          alt=""
          aria-hidden
          className="pointer-events-none fixed z-[100] rounded-lg object-cover shadow-xl"
          initial={{
            left: flying.from.left + flying.from.width / 2 - 28,
            top: flying.from.top - 10,
            width: 56,
            height: 72,
            opacity: 1,
          }}
          animate={{
            left: flying.to.left + flying.to.width / 2 - 10,
            top: [flying.from.top - 90, flying.to.top - 20, flying.to.top],
            width: 20,
            height: 26,
            opacity: [1, 1, 0.4],
          }}
          transition={{ duration: 0.6, ease: [0.3, 0.7, 0.4, 1] }}
        />
      )}
    </>
  );
}
