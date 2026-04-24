"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportGeneratingClient({ token }: { token: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("리포트를 생성하고 있습니다.");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const es = new EventSource(`/api/manus/stream?token=${encodeURIComponent(token)}`);

    es.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data as string) as { type: string; message?: string };
        if (data.type === "done") {
          es.close();
          router.replace(`/report/${token}`);
        } else if (data.type === "progress" && data.message) {
          setMessage(data.message);
        } else if (data.type === "error") {
          es.close();
          setIsError(true);
          setMessage(data.message ?? "리포트 생성 중 오류가 발생했습니다.");
        }
      } catch {
        // JSON 파싱 오류 무시
      }
    };

    es.onerror = () => {
      es.close();
      setIsError(true);
      setMessage("연결이 끊겼습니다. 페이지를 새로 고침하세요.");
    };

    return () => es.close();
  }, [token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <p className="mb-2 text-xl font-semibold tracking-tight text-foreground">TubeWatch™</p>
      {!isError && (
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
      {isError && (
        <div className="flex size-8 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-sm text-destructive">✕</span>
        </div>
      )}
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {!isError && (
          <>
            <p className="mt-1 text-xs text-muted-foreground">완료되면 이 페이지가 자동으로 전환됩니다.</p>
          </>
        )}
        {isError && (
          <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            다시 시도
          </button>
        )}
      </div>
      {!isError && (
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
