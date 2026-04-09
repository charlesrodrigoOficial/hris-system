import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdminPermission } from "@/lib/auth/guards";

export default async function AdminSecuritySettingsPage() {
  await requireAdminPermission("security:manage");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage security-related preferences.
        </p>
      </div>

      <Card className="rounded-2xl border-slate-200 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Password updates are managed per user account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/user/profile/edit#security">Open my security settings</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>Policies</CardTitle>
          <CardDescription>Coming soon.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Add org-wide settings like password rules, SSO, and audit logs here.
        </CardContent>
      </Card>
    </div>
  );
}
