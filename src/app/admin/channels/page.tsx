import { fetchAdminChannels } from "@/lib/admin/fetchAdminChannels";
import { formatDateTime } from "@/lib/format/formatDateTime";
import { formatSubscribers } from "@/lib/format/formatSubscribers";
import type { AdminChannelRow } from "@/lib/admin/types";
import AdminStatusBadge from "@/components/ui/AdminStatusBadge";
import EmptyState from "@/components/ui/EmptyState";

function ChannelsTable({ channels }: { channels: AdminChannelRow[] }): JSX.Element {
  if (channels.length === 0) {
    return <EmptyState dashed message="등록된 채널이 없습니다." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
            <th className="px-4 py-2.5 font-medium">채널명</th>
            <th className="px-4 py-2.5 font-medium">소유 사용자</th>
            <th className="px-4 py-2.5 text-right font-medium">구독자</th>
            <th className="px-4 py-2.5 font-medium">등록일</th>
            <th className="px-4 py-2.5 font-medium">최근 분석일</th>
            <th className="px-4 py-2.5 font-medium">최근 상태</th>
            <th className="px-4 py-2.5 text-right font-medium">분석 횟수</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {channels.map((ch) => (
            <tr key={ch.id} className="transition hover:bg-gray-50">
              <td
                className="max-w-[180px] truncate px-4 py-2.5 font-medium text-gray-900"
                title={ch.channel_title ?? undefined}
              >
                {ch.channel_title ?? "—"}
              </td>
              <td
                className="max-w-[160px] truncate px-4 py-2.5 text-gray-600"
                title={ch.owner_email}
              >
                {ch.owner_email}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-gray-700">
                {formatSubscribers(ch.subscriber_count)}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-gray-500">
                {formatDateTime(ch.created_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-gray-500">
                {formatDateTime(ch.lastJobAt)}
              </td>
              <td className="px-4 py-2.5">
                <AdminStatusBadge status={ch.lastJobStatus} />
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">
                {ch.jobCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminChannelsPage(): Promise<JSX.Element> {
  const { channels, totalCount } = await fetchAdminChannels();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Channels</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            등록된 채널 목록 및 분석 현황을 확인합니다.
          </p>
        </div>
        <span className="text-xs tabular-nums text-gray-400">
          총 {totalCount.toLocaleString("ko-KR")}개
        </span>
      </div>

      <ChannelsTable channels={channels} />
    </div>
  );
}
