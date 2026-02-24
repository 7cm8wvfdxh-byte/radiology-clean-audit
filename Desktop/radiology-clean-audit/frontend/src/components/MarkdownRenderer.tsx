import React from "react";

interface MarkdownRendererProps {
  text: string;
  className?: string;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, j) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={j} className="font-semibold text-zinc-800 dark:text-zinc-200">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={j}>{part.slice(1, -1)}</em>;
    }
    return <span key={j}>{part}</span>;
  });
}

export default function MarkdownRenderer({ text, className = "" }: MarkdownRendererProps) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-bold mt-3 mb-1 text-zinc-800 dark:text-zinc-200">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-bold mt-4 mb-2 text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 pb-1">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-lg font-bold mt-4 mb-1 text-zinc-900 dark:text-zinc-100">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} className="ml-4 text-sm text-zinc-700 dark:text-zinc-300 list-disc">
          {renderInline(line.slice(2))}
        </li>
      );
    } else if (line.trim() === "---") {
      elements.push(<hr key={i} className="my-3 border-zinc-200 dark:border-zinc-700" />);
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  });

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>;
}
