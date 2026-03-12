"use client";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, icon, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`flex items-center gap-3 w-full p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
        checked
          ? "bg-indigo-50 border-indigo-200 shadow-sm shadow-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-600 dark:shadow-none"
          : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 dark:bg-zinc-800/50 dark:border-zinc-700 dark:hover:border-zinc-600"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {/* Icon */}
      {icon && (
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
          checked
            ? "bg-indigo-100 dark:bg-indigo-500/20"
            : "bg-zinc-100 dark:bg-zinc-700/50"
        }`}>
          <svg className={`w-4.5 h-4.5 transition-colors ${checked ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
          </svg>
        </div>
      )}

      {/* Label + Description */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium transition-colors ${
          checked ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-700 dark:text-zinc-300"
        }`}>
          {label}
        </div>
        {description && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</div>
        )}
      </div>

      {/* Toggle switch */}
      <div className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 ${
        checked
          ? "bg-indigo-600 dark:bg-indigo-500"
          : "bg-zinc-300 dark:bg-zinc-600"
      }`}>
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200"
          style={{ left: checked ? "calc(100% - 22px)" : "2px" }}
        />
      </div>
    </button>
  );
}
