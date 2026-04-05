import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  Shield,
  Users,
  Wallet,
} from "lucide-react";

const settingsItems = [
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
] as const;

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
  ] as const;

function SettingsTiles({
  items,
}: {
  items: readonly {
    title: string;
    href: string;
    description: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[];
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
  const canSeeAdminSettings = role === "ADMIN" || role === "HR";
  const allItems = canSeeAdminSettings
    ? [...settingsItems, ...adminSettingsItems]
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
