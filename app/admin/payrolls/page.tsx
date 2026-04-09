import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdminPermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/rbac";

export default async function AdminPayrollsPage() {
  const session = await requireAdminPermission("payroll:manage");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payroll settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure payroll runs, schedules, and exports.
        </p>
      </div>

      <Card className="rounded-2xl border-slate-200 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>Payroll</CardTitle>
          <CardDescription>Coming soon.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {hasPermission(session.user.role, "calendar:manage") ? (
            <Button asChild variant="outline">
              <Link href="/admin/calender">Open calendar</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/admin/employees">Manage employee payroll details</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
