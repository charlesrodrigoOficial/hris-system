import Menu from "@/components/shared/header/menu";
import { auth } from "@/auth";
// import MainNav from "./main-nav";
import UserAppShell from "@/components/user-dashboard/user-app-shell";
// import AdminSearch from "@/components/admin/admin-search";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8FAFF]">
      {/* Header */}
      <div className="shrink-0 border-b border-[#1D4ED8]/60 bg-gradient-to-r from-[#0B1F5F] via-[#123187] to-[#1D4ED8] text-[#DBEAFE] backdrop-blur supports-[backdrop-filter]:bg-[#0B1F5F]/90">
        <div className="container mx-auto">
          <div className="flex items-center h-16 px-4">
            <div className="ml-auto items-center flex space-x-4">
              <Menu />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 bg-gradient-to-b from-[#EFF6FF] via-[#F8FAFF] to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <UserAppShell role={session?.user?.role}>{children}</UserAppShell>
      </div>
    </div>
  );
}


