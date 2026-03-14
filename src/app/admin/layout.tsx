import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/config/admin";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "TubeWatch Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    redirect("/");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8">
        {children}
      </main>
    </div>
  );
}
