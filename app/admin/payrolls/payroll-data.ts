import { prisma } from "@/db/prisma";
import type { PayrollSummary } from "./payroll-summary-cards";
import type {
  PayrollPolicyHistoryRow,
  PayrollPolicyView,
} from "./payroll-policy.types";
import type {
  HeaderRunStatus,
  PayCycleRow,
  PayRunRow,
  PayrollAuditTrailRow,
  PayrollPageData,
  PayrollRunEmployeeRow,
  UiRunStatus,
} from "./types";

function mapPayCycles(
  payCycles: Array<{
    id: string;
    name: string;
    periodStart: Date;
    periodEnd: Date;
    payDate: Date;
    frequency: PayCycleRow["frequency"];
    status: "OPEN" | "CLOSED";
    _count: { payrollRuns: number };
    payrollRuns: Array<{
      id: string;
      runNumber: number;
      status: Exclude<HeaderRunStatus, "NOT_STARTED">;
    }>;
  }>,
): PayCycleRow[] {
  return payCycles.map((cycle) => {
    const latestRun = cycle.payrollRuns[0] ?? null;
    return {
      id: cycle.id,
      name: cycle.name,
      startDate: toIsoDate(cycle.periodStart) ?? "",
      endDate: toIsoDate(cycle.periodEnd) ?? "",
      payDate: toIsoDate(cycle.payDate) ?? "",
      frequency: cycle.frequency,
      status: cycle.status,
      runCount: cycle._count.payrollRuns,
      latestRunId: latestRun?.id ?? null,
      latestRunNumber: latestRun?.runNumber ?? null,
      latestRunStatus: latestRun?.status ?? null,
    };
  });
}

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

function mapAuditActionLabel(
  action: string,
): PayrollAuditTrailRow["action"] {
  if (action === "PAYROLL_RUN_STARTED") return "Started run";
  if (action === "PAYROLL_RUN_CALCULATED") return "Calculated run";
  if (action === "PAYROLL_RUN_REVIEWED") return "Reviewed run";
  if (action === "PAYROLL_RUN_PUBLISHED") return "Published run";
  return "Started run";
}

function mapAuditTrail(
  rows: Array<{
    id: string;
    action: string;
    createdAt: Date;
    actor: { name: string | null; email: string };
    payrollRun: {
      id: string;
      runNumber: number;
      payCycle: {
        name: string;
        periodStart: Date;
        periodEnd: Date;
      };
    } | null;
  }>,
): PayrollAuditTrailRow[] {
  return rows.map((row) => ({
    id: row.id,
    runId: row.payrollRun?.id ?? null,
    runName: row.payrollRun
      ? `${row.payrollRun.payCycle.name} - Run ${row.payrollRun.runNumber}`
      : "Unknown run",
    payPeriod: row.payrollRun
      ? fmtRange(row.payrollRun.payCycle.periodStart, row.payrollRun.payCycle.periodEnd)
      : "-",
    action: mapAuditActionLabel(row.action),
    actorName: row.actor.name?.trim() || row.actor.email || "Unknown user",
    actorEmail: row.actor.email,
    actedAt: row.createdAt.toISOString(),
  }));
}

function getPayrollEligibility(user: {
  isActive: boolean;
  salary: unknown;
  workEligibility: string | null;
}) {
  if (!user.isActive) {
    return {
      payrollEligibility: "Not eligible" as const,
      eligibilityReason: "Inactive account",
    };
  }

  const salary = decToNumber(user.salary);
  if (salary <= 0) {
    return {
      payrollEligibility: "Not eligible" as const,
      eligibilityReason: "Missing salary",
    };
  }

  if (!user.workEligibility?.trim()) {
    return {
      payrollEligibility: "Not eligible" as const,
      eligibilityReason: "Work eligibility missing",
    };
  }

  return {
    payrollEligibility: "Eligible" as const,
    eligibilityReason: "Eligible for payroll",
  };
}

export async function getPayrollPageData(): Promise<PayrollPageData> {
  
  const auditTrailRaw = await prisma.payrollAuditLog.findMany({
    take: 100,
    where: {
      action: {
        in: [
          "PAYROLL_RUN_STARTED",
          "PAYROLL_RUN_CALCULATED",
          "PAYROLL_RUN_REVIEWED",
          "PAYROLL_RUN_PUBLISHED",
        ],
      },
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      action: true,
      createdAt: true,
      actor: {
        select: {
          name: true,
          email: true,
        },
      },
      payrollRun: {
        select: {
          id: true,
          runNumber: true,
          payCycle: {
            select: {
              name: true,
              periodStart: true,
              periodEnd: true,
            },
          },
        },
      },
    },
  });

  const auditTrail = mapAuditTrail(auditTrailRaw);

  const payCyclesRaw = await prisma.payCycle.findMany({
    take: 50,
    orderBy: [{ periodEnd: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      periodStart: true,
      periodEnd: true,
      payDate: true,
      frequency: true,
      status: true,
      _count: {
        select: {
          payrollRuns: true,
        },
      },
      payrollRuns: {
        take: 1,
        orderBy: [{ runNumber: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          runNumber: true,
          status: true,
        },
      },
    },
  });
  const payCycles = mapPayCycles(
    payCyclesRaw.map((cycle) => ({
      ...cycle,
      payrollRuns: cycle.payrollRuns.map((run) => ({
        ...run,
        status: run.status as Exclude<HeaderRunStatus, "NOT_STARTED">,
      })),
    })),
  );

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
      payCycles,
      runEmployeesByRun: {},
      auditTrail,
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

  const [rollups, alertRollups, runEmployees, activePolicy, policyHistory] =
    await Promise.all([
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
      prisma.payrollRunEmployee.findMany({
        where: {
          payrollRunId: { in: runIds },
        },
        select: {
          id: true,
          payrollRunId: true,
          userId: true,
          baseSalary: true,
          grossPay: true,
          taxesTotal: true,
          deductionsTotal: true,
          netPay: true,
          user: {
            select: {
              name: true,
              email: true,
              isActive: true,
              salary: true,
              workEligibility: true,
              department: {
                select: {
                  departmentName: true,
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: "asc" }],
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

  const runEmployeesByRun: Record<string, PayrollRunEmployeeRow[]> = {};
  for (const runId of runIds) runEmployeesByRun[runId] = [];

  for (const row of runEmployees) {
    const user = row.user;
    const { payrollEligibility, eligibilityReason } =
      getPayrollEligibility(user);

    runEmployeesByRun[row.payrollRunId].push({
      id: row.id,
      userId: row.userId,
      name: user.name?.trim() || user.email || "Unnamed user",
      email: user.email,
      department: user.department?.departmentName || "Unassigned",
      baseSalary: decToNumber(row.baseSalary),
      grossPay: decToNumber(row.grossPay),
      taxesTotal: decToNumber(row.taxesTotal),
      deductionsTotal: decToNumber(row.deductionsTotal),
      netPay: decToNumber(row.netPay),
      employmentStatus: user.isActive ? "Active" : "Inactive",
      payrollEligibility,
      eligibilityReason,
    });
  }

  for (const runId of runIds) {
    runEmployeesByRun[runId].sort((a, b) => {
      if (a.employmentStatus !== b.employmentStatus) {
        return a.employmentStatus === "Active" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  const payRuns: PayRunRow[] = runs.map((run) => {
    const employees = runEmployeesByRun[run.id] ?? [];
    const agg = rollupByRunId.get(run.id);
    return {
      id: run.id,
      runName: `${run.payCycle.name} - Run ${run.runNumber}`,
      payPeriod: fmtRange(run.payCycle.periodStart, run.payCycle.periodEnd),
      activeUsers: employees.filter(
        (employee) => employee.employmentStatus === "Active",
      ).length,
      grossPay: decToNumber(agg?._sum.grossPay),
      taxes: decToNumber(agg?._sum.taxesTotal),
      deductions: decToNumber(agg?._sum.deductionsTotal),
      netPay: decToNumber(agg?._sum.netPay),
      runStatus: run.status as Exclude<HeaderRunStatus, "NOT_STARTED">,
      status: mapRunStatus(run.status),
      alerts: alertsByRunId.get(run.id) ?? 0,
    };
  });

  const currentRun = runs[0];
  const currentAgg = rollupByRunId.get(currentRun.id);
  const currentRunEmployees = runEmployeesByRun[currentRun.id] ?? [];
  const currentRunActiveUsersCount = currentRunEmployees.filter(
    (employee) => employee.employmentStatus === "Active",
  ).length;

  return {
    payRuns,
    payCycles,
    runEmployeesByRun,
    auditTrail,
    summary: {
      activeUsersInRun: currentRunActiveUsersCount,
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
