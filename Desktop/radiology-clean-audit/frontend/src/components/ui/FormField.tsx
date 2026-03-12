import React, { useId } from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children?: React.ReactNode;
}

export function FormField({ label, required, error, hint, children }: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <div>
        {children && React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
              id,
              "aria-invalid": error ? true : undefined,
              "aria-describedby": [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined,
            })
          : children}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "w-full border rounded-lg px-3.5 py-2.5 text-sm transition-all " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 " +
  "dark:bg-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 " +
  "dark:focus:ring-indigo-400/30 dark:focus:border-indigo-400";

const inputNormal = "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800/80";
const inputError = "border-red-400 dark:border-red-500 ring-1 ring-red-400/30";

export function Input({
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={`${inputBase} ${error ? inputError : inputNormal} ${className}`}
      {...props}
    />
  );
}

export function Select({
  error,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      className={`${inputBase} ${error ? inputError : inputNormal} ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  error,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      className={`${inputBase} resize-y ${error ? inputError : inputNormal} ${className}`}
      {...props}
    />
  );
}
