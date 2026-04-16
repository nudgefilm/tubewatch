"use client";

import { useState, useMemo, useEffect } from "react";
import type { AdminUsersData, AdminSubscriptionChangeRow } from "./types";
import { formatDateTime } from "@/lib/format/formatDateTime";
import { FREE_LIFETIME_ANALYSIS_LIMIT } from "@/components/billing/types";

// ─── 상수 ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 100;

type PlanOption = "free" | "creator" | "pro";

const PLAN_OPTIONS: { id: PlanOption; label: string; className: string }[] = [
  { id: "free",    label: "Free",    className: "bg-foreground/10 text-foreground/60" },
  { id: "creator", label: "Creator", className: "bg-blue-100 text-blue-700" },
  { id: "pro",     label: "Pro",     className: "bg-violet-100 text-violet-700" },
];

const GRANT_PLANS = [
  { id: "creator", label: "Creator" },
  { id: "pro",     label: "Pro" },
] as const;

function grantPlanBadge(id: string): { label: string; cls: string } {
  const p = GRANT_PLANS.find((g) => g.id === id);
  const cls = id === "creator" ? "bg-blue-100 text-blue-700"
    : id === "pro" ? "bg-violet-100 text-violet-700"
    : "bg-foreground/10 text-foreground/60";
  return { label: p?.label ?? id, cls };
}

const GRANT_DURATIONS = [
  { days: 30,  label: "30일" },
  { days: 90,  label: "90일" },
  { days: 180, label: "180일" },
] as const;

const CHANGE_TYPE_LABELS: Record<string, string> = {
  new: "신규",
  upgrade: "업그레이드",
  downgrade: "다운그레이드",
  manual_grant: "수동부여",
  expiry: "만료",
  refund: "환불",
  cancel: "취소",
};

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function formatNum(n: number) { return n.toLocaleString("ko-KR"); }

function formatExpiry(isoString: string | null): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  // 익일까지 이용 허용이므로 만료일 +1일로 표시
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Seoul" });
}

function isExpired(isoString: string | null): boolean {
  if (!isoString) return true;
  return new Date(isoString).getTime() + 24 * 60 * 60 * 1000 < Date.now();
}

function getPlanLabel(planId: string | null): string {
  if (!planId) return "";
  const base: Record<string, string> = {
    creator: "Creator",
    pro: "Pro",
  };
  return base[planId] ?? planId;
}

function getPlanClass(planId: string | null): string {
  if (planId === "pro") return "bg-violet-100 text-violet-700";
  if (planId === "creator") return "bg-blue-100 text-blue-700";
  return "bg-foreground/10 text-foreground/60";
}

function getStatusBadge(status: string | null, expiresAt: string | null) {
  if (status === "refunded") return { label: "환불됨", cls: "bg-red-50 text-red-500" };
  if (status === "manual") return { label: "수동부여", cls: "bg-amber-100 text-amber-700" };
  if (status === "active" || status === "trialing") {
    if (!isExpired(expiresAt)) return { label: "활성", cls: "bg-emerald-100 text-emerald-700" };
    return { label: "만료", cls: "bg-foreground/10 text-foreground/50" };
  }
  if (status === "canceled" || status === "cancelled") return { label: "취소", cls: "bg-foreground/10 text-foreground/50" };
  return null;
}

// ─── 서브 컴포넌트: SetPlanButton ─────────────────────────────────────────────

function SetPlanButton({ userId, currentPlan }: { userId: string; currentPlan: PlanOption }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [applied, setApplied] = useState<PlanOption>(currentPlan);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSelect(planId: PlanOption) {
    if (planId === applied || status === "loading") return;
    setOpen(false);
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/set-user-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planId }),
      });
      const body = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (res.ok && body.ok) {
        setApplied(planId);
        setStatus("done");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setErrorMsg(body.error ?? `HTTP ${res.status}`);
        setStatus("error");
        setTimeout(() => { setStatus("idle"); setErrorMsg(null); }, 5000);
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "네트워크 오류");
      setStatus("error");
      setTimeout(() => { setStatus("idle"); setErrorMsg(null); }, 5000);
    }
  }

  const current = PLAN_OPTIONS.find((p) => p.id === applied) ?? PLAN_OPTIONS[0];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={status === "loading"}
        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors disabled:opacity-50 ${current.className}`}
      >
        {status === "loading" ? "..." : status === "done" ? "✓ " + current.label : current.label}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-24 rounded-lg border border-foreground/10 bg-background shadow-lg">
          {PLAN_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.id)}
              className={`w-full px-2.5 py-1.5 text-left text-[11px] font-medium hover:bg-foreground/5 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                opt.id === applied ? "opacity-40 cursor-default" : ""
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {status === "error" && (
        <span className="ml-1 text-[10px] text-red-500" title={errorMsg ?? ""}>
          실패
        </span>
      )}
    </div>
  );
}

// ─── 서브 컴포넌트: ResetFreeCreditsButton ───────────────────────────────────

function ResetFreeCreditsButton({ userId }: { userId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleReset() {
    if (status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/reset-free-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") return <span className="text-xs text-emerald-600">리셋 완료</span>;
  if (status === "error") return <span className="text-xs text-red-500">실패</span>;

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={status === "loading"}
      className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50 transition-colors"
    >
      {status === "loading" ? "..." : "Free 리셋"}
    </button>
  );
}

// ─── 서브 컴포넌트: ManualGrantModal ─────────────────────────────────────────

function ManualGrantModal({
  userId,
  userEmail,
  defaultPlanId,
  currentPeriodEnd,
  onClose,
  onSuccess,
}: {
  userId: string;
  userEmail: string | null;
  defaultPlanId: string;
  currentPeriodEnd: string | null;
  onClose: () => void;
  onSuccess: (newExpiresAt: string) => void;
}) {
  const planId = defaultPlanId;
  const [durationDays, setDurationDays] = useState<number>(30);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultExpiry, setResultExpiry] = useState<string | null>(null);

  const now = new Date();
  const baseDate = currentPeriodEnd && new Date(currentPeriodEnd) > now
    ? new Date(currentPeriodEnd)
    : now;
  const previewExpiry = new Date(baseDate);
  previewExpiry.setUTCDate(previewExpiry.getUTCDate() + durationDays);

  const isExtending = !!(currentPeriodEnd && new Date(currentPeriodEnd) > now);

  async function handleSubmit() {
    if (!reason.trim() || status === "loading") return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/manual-grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planId, durationDays, reason: reason.trim() }),
      });
      const body = await res.json().catch(() => ({})) as { ok?: boolean; newExpiresAt?: string; error?: string };
      if (res.ok && body.ok && body.newExpiresAt) {
        setResultExpiry(body.newExpiresAt);
        setStatus("done");
        onSuccess(body.newExpiresAt);
      } else {
        setErrorMsg(body.error ?? `HTTP ${res.status}`);
        setStatus("error");
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "네트워크 오류");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl border border-foreground/10 bg-background shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="font-heading text-base font-medium tracking-[-0.02em]">수동 권한 부여</h3>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${grantPlanBadge(planId).cls}`}>
              {grantPlanBadge(planId).label}
            </span>
          </div>
        </div>

        {status === "done" ? (
          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 text-center space-y-1">
            <p className="font-medium">부여 완료</p>
            <p className="text-xs">새 만료일: {formatExpiry(resultExpiry)}</p>
          </div>
        ) : (
          <>
            {/* 기간 선택 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/70">부여 기간</label>
              <div className="flex gap-1.5">
                {GRANT_DURATIONS.map((d) => (
                  <button
                    key={d.days}
                    type="button"
                    onClick={() => setDurationDays(d.days)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                      durationDays === d.days
                        ? "border-foreground bg-foreground text-background shadow-sm"
                        : "border-foreground/15 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 만료일 미리보기 */}
            <div className="rounded-lg bg-foreground/[0.03] border border-foreground/8 px-4 py-3 text-xs space-y-1">
              {isExtending && (
                <div className="flex justify-between text-muted-foreground">
                  <span>현재 만료일</span>
                  <span>{formatExpiry(currentPeriodEnd)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-foreground">
                <span>{isExtending ? "연장 후 만료일" : "새 만료일"}</span>
                <span className="text-emerald-600">{formatExpiry(previewExpiry.toISOString())}</span>
              </div>
              {isExtending && (
                <p className="text-muted-foreground/60 text-[10px] pt-0.5">기존 기간에 합산됩니다.</p>
              )}
            </div>

            {/* 사유 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/70">부여 사유 <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 베타 테스터 리워드 2026-04"
                className="w-full rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/30"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-500">{errorMsg}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-foreground/10 py-2 text-xs font-medium text-muted-foreground hover:bg-foreground/5 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!reason.trim() || status === "loading"}
                className="flex-1 rounded-lg bg-foreground py-2 text-xs font-medium text-background hover:bg-foreground/90 disabled:opacity-40 transition-colors"
              >
                {status === "loading" ? "처리 중..." : "부여"}
              </button>
            </div>
          </>
        )}

        {status === "done" && (
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-foreground/10 py-2 text-xs font-medium text-muted-foreground hover:bg-foreground/5 transition-colors"
          >
            닫기
          </button>
        )}
      </div>
    </div>
  );
}

// ─── 서브 컴포넌트: HistoryPanel ─────────────────────────────────────────────

function HistoryPanel({ userId, userEmail, onClose }: { userId: string; userEmail: string | null; onClose: () => void }) {
  const [history, setHistory] = useState<AdminSubscriptionChangeRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    fetch(`/api/admin/subscription-history?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((body: { ok?: boolean; history?: AdminSubscriptionChangeRow[]; error?: string }) => {
        if (body.ok && body.history) setHistory(body.history);
        else setError(body.error ?? "조회 실패");
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "오류"))
      .finally(() => setLoading(false));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-foreground/10 bg-background shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-foreground/8 flex items-center justify-between">
          <div>
            <h3 className="font-heading text-base font-medium tracking-[-0.02em]">구독 이력</h3>
            <p className="mt-0.5 text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading && <p className="text-xs text-muted-foreground text-center py-4">불러오는 중...</p>}
          {error && <p className="text-xs text-red-500 text-center py-4">{error}</p>}
          {history && history.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">이력이 없습니다.</p>
          )}
          {history && history.length > 0 && (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-xl border border-foreground/8 bg-foreground/[0.02] px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {CHANGE_TYPE_LABELS[item.change_type] ?? item.change_type}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {new Date(item.changed_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">{item.previous_plan_id ?? "없음"}</span>
                    <span className="text-muted-foreground/40">→</span>
                    <span className="font-medium text-foreground">{item.new_plan_id ?? "없음"}</span>
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                      item.change_source === "admin" ? "bg-violet-50 text-violet-600" : "bg-foreground/5 text-muted-foreground"
                    }`}>
                      {item.change_source}
                    </span>
                  </div>
                  {item.new_expires_at && (
                    <p className="text-[10px] text-muted-foreground">
                      만료일: {formatExpiry(item.new_expires_at)}
                    </p>
                  )}
                  {item.note && (
                    <p className="text-[10px] text-muted-foreground/70 border-t border-foreground/5 pt-1.5">
                      {item.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 서브 컴포넌트: RefundModal ───────────────────────────────────────────────

function RefundModal({
  userId,
  userEmail,
  currentPeriodEnd,
  onClose,
  onSuccess,
}: {
  userId: string;
  userEmail: string | null;
  currentPeriodEnd: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleRefund() {
    if (!note.trim() || status === "loading") return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/process-refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, note: note.trim() }),
      });
      const body = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (res.ok && body.ok) {
        setStatus("done");
        onSuccess();
      } else {
        setErrorMsg(body.error ?? `HTTP ${res.status}`);
        setStatus("error");
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "네트워크 오류");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-foreground/10 bg-background shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="font-heading text-base font-medium tracking-[-0.02em]">환불 처리</h3>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{userEmail}</p>
        </div>

        {status === "done" ? (
          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 text-center">
            <p className="font-medium">환불 처리 완료</p>
            <p className="text-xs mt-1">{formatExpiry(currentPeriodEnd)}까지 이용 후 종료됩니다.</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 space-y-1">
              <p className="font-medium">처리 방식 안내</p>
              <p>현재 만료일({formatExpiry(currentPeriodEnd)})까지 이용 후 자동 종료됩니다.</p>
              <p>처리 후 재구독이 제한됩니다.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/70">환불 사유 <span className="text-red-400">*</span></label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 유저 요청 — 서비스 미사용 7일 이내"
                rows={3}
                className="w-full rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/30 resize-none"
              />
            </div>

            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-foreground/10 py-2 text-xs font-medium text-muted-foreground hover:bg-foreground/5 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleRefund}
                disabled={!note.trim() || status === "loading"}
                className="flex-1 rounded-lg bg-red-500 py-2 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
              >
                {status === "loading" ? "처리 중..." : "환불 확정"}
              </button>
            </div>
          </>
        )}

        {status === "done" && (
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-foreground/10 py-2 text-xs font-medium text-muted-foreground hover:bg-foreground/5 transition-colors"
          >
            닫기
          </button>
        )}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function AdminUsersView({ data }: { data: AdminUsersData }): JSX.Element {
  const { rows, total } = data;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [grantModal, setGrantModal] = useState<{ userId: string; email: string | null; periodEnd: string | null; planId: string | null } | null>(null);
  const [historyPanel, setHistoryPanel] = useState<{ userId: string; email: string | null } | null>(null);
  const [refundModal, setRefundModal] = useState<{ userId: string; email: string | null; periodEnd: string | null } | null>(null);
  // 로컬 만료일 업데이트 (수동부여 성공 시)
  const [localExpiry, setLocalExpiry] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.email?.toLowerCase().includes(q) ||
        r.display_name?.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }, [rows, search]);

  // 검색어 변경 시 첫 페이지로 리셋
  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* 모달 */}
      {grantModal && (
        <ManualGrantModal
          userId={grantModal.userId}
          userEmail={grantModal.email}
          defaultPlanId={grantModal.planId ?? "creator"}
          currentPeriodEnd={localExpiry[grantModal.userId] ?? grantModal.periodEnd}
          onClose={() => setGrantModal(null)}
          onSuccess={(newExpiry) => {
            setLocalExpiry((prev) => ({ ...prev, [grantModal.userId]: newExpiry }));
            setTimeout(() => setGrantModal(null), 1500);
          }}
        />
      )}
      {historyPanel && (
        <HistoryPanel
          userId={historyPanel.userId}
          userEmail={historyPanel.email}
          onClose={() => setHistoryPanel(null)}
        />
      )}
      {refundModal && (
        <RefundModal
          userId={refundModal.userId}
          userEmail={refundModal.email}
          currentPeriodEnd={localExpiry[refundModal.userId] ?? refundModal.periodEnd}
          onClose={() => setRefundModal(null)}
          onSuccess={() => setTimeout(() => setRefundModal(null), 1500)}
        />
      )}

      {/* 헤더 */}
      <div className="border-b border-foreground/8 pb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium tracking-[-0.03em] text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            총 {formatNum(total)}명
            {search && ` · 검색결과 ${formatNum(filtered.length)}명`}
            {totalPages > 1 && ` · ${page}/${totalPages} 페이지`}
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이메일 · 이름 · ID 검색"
          className="w-64 rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/30"
        />
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-foreground/8 text-muted-foreground">
                <th className="px-4 pb-2 pt-3 font-medium">이메일</th>
                <th className="px-4 pb-2 pt-3 font-medium">역할</th>
                <th className="px-4 pb-2 pt-3 font-medium">플랜</th>
                <th className="px-4 pb-2 pt-3 font-medium">만료일</th>
                <th className="px-4 pb-2 pt-3 font-medium">채널</th>
                <th className="px-4 pb-2 pt-3 font-medium">채널분석</th>
                <th className="px-4 pb-2 pt-3 font-medium">가입일</th>
                <th className="px-4 pb-2 pt-3 font-medium">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground/60">
                    {search ? "검색 결과가 없습니다." : "데이터가 없습니다."}
                  </td>
                </tr>
              ) : (
                paged.map((row) => {
                  const effectivePeriodEnd = localExpiry[row.id] ?? row.renewal_at;
                  const lifeUsed = row.lifetime_analyses_used;
                  const purchased = row.purchased_credits ?? 0;
                  const limit = FREE_LIFETIME_ANALYSIS_LIMIT + purchased;
                  const isExhausted = lifeUsed != null && lifeUsed >= limit;
                  const totalAnalyses = row.total_analyses_count;

                  const statusBadge = getStatusBadge(row.subscription_status, effectivePeriodEnd);
                  const planLabel = row.plan_id ? getPlanLabel(row.plan_id) : null;
                  const isPaid = row.subscription_status === "active" || row.subscription_status === "trialing" || row.subscription_status === "manual";
                  const isRefunded = row.subscription_status === "refunded";

                  const currentPlan: PlanOption =
                    isPaid && !isExpired(effectivePeriodEnd) && (row.plan_id === "creator" || row.plan_id === "pro")
                      ? row.plan_id
                      : "free";

                  return (
                    <tr key={row.id} className="hover:bg-foreground/[0.02] transition-colors">
                      {/* 이메일 */}
                      <td className="px-4 py-2.5">
                        <div className="max-w-[200px]">
                          <p className="truncate text-foreground/80">{row.email ?? "—"}</p>
                          {row.display_name && (
                            <p className="truncate text-muted-foreground/60 text-[10px]">{row.display_name}</p>
                          )}
                        </div>
                      </td>

                      {/* 역할 */}
                      <td className="px-4 py-2.5">
                        {row.role === "admin" ? (
                          <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground">admin</span>
                        ) : (
                          <span className="text-muted-foreground">user</span>
                        )}
                      </td>

                      {/* 플랜 */}
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-1">
                          <SetPlanButton userId={row.id} currentPlan={currentPlan} />
                          <div className="flex items-center gap-1 flex-wrap">
                            {planLabel && !isExpired(effectivePeriodEnd) && (
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getPlanClass(row.plan_id)}`}>
                                {planLabel}
                              </span>
                            )}
                            {statusBadge && (
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusBadge.cls}`}>
                                {statusBadge.label}
                              </span>
                            )}
                            {row.grant_type === "manual" && (
                              <span className="rounded px-1.5 py-0.5 text-[10px] text-amber-600 bg-amber-50">수동</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 만료일 */}
                      <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                        {effectivePeriodEnd ? (
                          <span className={isExpired(effectivePeriodEnd) ? "text-muted-foreground/50" : "text-foreground/70"}>
                            {formatExpiry(effectivePeriodEnd)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* 채널 */}
                      <td className="px-4 py-2.5 tabular-nums text-foreground/70">
                        {row.channel_count}
                      </td>

                      {/* 채널분석 */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums text-foreground/70">
                            {totalAnalyses > 0 ? `${totalAnalyses}회` : <span className="text-muted-foreground/50">—</span>}
                          </span>
                          {isExhausted && <ResetFreeCreditsButton userId={row.id} />}
                        </div>
                      </td>

                      {/* 가입일 */}
                      <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                        {row.created_at ? formatDateTime(row.created_at) : "—"}
                      </td>

                      {/* 액션 */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setGrantModal({ userId: row.id, email: row.email, periodEnd: effectivePeriodEnd, planId: row.plan_id })}
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            부여
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryPanel({ userId: row.id, email: row.email })}
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-foreground/5 text-muted-foreground hover:bg-foreground/10 transition-colors"
                          >
                            이력
                          </button>
                          {isPaid && !isRefunded && !isExpired(effectivePeriodEnd) && (
                            <button
                              type="button"
                              onClick={() => setRefundModal({ userId: row.id, email: row.email, periodEnd: effectivePeriodEnd })}
                              className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                            >
                              환불
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            {formatNum((page - 1) * PAGE_SIZE + 1)}–{formatNum(Math.min(page * PAGE_SIZE, filtered.length))} / {formatNum(filtered.length)}명
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded px-2.5 py-1 text-xs font-medium border border-foreground/10 text-muted-foreground hover:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground/40">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`rounded px-2.5 py-1 text-xs font-medium border transition-colors ${
                      page === p
                        ? "border-foreground/30 bg-foreground text-background"
                        : "border-foreground/10 text-muted-foreground hover:bg-foreground/5"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded px-2.5 py-1 text-xs font-medium border border-foreground/10 text-muted-foreground hover:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
