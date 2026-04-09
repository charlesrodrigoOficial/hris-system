import Link from "next/link";
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminSession } from "@/lib/auth/guards";
import { hasPermission, isSuperAdmin } from "@/lib/auth/rbac";

const settingsItems = [
  {
    title: "Company settings",
    description: "Manage company details and structure.",
    href: "/admin/organization",
    Icon: Building2,
    permission: "org:manage",
  },
  {
    title: "User and Role Management",
    description: "Manage user accounts and roles.",
    href: "/admin/users",
    Icon: Users,
    permission: "roles:assign",
  },
  {
    title: "Attendance settings",
    description: "Configure attendance tracking and rules.",
    href: "/admin/attendance",
    Icon: CalendarCheck,
    permission: "attendance:review",
  },
  {
    title: "Payroll settings",
    description: "Payroll runs, schedules, and exports.",
    href: "/admin/payrolls",
    Icon: Wallet,
    permission: "payroll:manage",
  },
  {
    title: "Calender & event settings",
    description: "Manage company calendar and events.",
    href: "/admin/calender",
    Icon: CalendarDays,
    permission: "calendar:manage",
  },
  {
    title: "Security settings",
    description: "Security policies and account controls.",
    href: "/admin/settings/security",
    Icon: Shield,
    permission: "security:manage",
  },
] as const;

export default async function AdminSettingsPage() {
  const session = await requireAdminSession();
  const role = session.user.role;
  const visibleItems = settingsItems.filter((item) =>
    isSuperAdmin(role) || hasPermission(role, item.permission as any),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure admin and company preferences.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visibleItems.map(({ title, description, href, Icon }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full rounded-2xl border-slate-200 bg-white/80 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md">
              <CardHeader className="flex-row items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
