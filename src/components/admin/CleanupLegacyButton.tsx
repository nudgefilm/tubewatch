"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { cleanupNullStartedAt } from "@/app/admin/monitor/actions";

export function CleanupLegacyButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function handleCleanup() {
    startTransition(async () => {
      const result = await cleanupNullStartedAt();
      if (result.error) {
        setMessage(`오류: ${result.error}`);
      } else if (result.updated === 0) {
        setMessage("정리할 데이터 없음");
      } else {
        setMessage(`${result.updated}건 정리 완료`);
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        type="button"
        onClick={handleCleanup}
        disabled={isPending}
        className="rounded border border-amber-400/60 bg-amber-50/60 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100/80 disabled:opacity-50 dark:border-amber-500/40 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/40"
      >
        {isPending ? (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            정리 중…
          </span>
        ) : (
          "레거시 정리하기"
        )}
      </button>
      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
    </div>
  );
}
