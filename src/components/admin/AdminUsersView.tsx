import type { AdminUsersData } from "./types";
import { formatDateTime } from "@/lib/format/formatDateTime";

function formatNum(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function AdminUsersView({ data }: { data: AdminUsersData }): JSX.Element {
  const { rows, total } = data;

  return (
    <div className="space-y-6">
      <div className="border-b border-foreground/8 pb-5">
        <h1 className="font-heading text-2xl font-medium tracking-[-0.03em] text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">총 {formatNum(total)}명의 가입 회원</p>
      </div>

      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-foreground/8 text-muted-foreground">
                <th className="px-4 pb-2 pt-3 font-medium">이메일</th>
                <th className="px-4 pb-2 pt-3 font-medium">이름</th>
                <th className="px-4 pb-2 pt-3 font-medium">역할</th>
                <th className="px-4 pb-2 pt-3 font-medium">채널</th>
                <th className="px-4 pb-2 pt-3 font-medium">가입일</th>
                <th className="px-4 pb-2 pt-3 font-medium">마지막 로그인</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground/60">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-foreground/[0.02] transition-colors">
                    <td className="max-w-[200px] truncate px-4 py-2.5 text-foreground/80">
                      {row.email ?? "—"}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-2.5 text-foreground/70">
                      {row.display_name ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.role === "admin" ? (
                        <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                          admin
                        </span>
                      ) : (
                        <span className="text-muted-foreground">user</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-foreground/70">
                      {row.channel_count}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                      {row.created_at ? formatDateTime(row.created_at) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
                      {row.last_sign_in_at ? formatDateTime(row.last_sign_in_at) : "—"}
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
