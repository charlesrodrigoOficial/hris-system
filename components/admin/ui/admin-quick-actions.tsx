"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Building2,
  CalendarCheck,
  ClipboardList,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetClose } from "@/components/ui/sheet";
import { hasPermission, isPayrollAdmin, isSuperAdmin } from "@/lib/auth/rbac";

type AdminAction = {
  title: string;
  href: string;
  icon: LucideIcon;
};

function getActions(role?: string | null): AdminAction[] {
  const actions: AdminAction[] = [];

  actions.push({ title: "Employees", href: "/admin/employees", icon: Users });

  if (isPayrollAdmin(role) || isSuperAdmin(role)) {
    actions.push({ title: "Payroll", href: "/admin/payrolls", icon: Wallet });
  }

  if (hasPermission(role, "calendar:manage")) {
    actions.push({ title: "Calendar", href: "/admin/calender", icon: CalendarDays });
  }

  if (hasPermission(role, "attendance:review")) {
    actions.push({ title: "Attendance", href: "/admin/attendance", icon: CalendarCheck });
  }

  if (hasPermission(role, "requests:manage")) {
    actions.push({ title: "Requests", href: "/admin/requests", icon: ClipboardList });
  }

  if (hasPermission(role, "departments:manage")) {
    actions.push({ title: "Departments", href: "/admin/departments", icon: Building2 });
  }

  return actions;
}

const actionButtonClassName =
  "grid grid-cols-[16px_1fr] items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium transition";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminQuickActions({
  role,
  closeOnNavigate = false,
}: {
  role?: string | null;
  closeOnNavigate?: boolean;
}) {
  const pathname = usePathname();
  const actions = getActions(role);

  return (
    <div className="space-y-1">
      {actions.map((action) => {
        const active = isActivePath(pathname, action.href);
        const Icon = action.icon;

        const link = (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              actionButtonClassName,
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900 hover:shadow"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{action.title}</span>
          </Link>
        );

        return closeOnNavigate ? (
          <SheetClose asChild key={action.href}>
            {link}
          </SheetClose>
        ) : (
          link
        );
      })}
    </div>
  );
}
