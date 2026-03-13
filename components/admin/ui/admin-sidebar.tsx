"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import AdminQuickActions from "@/components/admin/ui/admin-quick-actions";

const links = [
  { title: "Overview", href: "/admin/overview" },
  { title: "Users", href: "/admin/users" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const overviewLink = links[0];
  const remainingLinks = links.slice(1);

  return (
    <div className="px-4">
      <p className="mb-3 text-center text-base font-semibold text-muted-foreground">
        Admin Dashboard
      </p>

      <nav className="flex flex-col gap-1 text-center">
        {[overviewLink].map((item) => {
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl border border-transparent px-3 py-2 text-sm transition",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900 hover:shadow"
              )}
            >
              {item.title}
            </Link>
          );
        })}

        <div className="flex flex-col gap-1 pt-1">
          {remainingLinks.map((item) => {
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl border border-transparent px-3 py-2 text-sm transition",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900 hover:shadow"
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </div>
        <AdminQuickActions />
      </nav>
    </div>
  );
}
