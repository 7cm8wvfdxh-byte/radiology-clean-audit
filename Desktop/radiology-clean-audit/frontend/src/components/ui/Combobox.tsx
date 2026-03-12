"use client";

import { useState, useRef, useEffect } from "react";

interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  error?: boolean;
  id?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Ara veya sec...",
  emptyMessage = "Sonuc bulunamadi",
  error,
  id,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = search
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.value.toLowerCase().includes(search.toLowerCase()) ||
          o.description?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setSearch("");
  }

  function handleInputFocus() {
    setOpen(true);
    setSearch("");
  }

  const borderClass = error
    ? "border-red-400 dark:border-red-500 ring-1 ring-red-400/30"
    : open
    ? "border-indigo-500 ring-2 ring-indigo-500/40 dark:border-indigo-400 dark:ring-indigo-400/30"
    : "border-zinc-300 dark:border-zinc-600";

  return (
    <div ref={ref} className="relative">
      <div
        className={`flex items-center w-full border rounded-lg bg-white dark:bg-zinc-800/80 transition-all ${borderClass} ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={() => { if (!disabled) { setOpen(true); inputRef.current?.focus(); } }}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          disabled={disabled}
          value={open ? search : selectedOption?.label ?? ""}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          className="flex-1 px-3.5 py-2.5 text-sm bg-transparent outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500 min-w-0"
          autoComplete="off"
        />
        {value && !open && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="p-1 mr-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Temizle"
          >
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <svg className={`w-4 h-4 text-zinc-400 mr-3 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg max-h-60 overflow-auto animate-fade-in">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-zinc-400 dark:text-zinc-500 text-center">
              {emptyMessage}
            </div>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 ${
                  option.value === value
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                }`}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{option.description}</div>
                  )}
                </div>
                {option.value === value && (
                  <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
