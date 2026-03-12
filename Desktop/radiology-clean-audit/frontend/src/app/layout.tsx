import "./globals.css";
import type { Metadata } from "next";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "Radiology-Clean",
  description: "Radiology DSL → Audit Pack → PDF + Verify",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-zinc-900 dark:from-zinc-950 dark:via-zinc-950 dark:to-slate-950 dark:text-zinc-100 bg-grid-pattern">
          <AppHeader />
          <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8" role="main">{children}</main>
          <footer className="border-t border-zinc-200/60 dark:border-zinc-800/60 mt-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-500">
                  Radiology-Clean Audit v2.1
                </span>
              </div>
              <span className="text-xs text-zinc-400 dark:text-zinc-600">
                FastAPI + Next.js
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
