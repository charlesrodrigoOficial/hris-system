import { prisma } from "@/db/prisma";
import type { PayrollSummary } from "./payroll-summary-cards";
import type {
  PayrollPolicyHistoryRow,
  PayrollPolicyView,
} from "./payroll-policy.types";

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
  netPay: number;
  status: UiRunStatus;
  alerts: number;
};

export type PayrollPageData = {
  payRuns: PayRunRow[];
  summary: PayrollSummary;
  currentPayCycle: string;
  payrollDate: string;
  headerRunStatus: HeaderRunStatus;
  headerStatus: UiRunStatus;
  activePolicy: PayrollPolicyView | null;
  policyHistory: PayrollPolicyHistoryRow[];
};

function decToNumber(value: unknown) {
  return (
    (value as { toNumber?: () => number })?.toNumber?.() ?? Number(value ?? 0)
  );
}

function fmtDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function fmtRange(start: Date, end: Date) {
  return `${fmtDate(start)} - ${fmtDate(end)}`;
}

function toIsoDate(date: Date | null | undefined) {
  if (!date) return null;
  return new Date(date).toISOString().slice(0, 10);
}

function mapRunStatus(status: string): UiRunStatus {
  if (status === "DRAFT") return "Draft";
  if (status === "CALCULATED") return "Ready for review";
  if (status === "IN_REVIEW") return "In progress";
  if (status === "APPROVED") return "In progress";
  if (status === "COMPLETED") return "Published";
  return "Draft";
}

export async function getPayrollPageData(): Promise<PayrollPageData> {
  const runs = await prisma.payrollRun.findMany({
    take: 25,
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      runNumber: true,
      status: true,
      payCycle: {
        select: {
          name: true,
          periodStart: true,
          periodEnd: true,
          payDate: true,
        },
      },
    },
  });

  if (!runs.length) {
    const [activePolicy, policyHistory] = await Promise.all([
      prisma.payrollPolicy.findFirst({
        where: { status: "ACTIVE" },
        include: {
          rules: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
      }),
      prisma.payrollPolicy.findMany({
        take: 10,
        orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
        select: {
          id: true,
          name: true,
          version: true,
          status: true,
          currency: true,
          effectiveFrom: true,
          effectiveTo: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      payRuns: [],
      summary: {
        activeUsersInRun: 0,
        grossPay: 0,
        taxes: 0,
        deductions: 0,
        netPay: 0,
        alertsCount: 0,
        variancePercent: 0,
      },
      currentPayCycle: "-",
      payrollDate: "-",
      headerRunStatus: "NOT_STARTED",
      headerStatus: "Draft",
      activePolicy: activePolicy
        ? {
            id: activePolicy.id,
            name: activePolicy.name,
            version: activePolicy.version,
            status: activePolicy.status,
            currency: activePolicy.currency,
            effectiveFrom: toIsoDate(activePolicy.effectiveFrom) ?? "",
            effectiveTo: toIsoDate(activePolicy.effectiveTo),
            notes: activePolicy.notes,
            rules: activePolicy.rules.map((rule) => ({
              id: rule.id,
              label: rule.label,
              kind: rule.kind,
              valueType: rule.valueType,
              value: decToNumber(rule.value),
              isActive: rule.isActive,
              sortOrder: rule.sortOrder,
              minAmount:
                rule.minAmount == null ? null : decToNumber(rule.minAmount),
              maxAmount:
                rule.maxAmount == null ? null : decToNumber(rule.maxAmount),
            })),
          }
        : null,
      policyHistory: policyHistory.map((row) => ({
        id: row.id,
        name: row.name,
        version: row.version,
        status: row.status,
        currency: row.currency,
        effectiveFrom: toIsoDate(row.effectiveFrom) ?? "",
        effectiveTo: toIsoDate(row.effectiveTo),
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
  }

  const runIds = runs.map((r) => r.id);

  const [rollups, alertRollups, activePolicy, policyHistory] = await Promise.all([
    prisma.payrollRunEmployee.groupBy({
      by: ["payrollRunId"],
      where: {
        payrollRunId: { in: runIds },
        user: {
          is: {
            isActive: true,
          },
        },
      },
      _count: { _all: true },
      _sum: {
        grossPay: true,
        taxesTotal: true,
        deductionsTotal: true,
        netPay: true,
      },
    }),
    prisma.payrollRunEmployee.groupBy({
      by: ["payrollRunId"],
      where: {
        payrollRunId: { in: runIds },
        reviewedAt: null,
        user: {
          is: {
            isActive: true,
          },
        },
      },
      _count: { _all: true },
    }),
    prisma.payrollPolicy.findFirst({
      where: { status: "ACTIVE" },
      include: {
        rules: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
    }),
    prisma.payrollPolicy.findMany({
      take: 10,
      orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
      select: {
        id: true,
        name: true,
        version: true,
        status: true,
        currency: true,
        effectiveFrom: true,
        effectiveTo: true,
        updatedAt: true,
      },
    }),
  ]);

  const rollupByRunId = new Map(rollups.map((r) => [r.payrollRunId, r]));
  const alertsByRunId = new Map(
    alertRollups.map((r) => [r.payrollRunId, r._count._all]),
  );

  const payRuns: PayRunRow[] = runs.map((run) => {
    const agg = rollupByRunId.get(run.id);
    return {
      id: run.id,
      runName: `${run.payCycle.name} - Run ${run.runNumber}`,
      payPeriod: fmtRange(run.payCycle.periodStart, run.payCycle.periodEnd),
      activeUsers: agg?._count._all ?? 0,
      grossPay: decToNumber(agg?._sum.grossPay),
      netPay: decToNumber(agg?._sum.netPay),
      status: mapRunStatus(run.status),
      alerts: alertsByRunId.get(run.id) ?? 0,
    };
  });

  const currentRun = runs[0];
  const currentAgg = rollupByRunId.get(currentRun.id);

  return {
    payRuns,
    summary: {
      activeUsersInRun: currentAgg?._count._all ?? 0,
      grossPay: decToNumber(currentAgg?._sum.grossPay),
      taxes: decToNumber(currentAgg?._sum.taxesTotal),
      deductions: decToNumber(currentAgg?._sum.deductionsTotal),
      netPay: decToNumber(currentAgg?._sum.netPay),
      alertsCount: alertsByRunId.get(currentRun.id) ?? 0,
      variancePercent: 0,
    },
    currentPayCycle: fmtRange(
      currentRun.payCycle.periodStart,
      currentRun.payCycle.periodEnd,
    ),
    payrollDate: fmtDate(currentRun.payCycle.payDate),
    headerRunStatus: currentRun.status as HeaderRunStatus,
    headerStatus: mapRunStatus(currentRun.status),
    activePolicy: activePolicy
      ? {
          id: activePolicy.id,
          name: activePolicy.name,
          version: activePolicy.version,
          status: activePolicy.status,
          currency: activePolicy.currency,
          effectiveFrom: toIsoDate(activePolicy.effectiveFrom) ?? "",
          effectiveTo: toIsoDate(activePolicy.effectiveTo),
          notes: activePolicy.notes,
          rules: activePolicy.rules.map((rule) => ({
            id: rule.id,
            label: rule.label,
            kind: rule.kind,
            valueType: rule.valueType,
            value: decToNumber(rule.value),
            isActive: rule.isActive,
            sortOrder: rule.sortOrder,
            minAmount: rule.minAmount == null ? null : decToNumber(rule.minAmount),
            maxAmount: rule.maxAmount == null ? null : decToNumber(rule.maxAmount),
          })),
        }
      : null,
    policyHistory: policyHistory.map((row) => ({
      id: row.id,
      name: row.name,
      version: row.version,
      status: row.status,
      currency: row.currency,
      effectiveFrom: toIsoDate(row.effectiveFrom) ?? "",
      effectiveTo: toIsoDate(row.effectiveTo),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}
