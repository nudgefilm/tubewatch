"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ReportPolling({ reportId }: { reportId: string }) {
  const router = useRouter();
  const triggered = useRef(false);

  useEffect(() => {
    // 마운트 시 1회만 process 트리거 (중복 방지)
    if (!triggered.current) {
      triggered.current = true;
      fetch("/api/manus/process", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: reportId }),
      }).catch(() => {});
    }

    // 5초마다 서버 컴포넌트 재요청 → 완료 시 ReportView로 전환
    const id = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [reportId, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <p className="mb-2 text-xl font-semibold tracking-tight text-foreground">TubeWatch™</p>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">튜브워치가 채널 데이터 해석을 통해 월간 리포트를 작성하고 있습니다.</p>
        <p className="mt-1 text-xs text-muted-foreground">리포트 생성까지 보통 1~2분 소요됩니다.</p>
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
