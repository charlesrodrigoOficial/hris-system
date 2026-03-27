"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Users, type LucideIcon } from "lucide-react";
import AdminQuickActions from "@/components/admin/ui/admin-quick-actions";
import { cn } from "@/lib/utils";

type SidebarItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const links: SidebarItem[] = [
  { title: "Overview", href: "/admin/overview", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Organization", href: "/admin/organization", icon: Building2 },
];

const sidebarButtonClassName =
  "grid grid-cols-[16px_1fr] items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium transition";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const [overviewLink, ...remainingLinks] = links;
  const OverviewIcon = overviewLink.icon;

  return (
    <div className="flex h-full flex-col px-4">
      <div className="sticky top-0 z-10 bg-background pb-3">
        <p className="mb-3 text-center text-base font-semibold text-muted-foreground">
          Admin Dashboard
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        <Link
          href={overviewLink.href}
          className={cn(
            sidebarButtonClassName,
            isActivePath(pathname, overviewLink.href)
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900 hover:shadow",
          )}
        >
          <OverviewIcon className="h-4 w-4 shrink-0" />
          <span>{overviewLink.title}</span>
        </Link>

        <div className="space-y-3 pt-3">
          {remainingLinks.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  sidebarButtonClassName,
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900 hover:shadow",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}

          <AdminQuickActions />
        </div>
      </nav>
    </div>
  );
}
