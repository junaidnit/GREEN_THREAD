import type { Metadata } from "next";
import { DiaryClient } from "./diary-client";

export const metadata: Metadata = {
  title: "Your Fibre Diary — GreenThread",
  description: "What you actually bought, and how much of it was natural fibre.",
  robots: { index: false },
};

export default function DiaryPage() {
  return <DiaryClient />;
}
