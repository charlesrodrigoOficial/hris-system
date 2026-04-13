import { prisma } from "@/db/prisma";
import type { PayrollSummary } from "./payroll-summary-cards";

export type UiRunStatus = "Draft" | "In progress" | "Ready for review" | "Published";

export type PayRunRow = {
  id: string;
  runName: string;
  payPeriod: string;
  employees: number;
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
  headerStatus: UiRunStatus;
};

function decToNumber(value: unknown) {
  return (value as { toNumber?: () => number })?.toNumber?.() ?? Number(value ?? 0);
}

function fmtDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}

function fmtRange(start: Date, end: Date) {
  return `${fmtDate(start)} - ${fmtDate(end)}`;
}

function mapRunStatus(status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "COMPLETED"): UiRunStatus {
  if (status === "DRAFT") return "Draft";
  if (status === "IN_REVIEW") return "Ready for review";
  if (status === "APPROVED") return "In progress";
  return "Published"; // COMPLETED
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
    return {
      payRuns: [],
      summary: {
        employeesInRun: 0,
        grossPay: 0,
        taxes: 0,
        deductions: 0,
        netPay: 0,
        alertsCount: 0,
        variancePercent: 0,
      },
      currentPayCycle: "-",
      payrollDate: "-",
      headerStatus: "Draft",
    };
  }

  const runIds = runs.map((r) => r.id);

  const [rollups, alertRollups] = await Promise.all([
    prisma.payrollRunEmployee.groupBy({
      by: ["payrollRunId"],
      where: { payrollRunId: { in: runIds } },
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
      where: { payrollRunId: { in: runIds }, reviewedAt: null },
      _count: { _all: true },
    }),
  ]);

  const rollupByRunId = new Map(rollups.map((r) => [r.payrollRunId, r]));
  const alertsByRunId = new Map(alertRollups.map((r) => [r.payrollRunId, r._count._all]));

  const payRuns: PayRunRow[] = runs.map((run) => {
    const agg = rollupByRunId.get(run.id);
    return {
      id: run.id,
      runName: `${run.payCycle.name} - Run ${run.runNumber}`,
      payPeriod: fmtRange(run.payCycle.periodStart, run.payCycle.periodEnd),
      employees: agg?._count._all ?? 0,
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
      employeesInRun: currentAgg?._count._all ?? 0,
      grossPay: decToNumber(currentAgg?._sum.grossPay),
      taxes: decToNumber(currentAgg?._sum.taxesTotal),
      deductions: decToNumber(currentAgg?._sum.deductionsTotal),
      netPay: decToNumber(currentAgg?._sum.netPay),
      alertsCount: alertsByRunId.get(currentRun.id) ?? 0,
      variancePercent: 0,
    },
    currentPayCycle: fmtRange(currentRun.payCycle.periodStart, currentRun.payCycle.periodEnd),
    payrollDate: fmtDate(currentRun.payCycle.payDate),
    headerStatus: mapRunStatus(currentRun.status),
  };
}
