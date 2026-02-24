import { LIRADS_COLORS } from "@/lib/constants";

interface LiradsBadgeProps {
  category: string;
}

export default function LiradsBadge({ category }: LiradsBadgeProps) {
  const color =
    LIRADS_COLORS[category] || "bg-zinc-100 text-zinc-800 border-zinc-300";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}
    >
      {category}
    </span>
  );
}
