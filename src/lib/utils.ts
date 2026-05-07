import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Simple cn utility (no shadcn dependency needed)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "CNY"): string {
  const sign = currency === "CNY" ? "¥" : "$";
  return `${sign}${amount.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function getStatusFromRatio(ratio: number): "normal" | "warning" | "danger" | "over" {
  if (ratio < 0) return "over";
  if (ratio <= 0.1) return "danger";
  if (ratio <= 0.3) return "warning";
  return "normal";
}

export function getStatusColor(status: "normal" | "warning" | "danger" | "over"): string {
  switch (status) {
    case "normal": return "#22c55e";
    case "warning": return "#3b82f6";
    case "danger": return "#f97316";
    case "over": return "#ef4444";
  }
}

export function getStatusLabel(status: "normal" | "warning" | "danger" | "over"): string {
  switch (status) {
    case "normal": return "正常";
    case "warning": return "需要关注";
    case "danger": return "即将超支";
    case "over": return "已超支";
  }
}

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function currentYear(): number {
  return new Date().getFullYear();
}
