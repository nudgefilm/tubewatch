"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  reportId: string;
};

export default function ReportPolling({ reportId }: Props) {
  const router = useRouter();
  const pollCount = useRef(0);

  useEffect(() => {
    let stopped = false;

    async function poll() {
      if (stopped) return;
      pollCount.current += 1;

      try {
        // 24번(2분) 이후부터는 Manus API 직접 확인 (webhook 미수신 대비)
        if (pollCount.current > 24) {
          const syncRes = await fetch("/api/manus/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ report_id: reportId }),
          });
          if (syncRes.ok) {
            const data = await syncRes.json() as { status: string };
            if (data.status === "completed" || data.status === "failed") {
              router.refresh();
              return;
            }
          }
        } else {
          const res = await fetch(`/api/manus/status/${reportId}`);
          if (!res.ok) return;
          const data = await res.json() as { status: string };
          if (data.status === "completed" || data.status === "failed") {
            router.refresh();
            return;
          }
        }
      } catch {
        // 네트워크 오류는 무시하고 계속 폴링
      }
      setTimeout(poll, 5000);
    }

    poll();
    return () => { stopped = true; };
  }, [reportId, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <p className="mb-2 text-xl font-semibold tracking-tight text-foreground">TubeWatch</p>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">튜브워치가 채널을 분석하고 있습니다</p>
        <p className="mt-1 text-xs text-muted-foreground">리포트 생성까지 보통 3~5분 소요됩니다.</p>
        <p className="mt-1 text-xs text-muted-foreground">이 페이지를 열어두면 완료 시 자동으로 결과를 표시합니다.</p>
      </div>
      <div className="flex gap-1 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
