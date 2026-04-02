import type { AdminChannelsData } from "./types";
import { formatDateTime } from "@/lib/format/formatDateTime";

function formatNum(n: number) {
  return n.toLocaleString("ko-KR");
}

function formatCount(n: number | null) {
  if (n == null) return "—";
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  return n.toLocaleString("ko-KR");
}

export default function AdminChannelsView({ data }: { data: AdminChannelsData }): JSX.Element {
  const { rows, total } = data;

  return (
    <div className="space-y-6">
      <div className="border-b border-foreground/8 pb-5">
        <h1 className="font-heading text-2xl font-medium tracking-[-0.03em] text-foreground">Channels</h1>
        <p className="mt-1 text-sm text-muted-foreground">총 {formatNum(total)}개의 등록 채널</p>
      </div>

      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-foreground/8 text-muted-foreground">
                <th className="px-4 pb-2 pt-3 font-medium">채널명</th>
                <th className="px-4 pb-2 pt-3 font-medium">YouTube ID</th>
                <th className="px-4 pb-2 pt-3 font-medium">구독자</th>
                <th className="px-4 pb-2 pt-3 font-medium">영상</th>
                <th className="px-4 pb-2 pt-3 font-medium">소유자</th>
                <th className="px-4 pb-2 pt-3 font-medium">마지막 분석</th>
                <th className="px-4 pb-2 pt-3 font-medium">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground/60">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-foreground/[0.02] transition-colors">
                    <td className="max-w-[180px] truncate px-4 py-2.5 font-medium text-foreground/90">
                      {row.channel_title ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">
                      {row.youtube_channel_id
                        ? row.youtube_channel_id.slice(0, 12) + "…"
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-foreground/70">
                      {formatCount(row.subscriber_count)}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-foreground/70">
                      {formatCount(row.video_count)}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-2.5 text-muted-foreground">
                      {row.owner_email ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                      {row.last_analyzed_at ? formatDateTime(row.last_analyzed_at) : "미분석"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                      {row.created_at ? formatDateTime(row.created_at) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
