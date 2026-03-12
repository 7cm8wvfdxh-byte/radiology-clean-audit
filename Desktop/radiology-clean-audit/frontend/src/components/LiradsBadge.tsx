import { LIRADS_COLORS } from "@/lib/constants";

interface LiradsBadgeProps {
  category: string;
  label?: string;
}

export default function LiradsBadge({ category, label }: LiradsBadgeProps) {
  const color =
    LIRADS_COLORS[category] || "bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {label ?? category}
    </span>
  );
}
