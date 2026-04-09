"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  CalendarCheck,
  LayoutDashboard,
  Settings,
  Wallet,
  ClipboardList,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetClose } from "@/components/ui/sheet";
import { hasPermission, isPayrollAdmin, isSuperAdmin } from "@/lib/auth/rbac";

type SidebarItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

function getLinks(role?: string | null): SidebarItem[] {
  const links: SidebarItem[] = [];

  if (isPayrollAdmin(role)) {
    links.push({ title: "Payroll", href: "/admin/payrolls", icon: Wallet });
  } else {
    links.push({ title: "Overview", href: "/admin/overview", icon: LayoutDashboard });
  }

  // Super Admin only: user + role management.
  if (isSuperAdmin(role)) {
    links.push({ title: "Users", href: "/admin/users", icon: Users });
  }

  if (hasPermission(role, "users:view")) {
    links.push({ title: "Employees", href: "/admin/employees", icon: Users });
  }

  if (
    !isPayrollAdmin(role) &&
    (isSuperAdmin(role) || hasPermission(role, "payroll:manage"))
  ) {
    links.push({ title: "Payroll", href: "/admin/payrolls", icon: Wallet });
  }

  if (hasPermission(role, "requests:manage")) {
    links.push({ title: "Requests", href: "/admin/requests", icon: ClipboardList });
  }

  if (hasPermission(role, "attendance:review")) {
    links.push({ title: "Attendance", href: "/admin/attendance", icon: CalendarCheck });
  }

  if (hasPermission(role, "departments:manage")) {
    links.push({ title: "Departments", href: "/admin/departments", icon: Building2 });
  }

  if (hasPermission(role, "calendar:manage")) {
    links.push({ title: "Calendar", href: "/admin/calender", icon: CalendarDays });
  }

  if (hasPermission(role, "org:manage")) {
    links.push({ title: "Organization", href: "/admin/organization", icon: Building2 });
  }

  // Payroll admins should only see payroll settings.
  if (!isPayrollAdmin(role)) {
    links.push({ title: "Settings", href: "/admin/settings", icon: Settings });
  }

  return links;
}

const sidebarButtonClassName =
  "grid grid-cols-[16px_1fr] items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium transition";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav({
  role,
  closeOnNavigate = false,
  className,
}: {
  role?: string | null;
  closeOnNavigate?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const links = getLinks(role);
  const [overviewLink, ...remainingLinks] = links;
  const OverviewIcon = overviewLink.icon;

  return (
    <nav className={cn("flex flex-1 flex-col gap-1 overflow-y-auto", className)}>
      {closeOnNavigate ? (
        <SheetClose asChild>
          <Link
            href={overviewLink.href}
            className={cn(
              sidebarButtonClassName,
              isActivePath(pathname, overviewLink.href)
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900 hover:shadow"
            )}
          >
            <OverviewIcon className="h-4 w-4 shrink-0" />
            <span>{overviewLink.title}</span>
          </Link>
        </SheetClose>
      ) : (
        <Link
          href={overviewLink.href}
          className={cn(
            sidebarButtonClassName,
            isActivePath(pathname, overviewLink.href)
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900 hover:shadow"
          )}
        >
          <OverviewIcon className="h-4 w-4 shrink-0" />
          <span>{overviewLink.title}</span>
        </Link>
      )}

      <div className="space-y-3 pt-3">
        {remainingLinks.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;

          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                sidebarButtonClassName,
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900 hover:shadow"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );

          return closeOnNavigate ? (
            <SheetClose asChild key={item.href}>
              {link}
            </SheetClose>
          ) : (
            link
          );
        })}
      </div>
    </nav>
  );
}

export default function Sidebar({ role }: { role?: string | null }) {
  return (
    <div className="flex h-full flex-col px-4">
      <div className="sticky top-0 z-10 bg-background pb-3">
        <p className="mb-3 text-center text-base font-semibold text-muted-foreground">
          Admin Dashboard
        </p>
      </div>

      <AdminSidebarNav role={role} />
    </div>
  );
}
