"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  CircleHelp,
  Clock3,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Receipt,
  Settings,
  Star,
  type LucideIcon,
} from "lucide-react";
import AttendanceUserClient from "@/app/(root)/user/profile/attendance-user-client";
import { cn } from "@/lib/utils";
import { canManageAttendance } from "@/lib/auth/roles";
import { isAdmin } from "@/lib/requests/helpers";

type SidebarItem = {
  title: string;
  href?: string;
  icon: LucideIcon;
};

function getSidebarItems(role?: string | null): SidebarItem[] {
  const canSeeOrg = isAdmin(role);

  return [
    { title: "Overview", href: "/", icon: LayoutDashboard },
    { title: "Attendance", icon: CalendarCheck },
    {
      title: "Time",
      href: "/user/requests?mode=leave",
      icon: Clock3,
    },
    {
      title: "Docs",
      href: "/user/documents",
      icon: FileText,
    },
    {
      title: "Reviews",
      href: "/user/scorecard",
      icon: Star,
    },
    ...(canSeeOrg
      ? [
          {
            title: "Org",
            href: "/admin/employees",
            icon: Building2,
          },
        ]
      : []),
    {
      title: "Payroll",
      href: "/user/profile",
      icon: Receipt,
    },
    {
      title: "Support",
      href: "/user/requests?mode=support",
      icon: MessageSquareText,
    },
    {
      title: "Help",
      href: "/user/requests",
      icon: CircleHelp,
    },
    {
      title: "Settings",
      href: "/user/profile/edit",
      icon: Settings,
    },
  ];
}

function isActivePath(pathname: string, href?: string) {
  if (!href) return false;
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export default function Sidebar({ role }: { role?: string | null }) {
  const pathname = usePathname();
  const items = getSidebarItems(role);
  const [overviewItem, ...secondaryItems] = items;
  const OverviewIcon = overviewItem.icon;

  return (
    <div className="flex h-full flex-col px-4">
      <div className="sticky top-0 z-10 bg-background pb-3">
        <div className="border-b px-4 py-1">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/favicon.png"
              alt="Intelura"
              width={120}
              height={30}
              className="object-contain"
            />
          </Link>
        </div>
        <p className="mb-3 mt-3 text-center text-base font-semibold text-muted-foreground">
          Dashboard
        </p>
      </div>

      <nav className="scrollbar-hidden flex-1 flex flex-col gap-1 overflow-y-auto">
        <Link
          href={overviewItem.href!}
          className={cn(
            "grid grid-cols-[16px_1fr] items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium transition",
            isActivePath(pathname, overviewItem.href)
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900 hover:shadow",
          )}
        >
          <OverviewIcon className="h-4 w-4 shrink-0" />
          <span>{overviewItem.title}</span>
        </Link>

        <div className="space-y-3 pt-3">
          {secondaryItems.map((item) => {
            const isAttendanceItem = item.title === "Attendance";
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            const cardClassName = cn(
              "grid grid-cols-[16px_1fr] items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium transition",
              item.href || isAttendanceItem
                ? active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900 hover:shadow"
                : "cursor-not-allowed border border-dashed border-slate-200 bg-slate-50 text-slate-400",
            );

            return (
              <div key={item.title}>
                {isAttendanceItem ? (
                  <AttendanceUserClient
                    renderTrigger={(openDialog) => (
                      <button
                        type="button"
                        className={cn(cardClassName, "w-full")}
                        onClick={openDialog}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </button>
                    )}
                  />
                ) : item.href ? (
                  <Link href={item.href} className={cardClassName}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                ) : (
                  <div className={cardClassName}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
