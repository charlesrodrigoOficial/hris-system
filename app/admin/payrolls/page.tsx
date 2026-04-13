import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireAdminPermission } from "@/lib/auth/guards";
import PayrollSummaryCards from "./payroll-summary-cards";
import PayrollWorkspaceTabs from "./payroll-workspace-tabs.client";
import { getPayrollPageData } from "./payroll-data";

type PayrollRunStatus =
  | "Not started"
  | "In progress"
  | "Ready for review"
  | "Published";

const statusClassByRunStatus: Record<PayrollRunStatus, string> = {
  "Not started": "bg-slate-100 text-slate-700 border-slate-200",
  "In progress": "bg-blue-100 text-blue-700 border-blue-200",
  "Ready for review": "bg-amber-100 text-amber-700 border-amber-200",
  Published: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default async function AdminPayrollsPage() {
  await requireAdminPermission("payroll:manage");

  const data = await getPayrollPageData();
  const runStatus: PayrollRunStatus =
    data.headerStatus === "Draft" ? "Not started" : data.headerStatus;
  const statusClass = statusClassByRunStatus[runStatus] ??
    statusClassByRunStatus["Not started"];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-background p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Current pay cycle: {data.currentPayCycle}</span>
              <span className="text-muted-foreground/50">|</span>
              <span>Payroll date: {data.payrollDate}</span>
              <span className="text-muted-foreground/50">|</span>
              <Badge variant="outline" className={statusClass}>
                {runStatus}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline">Start Run</Button>
            <Button variant="outline">Calculate</Button>
            <Button variant="outline">Review</Button>
            <Button variant="outline">Export</Button>
            <Button>Publish Payslips</Button>
          </div>
        </div>
      </section>

      <PayrollSummaryCards summary={data.summary} />
      <PayrollWorkspaceTabs payRuns={data.payRuns} />
    </div>
  );
}
