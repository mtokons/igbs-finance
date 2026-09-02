import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "EUR"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(d);
}

export function getMonthName(month: number): string {
  const date = new Date(2000, month - 1, 1);
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
}

export function decimalToNumber(value: { toString(): string } | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : parseFloat(value.toString());
}
