import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User } from "lucide-react";

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
    title: "Security settings",
    href: "/user/profile/edit#security",
    Icon: Shield,
    description: "Password & account security",
  },
] satisfies SettingsTile[];

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Card className="rounded-lg border-slate-200 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsTiles items={settingsItems} />
        </CardContent>
      </Card>
    </div>
  );
}
