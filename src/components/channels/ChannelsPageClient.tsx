"use client";

import { useCallback, useEffect, useState } from "react";
import RegisterChannelForm from "@/components/channels/RegisterChannelForm";
import {
  readSelectedChannelIdFromStorage,
  writeSelectedChannelIdToStorage,
} from "@/lib/channels/selectedChannelStorage";

type ChannelRow = {
  id: string;
  channel_title: string | null;
  channel_url: string | null;
  channel_id: string | null;
  created_at?: string | null;
};

function broadcastChannelsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("tubewatch-channels-updated"));
}

export default function ChannelsPageClient(): JSX.Element {
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    setListError(null);
    try {
      const res = await fetch("/api/channels", { credentials: "include" });
      const json: { ok?: boolean; data?: ChannelRow[]; error?: string } =
        await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(json.error || "목록을 불러오지 못했습니다.");
        setChannels([]);
        return;
      }
      setChannels(Array.isArray(json.data) ? json.data : []);
    } catch {
      setListError("목록을 불러오지 못했습니다.");
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  const handleDelete = async (row: ChannelRow) => {
    if (!window.confirm(`"${row.channel_title ?? row.channel_id ?? "채널"}"을(를) 삭제할까요?`)) {
      return;
    }
    setDeletingId(row.id);
    setListError(null);
    try {
      const res = await fetch("/api/channels", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: row.id }),
      });
      const json: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(json.error || "삭제에 실패했습니다.");
        return;
      }
      const selected = readSelectedChannelIdFromStorage();
      if (selected === row.id) {
        writeSelectedChannelIdToStorage(null);
      }
      broadcastChannelsUpdated();
      await loadChannels();
    } catch {
      setListError("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">내 채널</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          등록한 채널은 사이드바에서 선택할 수 있습니다. 선택 상태는 이 브라우저에 저장됩니다.
        </p>
      </div>

      <RegisterChannelForm
        currentCount={channels.length}
        onRegistered={() => {
          broadcastChannelsUpdated();
          void loadChannels();
        }}
      />

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          등록된 채널
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        ) : listError ? (
          <p className="text-sm text-red-600">{listError}</p>
        ) : channels.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 채널이 없습니다.</p>
        ) : (
          <ul className="divide-y rounded-xl border border-border bg-card">
            {channels.map((ch) => (
              <li
                key={ch.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {ch.channel_title ?? ch.channel_id ?? "채널"}
                  </p>
                  {ch.channel_url ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {ch.channel_url}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={deletingId === ch.id}
                  onClick={() => void handleDelete(ch)}
                  className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingId === ch.id ? "삭제 중…" : "삭제"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
