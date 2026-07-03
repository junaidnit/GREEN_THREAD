import { GRADE_COLORS } from "@/lib/format";

export function GradeBadge({
  grade,
  score,
  size = "sm",
}: {
  grade: string;
  score?: number;
  size?: "sm" | "lg";
}) {
  return (
    <span
      data-testid="grade-badge"
      className={`inline-flex items-center gap-1 rounded-full font-semibold text-white ${GRADE_COLORS[grade] ?? "bg-muted-foreground"} ${
        size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
      }`}
      title={score != null ? `Sustainability score ${score}/100` : `Grade ${grade}`}
    >
      {grade}
      {score != null && <span className="font-normal opacity-90">{score}</span>}
    </span>
  );
}
