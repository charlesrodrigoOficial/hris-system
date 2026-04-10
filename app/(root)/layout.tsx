import Menu from "@/components/shared/header/menu";
import { auth } from "@/auth";
// import MainNav from "./main-nav";
import { Input } from "@/components/ui/input";
import UserAppShell from "@/components/user-dashboard/user-app-shell";
// import AdminSearch from "@/components/admin/admin-search";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b">
        <div className="container mx-auto">
          <div className="flex items-center h-16 px-4">
            <div className="ml-auto items-center flex space-x-4">
              <Input
                type="search"
                placeholder="Search..."
                className="md:w-[100px] lg:w-[300px]"
              />
              <Menu />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 bg-gradient-to-b from-sky-50 via-slate-50 to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <UserAppShell role={session?.user?.role}>{children}</UserAppShell>
      </div>
    </div>
  );
}


