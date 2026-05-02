import AdminUsersView from "@/components/admin/AdminUsersView";
import AdminSignupLogView from "@/components/admin/AdminSignupLogView";
import AdminTabHeader from "@/components/admin/AdminTabHeader";
import { getAdminUsersData } from "@/lib/server/admin/getAdminUsersData";
import { getAdminSignupLogData } from "@/lib/server/admin/getAdminSignupLogData";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "users", label: "사용자 목록" },
  { key: "signup-log", label: "가입 로그" },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "users" } = await searchParams;

  return (
    <div className="space-y-6">
      <AdminTabHeader title="사용자" tabs={TABS} activeTab={tab} />
      {tab === "signup-log" ? (
        <SignupLogTab />
      ) : (
        <UsersTab />
      )}
    </div>
  );
}

async function UsersTab() {
  const data = await getAdminUsersData();
  return <AdminUsersView data={data} hideHeader />;
}

async function SignupLogTab() {
  const data = await getAdminSignupLogData();
  return <AdminSignupLogView data={data} hideHeader />;
}
