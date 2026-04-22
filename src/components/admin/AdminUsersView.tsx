"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminUsersData, AdminSubscriptionChangeRow } from "./types";
import { formatDateTime } from "@/lib/format/formatDateTime";
import { FREE_LIFETIME_ANALYSIS_LIMIT } from "@/components/billing/types";

// ─── 상수 ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 100;

// SetPlanButton용 옵션 (planId + billingPeriod 조합)
type SetPlanKey = "free" | "creator_monthly" | "creator_semiannual" | "pro_monthly" | "pro_semiannual";

type SetPlanOpt = {
  key: SetPlanKey;
  planId: "free" | "creator" | "pro";
  billingPeriod: "monthly" | "semiannual" | null;
  label: string;
  className: string;
};

const SET_PLAN_OPTS: SetPlanOpt[] = [
  { key: "free",               planId: "free",    billingPeriod: null,         label: "Free",          className: "bg-foreground/10 text-foreground/60" },
  { key: "creator_monthly",    planId: "creator", billingPeriod: "monthly",    label: "Creator 월간",  className: "bg-blue-100 text-blue-700" },
  { key: "creator_semiannual", planId: "creator", billingPeriod: "semiannual", label: "Creator 6개월", className: "bg-blue-100 text-blue-700" },
  { key: "pro_monthly",        planId: "pro",     billingPeriod: "monthly",    label: "Pro 월간",      className: "bg-violet-100 text-violet-700" },
  { key: "pro_semiannual",     planId: "pro",     billingPeriod: "semiannual", label: "Pro 6개월",     className: "bg-violet-100 text-violet-700" },
];

function toSetPlanKey(planId: string | null, billingPeriod: string | null): SetPlanKey {
  if (!planId || planId === "free") return "free";
  if (planId === "creator" && billingPeriod === "semiannual") return "creator_semiannual";
  if (planId === "creator") return "creator_monthly";
  if (planId === "pro" && billingPeriod === "semiannual") return "pro_semiannual";
  return "pro_monthly";
}

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
  pending_cancel: "예약 취소",
};

const PLAN_TIER: Record<string, number> = { free: 0, creator: 1, pro: 2 };

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

function getPlanDisplayLabel(planId: string | null, billingPeriod: string | null): string {
  if (!planId) return "";
  const name = planId === "creator" ? "Creator" : planId === "pro" ? "Pro" : planId;
  const period = billingPeriod === "semiannual" ? " (6개월)" : " (월간)";
  return name + period;
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

function SetPlanButton({
  userId,
  currentPlanId,
  currentBillingPeriod,
  onSuccess,
}: {
  userId: string;
  currentPlanId: string | null;
  currentBillingPeriod: string | null;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reqStatus, setReqStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [applied, setApplied] = useState<SetPlanKey>(() =>
    toSetPlanKey(currentPlanId, currentBillingPeriod)
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSelect(opt: SetPlanOpt) {
    if (opt.key === applied || reqStatus === "loading") return;
    setOpen(false);
    setReqStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/set-user-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planId: opt.planId, billingPeriod: opt.billingPeriod, force: true }),
      });
      const body = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (res.ok && body.ok) {
        setApplied(opt.key);
        setReqStatus("done");
        onSuccess?.();
        setTimeout(() => setReqStatus("idle"), 2000);
      } else {
        setErrorMsg(body.error ?? `HTTP ${res.status}`);
        setReqStatus("error");
        setTimeout(() => { setReqStatus("idle"); setErrorMsg(null); }, 5000);
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "네트워크 오류");
      setReqStatus("error");
      setTimeout(() => { setReqStatus("idle"); setErrorMsg(null); }, 5000);
    }
  }

  const current = SET_PLAN_OPTS.find((o) => o.key === applied) ?? SET_PLAN_OPTS[0];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={reqStatus === "loading"}
        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors disabled:opacity-50 ${current.className}`}
      >
        {reqStatus === "loading" ? "..." : reqStatus === "done" ? "✓ " + current.label : current.label}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-36 rounded-lg border border-foreground/10 bg-background shadow-lg">
          {SET_PLAN_OPTS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleSelect(opt)}
              className={`w-full px-2.5 py-1.5 text-left text-[11px] font-medium hover:bg-foreground/5 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                opt.key === applied ? "opacity-40 cursor-default" : ""
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {reqStatus === "error" && (
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
  defaultBillingPeriod,
  currentPeriodEnd,
  onClose,
  onSuccess,
}: {
  userId: string;
  userEmail: string | null;
  defaultPlanId: string;
  defaultBillingPeriod: "monthly" | "semiannual";
  currentPeriodEnd: string | null;
  onClose: () => void;
  onSuccess: (newExpiresAt: string) => void;
}) {
  const planId = defaultPlanId;
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "semiannual">(defaultBillingPeriod);
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
        body: JSON.stringify({ userId, planId, billingPeriod, durationDays, reason: reason.trim() }),
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
            {/* 결제 주기 선택 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/70">결제 주기</label>
              <div className="flex gap-1.5">
                {(["monthly", "semiannual"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setBillingPeriod(p)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                      billingPeriod === p
                        ? "border-foreground bg-foreground text-background shadow-sm"
                        : "border-foreground/15 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {p === "monthly" ? "월간" : "6개월"}
                  </button>
                ))}
              </div>
            </div>

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

// ─── 서브 컴포넌트: CreditGrantModal ─────────────────────────────────────────

function CreditGrantModal({
  userId,
  userEmail,
  onClose,
  onSuccess,
}: {
  userId: string;
  userEmail: string | null;
  onClose: () => void;
  onSuccess: (count: number) => void;
}) {
  const [count, setCount] = useState<string>("1");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [grantedCount, setGrantedCount] = useState<number | null>(null);

  const parsedCount = parseInt(count, 10);
  const isValidCount = !isNaN(parsedCount) && parsedCount >= 1 && parsedCount <= 99;

  async function handleSubmit() {
    if (!isValidCount || status === "loading") return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/credit-grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, count: parsedCount, reason: reason.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({})) as { ok?: boolean; credits?: number; error?: string };
      if (res.ok && body.ok) {
        setGrantedCount(body.credits ?? parsedCount);
        setStatus("done");
        onSuccess(body.credits ?? parsedCount);
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
        className="relative w-full max-w-sm rounded-2xl border border-foreground/10 bg-background shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="font-heading text-base font-medium tracking-[-0.02em]">크레딧 수동 부여</h3>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{userEmail}</p>
        </div>

        {status === "done" ? (
          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 text-center space-y-1">
            <p className="font-medium">부여 완료</p>
            <p className="text-xs">{grantedCount}회 크레딧이 추가되었습니다.</p>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/70">부여 횟수</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="w-24 rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-xs tabular-nums focus:outline-none focus:border-foreground/30"
                />
                <span className="text-xs text-muted-foreground">회</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/70">부여 사유 <span className="text-muted-foreground/40">(선택)</span></label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 업그레이드 잔여 기간 보상"
                className="w-full rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/30"
              />
            </div>

            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}

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
                disabled={!isValidCount || status === "loading"}
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

type HistoryPanelProps = {
  userId: string;
  userEmail: string | null;
  planId: string | null;
  billingPeriod: "monthly" | "semiannual" | null;
  renewalAt: string | null;
  subscriptionStatus: string | null;
  pendingPlanId: string | null;
  pendingBillingPeriod: "monthly" | "semiannual" | null;
  onClose: () => void;
  onPlanChanged: () => void;
};

function HistoryPanel({
  userId,
  userEmail,
  planId: initPlanId,
  billingPeriod,
  renewalAt,
  subscriptionStatus,
  pendingPlanId: initPendingPlanId,
  pendingBillingPeriod: initPendingBillingPeriod,
  onClose,
  onPlanChanged,
}: HistoryPanelProps) {
  const [history, setHistory] = useState<AdminSubscriptionChangeRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [planId, setPlanId] = useState(initPlanId);
  const [pendingPlanId, setPendingPlanId] = useState(initPendingPlanId);
  const [pendingBillingPeriod, setPendingBillingPeriod] = useState(initPendingBillingPeriod);

  const [showDowngradeForm, setShowDowngradeForm] = useState(false);
  const [targetPlanId, setTargetPlanId] = useState<"creator" | "free" | null>(null);
  const [targetBillingPeriod, setTargetBillingPeriod] = useState<"monthly" | "semiannual">("monthly");
  const [actionStatus, setActionStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [cancelStatus, setCancelStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/subscription-history?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((body: { ok?: boolean; history?: AdminSubscriptionChangeRow[]; error?: string }) => {
        if (body.ok && body.history) setHistory(body.history);
        else setFetchError(body.error ?? "조회 실패");
      })
      .catch((e: unknown) => setFetchError(e instanceof Error ? e.message : "오류"))
      .finally(() => setLoading(false));
  }, [userId]);

  const currentTier = PLAN_TIER[planId ?? "free"] ?? 0;

  const downgradeOptions: Array<{ planId: "creator" | "free"; label: string }> = [];
  if (currentTier > 1) downgradeOptions.push({ planId: "creator", label: "Creator" });
  if (currentTier > 0) downgradeOptions.push({ planId: "free", label: "Free" });

  async function handleDowngrade() {
    if (!targetPlanId || actionStatus === "loading") return;
    setActionStatus("loading");
    setActionError(null);
    try {
      const bp = targetPlanId === "creator" ? targetBillingPeriod : "monthly";
      const res = await fetch("/api/admin/set-user-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planId: targetPlanId, billingPeriod: bp, force: true }),
      });
      const body = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (res.ok && body.ok) {
        setPlanId(targetPlanId);
        setPendingPlanId(null);
        setPendingBillingPeriod(null);
        setShowDowngradeForm(false);
        setTargetPlanId(null);
        setActionStatus("done");
        onPlanChanged();
        setTimeout(() => setActionStatus("idle"), 2000);
      } else {
        setActionError(body.error ?? `HTTP ${res.status}`);
        setActionStatus("error");
        setTimeout(() => { setActionStatus("idle"); setActionError(null); }, 5000);
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "네트워크 오류");
      setActionStatus("error");
      setTimeout(() => { setActionStatus("idle"); setActionError(null); }, 5000);
    }
  }

  async function handleCancelPending() {
    if (cancelStatus === "loading") return;
    setCancelStatus("loading");
    setActionError(null);
    try {
      const res = await fetch("/api/admin/cancel-pending-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const body = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (res.ok && body.ok) {
        setPendingPlanId(null);
        setPendingBillingPeriod(null);
        setCancelStatus("done");
        onPlanChanged();
        setTimeout(() => setCancelStatus("idle"), 2000);
      } else {
        setActionError(body.error ?? `HTTP ${res.status}`);
        setCancelStatus("error");
        setTimeout(() => { setCancelStatus("idle"); setActionError(null); }, 5000);
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "네트워크 오류");
      setCancelStatus("error");
      setTimeout(() => { setCancelStatus("idle"); setActionError(null); }, 5000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-foreground/10 bg-background shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-foreground/8 flex items-center justify-between">
          <div>
            <h3 className="font-heading text-base font-medium tracking-[-0.02em]">구독 이력 · 플랜 변경</h3>
            <p className="mt-0.5 text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          {/* 플랜 변경 섹션 — 유료 플랜 보유 시 표시 */}
          {currentTier > 0 && (
            <div className="px-6 py-4 border-b border-foreground/8 space-y-3">
              {/* 현재 플랜 상태 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getPlanClass(planId)}`}>
                    {getPlanDisplayLabel(planId, billingPeriod)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{formatExpiry(renewalAt)} 만료</span>
                </div>
                {downgradeOptions.length > 0 && !showDowngradeForm && (
                  <button
                    type="button"
                    onClick={() => { setShowDowngradeForm(true); setTargetPlanId(null); }}
                    className="rounded px-2 py-1 text-[10px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    다운그레이드
                  </button>
                )}
              </div>

              {/* 예약된 다운그레이드 */}
              {pendingPlanId && (
                <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                  <p className="text-[10px] text-amber-700">
                    예약된 변경: <span className="font-semibold">{getPlanDisplayLabel(pendingPlanId, pendingBillingPeriod)}</span>{" "}
                    (만료 후 적용)
                  </p>
                  <button
                    type="button"
                    onClick={handleCancelPending}
                    disabled={cancelStatus === "loading"}
                    className="ml-3 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50 transition-colors"
                  >
                    {cancelStatus === "loading" ? "..." : cancelStatus === "done" ? "취소됨" : "예약 취소"}
                  </button>
                </div>
              )}

              {/* 다운그레이드 폼 */}
              {showDowngradeForm && (
                <div className="space-y-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
                  <p className="text-xs font-medium text-foreground/70">변경할 플랜 선택</p>

                  <div className="flex gap-1.5">
                    {downgradeOptions.map((opt) => (
                      <button
                        key={opt.planId}
                        type="button"
                        onClick={() => setTargetPlanId(opt.planId)}
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          targetPlanId === opt.planId
                            ? "border-foreground bg-foreground text-background"
                            : "border-foreground/15 text-muted-foreground hover:border-foreground/40"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Creator 선택 시 결제 주기 */}
                  {targetPlanId === "creator" && (
                    <div className="flex gap-1.5">
                      {(["monthly", "semiannual"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTargetBillingPeriod(p)}
                          className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                            targetBillingPeriod === p
                              ? "border-foreground bg-foreground text-background"
                              : "border-foreground/15 text-muted-foreground hover:border-foreground/40"
                          }`}
                        >
                          {p === "monthly" ? "월간" : "6개월"}
                        </button>
                      ))}
                    </div>
                  )}

                  {targetPlanId && (
                    <p className="text-[10px] text-muted-foreground">
                      {targetPlanId === "free"
                        ? "구독이 즉시 종료됩니다."
                        : renewalAt ? `즉시 Creator로 변경됩니다. 만료일(${formatExpiry(renewalAt)})은 유지됩니다.` : "즉시 Creator로 변경됩니다."}
                    </p>
                  )}

                  {actionError && <p className="text-[10px] text-red-500">{actionError}</p>}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowDowngradeForm(false); setTargetPlanId(null); setActionError(null); }}
                      className="flex-1 rounded-lg border border-foreground/10 py-1.5 text-xs font-medium text-muted-foreground hover:bg-foreground/5 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleDowngrade}
                      disabled={!targetPlanId || actionStatus === "loading"}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-medium text-white disabled:opacity-40 transition-colors ${
                        targetPlanId === "free" ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"
                      }`}
                    >
                      {actionStatus === "loading"
                        ? "처리 중..."
                        : targetPlanId === "free"
                        ? "즉시 Free 전환"
                        : "즉시 다운그레이드"}
                    </button>
                  </div>
                </div>
              )}

              {actionStatus === "done" && !showDowngradeForm && (
                <p className="text-[10px] text-emerald-600">변경이 적용되었습니다.</p>
              )}
            </div>
          )}

          {/* 이력 목록 */}
          <div className="p-6 space-y-3">
            <p className="text-xs font-medium text-foreground/60">변경 이력</p>
            {loading && <p className="text-xs text-muted-foreground text-center py-4">불러오는 중...</p>}
            {fetchError && <p className="text-xs text-red-500 text-center py-4">{fetchError}</p>}
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 다른 메뉴 갔다가 돌아올 때 라우터 캐시 구버전 복원 방지
  useEffect(() => {
    startTransition(() => router.refresh());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [grantModal, setGrantModal] = useState<{ userId: string; email: string | null; periodEnd: string | null; planId: string | null; billingPeriod: string | null } | null>(null);
  const [creditGrantModal, setCreditGrantModal] = useState<{ userId: string; email: string | null } | null>(null);
  const [historyPanel, setHistoryPanel] = useState<{
    userId: string;
    email: string | null;
    planId: string | null;
    billingPeriod: "monthly" | "semiannual" | null;
    renewalAt: string | null;
    subscriptionStatus: string | null;
    pendingPlanId: string | null;
    pendingBillingPeriod: "monthly" | "semiannual" | null;
  } | null>(null);
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
          defaultBillingPeriod={(grantModal.billingPeriod === "semiannual") ? "semiannual" : "monthly"}
          currentPeriodEnd={localExpiry[grantModal.userId] ?? grantModal.periodEnd}
          onClose={() => setGrantModal(null)}
          onSuccess={(newExpiry) => {
            setLocalExpiry((prev) => ({ ...prev, [grantModal.userId]: newExpiry }));
            startTransition(() => router.refresh());
            setTimeout(() => setGrantModal(null), 1500);
          }}
        />
      )}
      {creditGrantModal && (
        <CreditGrantModal
          userId={creditGrantModal.userId}
          userEmail={creditGrantModal.email}
          onClose={() => setCreditGrantModal(null)}
          onSuccess={() => {
            startTransition(() => router.refresh());
            setTimeout(() => setCreditGrantModal(null), 1500);
          }}
        />
      )}
      {historyPanel && (
        <HistoryPanel
          userId={historyPanel.userId}
          userEmail={historyPanel.email}
          planId={historyPanel.planId}
          billingPeriod={historyPanel.billingPeriod}
          renewalAt={historyPanel.renewalAt}
          subscriptionStatus={historyPanel.subscriptionStatus}
          pendingPlanId={historyPanel.pendingPlanId}
          pendingBillingPeriod={historyPanel.pendingBillingPeriod}
          onClose={() => setHistoryPanel(null)}
          onPlanChanged={() => startTransition(() => router.refresh())}
        />
      )}
      {refundModal && (
        <RefundModal
          userId={refundModal.userId}
          userEmail={refundModal.email}
          currentPeriodEnd={localExpiry[refundModal.userId] ?? refundModal.periodEnd}
          onClose={() => setRefundModal(null)}
          onSuccess={() => {
            startTransition(() => router.refresh());
            setTimeout(() => setRefundModal(null), 1500);
          }}
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startTransition(() => router.refresh())}
            disabled={isPending}
            className="rounded-lg border border-foreground/10 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "새로고침 중…" : "새로고침"}
          </button>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이메일 · 이름 · ID 검색"
            className="w-64 rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/30"
          />
        </div>
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
                  const planLabel = row.plan_id && !isExpired(effectivePeriodEnd) && row.subscription_status !== "refunded"
                    ? getPlanDisplayLabel(row.plan_id, row.billing_period)
                    : null;
                  const isPaid = row.subscription_status === "active" || row.subscription_status === "trialing" || row.subscription_status === "manual";
                  const isRefunded = row.subscription_status === "refunded";

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
                          <SetPlanButton
                            key={`${row.id}|${row.plan_id ?? ""}|${row.billing_period ?? ""}`}
                            userId={row.id}
                            currentPlanId={row.plan_id}
                            currentBillingPeriod={row.billing_period}
                            onSuccess={() => startTransition(() => router.refresh())}
                          />
                          <div className="flex items-center gap-1 flex-wrap">
                            {planLabel && (
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
                          {/* pending 플랜 표시 */}
                          {row.pending_plan_id && (
                            <p className="text-[10px] text-amber-600">
                              → {getPlanDisplayLabel(row.pending_plan_id, row.pending_billing_period)} (만료 후 적용)
                            </p>
                          )}
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
                            onClick={() => setGrantModal({ userId: row.id, email: row.email, periodEnd: effectivePeriodEnd, planId: row.plan_id, billingPeriod: row.billing_period })}
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            부여
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreditGrantModal({ userId: row.id, email: row.email })}
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          >
                            크레딧
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryPanel({
                              userId: row.id,
                              email: row.email,
                              planId: row.plan_id,
                              billingPeriod: row.billing_period,
                              renewalAt: effectivePeriodEnd,
                              subscriptionStatus: row.subscription_status,
                              pendingPlanId: row.pending_plan_id,
                              pendingBillingPeriod: row.pending_billing_period,
                            })}
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
