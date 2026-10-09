import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function minutesUntil(isoString: string | null | undefined): number | null {
  if (!isoString) return null;
  const diff = new Date(isoString).getTime() - Date.now();
  return Math.round(diff / 60000);
}

export function formatEta(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  const mins = minutesUntil(isoString);
  if (mins === null) return "-";
  if (mins <= 0) return "到站";
  if (mins === 1) return "1 分鐘";
  return `${mins} 分鐘`;
}

export function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString("zh-HK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
