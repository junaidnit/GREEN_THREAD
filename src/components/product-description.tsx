"use client";

import { useState } from "react";

/**
 * The merchant's own product description, shown with its structure intact
 * (paragraphs, bullet lists, the THINGS TO KNOW / SIZE & FIT / SUSTAINABILITY
 * sections). Collapsed to a teaser with a soft fade; "Read full description"
 * reveals the rest. Line breaks come from the stored text (whitespace-pre-line).
 */
export function ProductDescription({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const body = text.trim();
  if (!body) return null;

  return (
    <div>
      <div
        className={`whitespace-pre-line text-[15px] font-light leading-relaxed text-muted-foreground ${
          open
            ? ""
            : "max-h-[7.5rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
        }`}
      >
        {body}
      </div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-1.5 text-xs font-semibold text-primary underline-offset-2 hover:underline"
      >
        {open ? "Show less" : "Read full description →"}
      </button>
    </div>
  );
}
