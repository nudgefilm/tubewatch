"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ReportPolling({ accessToken }: { accessToken: string }) {
  const router = useRouter();
  const triggered = useRef(false);

  useEffect(() => {
    // stuck 레코드 복구: 마운트 시 1회 process 트리거
    if (!triggered.current) {
      triggered.current = true;
      fetch("/api/manus/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      }).catch(() => {});
    }

    // 5초마다 서버 컴포넌트 재요청 → 완료 시 ReportView로 전환
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [accessToken, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <p className="mb-2 text-xl font-semibold tracking-tight text-foreground">TubeWatch™</p>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">리포트를 작성하고 있습니다.</p>
        <p className="mt-1 text-xs text-muted-foreground">완료 시 자동으로 전환됩니다.</p>
      </div>
      <div className="flex gap-1 mt-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }} />
        ))}
      </div>
    </div>
  );
}
