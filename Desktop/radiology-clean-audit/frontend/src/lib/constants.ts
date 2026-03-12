/** LI-RADS kategorilerine gore Tailwind renk siniflari. */
export const LIRADS_COLORS: Record<string, string> = {
  "LR-1": "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
  "LR-2": "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  "LR-3": "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  "LR-4": "bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
  "LR-5": "bg-red-50 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  "LR-M": "bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
  "LR-TIV": "bg-red-100 text-red-900 border-red-400 dark:bg-red-900/40 dark:text-red-300 dark:border-red-600",
};

/** LI-RADS siralamasi (dusukten yukssege). */
export const LIRADS_ORDER = [
  "LR-1",
  "LR-2",
  "LR-3",
  "LR-4",
  "LR-5",
  "LR-M",
  "LR-TIV",
];

/** Backend API base URL. */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
