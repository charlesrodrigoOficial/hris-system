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
import { SheetClose } from "@/components/ui/sheet";

type SidebarItem = {
  title: string;
  href?: string;
  icon: LucideIcon;
};

function getSidebarItems(role?: string | null): SidebarItem[] {
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
      title: "Talent Hub",
      href: "/user/talent-hub",
      icon: Star,
    },
    {
      title: "Org",
      href: "/user/organization",
      icon: Building2,
    },
    {
      title: "Payroll",
      href: "/user/payroll",
      icon: Receipt,
    },
    {
      title: "Support",
      href: "/user/requests?mode=support",
      icon: MessageSquareText,
    },
    {
      title: "Help",
      href: "/user/help",
      icon: CircleHelp,
    },
    {
      title: "Settings",
      href: "/user/settings",
      icon: Settings,
    },
  ];
}

function isActivePath(pathname: string, href?: string) {
  if (!href) return false;
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function UserSidebarNav({
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
  const items = getSidebarItems(role);
  const [overviewItem, ...secondaryItems] = items;
  const OverviewIcon = overviewItem.icon;
  const labelClassName = collapsed ? "sr-only" : undefined;
  const activeItemClass =
    "border-[#93C5FD] bg-[#DBEAFE] text-[#0B1F5F] shadow-sm";
  const idleItemClass =
    "text-[#DBEAFE] hover:-translate-y-0.5 hover:border-[#93C5FD]/60 hover:bg-white/12 hover:text-white hover:shadow-sm";
  const linkBaseClassName = collapsed
    ? "flex w-full items-center justify-center rounded-xl border border-transparent p-3 text-sm font-medium transition"
    : "grid w-full grid-cols-[16px_1fr] items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium transition";

  return (
    <nav
      className={cn(
        "scrollbar-hidden flex-1 flex flex-col gap-1 overflow-y-auto",
        className
      )}
    >
      {closeOnNavigate ? (
        <SheetClose asChild>
          <Link
            href={overviewItem.href!}
            className={cn(
              linkBaseClassName,
              isActivePath(pathname, overviewItem.href)
                ? activeItemClass
                : idleItemClass
            )}
          >
            <OverviewIcon className="h-4 w-4 shrink-0" />
            <span className={labelClassName}>{overviewItem.title}</span>
          </Link>
        </SheetClose>
      ) : (
        <Link
          href={overviewItem.href!}
          className={cn(
            linkBaseClassName,
            isActivePath(pathname, overviewItem.href)
              ? activeItemClass
              : idleItemClass
          )}
        >
          <OverviewIcon className="h-4 w-4 shrink-0" />
          <span className={labelClassName}>{overviewItem.title}</span>
        </Link>
      )}

      <div className="space-y-3 pt-3">
        {secondaryItems.map((item) => {
          const isAttendanceItem = item.title === "Attendance";
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          const cardClassName = cn(
            linkBaseClassName,
            item.href || isAttendanceItem
              ? active
                ? activeItemClass
                : idleItemClass
              : "cursor-not-allowed border border-dashed border-[#93C5FD]/30 bg-white/5 text-[#BFDBFE]"
          );

          return (
            <div key={item.title}>
              {isAttendanceItem ? (
                <AttendanceUserClient
                  renderTrigger={(openDialog) => {
                    const trigger = (
                      <button
                        type="button"
                        className={cn(cardClassName, "w-full")}
                        onClick={openDialog}
                        title={collapsed ? item.title : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className={labelClassName}>{item.title}</span>
                      </button>
                    );

                    return closeOnNavigate ? (
                      <SheetClose asChild>{trigger}</SheetClose>
                    ) : (
                      trigger
                    );
                  }}
                />
              ) : item.href ? closeOnNavigate ? (
                <SheetClose asChild>
                  <Link
                    href={item.href}
                    className={cardClassName}
                    title={collapsed ? item.title : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className={labelClassName}>{item.title}</span>
                  </Link>
                </SheetClose>
              ) : (
                <Link
                  href={item.href}
                  className={cardClassName}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={labelClassName}>{item.title}</span>
                </Link>
              ) : (
                <div className={cardClassName}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={labelClassName}>{item.title}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export default function Sidebar({
  role,
  collapsed = false,
}: {
  role?: string | null;
  collapsed?: boolean;
}) {
  return (
    <div className={cn("flex h-full flex-col", collapsed ? "px-2" : "px-4")}>
      <div className="sticky top-0 z-10 bg-transparent pb-3">
        <div className={cn("border-b border-[#93C5FD]/30 py-1", collapsed ? "px-2" : "px-4")}>
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 rounded-xl bg-white/95 px-2 py-1 shadow-sm",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Dashboard" : undefined}
          >
            <Image
              src="/images/favicon.png"
              alt="Intelura"
              width={collapsed ? 32 : 120}
              height={collapsed ? 32 : 30}
              className={cn("object-contain", collapsed && "mx-auto")}
            />
          </Link>
        </div>
        {!collapsed ? (
          <p className="mb-3 mt-3 text-center text-base font-semibold text-white">
            Dashboard
          </p>
        ) : null}
      </div>

      <UserSidebarNav role={role} collapsed={collapsed} />
    </div>
  );
}
