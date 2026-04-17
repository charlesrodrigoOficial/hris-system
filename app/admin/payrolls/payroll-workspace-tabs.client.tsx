"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import PayrollPolicyEditor from "./payroll-policy-editor.client";
import type {
  PayrollPolicyHistoryRow,
  PayrollPolicyView,
} from "./payroll-policy.types";

import type {
  PayCycleRow,
  PayRunRow,
  PayrollAuditTrailRow,
  PayrollRunEmployeeRow,
} from "./types";

type PayRunStatus = "Draft" | "In progress" | "Ready for review" | "Published";
type RowRunStatus = "DRAFT" | "CALCULATED" | "IN_REVIEW" | "APPROVED" | "COMPLETED";
type PayrollAction =
  | "START_RUN"
  | "CALCULATE"
  | "REVIEW"
  | "APPROVE"
  | "PUBLISH"
  | "SYNC";
type PayCycleStatus = "OPEN" | "CLOSED";
type PayCycleFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY";
type CycleBadgeStatus = "Open" | "Closed";
type WorkspaceTab =
  | "pay-runs"
  | "active-users"
  | "pay-cycles"
  | "reports"
  | "audit"
  | "policy";

function formatCurrency(amount: number, currencyCode = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateFromIso(isoDate: string) {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTimeFromIso(isoDate: string) {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function formatFrequencyLabel(frequency: PayCycleFrequency) {
  if (frequency === "WEEKLY") return "Weekly";
  if (frequency === "BIWEEKLY") return "Bi-weekly";
  return "Monthly";
}

function formatCycleStatus(status: PayCycleStatus): CycleBadgeStatus {
  return status === "OPEN" ? "Open" : "Closed";
}

function formatRunStatusLabel(runStatus: RowRunStatus) {
  if (runStatus === "DRAFT") return "Draft";
  if (runStatus === "CALCULATED") return "Ready for review";
  if (runStatus === "COMPLETED") return "Published";
  return "In progress";
}

function badgeClassByStatus(
  status:
    | PayRunStatus
    | CycleBadgeStatus,
) {
  switch (status) {
    case "Draft":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "In progress":
    case "Open":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Ready for review":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Published":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Closed":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function StatusBadge({
  status,
}: {
  status:
    | PayRunStatus
    | CycleBadgeStatus;
}) {
  return (
    <Badge variant="outline" className={badgeClassByStatus(status)}>
      {status}
    </Badge>
  );
}

function canCalculate(runStatus: RowRunStatus) {
  return (
    runStatus === "DRAFT" ||
    runStatus === "CALCULATED" ||
    runStatus === "IN_REVIEW" ||
    runStatus === "APPROVED"
  );
}

function canOpenRun(runStatus: RowRunStatus) {
  return runStatus !== "COMPLETED";
}

function canReview(runStatus: RowRunStatus) {
  return runStatus === "CALCULATED";
}

function canSync(runStatus: RowRunStatus) {
  return runStatus !== "COMPLETED";
}

function approveOrPublishAction(runStatus: RowRunStatus): PayrollAction {
  return runStatus === "IN_REVIEW" ? "APPROVE" : "PUBLISH";
}

function approveOrPublishLabel(runStatus: RowRunStatus) {
  return runStatus === "IN_REVIEW" ? "Approve" : "Publish";
}

function canApproveOrPublish(runStatus: RowRunStatus) {
  return runStatus === "IN_REVIEW" || runStatus === "APPROVED";
}

function employmentBadgeClass(status: PayrollRunEmployeeRow["employmentStatus"]) {
  return status === "Active"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-slate-100 text-slate-700 border-slate-200";
}

function eligibilityBadgeClass(eligibility: PayrollRunEmployeeRow["payrollEligibility"]) {
  return eligibility === "Eligible"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-rose-100 text-rose-700 border-rose-200";
}

export default function PayrollWorkspaceTabs({
  payRuns,
  payCycles,
  runEmployeesByRun,
  auditTrail,
  activePolicy,
  policyHistory,
  canEditPolicy,
}: {
  payRuns: PayRunRow[];
  payCycles: PayCycleRow[];
  runEmployeesByRun: Record<string, PayrollRunEmployeeRow[]>;
  auditTrail: PayrollAuditTrailRow[];
  activePolicy: PayrollPolicyView | null;
  policyHistory: PayrollPolicyHistoryRow[];
  canEditPolicy: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pendingAction, setPendingAction] = React.useState<{
    action: PayrollAction;
    runId: string;
  } | null>(null);
  const [activeTab, setActiveTab] = React.useState<WorkspaceTab>("pay-runs");
  const [selectedRunId, setSelectedRunId] = React.useState(payRuns[0]?.id ?? "");

  React.useEffect(() => {
    if (!payRuns.length) {
      setSelectedRunId("");
      return;
    }

    if (!selectedRunId || !payRuns.some((run) => run.id === selectedRunId)) {
      setSelectedRunId(payRuns[0].id);
    }
  }, [payRuns, selectedRunId]);

  const selectedRun = payRuns.find((run) => run.id === selectedRunId) ?? null;
  const selectedRunEmployees =
    (selectedRun ? runEmployeesByRun[selectedRun.id] : []) ?? [];
  const selectedRunActiveUsersCount = selectedRunEmployees.filter(
    (employee) => employee.employmentStatus === "Active",
  ).length;

  async function runPayrollAction(action: PayrollAction, runId: string) {
    setPendingAction({ action, runId });

    try {
      const res = await fetch("/api/admin/payrolls/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, runId }),
      });

      const payload = (await res.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!res.ok) {
        throw new Error(payload?.error || "Failed to run payroll action.");
      }

      toast({
        description: payload?.message || "Payroll action completed.",
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        description:
          error instanceof Error ? error.message : "Payroll action failed.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-muted-foreground">Workspace</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as WorkspaceTab)}
        >
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
                  <TableRow
                    key={run.id}
                    className={
                      run.id === selectedRunId ? "bg-blue-50/40" : undefined
                    }
                    onClick={() => setSelectedRunId(run.id)}
                  >
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
                      <div className="inline-flex min-w-[460px] flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            pendingAction !== null || !canOpenRun(run.runStatus)
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            runPayrollAction("START_RUN", run.id);
                          }}
                        >
                          {pendingAction?.action === "START_RUN" &&
                          pendingAction.runId === run.id
                            ? "Opening..."
                            : "Open Run"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            pendingAction !== null || !canCalculate(run.runStatus)
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            runPayrollAction("CALCULATE", run.id);
                          }}
                        >
                          {pendingAction?.action === "CALCULATE" &&
                          pendingAction.runId === run.id
                            ? "Calculating..."
                            : "Calculate"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pendingAction !== null || !canReview(run.runStatus)}
                          onClick={(event) => {
                            event.stopPropagation();
                            runPayrollAction("REVIEW", run.id);
                          }}
                        >
                          {pendingAction?.action === "REVIEW" &&
                          pendingAction.runId === run.id
                            ? "Reviewing..."
                            : "Review"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pendingAction !== null || !canSync(run.runStatus)}
                          onClick={(event) => {
                            event.stopPropagation();
                            runPayrollAction("SYNC", run.id);
                          }}
                        >
                          {pendingAction?.action === "SYNC" &&
                          pendingAction.runId === run.id
                            ? "Syncing..."
                            : "Sync"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={
                            pendingAction !== null ||
                            !canApproveOrPublish(run.runStatus)
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            runPayrollAction(
                              approveOrPublishAction(run.runStatus),
                              run.id,
                            );
                          }}
                        >
                          {pendingAction?.runId === run.id &&
                          (pendingAction.action === "APPROVE" ||
                            pendingAction.action === "PUBLISH")
                            ? pendingAction.action === "APPROVE"
                              ? "Approving..."
                              : "Publishing..."
                            : approveOrPublishLabel(run.runStatus)}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="active-users">
            <div className="mb-3 text-sm text-muted-foreground">
              {selectedRun
                ? `Showing employees included in ${selectedRun.runName}. Active users in this selected run: ${selectedRunActiveUsersCount}.`
                : "No payroll run selected yet."}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Employment status</TableHead>
                  <TableHead>Payroll eligibility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedRunEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No employees are included in this run yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedRunEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-xs text-muted-foreground">{employee.email}</div>
                      </TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={employmentBadgeClass(employee.employmentStatus)}
                        >
                          {employee.employmentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className={eligibilityBadgeClass(employee.payrollEligibility)}
                          >
                            {employee.payrollEligibility}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {employee.eligibilityReason}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="pay-cycles">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Start date</TableHead>
                  <TableHead>End date</TableHead>
                  <TableHead>Payroll date</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                  <TableHead>Linked payroll run</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payCycles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground">
                      No pay cycles found yet. Start a payroll run to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  payCycles.map((cycle) => (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">{cycle.name}</TableCell>
                      <TableCell>{formatDateFromIso(cycle.startDate)}</TableCell>
                      <TableCell>{formatDateFromIso(cycle.endDate)}</TableCell>
                      <TableCell>{formatDateFromIso(cycle.payDate)}</TableCell>
                      <TableCell>{formatFrequencyLabel(cycle.frequency)}</TableCell>
                      <TableCell>
                        <StatusBadge status={formatCycleStatus(cycle.status)} />
                      </TableCell>
                      <TableCell className="text-right">{cycle.runCount}</TableCell>
                      <TableCell>
                        {cycle.latestRunId ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRunId(cycle.latestRunId!);
                                setActiveTab("pay-runs");
                              }}
                            >
                              Open Run {cycle.latestRunNumber}
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {cycle.latestRunStatus
                                ? formatRunStatusLabel(cycle.latestRunStatus)
                                : "Status unavailable"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No run linked</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  Payroll reports are based on completed run calculations.
                </div>
                <Button type="button" size="sm" variant="outline" disabled>
                  Download table (coming soon)
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Payroll Summary by Period</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run name</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Active users</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payRuns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-muted-foreground">
                          No payroll runs found yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payRuns.map((run) => (
                        <TableRow key={`report-${run.id}`}>
                          <TableCell className="font-medium">{run.runName}</TableCell>
                          <TableCell>{run.payPeriod}</TableCell>
                          <TableCell className="text-right">{run.activeUsers}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(run.grossPay)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(run.taxes)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(run.deductions)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(run.netPay)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={run.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Employee-Level Payroll Report</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedRun
                    ? `Showing employee payroll values for ${selectedRun.runName}.`
                    : "Select a payroll run to view employee-level payroll values."}
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRunEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-muted-foreground">
                          No employee payroll records found for this run.
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedRunEmployees.map((employee) => (
                        <TableRow key={`employee-report-${employee.id}`}>
                          <TableCell>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {employee.email}
                            </div>
                          </TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(employee.baseSalary)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(employee.grossPay)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(employee.taxesTotal)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(employee.deductionsTotal)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(employee.netPay)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Run</TableHead>
                  <TableHead>Pay period</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Performed by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditTrail.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No payroll audit events yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  auditTrail.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        {formatDateTimeFromIso(event.actedAt)}
                      </TableCell>
                      <TableCell>{event.runName}</TableCell>
                      <TableCell>{event.payPeriod}</TableCell>
                      <TableCell>{event.action}</TableCell>
                      <TableCell>
                        <div className="font-medium">{event.actorName}</div>
                        <div className="text-xs text-muted-foreground">
                          {event.actorEmail}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
