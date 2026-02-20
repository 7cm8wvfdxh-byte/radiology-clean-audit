import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Radiology-Clean",
  description: "Radiology DSL → Audit Pack → PDF + Verify",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
          <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
              <div className="font-semibold">Radiology-Clean</div>
              <div className="text-xs text-zinc-500">Local: 3000 ↔ API: 8000</div>
            </div>
          </header>

          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

          <footer className="mx-auto max-w-5xl px-4 py-10 text-xs text-zinc-500">
            Prototype UI • FastAPI + Next.js
          </footer>
        </div>
      </body>
    </html>
  );
}