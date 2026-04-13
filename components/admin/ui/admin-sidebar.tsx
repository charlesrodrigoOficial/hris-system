"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  CalendarCheck,
  LayoutDashboard,
  PanelLeft,
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
  "items-center rounded-xl border border-transparent text-left text-sm font-medium transition";

function getSidebarButtonClassName(collapsed: boolean) {
  return cn(
    sidebarButtonClassName,
    collapsed
      ? "flex justify-center px-2.5 py-2.5"
      : "grid grid-cols-[16px_1fr] gap-2 px-3 py-2.5"
  );
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav({
  role,
  closeOnNavigate = false,
  collapsed = false,
  className,
}: {
  role?: string | null;
  closeOnNavigate?: boolean;
  collapsed?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const links = getLinks(role);
  const [overviewLink, ...remainingLinks] = links;
  const OverviewIcon = overviewLink.icon;
  const buttonClassName = getSidebarButtonClassName(collapsed);

  return (
    <nav
      className={cn(
        "flex flex-1 flex-col gap-1 overflow-y-auto",
        collapsed && "items-center",
        className
      )}
    >
      {closeOnNavigate ? (
        <SheetClose asChild>
          <Link
            href={overviewLink.href}
            title={overviewLink.title}
            className={cn(
              buttonClassName,
              isActivePath(pathname, overviewLink.href)
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900 hover:shadow"
            )}
          >
            <OverviewIcon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{overviewLink.title}</span>}
          </Link>
        </SheetClose>
      ) : (
        <Link
          href={overviewLink.href}
          title={overviewLink.title}
          className={cn(
            buttonClassName,
            isActivePath(pathname, overviewLink.href)
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900 hover:shadow"
          )}
        >
          <OverviewIcon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{overviewLink.title}</span>}
        </Link>
      )}

      <div className={cn("space-y-3 pt-3", collapsed && "w-full")}>
        {remainingLinks.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;

          const link = (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              className={cn(
                buttonClassName,
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900 hover:shadow"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
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

export default function Sidebar({
  role,
  collapsed = false,
  onToggleCollapsed,
}: {
  role?: string | null;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  return (
    <div className={cn("flex h-full flex-col", collapsed ? "px-2" : "px-4")}>
      <div className="sticky top-0 z-10 bg-background pb-3">
        <div className={cn("mb-3 flex items-center", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <p className="text-center text-base font-semibold text-muted-foreground">
              Admin Dashboard
            </p>
          )}
          {onToggleCollapsed ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900",
                collapsed && "mx-auto"
              )}
            >
              <PanelLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            </button>
          ) : null}
        </div>
      </div>

      <AdminSidebarNav role={role} collapsed={collapsed} />
    </div>
  );
}
