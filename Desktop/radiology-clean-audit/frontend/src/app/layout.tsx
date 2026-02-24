import "./globals.css";
import type { Metadata } from "next";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "Radiology-Clean",
  description: "Radiology DSL → Audit Pack → PDF + Verify",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <div className="min-h-screen bg-zinc-50 text-zinc-900">
          <AppHeader />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
          <footer className="mx-auto max-w-5xl px-4 py-10 text-xs text-zinc-500">
            Prototype UI • FastAPI + Next.js
          </footer>
        </div>
      </body>
    </html>
  );
}