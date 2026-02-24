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
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
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
        <p id={hintId} className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "w-full border rounded-md px-3 py-2 text-sm transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 " +
  "dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500";

const inputNormal = "border-zinc-300 dark:border-zinc-600";
const inputError = "border-red-400 dark:border-red-500 ring-1 ring-red-400";

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
