import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  Shield,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { adminHomePath, canAccessAdminArea, hasPermission, isPayrollAdmin, isSuperAdmin } from "@/lib/auth/rbac";

type SettingsTile = {
  title: string;
  href: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const settingsItems = [
  {
    title: "Edit Profile",
    href: "/user/profile/edit",
    Icon: User,
    description: "Personal and contact details",
  },
  {
    title: "Payroll settings",
    href: "/user/profile/edit?section=banking",
    Icon: Wallet,
    description: "Banking & payroll details",
  },
  {
    title: "Security settings",
    href: "/user/profile/edit#security",
    Icon: Shield,
    description: "Password & account security",
  },
] satisfies SettingsTile[];

const adminSettingsItems = [
  {
    title: "Company settings",
    href: "/admin/organization",
    Icon: Building2,
    description: "Company structure & org data",
  },
  {
    title: "User and Role Management",
    href: "/admin/users",
    Icon: Users,
    description: "Users, roles, and permissions",
  },
  {
    title: "Attendance settings",
    href: "/admin/attendance",
    Icon: CalendarCheck,
    description: "Attendance tracking configuration",
  },
  {
    title: "Calender & event settings",
    href: "/admin/calender",
    Icon: CalendarDays,
    description: "Company events and schedules",
  },
  ] satisfies SettingsTile[];

function adminTilesForRole(role?: string | null) {
  const tiles: SettingsTile[] = [];

  if (isPayrollAdmin(role) || isSuperAdmin(role)) {
    tiles.push({
      title: "Payroll settings",
      href: "/admin/payrolls",
      Icon: Wallet,
      description: "Payroll runs, schedules, and exports",
    });
  }

  if (hasPermission(role, "org:manage")) tiles.push(adminSettingsItems[0]);
  if (isSuperAdmin(role)) tiles.push(adminSettingsItems[1]);
  if (hasPermission(role, "attendance:review")) tiles.push(adminSettingsItems[2]);
  if (hasPermission(role, "calendar:manage")) tiles.push(adminSettingsItems[3]);

  if (canAccessAdminArea(role)) {
    tiles.unshift({
      title: "Admin dashboard",
      href: adminHomePath(role),
      Icon: Shield,
      description: "Administration & operations",
    });
  }

  return tiles;
}

function SettingsTiles({
  items,
}: {
  items: readonly SettingsTile[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(({ title, href, Icon, description }) => (
        <Link
          key={href}
          href={href}
          className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800">
              {title}
            </div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function UserSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const role = (session.user as any)?.role as string | undefined;
  const allItems = canAccessAdminArea(role)
    ? [...settingsItems, ...adminTilesForRole(role)]
    : settingsItems;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Card className="rounded-lg border-slate-200 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsTiles items={allItems} />
        </CardContent>
      </Card>
    </div>
  );
}
