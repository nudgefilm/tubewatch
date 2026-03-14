import type { AdminQueueRow } from "./types";
import { formatDateTime } from "@/lib/format/formatDateTime";

type AdminQueueTableProps = {
  rows: AdminQueueRow[];
};

export default function AdminQueueTable({
  rows,
}: AdminQueueTableProps): JSX.Element {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          최근 분석 요청
        </h3>
        <p className="text-xs text-gray-400">데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">
          최근 분석 요청
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="pb-2 pr-3 pt-3 font-medium">job_id</th>
              <th className="pb-2 pr-3 pt-3 font-medium">channel</th>
              <th className="pb-2 pr-3 pt-3 font-medium">status</th>
              <th className="pb-2 pt-3 font-medium">created_at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, i) => (
              <tr key={`${row.job_id}-${i}`}>
                <td className="py-2 pr-3 font-mono text-gray-600">
                  {row.job_id.slice(0, 8)}…
                </td>
                <td className="max-w-[140px] truncate py-2 pr-3 text-gray-700">
                  {row.channel ?? "—"}
                </td>
                <td className="py-2 pr-3 text-gray-700">{row.status}</td>
                <td className="whitespace-nowrap py-2 tabular-nums text-gray-500">
                  {formatDateTime(row.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
