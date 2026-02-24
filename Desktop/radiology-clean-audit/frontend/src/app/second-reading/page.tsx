"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import LiradsBadge from "@/components/LiradsBadge";
import Breadcrumb from "@/components/Breadcrumb";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { SkeletonList } from "@/components/Skeleton";
import { FormField, Input, Select, Textarea } from "@/components/ui/FormField";
import { getToken, clearToken, authHeaders } from "@/lib/auth";
import { API_BASE, LIRADS_ORDER } from "@/lib/constants";
import { getErrorMessage } from "@/lib/errors";

const LIRADS_OPTIONS = LIRADS_ORDER;

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

function AgreementBadge({ agreement }: { agreement: string }) {
  const color = AGREEMENT_COLORS[agreement] || "bg-zinc-100 text-zinc-800";
  const label = AGREEMENT_LABELS[agreement] || agreement;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
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
      const res = await fetch(`${API_BASE}/second-readings?status=pending`, {
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
    } catch (e: unknown) {
      setPendingErr(getErrorMessage(e));
    } finally {
      setPendingLoading(false);
    }
  }

  async function fetchCompleted() {
    try {
      setCompletedLoading(true);
      setCompletedErr(null);
      const res = await fetch(`${API_BASE}/second-readings?status=completed`, {
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
    } catch (e: unknown) {
      setCompletedErr(getErrorMessage(e));
    } finally {
      setCompletedLoading(false);
    }
  }

  async function fetchCase(caseId: string) {
    try {
      setCaseLoading(true);
      setCaseErr(null);
      setCaseData(null);
      const res = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}`, {
        headers: authHeaders(),
      });
      if (res.status === 401) {
        clearToken();
        router.replace("/");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCaseData(await res.json());
    } catch (e: unknown) {
      setCaseErr(getErrorMessage(e));
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

      const res = await fetch(`${API_BASE}/second-readings/${selected.id}/complete`, {
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
      fetchPending();
      fetchCompleted();
    } catch (e: unknown) {
      setSubmitErr(getErrorMessage(e));
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

      const res = await fetch(`${API_BASE}/second-readings`, {
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
      fetchPending();
    } catch (e: unknown) {
      setAssignErr(getErrorMessage(e));
    } finally {
      setAssigning(false);
    }
  }

  /* ---------- Render ---------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: "Ikinci Okuma" }]} />
        <h1 className="text-xl font-semibold mt-2 dark:text-zinc-100">Ikinci Okuma Akisi</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Kalite guvencesi icin ikinci radyolog degerlendirmesi
        </p>
      </div>

      {/* Section 1: Pending Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Bekleyen Degerlendirmeler</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingLoading && <SkeletonList rows={3} />}
          {pendingErr && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2" role="alert">
              Hata: {pendingErr}
            </div>
          )}
          {!pendingLoading && !pendingErr && pendingList.length === 0 && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">Bekleyen degerlendirme yok</div>
          )}
          {!pendingLoading && !pendingErr && pendingList.length > 0 && (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {pendingList.map((item) => (
                <li
                  key={item.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <LiradsBadge category={item.original_category} />
                    <div>
                      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {item.case_id}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
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

      {/* Section 2: Review Form (when a reading selected) */}
      {selected && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10">
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
              <div className="text-sm text-zinc-500 dark:text-zinc-400" role="status">Vaka yukleniyor...</div>
            )}
            {caseErr && (
              <div className="text-sm text-red-600 dark:text-red-400" role="alert">Hata: {caseErr}</div>
            )}

            {caseData && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Orijinal Kategori:</span>
                  <LiradsBadge category={selected.original_category} />
                </div>

                {caseData.content?.agent_report && (
                  <div>
                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Orijinal Rapor
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <MarkdownRenderer text={caseData.content.agent_report} />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Review form fields */}
            <div className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <FormField label="Degerlendirme" required>
                <Select
                  value={agreement}
                  onChange={(e) => setAgreement(e.target.value)}
                >
                  <option value="">-- Seciniz --</option>
                  <option value="agree">Katiliyorum</option>
                  <option value="disagree">Katilmiyorum</option>
                  <option value="partial">Kismen Katiliyorum</option>
                </Select>
              </FormField>

              <FormField label="Ikinci Okuyucu LI-RADS Kategorisi" hint="Opsiyonel">
                <Select
                  value={secondCategory}
                  onChange={(e) => setSecondCategory(e.target.value)}
                >
                  <option value="">-- Seciniz --</option>
                  {LIRADS_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Yorumlar">
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  placeholder="Degerlendirme notlarinizi yaziniz..."
                />
              </FormField>

              {submitErr && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2" role="alert">
                  Hata: {submitErr}
                </div>
              )}
              {submitOk && (
                <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2" role="status">
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

      {/* Section 3: Assignment Form (admin) */}
      <Card>
        <CardHeader>
          <CardTitle>Yeni Ikinci Okuma Atama</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Vaka ID" required>
              <Input
                type="text"
                value={assignCaseId}
                onChange={(e) => setAssignCaseId(e.target.value)}
                placeholder="orn. CASE1001"
              />
            </FormField>

            <FormField label="Okuyucu Kullanici Adi" required>
              <Input
                type="text"
                value={assignReader}
                onChange={(e) => setAssignReader(e.target.value)}
                placeholder="orn. dr_mehmet"
              />
            </FormField>

            <FormField label="Orijinal Kategori" required>
              <Select
                value={assignCategory}
                onChange={(e) => setAssignCategory(e.target.value)}
              >
                <option value="">-- Seciniz --</option>
                {LIRADS_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {assignErr && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2" role="alert">
              Hata: {assignErr}
            </div>
          )}
          {assignOk && (
            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2" role="status">
              Ikinci okuma basariyla atandi!
            </div>
          )}
          <Button onClick={handleAssign} disabled={assigning}>
            {assigning ? "Ataniyor..." : "Atama Yap"}
          </Button>
        </CardContent>
      </Card>

      {/* Section 4: Completed Reviews History */}
      <Card>
        <CardHeader>
          <CardTitle>Tamamlanan Degerlendirmeler</CardTitle>
        </CardHeader>
        <CardContent>
          {completedLoading && <SkeletonList rows={3} />}
          {completedErr && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2" role="alert">
              Hata: {completedErr}
            </div>
          )}
          {!completedLoading && !completedErr && completedList.length === 0 && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">Henuz tamamlanan degerlendirme yok</div>
          )}
          {!completedLoading && !completedErr && completedList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left">
                    <th className="py-2 pr-3 font-medium text-zinc-600 dark:text-zinc-400">Vaka ID</th>
                    <th className="py-2 pr-3 font-medium text-zinc-600 dark:text-zinc-400">Okuyucu</th>
                    <th className="py-2 pr-3 font-medium text-zinc-600 dark:text-zinc-400">Degerlendirme</th>
                    <th className="py-2 pr-3 font-medium text-zinc-600 dark:text-zinc-400">Orijinal</th>
                    <th className="py-2 pr-3 font-medium text-zinc-600 dark:text-zinc-400">Ikinci Kategori</th>
                    <th className="py-2 pr-3 font-medium text-zinc-600 dark:text-zinc-400">Yorumlar</th>
                    <th className="py-2 font-medium text-zinc-600 dark:text-zinc-400">Tamamlanma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {completedList.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="py-2.5 pr-3 font-medium text-zinc-800 dark:text-zinc-200">
                        {item.case_id}
                      </td>
                      <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400">
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
                          <span className="text-zinc-400 dark:text-zinc-500">-</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                        {item.comments || <span className="text-zinc-400 dark:text-zinc-500">-</span>}
                      </td>
                      <td className="py-2.5 text-zinc-500 dark:text-zinc-400 text-xs">
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
