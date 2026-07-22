/**
 * Reorder a list so the same image doesn't land within `gap` positions of
 * itself, kills the "same photo twice, side by side" look that a small demo
 * image pool produces. Greedy and stable-ish; falls back to original order
 * when it can't avoid a repeat.
 */
export function spreadByImage<T extends { image_url: string }>(items: T[], gap = 2): T[] {
  const remaining = [...items];
  const out: T[] = [];
  while (remaining.length) {
    const recent = out.slice(-gap).map((p) => p.image_url);
    let idx = remaining.findIndex((p) => !recent.includes(p.image_url));
    if (idx === -1) idx = 0; // unavoidable repeat, take the next
    out.push(remaining.splice(idx, 1)[0]);
  }
  return out;
}
