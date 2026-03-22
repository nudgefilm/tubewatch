import type { AdminFailureRow } from "./types";
import { formatDateTime } from "@/lib/format/formatDateTime";

type AdminFailureTableProps = {
  rows: AdminFailureRow[];
};

export default function AdminFailureTable({
  rows,
}: AdminFailureTableProps): JSX.Element {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-heading font-medium tracking-[-0.01em] text-gray-900">
          분석 실패 로그
        </h3>
        <p className="text-xs text-gray-400">데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-heading font-medium tracking-[-0.01em] text-gray-900">
          분석 실패 로그
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="pb-2 pr-3 pt-3 font-medium">channel</th>
              <th className="pb-2 pr-3 pt-3 font-medium">error</th>
              <th className="pb-2 pt-3 font-medium">created_at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, i) => (
              <tr key={`failure-${i}`}>
                <td className="max-w-[160px] truncate py-2 pr-3 text-gray-700">
                  {row.channel ?? "—"}
                </td>
                <td
                  className="max-w-[240px] truncate py-2 pr-3 text-gray-600"
                  title={row.error ?? undefined}
                >
                  {row.error ?? "—"}
                </td>
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
