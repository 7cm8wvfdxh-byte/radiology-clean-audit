"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type CaseItem = {
  case_id: string;
  decision?: string;
  created_at?: string;
};

export default function Home() {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const res = await fetch(`${API}/cases`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setErr(e?.message ?? "Fetch error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cases</h1>
          <div className="text-sm text-zinc-500">List + open a case detail</div>
        </div>

        <Link href="/new">
          <Button>+ New Case</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Case List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-zinc-500">Loading…</div>}
          {err && <div className="text-sm text-red-600">Error: {err}</div>}
          {!loading && !err && items.length === 0 && (
            <div className="text-sm text-zinc-500">No cases found.</div>
          )}

          <ul className="divide-y divide-zinc-200">
            {items.map((c) => (
              <li key={c.case_id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.case_id}</div>
                  <div className="text-sm text-zinc-600">{c.decision ?? "-"}</div>
                </div>

                <Link href={`/cases/${encodeURIComponent(c.case_id)}`}>
                  <Button variant="secondary">Open</Button>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardContent className="text-sm text-zinc-600">
          API Base: <span className="font-mono">{API}</span>
        </CardContent>
      </Card>
    </div>
  );
}