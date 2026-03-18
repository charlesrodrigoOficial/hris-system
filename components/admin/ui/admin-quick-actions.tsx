"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  ClipboardList,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AdminAction = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const actions: AdminAction[] = [
  { title: "User Overview", href: "/admin/employees", icon: Users },
  { title: "Attendance", href: "/admin/attendance", icon: CalendarCheck },
  { title: "Requests", href: "/admin/requests", icon: ClipboardList },

  { title: "Departments", href: "/admin/departments", icon: Building2 },
];

const actionButtonClassName =
  "grid grid-cols-[16px_1fr] items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium transition";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminQuickActions() {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      {actions.map((action) => {
        const active = isActivePath(pathname, action.href);
        const Icon = action.icon;

        return (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              actionButtonClassName,
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900 hover:shadow",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{action.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
