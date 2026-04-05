import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPayrollsPage() {
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
          <Button asChild variant="outline">
            <Link href="/admin/calender">Open calendar</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/users">Manage employee bank details</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

