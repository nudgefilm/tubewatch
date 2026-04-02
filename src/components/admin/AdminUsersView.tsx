"use client";

import { useState } from "react";
import type { AdminUsersData } from "./types";
import { formatDateTime } from "@/lib/format/formatDateTime";
import { FREE_LIFETIME_ANALYSIS_LIMIT } from "@/components/billing/types";

function formatNum(n: number) {
  return n.toLocaleString("ko-KR");
}

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

export default function AdminUsersView({ data }: { data: AdminUsersData }): JSX.Element {
  const { rows, total } = data;

  return (
    <div className="space-y-6">
      <div className="border-b border-foreground/8 pb-5">
        <h1 className="font-heading text-2xl font-medium tracking-[-0.03em] text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">총 {formatNum(total)}명의 가입 회원</p>
      </div>

      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-foreground/8 text-muted-foreground">
                <th className="px-4 pb-2 pt-3 font-medium">이메일</th>
                <th className="px-4 pb-2 pt-3 font-medium">이름</th>
                <th className="px-4 pb-2 pt-3 font-medium">역할</th>
                <th className="px-4 pb-2 pt-3 font-medium">플랜</th>
                <th className="px-4 pb-2 pt-3 font-medium">채널</th>
                <th className="px-4 pb-2 pt-3 font-medium">Free 사용</th>
                <th className="px-4 pb-2 pt-3 font-medium">가입일</th>
                <th className="px-4 pb-2 pt-3 font-medium">마지막 로그인</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground/60">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const lifeUsed = row.lifetime_analyses_used;
                  const purchased = row.purchased_credits ?? 0;
                  const limit = FREE_LIFETIME_ANALYSIS_LIMIT + purchased;
                  const isExhausted = lifeUsed != null && lifeUsed >= limit;

                  return (
                    <tr key={row.id} className="hover:bg-foreground/[0.02] transition-colors">
                      <td className="max-w-[200px] truncate px-4 py-2.5 text-foreground/80">
                        {row.email ?? "—"}
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-2.5 text-foreground/70">
                        {row.display_name ?? "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {row.role === "admin" ? (
                          <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                            admin
                          </span>
                        ) : (
                          <span className="text-muted-foreground">user</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {(() => {
                          const plan = row.plan_id;
                          const status = row.subscription_status;
                          const isActive = status === "active" || status === "trialing";
                          if (plan && isActive) {
                            return (
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                plan === "pro"
                                  ? "bg-violet-100 text-violet-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                                {plan}
                              </span>
                            );
                          }
                          return <span className="text-muted-foreground/50 text-[10px]">free</span>;
                        })()}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-foreground/70">
                        {row.channel_count}
                      </td>
                      <td className="px-4 py-2.5">
                        {lifeUsed == null ? (
                          <span className="text-muted-foreground/50">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`tabular-nums ${isExhausted ? "text-red-500 font-semibold" : "text-foreground/70"}`}>
                              {lifeUsed}/{limit}
                            </span>
                            {isExhausted && <ResetFreeCreditsButton userId={row.id} />}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                        {row.created_at ? formatDateTime(row.created_at) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                        {row.last_sign_in_at ? formatDateTime(row.last_sign_in_at) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
