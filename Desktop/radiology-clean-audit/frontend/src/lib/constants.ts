/** LI-RADS kategorilerine gore Tailwind renk siniflari. */
export const LIRADS_COLORS: Record<string, string> = {
  "LR-1": "bg-green-100 text-green-800 border-green-300",
  "LR-2": "bg-green-50 text-green-700 border-green-200",
  "LR-3": "bg-yellow-50 text-yellow-800 border-yellow-300",
  "LR-4": "bg-orange-50 text-orange-800 border-orange-300",
  "LR-5": "bg-red-50 text-red-800 border-red-300",
  "LR-M": "bg-purple-50 text-purple-800 border-purple-300",
  "LR-TIV": "bg-red-100 text-red-900 border-red-400",
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
