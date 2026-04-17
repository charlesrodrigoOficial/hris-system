import type { PayrollPolicyHistoryRow, PayrollPolicyView } from "./payroll-policy.types";
import type { PayrollSummary } from "./payroll-summary-cards";

export type UiRunStatus =
  | "Draft"
  | "In progress"
  | "Ready for review"
  | "Published";

export type HeaderRunStatus =
  | "NOT_STARTED"
  | "DRAFT"
  | "CALCULATED"
  | "IN_REVIEW"
  | "APPROVED"
  | "COMPLETED";

export type PayRunRow = {
  id: string;
  runName: string;
  payPeriod: string;
  activeUsers: number;
  grossPay: number;
  taxes: number;
  deductions: number;
  netPay: number;
  runStatus: Exclude<HeaderRunStatus, "NOT_STARTED">;
  status: UiRunStatus;
  alerts: number;
};

export type PayrollRunEmployeeRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  baseSalary: number;
  grossPay: number;
  taxesTotal: number;
  deductionsTotal: number;
  netPay: number;
  employmentStatus: "Active" | "Inactive";
  payrollEligibility: "Eligible" | "Not eligible";
  eligibilityReason: string;
};

export type PayCycleRow = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  payDate: string;
  frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  status: "OPEN" | "CLOSED";
  runCount: number;
  latestRunId: string | null;
  latestRunNumber: number | null;
  latestRunStatus: Exclude<HeaderRunStatus, "NOT_STARTED"> | null;
};

export type PayrollAuditTrailRow = {
  id: string;
  runId: string | null;
  runName: string;
  payPeriod: string;
  action: "Started run" | "Calculated run" | "Reviewed run" | "Published run";
  actorName: string;
  actorEmail: string;
  actedAt: string;
};

export type PayrollPageData = {
  payRuns: PayRunRow[];
  payCycles: PayCycleRow[];
  runEmployeesByRun: Record<string, PayrollRunEmployeeRow[]>;
  auditTrail: PayrollAuditTrailRow[];
  summary: PayrollSummary;
  currentPayCycle: string;
  payrollDate: string;
  headerRunStatus: HeaderRunStatus;
  headerStatus: UiRunStatus;
  activePolicy: PayrollPolicyView | null;
  policyHistory: PayrollPolicyHistoryRow[];
};
