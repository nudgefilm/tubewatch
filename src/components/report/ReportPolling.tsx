"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReportPolling() {
  const router = useRouter();

  useEffect(() => {
    // status API 대신 router.refresh()로 서버 컴포넌트를 직접 재요청
    // → 인증 불필요, 완료 즉시 ReportView로 전환
    const id = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <p className="mb-2 text-xl font-semibold tracking-tight text-foreground">TubeWatch™</p>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">튜브워치가 채널 데이터 해석을 통해 월간 리포트를 작성하고 있습니다.</p>
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
