import { APP_NAME, APP_SIDEBAR_WIDTH_CLASS } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import Menu from "@/components/shared/header/menu";
import { auth } from "@/auth";
// import MainNav from "./main-nav";
import { Input } from "@/components/ui/input";
import UserSidebar from "@/components/user-dashboard/users-sidebar";
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
        <div className="flex h-full w-full gap-6 px-4 md:px-6">
          {/* Sidebar */}
          <aside
            className={`hidden h-full shrink-0 overflow-y-auto border-r bg-background py-5 md:block ${APP_SIDEBAR_WIDTH_CLASS}`}
          >
            <UserSidebar role={session?.user?.role} />
          </aside>
          {/* Page content */}
          <main className="scrollbar-hidden min-h-0 w-full flex-1 overflow-y-auto py-5 pr-2">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}


