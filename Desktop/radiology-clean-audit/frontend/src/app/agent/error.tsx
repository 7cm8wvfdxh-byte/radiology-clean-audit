"use client";

export default function AgentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-lg font-bold text-red-800 mb-2">Radyolog Ajan Hatasi</h2>
      <pre className="text-sm text-red-700 bg-red-100 p-3 rounded overflow-auto whitespace-pre-wrap mb-4">
        {error.message}
        {error.stack && `\n\n${error.stack}`}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
