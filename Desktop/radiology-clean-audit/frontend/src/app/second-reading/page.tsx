"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getToken, clearToken, authHeaders } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const LIRADS_COLORS: Record<string, string> = {
  "LR-1": "bg-green-100 text-green-800 border-green-300",
  "LR-2": "bg-green-50 text-green-700 border-green-200",
  "LR-3": "bg-yellow-50 text-yellow-800 border-yellow-300",
  "LR-4": "bg-orange-50 text-orange-800 border-orange-300",
  "LR-5": "bg-red-50 text-red-800 border-red-300",
  "LR-M": "bg-purple-50 text-purple-800 border-purple-300",
  "LR-TIV": "bg-red-100 text-red-900 border-red-400",
};

const LIRADS_OPTIONS = ["LR-1", "LR-2", "LR-3", "LR-4", "LR-5", "LR-M", "LR-TIV"];

const AGREEMENT_COLORS: Record<string, string> = {
  agree: "bg-green-100 text-green-800",
  disagree: "bg-red-100 text-red-800",
  partial: "bg-yellow-100 text-yellow-800",
};

const AGREEMENT_LABELS: Record<string, string> = {
  agree: "Katiliyorum",
  disagree: "Katilmiyorum",
  partial: "Kismen Katiliyorum",
};

/* ---------- Types ---------- */

type PendingReading = {
  id: string;
  case_id: string;
  reader_username: string;
  original_category: string;
  created_at: string;
};

type CompletedReading = {
  id: string;
  case_id: string;
  reader_username: string;
  agreement: string;
  original_category: string;
  second_category: string | null;
  comments: string | null;
  completed_at: string;
};

type CaseData = {
  case_id: string;
  category?: string;
  content?: {
    agent_report?: string;
  };
  [key: string]: unknown;
};

/* ---------- Helper Components ---------- */

function LiradsBadge({ category }: { category: string }) {
  const color = LIRADS_COLORS[category] || "bg-zinc-100 text-zinc-800 border-zinc-300";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}
    >
      {category}
    </span>
  );
}

function AgreementBadge({ agreement }: { agreement: string }) {
  const color = AGREEMENT_COLORS[agreement] || "bg-zinc-100 text-zinc-800";
  const label = AGREEMENT_LABELS[agreement] || agreement;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}

/** Render basic markdown: headings, bold, italic, lists, line breaks */
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-bold mt-3 mb-1 text-zinc-800">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-bold mt-4 mb-1 text-zinc-900">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-lg font-bold mt-4 mb-1 text-zinc-900">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} className="ml-4 text-sm text-zinc-700 list-disc">
          {line.slice(2)}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<br key={i} />);
    } else {
      // Handle inline **bold** and *italic*
      const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
      const rendered = parts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={j} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={j}>{part.slice(1, -1)}</em>;
        }
        return part;
      });
      elements.push(
        <p key={i} className="text-sm text-zinc-700 leading-relaxed">
          {rendered}
        </p>
      );
    }
  });

  return <div className="space-y-0.5">{elements}</div>;
}

/* ---------- Main Page ---------- */

export default function SecondReadingPage() {
  const router = useRouter();

  /* --- Pending readings --- */
  const [pendingList, setPendingList] = useState<PendingReading[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingErr, setPendingErr] = useState<string | null>(null);

  /* --- Selected reading for review --- */
  const [selected, setSelected] = useState<PendingReading | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const [caseErr, setCaseErr] = useState<string | null>(null);

  /* --- Review form state --- */
  const [agreement, setAgreement] = useState<string>("");
  const [secondCategory, setSecondCategory] = useState<string>("");
  const [comments, setComments] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState(false);

  /* --- Assignment form state (admin) --- */
  const [assignCaseId, setAssignCaseId] = useState("");
  const [assignReader, setAssignReader] = useState("");
  const [assignCategory, setAssignCategory] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignErr, setAssignErr] = useState<string | null>(null);
  const [assignOk, setAssignOk] = useState(false);

  /* --- Completed readings --- */
  const [completedList, setCompletedList] = useState<CompletedReading[]>([]);
  const [completedLoading, setCompletedLoading] = useState(true);
  const [completedErr, setCompletedErr] = useState<string | null>(null);

  /* ---------- Auth check ---------- */

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/");
      return;
    }
    fetchPending();
    fetchCompleted();
  }, []);

  /* ---------- Fetchers ---------- */

  async function fetchPending() {
    try {
      setPendingLoading(true);
      setPendingErr(null);
      const res = await fetch(`${API}/second-readings?status=pending`, {
        headers: authHeaders(),
      });
      if (res.status === 401) {
        clearToken();
        router.replace("/");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPendingList(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setPendingErr(e?.message ?? "Bekleyen okumalar yuklenemedi");
    } finally {
      setPendingLoading(false);
    }
  }

  async function fetchCompleted() {
    try {
      setCompletedLoading(true);
      setCompletedErr(null);
      const res = await fetch(`${API}/second-readings?status=completed`, {
        headers: authHeaders(),
      });
      if (res.status === 401) {
        clearToken();
        router.replace("/");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCompletedList(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setCompletedErr(e?.message ?? "Tamamlanan okumalar yuklenemedi");
    } finally {
      setCompletedLoading(false);
    }
  }

  async function fetchCase(caseId: string) {
    try {
      setCaseLoading(true);
      setCaseErr(null);
      setCaseData(null);
      const res = await fetch(`${API}/cases/${encodeURIComponent(caseId)}`, {
        headers: authHeaders(),
      });
      if (res.status === 401) {
        clearToken();
        router.replace("/");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCaseData(await res.json());
    } catch (e: any) {
      setCaseErr(e?.message ?? "Vaka yuklenemedi");
    } finally {
      setCaseLoading(false);
    }
  }

  /* ---------- Handlers ---------- */

  function handleSelectReading(reading: PendingReading) {
    setSelected(reading);
    setAgreement("");
    setSecondCategory("");
    setComments("");
    setSubmitErr(null);
    setSubmitOk(false);
    fetchCase(reading.case_id);
  }

  function handleCancelReview() {
    setSelected(null);
    setCaseData(null);
    setCaseErr(null);
    setAgreement("");
    setSecondCategory("");
    setComments("");
    setSubmitErr(null);
    setSubmitOk(false);
  }

  async function handleSubmitReview() {
    if (!selected) return;
    if (!agreement) {
      setSubmitErr("Lutfen bir degerlendirme secin");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitErr(null);
      setSubmitOk(false);

      const body: Record<string, string> = { agreement };
      if (secondCategory) body.second_category = secondCategory;
      if (comments.trim()) body.comments = comments.trim();

      const res = await fetch(`${API}/second-readings/${selected.id}/complete`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        clearToken();
        router.replace("/");
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `HTTP ${res.status}`);
      }

      setSubmitOk(true);
      setSelected(null);
      setCaseData(null);
      // Refresh both lists
      fetchPending();
      fetchCompleted();
    } catch (e: any) {
      setSubmitErr(e?.message ?? "Gonderim hatasi");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssign() {
    if (!assignCaseId.trim() || !assignReader.trim() || !assignCategory.trim()) {
      setAssignErr("Tum alanlari doldurun");
      return;
    }

    try {
      setAssigning(true);
      setAssignErr(null);
      setAssignOk(false);

      const res = await fetch(`${API}/second-readings`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_id: assignCaseId.trim(),
          reader_username: assignReader.trim(),
          original_category: assignCategory.trim(),
        }),
      });

      if (res.status === 401) {
        clearToken();
        router.replace("/");
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `HTTP ${res.status}`);
      }

      setAssignOk(true);
      setAssignCaseId("");
      setAssignReader("");
      setAssignCategory("");
      // Refresh pending list
      fetchPending();
    } catch (e: any) {
      setAssignErr(e?.message ?? "Atama hatasi");
    } finally {
      setAssigning(false);
    }
  }

  /* ---------- Render ---------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/" className="text-sm text-zinc-600 hover:underline">
          &larr; Ana Sayfa
        </Link>
        <h1 className="text-xl font-semibold mt-1">Ikinci Okuma Akisi</h1>
        <p className="text-sm text-zinc-500">
          Kalite guvencesi icin ikinci radyolog degerlendirmesi
        </p>
      </div>

      {/* ================================================ */}
      {/* Section 1: Pending Reviews List                   */}
      {/* ================================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Bekleyen Degerlendirmeler</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingLoading && (
            <div className="text-sm text-zinc-500">Yukleniyor...</div>
          )}
          {pendingErr && (
            <div className="text-sm text-red-600">Hata: {pendingErr}</div>
          )}
          {!pendingLoading && !pendingErr && pendingList.length === 0 && (
            <div className="text-sm text-zinc-500">Bekleyen degerlendirme yok</div>
          )}
          {!pendingLoading && !pendingErr && pendingList.length > 0 && (
            <ul className="divide-y divide-zinc-200">
              {pendingList.map((item) => (
                <li
                  key={item.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <LiradsBadge category={item.original_category} />
                    <div>
                      <div className="text-sm font-medium text-zinc-800">
                        {item.case_id}
                      </div>
                      <div className="text-xs text-zinc-500">
                        Okuyucu: {item.reader_username} &middot;{" "}
                        {item.created_at?.slice(0, 10)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="text-xs"
                    onClick={() => handleSelectReading(item)}
                    disabled={selected?.id === item.id}
                  >
                    Degerlendir
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ================================================ */}
      {/* Section 2: Review Form (when a reading selected) */}
      {/* ================================================ */}
      {selected && (
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50/50">
            <div className="flex items-center justify-between">
              <CardTitle>
                Degerlendirme: {selected.case_id}
              </CardTitle>
              <Button
                variant="ghost"
                className="text-xs text-zinc-500"
                onClick={handleCancelReview}
              >
                Iptal
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Case details */}
            {caseLoading && (
              <div className="text-sm text-zinc-500">Vaka yukeniyor...</div>
            )}
            {caseErr && (
              <div className="text-sm text-red-600">Hata: {caseErr}</div>
            )}

            {caseData && (
              <>
                {/* Original category badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">Orijinal Kategori:</span>
                  <LiradsBadge category={selected.original_category} />
                </div>

                {/* Original report */}
                {caseData.content?.agent_report && (
                  <div>
                    <div className="text-sm font-medium text-zinc-700 mb-2">
                      Orijinal Rapor
                    </div>
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {renderMarkdown(caseData.content.agent_report)}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Review form fields */}
            <div className="space-y-4 pt-2 border-t border-zinc-200">
              {/* Agreement */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Degerlendirme
                </label>
                <select
                  value={agreement}
                  onChange={(e) => setAgreement(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                >
                  <option value="">-- Seciniz --</option>
                  <option value="agree">Katiliyorum</option>
                  <option value="disagree">Katilmiyorum</option>
                  <option value="partial">Kismen Katiliyorum</option>
                </select>
              </div>

              {/* Second reader LI-RADS category */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Ikinci Okuyucu LI-RADS Kategorisi{" "}
                  <span className="text-zinc-400 font-normal">(opsiyonel)</span>
                </label>
                <select
                  value={secondCategory}
                  onChange={(e) => setSecondCategory(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                >
                  <option value="">-- Seciniz --</option>
                  {LIRADS_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Yorumlar
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  placeholder="Degerlendirme notlarinizi yaziniz..."
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 resize-y"
                />
              </div>

              {/* Submit */}
              {submitErr && (
                <div className="text-sm text-red-600">Hata: {submitErr}</div>
              )}
              {submitOk && (
                <div className="text-sm text-green-600">
                  Degerlendirme basariyla gonderildi!
                </div>
              )}
              <Button
                onClick={handleSubmitReview}
                disabled={submitting || !agreement}
              >
                {submitting ? "Gonderiliyor..." : "Degerlendirmeyi Gonder"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================ */}
      {/* Section 3: Assignment Form (admin)               */}
      {/* ================================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Yeni Ikinci Okuma Atama</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Case ID */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Vaka ID
              </label>
              <input
                type="text"
                value={assignCaseId}
                onChange={(e) => setAssignCaseId(e.target.value)}
                placeholder="orn. CASE1001"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            {/* Reader username */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Okuyucu Kullanici Adi
              </label>
              <input
                type="text"
                value={assignReader}
                onChange={(e) => setAssignReader(e.target.value)}
                placeholder="orn. dr_mehmet"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            {/* Original category */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Orijinal Kategori
              </label>
              <select
                value={assignCategory}
                onChange={(e) => setAssignCategory(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="">-- Seciniz --</option>
                {LIRADS_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {assignErr && (
            <div className="text-sm text-red-600">Hata: {assignErr}</div>
          )}
          {assignOk && (
            <div className="text-sm text-green-600">
              Ikinci okuma basariyla atandi!
            </div>
          )}
          <Button onClick={handleAssign} disabled={assigning}>
            {assigning ? "Ataniyor..." : "Atama Yap"}
          </Button>
        </CardContent>
      </Card>

      {/* ================================================ */}
      {/* Section 4: Completed Reviews History             */}
      {/* ================================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Tamamlanan Degerlendirmeler</CardTitle>
        </CardHeader>
        <CardContent>
          {completedLoading && (
            <div className="text-sm text-zinc-500">Yukleniyor...</div>
          )}
          {completedErr && (
            <div className="text-sm text-red-600">Hata: {completedErr}</div>
          )}
          {!completedLoading && !completedErr && completedList.length === 0 && (
            <div className="text-sm text-zinc-500">Henuz tamamlanan degerlendirme yok</div>
          )}
          {!completedLoading && !completedErr && completedList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left">
                    <th className="py-2 pr-3 font-medium text-zinc-600">Vaka ID</th>
                    <th className="py-2 pr-3 font-medium text-zinc-600">Okuyucu</th>
                    <th className="py-2 pr-3 font-medium text-zinc-600">Degerlendirme</th>
                    <th className="py-2 pr-3 font-medium text-zinc-600">Orijinal</th>
                    <th className="py-2 pr-3 font-medium text-zinc-600">Ikinci Kategori</th>
                    <th className="py-2 pr-3 font-medium text-zinc-600">Yorumlar</th>
                    <th className="py-2 font-medium text-zinc-600">Tamamlanma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {completedList.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50">
                      <td className="py-2.5 pr-3 font-medium text-zinc-800">
                        {item.case_id}
                      </td>
                      <td className="py-2.5 pr-3 text-zinc-600">
                        {item.reader_username}
                      </td>
                      <td className="py-2.5 pr-3">
                        <AgreementBadge agreement={item.agreement} />
                      </td>
                      <td className="py-2.5 pr-3">
                        <LiradsBadge category={item.original_category} />
                      </td>
                      <td className="py-2.5 pr-3">
                        {item.second_category ? (
                          <LiradsBadge category={item.second_category} />
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-zinc-600 max-w-xs truncate">
                        {item.comments || <span className="text-zinc-400">-</span>}
                      </td>
                      <td className="py-2.5 text-zinc-500 text-xs">
                        {item.completed_at?.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
