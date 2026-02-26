import { APP_NAME } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import Menu from "@/components/shared/header/menu";
// import MainNav from "./main-nav";
import { Input } from "@/components/ui/input";
import UserSidebar from "@/components/user-dashboard/users-sidebar";
// import AdminSearch from "@/components/admin/admin-search";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b">
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
      <div className="flex-1">
        <div className="container mx-auto flex gap-6">
          {/* Sidebar */}
          <aside className="hidden md:block w-64 border-r py-6">
            <UserSidebar />
          </aside>
          {/* Page content */}
          <main className="flex-1 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}


