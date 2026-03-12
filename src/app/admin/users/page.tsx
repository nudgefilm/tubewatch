import { fetchAdminUsers } from "@/lib/admin/fetchAdminUsers";
import { formatDateTime } from "@/lib/format/formatDateTime";
import type { AdminUserRow } from "@/lib/admin/types";
import AdminBadge from "@/components/ui/AdminBadge";
import EmptyState from "@/components/ui/EmptyState";

function UsersTable({ users }: { users: AdminUserRow[] }): JSX.Element {
  if (users.length === 0) {
    return (
      <EmptyState dashed message="등록된 사용자가 없습니다." />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
            <th className="px-4 py-2.5 font-medium">이메일</th>
            <th className="px-4 py-2.5 font-medium">가입일</th>
            <th className="px-4 py-2.5 text-right font-medium">등록 채널</th>
            <th className="px-4 py-2.5 text-right font-medium">분석 요청</th>
            <th className="px-4 py-2.5 font-medium">최근 분석 요청일</th>
            <th className="px-4 py-2.5 font-medium">역할</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.map((user) => (
            <tr key={user.id} className="transition hover:bg-gray-50">
              <td
                className="max-w-[200px] truncate px-4 py-2.5 text-gray-700"
                title={user.email}
              >
                {user.email}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-gray-500">
                {formatDateTime(user.created_at)}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">
                {user.channelCount}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">
                {user.jobCount}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-gray-500">
                {formatDateTime(user.lastJobAt)}
              </td>
              <td className="px-4 py-2.5">
                {user.isAdmin ? <AdminBadge /> : <span className="text-gray-300">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminUsersPage(): Promise<JSX.Element> {
  const { users, totalCount } = await fetchAdminUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Users</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            전체 사용자 목록 및 활동 현황을 확인합니다.
          </p>
        </div>
        <span className="text-xs tabular-nums text-gray-400">
          총 {totalCount.toLocaleString("ko-KR")}명
        </span>
      </div>

      <UsersTable users={users} />
    </div>
  );
}
