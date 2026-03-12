import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 " +
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer";

  const styles: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20 " +
      "hover:from-indigo-500 hover:to-blue-500 hover:shadow-lg hover:shadow-indigo-500/30 " +
      "active:from-indigo-700 active:to-blue-700 " +
      "dark:from-indigo-500 dark:to-blue-500 dark:shadow-indigo-500/10 " +
      "dark:hover:from-indigo-400 dark:hover:to-blue-400",
    secondary:
      "bg-white text-zinc-700 border border-zinc-200 shadow-sm " +
      "hover:bg-zinc-50 hover:border-zinc-300 hover:shadow " +
      "dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 " +
      "dark:hover:bg-zinc-700 dark:hover:border-zinc-600",
    ghost:
      "bg-transparent text-zinc-700 hover:bg-zinc-100 " +
      "dark:text-zinc-300 dark:hover:bg-zinc-800",
    danger:
      "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20 " +
      "hover:from-red-500 hover:to-rose-500 hover:shadow-lg hover:shadow-red-500/30 " +
      "dark:from-red-500 dark:to-rose-500",
  };

  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
