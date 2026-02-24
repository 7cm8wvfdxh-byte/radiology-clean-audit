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
        <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
          <AppHeader />
          <main className="mx-auto max-w-5xl px-4 py-6" role="main">{children}</main>
          <footer className="mx-auto max-w-5xl px-4 py-10 text-xs text-zinc-500 dark:text-zinc-600">
            Radiology-Clean Audit v2.1 &middot; FastAPI + Next.js
          </footer>
        </div>
      </body>
    </html>
  );
}