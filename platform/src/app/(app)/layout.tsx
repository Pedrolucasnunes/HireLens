import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar userEmail={user.email ?? ""} />
      <main className="flex-1 min-w-0 relative">
        {children}
      </main>
    </div>
  );
}
