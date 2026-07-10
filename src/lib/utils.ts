import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const convertToIDR = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
};

// ===== LIST MODEL ====
export const usedModels = "gemini-2.5-flash";
// export const usedModels = "gemini-3.1-flash-lite";
// export const usedModels = "gemini-3.1-flash-live-preview";
// --------
// export const usedModels = "gemini-3-flash-preview";
// export const usedModels = "gemini-3.1-flash-lite";
// export const usedModels = "gemini-3.5-flash";
// -----------------------------------------
