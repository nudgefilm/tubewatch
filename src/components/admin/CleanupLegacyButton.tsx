"use client";

import { useState } from "react";
import type { DirectActionKey, ModalActionKey } from "@/lib/server/admin/getAdminMonitorData";
import { AdminMonitorModal } from "./AdminMonitorModal";

type Props = {
  buttonLabel: string;
  directAction?: DirectActionKey;
  modalAction?: ModalActionKey;
  extraData?: unknown;
};

export function CleanupLegacyButton({ buttonLabel, directAction, modalAction, extraData }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  // directAction 항목: 어드민 수동 작업 필요 — 버튼 없이 레이블만 표시
  if (directAction && !modalAction) {
    return (
      <div className="mt-3">
        <span className="inline-block rounded border border-dashed border-foreground/15 px-2 py-0.5 text-xs text-muted-foreground/50">
          작업 요청
        </span>
      </div>
    );
  }

  // modalAction 항목: 버튼으로 상세 조회
  function handleClick() {
    if (modalAction) setModalOpen(true);
  }

  return (
    <>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleClick}

          className="rounded border border-foreground/20 bg-foreground/[0.04] px-2.5 py-1 text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/[0.08] disabled:opacity-50"
        >
          {buttonLabel}
        </button>
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
