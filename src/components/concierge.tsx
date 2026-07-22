"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { GradeBadge } from "./grade-badge";
import { Send, Sparkles, X } from "./icons";
import { formatPrice } from "@/lib/format";

interface CardProduct {
  id: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  score: number;
  grade: string;
  fabric: string;
  image_url: string;
  url: string;
}

const SUGGESTIONS = [
  "A breathable linen top for summer",
  "Warm winter layer with no animal products",
  "Gym wear that isn't virgin plastic",
  "An organic cotton dress under £40",
];

export function Concierge() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/concierge" }),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // other components can open the concierge with a ready-made question
  useEffect(() => {
    const onAsk = (e: Event) => {
      const q = (e as CustomEvent<string>).detail;
      setOpen(true);
      if (q && status === "ready") sendMessage({ text: q });
    };
    window.addEventListener("gt:concierge", onAsk);
    return () => window.removeEventListener("gt:concierge", onAsk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const busy = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  return (
    <>
      {/* floating trigger */}
      <button
        data-testid="concierge-open"
        aria-label="Open shopping concierge"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex h-13 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-xl shadow-black/15 transition-transform hover:scale-[1.03] active:scale-95"
      >
        <Sparkles className="size-4" />
        <span className="hidden sm:inline">Concierge</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            data-testid="concierge-panel"
            className="fixed bottom-20 right-4 z-50 flex h-[560px] max-h-[75vh] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl2 border border-border bg-surface shadow-2xl shadow-black/20"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-border bg-surface-2/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="size-3.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-none">Shopping concierge</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">knows every fabric in the catalog</p>
                </div>
              </div>
              <button aria-label="Close concierge" onClick={() => setOpen(false)}>
                <X className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Describe what you&apos;re looking for — I&apos;ll match it against real fabric
                    compositions and sustainability scores.
                  </p>
                  <div className="space-y-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => submit(s)}
                        className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-accent"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} data-testid={`msg-${m.role}`}>
                  {m.role === "user" ? (
                    <div className="ml-8 rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
                      {m.parts.map((part, i) => (part.type === "text" ? <span key={i}>{part.text}</span> : null))}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {m.parts.map((part, i) => {
                        if (part.type === "text" && part.text.trim()) {
                          return (
                            <div key={i} className="mr-6 whitespace-pre-wrap rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-2.5 text-sm leading-relaxed">
                              {part.text}
                            </div>
                          );
                        }
                        if (part.type === "tool-search_catalog" && part.state === "output-available") {
                          const out = part.output as { products?: CardProduct[] };
                          return (
                            <div key={i} className="space-y-2" data-testid="concierge-products">
                              {(out.products ?? []).map((p) => (
                                <ChatProductCard key={p.id} p={p} onNavigate={() => setOpen(false)} />
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              ))}

              {busy && (
                <div className="mr-6 flex items-center gap-2 rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-3 text-sm text-muted-foreground">
                  <span className="flex gap-1">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
                  </span>
                  checking fabrics…
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-grade-e/40 bg-grade-e/5 px-3 py-2 text-xs text-grade-e">
                  The concierge hit a snag — try again in a moment.
                </div>
              )}
            </div>

            {/* input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                data-testid="concierge-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. no polyester, under £30…"
                className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChatProductCard({ p, onNavigate }: { p: CardProduct; onNavigate: () => void }) {
  return (
    <Link
      href={p.url}
      onClick={onNavigate}
      className="flex gap-3 rounded-xl border border-border bg-background p-2.5 transition-colors hover:border-primary/40"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.image_url}
        alt={p.title}
        className="size-14 shrink-0 rounded-lg object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold">{p.title}</p>
          <GradeBadge grade={p.grade} score={p.score} />
        </div>
        <p className="truncate text-[12px] text-muted-foreground">{p.brand} · {p.fabric}</p>
        <p className="mt-0.5 text-xs font-semibold">{formatPrice(p.price, p.currency)}</p>
      </div>
    </Link>
  );
}
