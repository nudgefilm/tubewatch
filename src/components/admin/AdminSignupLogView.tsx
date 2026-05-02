"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminSignupLogData, SignupLogRow } from "@/lib/server/admin/getAdminSignupLogData";

const PAGE_SIZE = 10;

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ row }: { row: SignupLogRow }) {
  if (row.withdrawn_at) {
    return (
      <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-foreground/8 text-muted-foreground">
        탈퇴
      </span>
    );
  }
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-600">
      활성
    </span>
  );
}

export default function AdminSignupLogView({ data, hideHeader }: { data: AdminSignupLogData; hideHeader?: boolean }): JSX.Element {
  const { rows, total } = data;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paged = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page]
  );

  const activeCount = rows.filter((r) => !r.withdrawn_at).length;
  const withdrawnCount = rows.filter((r) => r.withdrawn_at).length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      {!hideHeader && (
        <div className="border-b border-foreground/8 pb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-medium tracking-[-0.03em] text-foreground">
              가입 로그
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              총 {total}건 · 활성 {activeCount} · 탈퇴 {withdrawnCount}
              {totalPages > 1 && ` · ${page}/${totalPages}페이지`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/50">
              최신 100건 보관 · 10건 × 10페이지 · 탈퇴 후에도 기록 유지
            </p>
          </div>
          <button
            type="button"
            onClick={() => startTransition(() => router.refresh())}
            disabled={isPending}
            className="rounded-lg border border-foreground/10 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-foreground/5 disabled:opacity-40 transition-colors"
          >
            {isPending ? "새로고침 중…" : "새로고침"}
          </button>
        </div>
      )}

      {/* 테이블 */}
      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-foreground/8">
                <th className="px-4 pb-2 pt-3 font-semibold text-foreground">#</th>
                <th className="px-4 pb-2 pt-3 font-semibold text-foreground">상태</th>
                <th className="px-4 pb-2 pt-3 font-semibold text-foreground">이메일</th>
                <th className="px-4 pb-2 pt-3 font-semibold text-foreground">등록 채널</th>
                <th className="px-4 pb-2 pt-3 font-semibold text-foreground">가입일시</th>
                <th className="px-4 pb-2 pt-3 font-semibold text-foreground">탈퇴일시</th>
                <th className="px-4 pb-2 pt-3 font-semibold text-foreground text-right">성공</th>
                <th className="px-4 pb-2 pt-3 font-semibold text-foreground text-right">실패</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground/50">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                paged.map((row, idx) => {
                  const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                  const isWithdrawn = !!row.withdrawn_at;
                  return (
                    <tr
                      key={row.id}
                      className={[
                        "transition-colors",
                        isWithdrawn
                          ? "opacity-50 hover:opacity-70"
                          : "hover:bg-foreground/[0.02]",
                      ].join(" ")}
                    >
                      {/* # */}
                      <td className="px-4 py-2.5 tabular-nums text-muted-foreground/50 w-10">
                        {rowNum}
                      </td>

                      {/* 상태 */}
                      <td className="px-4 py-2.5">
                        <StatusBadge row={row} />
                      </td>

                      {/* 이메일 */}
                      <td className="px-4 py-2.5 max-w-[200px]">
                        <p className="truncate text-foreground/80">
                          {row.email ?? "—"}
                        </p>
                      </td>

                      {/* 등록 채널 */}
                      <td className="px-4 py-2.5 max-w-[160px]">
                        {row.channel_title ? (
                          <p className="truncate text-foreground/70">{row.channel_title}</p>
                        ) : (
                          <span className="text-muted-foreground/40">미등록</span>
                        )}
                      </td>

                      {/* 가입일시 */}
                      <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                        {fmt(row.joined_at)}
                      </td>

                      {/* 탈퇴일시 */}
                      <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                        {row.withdrawn_at ? (
                          <span className="text-muted-foreground/60">{fmt(row.withdrawn_at)}</span>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>

                      {/* 성공 */}
                      <td className="px-4 py-2.5 tabular-nums text-right">
                        {row.analysis_success_count > 0 ? (
                          <span className="font-medium text-emerald-600">
                            {row.analysis_success_count}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">0</span>
                        )}
                      </td>

                      {/* 실패 */}
                      <td className="px-4 py-2.5 tabular-nums text-right">
                        {row.analysis_failure_count > 0 ? (
                          <span className="font-medium text-red-500">
                            {row.analysis_failure_count}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">0</span>
                        )}
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
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} / {rows.length}건
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded px-2.5 py-1 text-xs font-medium border border-foreground/10 text-muted-foreground hover:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={[
                  "rounded px-2.5 py-1 text-xs font-medium border transition-colors",
                  page === p
                    ? "border-foreground/30 bg-foreground text-background"
                    : "border-foreground/10 text-muted-foreground hover:bg-foreground/5",
                ].join(" ")}
              >
                {p}
              </button>
            ))}
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
