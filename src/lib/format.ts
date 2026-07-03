export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export const GRADE_COLORS: Record<string, string> = {
  A: "bg-grade-a",
  B: "bg-grade-b",
  C: "bg-grade-c",
  D: "bg-grade-d",
  E: "bg-grade-e",
};

export function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
