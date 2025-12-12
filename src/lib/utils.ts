import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "BDT"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "BDT" ? "USD" : currency, // BDT not supported, use USD formatting
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace("$", currency === "BDT" ? "BDT " : "");
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
