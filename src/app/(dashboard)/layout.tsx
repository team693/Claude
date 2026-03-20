import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
