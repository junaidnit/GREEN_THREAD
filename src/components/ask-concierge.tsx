"use client";

import { Sparkles } from "./icons";

/** Hands a pre-written question to the floating concierge (opens it too). */
export function AskConcierge({ question }: { question: string }) {
  return (
    <button
      type="button"
      data-testid="ask-concierge"
      onClick={() => window.dispatchEvent(new CustomEvent("gt:concierge", { detail: question }))}
      className="mt-4 flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-accent"
    >
      <Sparkles className="size-4" /> Ask the concierge about this
    </button>
  );
}
