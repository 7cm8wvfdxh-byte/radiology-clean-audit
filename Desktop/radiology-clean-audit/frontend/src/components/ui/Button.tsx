import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const styles: Record<string, string> = {
    primary: "bg-black text-white hover:bg-zinc-800",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    ghost: "bg-transparent text-zinc-900 hover:bg-zinc-100",
  };

  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}