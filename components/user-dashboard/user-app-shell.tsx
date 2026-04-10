"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import UserSidebar from "@/components/user-dashboard/users-sidebar";
import { cn } from "@/lib/utils";
import { APP_SIDEBAR_WIDTH_CLASS } from "@/lib/constants";

function isPayrollPath(pathname: string) {
  return pathname === "/user/payroll" || pathname.startsWith("/user/payroll/");
}

export default function UserAppShell({
  role,
  children,
}: {
  role?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const collapseSidebar = isPayrollPath(pathname);

  return (
    <div className="flex h-full w-full gap-6">
      <aside
        className={cn(
          "hidden h-full shrink-0 overflow-y-auto border-r bg-background py-5 md:block",
          collapseSidebar ? "w-20 overflow-x-hidden" : APP_SIDEBAR_WIDTH_CLASS
        )}
      >
        <UserSidebar role={role} collapsed={collapseSidebar} />
      </aside>

      <main className="scrollbar-hidden min-h-0 w-full flex-1 overflow-y-auto py-5 pl-4 pr-4 md:pl-6 md:pr-6">
        {children}
      </main>
    </div>
  );
}
