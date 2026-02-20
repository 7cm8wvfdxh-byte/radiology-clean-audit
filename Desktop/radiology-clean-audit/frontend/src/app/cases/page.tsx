"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CaseItem = {
  case_id: string;
  decision?: string;
  generated_at?: string;
};

export default function CasesPage() {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cases")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        // beklenen: [{case_id, decision, generated_at}, ...]
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Radiology-Clean</h1>

      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}

      <ul>
        {items.map((c) => (
          <li key={c.case_id}>
            <Link href={`/cases/${encodeURIComponent(c.case_id)}`}>
              {c.case_id}
            </Link>
            {c.decision ? ` — ${c.decision}` : ""}
          </li>
        ))}
      </ul>

      <p style={{ marginTop: 16 }}>
        Örnek: <Link href="/cases/CASE1001">/cases/CASE1001</Link>
      </p>
    </main>
  );
}
