"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { DirectActionKey, ModalActionKey } from "@/lib/server/admin/getAdminMonitorData";
import { resetStuckPending, resetStuckRunning, clearStuckQueued } from "@/app/admin/monitor/actions";
import { AdminMonitorModal } from "./AdminMonitorModal";

const DIRECT_ACTIONS = {
  resetStuckPending,
  resetStuckRunning,
  clearStuckQueued,
} as const;

type Props = {
  buttonLabel: string;
  directAction?: DirectActionKey;
  modalAction?: ModalActionKey;
  extraData?: unknown;
};

export function CleanupLegacyButton({ buttonLabel, directAction, modalAction, extraData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  function handleClick() {
    if (directAction) {
      startTransition(async () => {
        const result = await DIRECT_ACTIONS[directAction]();
        if (result.error) {
          setResultMsg(`오류: ${result.error}`);
        } else if (result.updated === 0) {
          setResultMsg("처리할 항목 없음");
        } else {
          setResultMsg(`${result.updated}건 처리 완료`);
          router.refresh();
        }
      });
    } else if (modalAction) {
      setModalOpen(true);
    }
  }

  return (
    <>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="rounded border border-foreground/20 bg-foreground/[0.04] px-2.5 py-1 text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/[0.08] disabled:opacity-50"
        >
          {isPending ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              처리 중…
            </span>
          ) : (
            buttonLabel
          )}
        </button>
        {resultMsg && (
          <span className="text-xs text-muted-foreground">{resultMsg}</span>
        )}
      </div>
      {modalOpen && modalAction && (
        <AdminMonitorModal
          action={modalAction}
          extraData={extraData}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
