"use client";

/**
 * The Fibre Diary — a private, local record of what you bought through
 * The Fibre Set and what it was made of. Stored in localStorage only; no
 * account, no server, no tracking beyond your own browser.
 */

export interface DiaryEntry {
  id: string;
  title: string;
  brand: string;
  price: number;
  /** % oil-derived plastic at time of purchase */
  plastic: number;
  /** % grown natural fibre at time of purchase */
  natural: number;
  date: string; // ISO
}

const KEY = "gt-diary";

export function getDiary(): DiaryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function recordPurchase(entry: Omit<DiaryEntry, "date">) {
  try {
    const list = getDiary();
    list.push({ ...entry, date: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("gt:diary"));
  } catch {
    /* diary must never block a purchase */
  }
}

export function clearDiary() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("gt:diary"));
}
