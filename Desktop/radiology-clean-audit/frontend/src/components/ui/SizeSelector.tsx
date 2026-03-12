"use client";

interface SizeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  id?: string;
}

const PRESETS = [
  { label: "5 mm", value: "5", desc: "Cok kucuk" },
  { label: "10 mm", value: "10", desc: "Kucuk" },
  { label: "15 mm", value: "15", desc: "Orta-kucuk" },
  { label: "20 mm", value: "20", desc: "Orta" },
  { label: "30 mm", value: "30", desc: "Buyuk" },
  { label: "50 mm", value: "50", desc: "Cok buyuk" },
];

export function SizeSelector({ value, onChange, error, id }: SizeSelectorProps) {
  const numValue = parseInt(value, 10);
  const isValid = !isNaN(numValue) && numValue >= 0 && numValue <= 200;

  return (
    <div className="space-y-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
              value === preset.value
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm dark:bg-indigo-500/10 dark:border-indigo-600 dark:text-indigo-300"
                : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
            }`}
          >
            <div>{preset.label}</div>
            <div className="text-xs opacity-60">{preset.desc}</div>
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="flex items-center gap-4">
        <input
          id={id}
          type="range"
          min={0}
          max={200}
          step={1}
          value={isValid ? numValue : 0}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div
          className={`w-20 text-center rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
            error
              ? "border-red-400 text-red-600 dark:border-red-500 dark:text-red-400"
              : value
              ? "border-indigo-200 text-indigo-700 bg-indigo-50 dark:border-indigo-600 dark:text-indigo-300 dark:bg-indigo-500/10"
              : "border-zinc-200 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
          }`}
        >
          {value ? `${value} mm` : "- mm"}
        </div>
      </div>
    </div>
  );
}
