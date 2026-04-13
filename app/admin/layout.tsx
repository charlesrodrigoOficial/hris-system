import { APP_NAME } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import AdminMenu from "@/components/shared/header/admin-menu";
import MainNav from "./main-nav";
import { Input } from "@/components/ui/input";
import AdminSidebarShell from "@/components/admin/ui/admin-sidebar-shell";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { canAccessAdminArea } from "@/lib/auth/rbac";
// import AdminSearch from "@/components/admin/admin-search";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (!canAccessAdminArea(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="z-20 flex-none border-b bg-background">
        <div className="container mx-auto">
          <div className="flex items-center h-16 px-4">
            <Link href="/" className="w-22">
              <Image
                src="/images/favicon.png"
                height={148}
                width={148}
                alt={APP_NAME}
              />
            </Link>

            <MainNav className="mx-6 hidden md:flex" />

            <div className="ml-auto items-center flex space-x-4">
              <Input
                type="search"
                placeholder="Search..."
                className="md:w-[100px] lg:w-[300px]"
              />
              <AdminMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="container mx-auto flex h-full gap-6 overflow-hidden">
          <AdminSidebarShell role={session.user.role} />

          {/* Page content */}
          <main className="min-w-0 flex-1 overflow-y-auto py-6 pr-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
