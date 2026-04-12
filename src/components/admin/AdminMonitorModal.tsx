"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { ModalActionKey } from "@/lib/server/admin/getAdminMonitorData";
import {
  getFailedJobsDetail,
  getFailedModulesDetail,
  getNullScoreDetail,
  getRecentModuleLogs,
  retestGeminiKey,
  getRecentJobsLog,
  type FailedJobRow,
  type FailedModuleRow,
  type NullScoreRow,
  type ModuleLogRow,
  type GeminiTestResult,
  type RecentJobRow,
} from "@/app/admin/monitor/actions";

const MODAL_TITLES: Record<ModalActionKey, string> = {
  viewFailedJobs: "실패 런 로그 (최근 24h)",
  viewFailedModules: "실패 모듈 상세 (최근 24h)",
  viewNullScoreChannels: "점수 누락 항목",
  viewRecentModuleLogs: "최근 실행 로그 (최근 24h)",
  testGeminiKey: "Gemini API 연결 테스트",
  viewEnvVars: "환경변수 설정 상태",
  viewRecentJobs: "최근 분석 작업",
};

type EnvVarsData = { missing: string[]; leaked: string[] };

type Props = {
  action: ModalActionKey;
  extraData?: unknown;
  onClose: () => void;
};

export function AdminMonitorModal({ action, extraData, onClose }: Props) {
  const [loading, setLoading] = useState(action !== "viewEnvVars");
  const [data, setData] = useState<unknown>(action === "viewEnvVars" ? extraData : null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (action === "viewEnvVars") return;

    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setFetchError(null);
      try {
        let result: unknown = null;
        switch (action) {
          case "viewFailedJobs": {
            const res = await getFailedJobsDetail();
            if (res.error) throw new Error(res.error);
            result = res.rows;
            break;
          }
          case "viewFailedModules": {
            const res = await getFailedModulesDetail();
            if (res.error) throw new Error(res.error);
            result = res.rows;
            break;
          }
          case "viewNullScoreChannels": {
            const res = await getNullScoreDetail();
            if (res.error) throw new Error(res.error);
            result = res.rows;
            break;
          }
          case "viewRecentModuleLogs": {
            const res = await getRecentModuleLogs();
            if (res.error) throw new Error(res.error);
            result = res.rows;
            break;
          }
          case "testGeminiKey": {
            result = await retestGeminiKey();
            break;
          }
          case "viewRecentJobs": {
            const res = await getRecentJobsLog();
            if (res.error) throw new Error(res.error);
            result = res.rows;
            break;
          }
        }
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setFetchError(e instanceof Error ? e.message : "알 수 없는 오류");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [action, extraData]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-foreground/10 bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-4">
          <h2 className="text-sm font-semibold">{MODAL_TITLES[action]}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              조회 중…
            </div>
          )}
          {fetchError && (
            <p className="rounded-lg border border-red-400/30 bg-red-50/40 px-4 py-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
              오류: {fetchError}
            </p>
          )}
          {!loading && !fetchError && data !== null && (
            <ModalContent action={action} data={data} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── 모달 콘텐츠 렌더러 ────────────────────────────────────────────────────────

function ModalContent({ action, data }: { action: ModalActionKey; data: unknown }) {
  switch (action) {
    case "viewFailedJobs":
      return <FailedJobsTable rows={data as FailedJobRow[]} />;
    case "viewFailedModules":
      return <FailedModulesTable rows={data as FailedModuleRow[]} />;
    case "viewNullScoreChannels":
      return <NullScoreTable rows={data as NullScoreRow[]} />;
    case "viewRecentModuleLogs":
      return <ModuleLogsTable rows={data as ModuleLogRow[]} />;
    case "testGeminiKey":
      return <GeminiTestView result={data as GeminiTestResult} />;
    case "viewEnvVars":
      return <EnvVarsView data={data as EnvVarsData} />;
    case "viewRecentJobs":
      return <RecentJobsTable rows={data as RecentJobRow[]} />;
  }
}

// ── 테이블 공통 스타일 ────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{message}</p>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-foreground/10 pb-2 text-left text-xs font-medium text-muted-foreground">
      {children}
    </th>
  );
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={`py-2 pr-4 text-xs ${mono ? "font-mono text-foreground/70" : "text-foreground/80"}`}>
      {children}
    </td>
  );
}

function formatKST(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── 개별 콘텐츠 컴포넌트 ──────────────────────────────────────────────────────

function FailedJobsTable({ rows }: { rows: FailedJobRow[] }) {
  if (rows.length === 0) return <EmptyState message="최근 24시간 실패 런 없음" />;
  return (
    <table className="w-full">
      <thead>
        <tr><Th>시각 (KST)</Th><Th>단계</Th><Th>Job ID</Th></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-foreground/5 last:border-0">
            <Td>{formatKST(r.created_at)}</Td>
            <Td>{r.progress_step ?? "—"}</Td>
            <Td mono>{r.id.slice(0, 8)}…</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FailedModulesTable({ rows }: { rows: FailedModuleRow[] }) {
  if (rows.length === 0) return <EmptyState message="최근 24시간 실패 모듈 없음" />;
  return (
    <table className="w-full">
      <thead>
        <tr><Th>시각 (KST)</Th><Th>모듈</Th><Th>오류</Th></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-foreground/5 last:border-0">
            <Td>{formatKST(r.created_at)}</Td>
            <Td>{r.module_type}</Td>
            <Td>{r.error_message ? r.error_message.slice(0, 60) : "—"}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NullScoreTable({ rows }: { rows: NullScoreRow[] }) {
  if (rows.length === 0) return <EmptyState message="점수 누락 항목 없음" />;
  return (
    <>
      <p className="mb-3 text-xs text-muted-foreground">
        아래 채널은 재분석이 필요합니다. 해당 채널 페이지에서 직접 재분석을 요청하세요.
      </p>
      <table className="w-full">
        <thead>
          <tr><Th>생성 시각 (KST)</Th><Th>Channel ID</Th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-foreground/5 last:border-0">
              <Td>{formatKST(r.created_at)}</Td>
              <Td mono>{r.channel_id}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function ModuleLogsTable({ rows }: { rows: ModuleLogRow[] }) {
  if (rows.length === 0) return <EmptyState message="최근 24시간 완료된 모듈 없음" />;
  return (
    <table className="w-full">
      <thead>
        <tr><Th>시각 (KST)</Th><Th>모듈</Th><Th>소요</Th></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-foreground/5 last:border-0">
            <Td>{formatKST(r.analyzed_at)}</Td>
            <Td>{r.module_type}</Td>
            <Td>
              <span className={r.duration_sec > 60 ? "text-red-500" : r.duration_sec > 10 ? "text-amber-500" : "text-emerald-600"}>
                {r.duration_sec}초
              </span>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GeminiTestView({ result }: { result: GeminiTestResult }) {
  const Icon =
    result.status === "ok" ? CheckCircle2 : result.status === "warn" ? AlertTriangle : XCircle;
  const color =
    result.status === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : result.status === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";
  return (
    <div className="flex items-start gap-3 py-4">
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
      <div>
        <p className={`text-sm font-semibold ${color}`}>{result.displayValue}</p>
        <p className="mt-1 text-xs text-muted-foreground">{result.description}</p>
      </div>
    </div>
  );
}

function EnvVarsView({ data }: { data: EnvVarsData }) {
  const allRequired = [
    "GEMINI_API_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">필수 환경변수</p>
        <div className="space-y-1.5">
          {allRequired.map((k) => {
            const missing = data.missing.includes(k);
            return (
              <div key={k} className="flex items-center gap-2">
                {missing
                  ? <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                <span className={`text-xs font-mono ${missing ? "text-red-500" : "text-foreground/70"}`}>
                  {k}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {data.leaked.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-red-500">NEXT_PUBLIC 노출 감지 (즉시 조치 필요)</p>
          <div className="space-y-1.5">
            {data.leaked.map((k) => (
              <div key={k} className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <span className="text-xs font-mono text-red-500">{k}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.missing.length === 0 && data.leaked.length === 0 && (
        <EmptyState message="모든 환경변수 정상" />
      )}
    </div>
  );
}

function RecentJobsTable({ rows }: { rows: RecentJobRow[] }) {
  if (rows.length === 0) return <EmptyState message="분석 작업 없음" />;

  const statusColor: Record<string, string> = {
    completed: "text-emerald-600 dark:text-emerald-400",
    failed: "text-red-500",
    running: "text-amber-500",
    queued: "text-amber-500",
    pending: "text-muted-foreground",
  };

  return (
    <table className="w-full">
      <thead>
        <tr><Th>시각 (KST)</Th><Th>상태</Th><Th>단계</Th></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-foreground/5 last:border-0">
            <Td>{formatKST(r.created_at)}</Td>
            <Td>
              <span className={statusColor[r.status] ?? "text-foreground/70"}>
                {r.status}
              </span>
            </Td>
            <Td>{r.progress_step ?? "—"}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
