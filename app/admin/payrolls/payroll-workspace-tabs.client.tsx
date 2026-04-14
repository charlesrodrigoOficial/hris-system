"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PayrollPolicyEditor from "./payroll-policy-editor.client";
import type {
  PayrollPolicyHistoryRow,
  PayrollPolicyView,
} from "./payroll-policy.types";

type PayRunStatus = "Draft" | "In progress" | "Ready for review" | "Published";
type EmployeePayrollStatus = "Ready" | "Missing data" | "Requires review";
type CycleStatus = "Open" | "Closing soon" | "Scheduled";
type ReportStatus = "Generated" | "Needs update";
type AuditSeverity = "Info" | "Warning" | "Critical";

export type PayRunRow = {
  id: string;
  runName: string;
  payPeriod: string;
  activeUsers: number;
  grossPay: number;
  netPay: number;
  status: "Draft" | "In progress" | "Ready for review" | "Published";
  alerts: number;
};

const employeeChecks: Array<{
  employee: string;
  department: string;
  change: string;
  status: EmployeePayrollStatus;
}> = [
  {
    employee: "Aaliyah Khan",
    department: "Operations",
    change: "Bonus adjustment pending approval",
    status: "Requires review",
  },
  {
    employee: "Daniel Wong",
    department: "Engineering",
    change: "No change detected",
    status: "Ready",
  },
  {
    employee: "Sofia Martinez",
    department: "Finance",
    change: "Bank account details incomplete",
    status: "Missing data",
  },
];

const payCycles: Array<{
  cycle: string;
  cutOff: string;
  payrollDate: string;
  status: CycleStatus;
}> = [
  {
    cycle: "Bi-weekly Cycle B",
    cutOff: "Apr 24, 2026",
    payrollDate: "Apr 30, 2026",
    status: "Open",
  },
  {
    cycle: "Monthly Salaried",
    cutOff: "Apr 28, 2026",
    payrollDate: "Apr 30, 2026",
    status: "Closing soon",
  },
  {
    cycle: "Contractor Cycle",
    cutOff: "May 13, 2026",
    payrollDate: "May 15, 2026",
    status: "Scheduled",
  },
];

const reports: Array<{
  report: string;
  owner: string;
  updatedAt: string;
  status: ReportStatus;
}> = [
  {
    report: "Payroll variance by department",
    owner: "Payroll Ops",
    updatedAt: "Apr 12, 2026",
    status: "Generated",
  },
  {
    report: "Tax liability summary",
    owner: "Finance",
    updatedAt: "Apr 11, 2026",
    status: "Generated",
  },
  {
    report: "Benefits and deduction exceptions",
    owner: "HR",
    updatedAt: "Apr 05, 2026",
    status: "Needs update",
  },
];

const auditEvents: Array<{
  timestamp: string;
  actor: string;
  action: string;
  severity: AuditSeverity;
}> = [
  {
    timestamp: "Apr 13, 2026 09:14",
    actor: "Payroll Manager",
    action: "Recalculated monthly payroll run",
    severity: "Info",
  },
  {
    timestamp: "Apr 13, 2026 08:52",
    actor: "HR Admin",
    action: "Updated bank details for 2 active users",
    severity: "Warning",
  },
  {
    timestamp: "Apr 12, 2026 17:26",
    actor: "System",
    action: "Validation failed: missing tax IDs",
    severity: "Critical",
  },
];

function formatCurrency(amount: number, currencyCode = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

function badgeClassByStatus(
  status:
    | PayRunStatus
    | EmployeePayrollStatus
    | CycleStatus
    | ReportStatus
    | AuditSeverity,
) {
  switch (status) {
    case "Draft":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "In progress":
    case "Open":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Ready for review":
    case "Requires review":
    case "Closing soon":
    case "Warning":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Published":
    case "Ready":
    case "Generated":
    case "Scheduled":
    case "Info":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Missing data":
    case "Needs update":
    case "Critical":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function StatusBadge({
  status,
}: {
  status:
    | PayRunStatus
    | EmployeePayrollStatus
    | CycleStatus
    | ReportStatus
    | AuditSeverity;
}) {
  return (
    <Badge variant="outline" className={badgeClassByStatus(status)}>
      {status}
    </Badge>
  );
}

export default function PayrollWorkspaceTabs({
  payRuns,
  activePolicy,
  policyHistory,
  canEditPolicy,
}: {
  payRuns: PayRunRow[];
  activePolicy: PayrollPolicyView | null;
  policyHistory: PayrollPolicyHistoryRow[];
  canEditPolicy: boolean;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-muted-foreground">Workspace</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pay-runs">
          <TabsList className="h-auto w-full flex-wrap justify-start rounded-xl bg-muted/30 p-1">
            <TabsTrigger value="pay-runs" className="rounded-lg">
              Pay Runs
            </TabsTrigger>
            <TabsTrigger value="active-users" className="rounded-lg">
              Active users
            </TabsTrigger>
            <TabsTrigger value="pay-cycles" className="rounded-lg">
              Pay Cycles
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg">
              Reports
            </TabsTrigger>
            <TabsTrigger value="audit" className="rounded-lg">
              Audit
            </TabsTrigger>
            <TabsTrigger value="policy" className="rounded-lg">
              Policy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pay-runs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run name</TableHead>
                  <TableHead>Pay period</TableHead>
                  <TableHead className="text-right">Active users</TableHead>
                  <TableHead className="text-right">Gross pay</TableHead>
                  <TableHead className="text-right">Net pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Alerts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payRuns.map((run) => (
                  <TableRow key={run.runName}>
                    <TableCell className="font-medium">{run.runName}</TableCell>
                    <TableCell>{run.payPeriod}</TableCell>
                    <TableCell className="text-right">{run.activeUsers}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(run.grossPay)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(run.netPay)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={run.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          run.alerts > 0
                            ? "font-semibold text-amber-600"
                            : "text-muted-foreground"
                        }
                      >
                        {run.alerts}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex min-w-[430px] flex-wrap justify-end gap-2">
                        <Button type="button" size="sm" variant="outline">
                          Review
                        </Button>
                        <Button type="button" size="sm" variant="outline">
                          Open Run
                        </Button>
                        <Button type="button" size="sm" variant="outline">
                          Calculate
                        </Button>
                        <Button type="button" size="sm" variant="outline">
                          Sync
                        </Button>
                        <Button type="button" size="sm">
                          Approve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="active-users">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Active user</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Payroll change</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeChecks.map((employee) => (
                  <TableRow key={employee.employee}>
                    <TableCell className="font-medium">{employee.employee}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.change}</TableCell>
                    <TableCell>
                      <StatusBadge status={employee.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="pay-cycles">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Cut-off</TableHead>
                  <TableHead>Payroll date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payCycles.map((cycle) => (
                  <TableRow key={cycle.cycle}>
                    <TableCell className="font-medium">{cycle.cycle}</TableCell>
                    <TableCell>{cycle.cutOff}</TableCell>
                    <TableCell>{cycle.payrollDate}</TableCell>
                    <TableCell>
                      <StatusBadge status={cycle.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="reports">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.report}>
                    <TableCell className="font-medium">{report.report}</TableCell>
                    <TableCell>{report.owner}</TableCell>
                    <TableCell>{report.updatedAt}</TableCell>
                    <TableCell>
                      <StatusBadge status={report.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="audit">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEvents.map((event) => (
                  <TableRow
                    key={`${event.timestamp}-${event.actor}-${event.action}`}
                  >
                    <TableCell className="font-medium">{event.timestamp}</TableCell>
                    <TableCell>{event.actor}</TableCell>
                    <TableCell>{event.action}</TableCell>
                    <TableCell>
                      <StatusBadge status={event.severity} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="policy">
            <PayrollPolicyEditor
              activePolicy={activePolicy}
              history={policyHistory}
              canEdit={canEditPolicy}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
