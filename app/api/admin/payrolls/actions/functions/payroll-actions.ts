import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { calculateFromPolicy } from "@/lib/payroll/policy";

export type PayrollAction =
  | "START_RUN"
  | "CALCULATE"
  | "REVIEW"
  | "APPROVE"
  | "PUBLISH"
  | "SYNC";

type PayrollActionResult = {
  message: string;
  runId: string;
};

const PAYROLL_TRANSACTION_OPTIONS = {
  maxWait: 20_000,
  timeout: 60_000,
} as const;

export function isPayrollAction(value: string): value is PayrollAction {
  return (
    value === "START_RUN" ||
    value === "CALCULATE" ||
    value === "REVIEW" ||
    value === "APPROVE" ||
    value === "PUBLISH" ||
    value === "SYNC"
  );
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function toMoneyNumber(value: unknown) {
  const numeric =
    (value as { toNumber?: () => number })?.toNumber?.() ?? Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return roundMoney(Math.max(0, numeric));
}

function toDecimal(value: number) {
  return new Prisma.Decimal(roundMoney(value).toFixed(2));
}

function monthRange(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  );
  const payDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 2),
  );

  return { start, end, payDate };
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

async function findCurrentRun() {
  return prisma.payrollRun.findFirst({
    orderBy: [{ createdAt: "desc" }],
    include: {
      payCycle: true,
    },
  });
}

async function findTargetRun(payrollRunId?: string | null) {
  if (payrollRunId) {
    return prisma.payrollRun.findUnique({
      where: { id: payrollRunId },
      include: { payCycle: true },
    });
  }
  return findCurrentRun();
}

async function handleStartRun(
  actorId: string,
  payrollRunId?: string | null,
): Promise<PayrollActionResult> {
  if (payrollRunId) {
    return prisma.$transaction(async (tx) => {
      const selectedRun = await tx.payrollRun.findUnique({
        where: { id: payrollRunId },
      });

      if (!selectedRun) {
        throw new Error("Selected payroll run was not found.");
      }
      if (selectedRun.status === "COMPLETED") {
        throw new Error("Cannot open a published payroll run.");
      }

      const startedRun = await tx.payrollRun.update({
        where: { id: selectedRun.id },
        data: {
          startedAt: selectedRun.startedAt ?? new Date(),
        },
      });

      await tx.payrollAuditLog.create({
        data: {
          actorId,
          payrollRunId: startedRun.id,
          payCycleId: startedRun.payCycleId,
          action: "PAYROLL_RUN_STARTED",
          details: {
            selectedRun: true,
            status: startedRun.status,
          },
        },
      });

      return {
        message: "Payroll run opened.",
        runId: startedRun.id,
      };
    }, PAYROLL_TRANSACTION_OPTIONS);
  }

  return prisma.$transaction(async (tx) => {
    const latestRun = await tx.payrollRun.findFirst({
      orderBy: [{ createdAt: "desc" }],
    });

    if (latestRun && latestRun.status !== "COMPLETED") {
      const startedRun = await tx.payrollRun.update({
        where: { id: latestRun.id },
        data: {
          startedAt: latestRun.startedAt ?? new Date(),
        },
      });

      await tx.payrollAuditLog.create({
        data: {
          actorId,
          payrollRunId: startedRun.id,
          payCycleId: startedRun.payCycleId,
          action: "PAYROLL_RUN_STARTED",
          details: {
            reusedExistingRun: true,
            status: startedRun.status,
          },
        },
      });

      return {
        message: "Using existing active payroll run.",
        runId: startedRun.id,
      };
    }

    const existingOpenCycle = await tx.payCycle.findFirst({
      where: { status: "OPEN" },
      orderBy: [{ periodEnd: "desc" }, { createdAt: "desc" }],
    });
    const payCycle =
      existingOpenCycle ??
      (await (async () => {
        const latestCycle = await tx.payCycle.findFirst({
          orderBy: [{ periodEnd: "desc" }, { createdAt: "desc" }],
          select: {
            periodStart: true,
            periodEnd: true,
          },
        });

        let start: Date;
        let end: Date;
        let payDate: Date;

        if (latestCycle) {
          const cycleLengthDays =
            Math.max(
              1,
              Math.floor(
                (latestCycle.periodEnd.getTime() -
                  latestCycle.periodStart.getTime()) /
                  86_400_000,
              ) + 1,
            );
          start = addUtcDays(latestCycle.periodEnd, 1);
          end = addUtcDays(start, cycleLengthDays - 1);
          payDate = addUtcDays(end, 2);
        } else {
          const range = monthRange(new Date());
          start = range.start;
          end = range.end;
          payDate = range.payDate;
        }

        const monthLabel = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          timeZone: "UTC",
        }).format(start);
        const periodEndLabel = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          timeZone: "UTC",
        }).format(end);

        return tx.payCycle.create({
          data: {
            name: `Cycle ${monthLabel} - ${periodEndLabel}`,
            periodStart: start,
            periodEnd: end,
            payDate,
            status: "OPEN",
            createdById: actorId,
          },
        });
      })());

    const prevRun = await tx.payrollRun.findFirst({
      where: { payCycleId: payCycle.id },
      orderBy: [{ runNumber: "desc" }],
      select: { runNumber: true },
    });
    const nextRunNumber = (prevRun?.runNumber ?? 0) + 1;

    const createdRun = await tx.payrollRun.create({
      data: {
        payCycleId: payCycle.id,
        runNumber: nextRunNumber,
        status: "DRAFT",
        startedAt: new Date(),
        createdById: actorId,
      },
    });

    await tx.payrollAuditLog.create({
      data: {
        actorId,
        payrollRunId: createdRun.id,
        payCycleId: payCycle.id,
        action: "PAYROLL_RUN_STARTED",
        details: {
          runNumber: createdRun.runNumber,
        },
      },
    });

    return {
      message: "Payroll run started.",
      runId: createdRun.id,
    };
  }, PAYROLL_TRANSACTION_OPTIONS);
}

async function handleCalculate(
  actorId: string,
  payrollRunId?: string | null,
): Promise<PayrollActionResult> {
  const run = await findTargetRun(payrollRunId);
  if (!run || run.status === "COMPLETED") {
    throw new Error("No active payroll run found. Start a run first.");
  }
  if (
    run.status !== "DRAFT" &&
    run.status !== "CALCULATED" &&
    run.status !== "IN_REVIEW" &&
    run.status !== "APPROVED"
  ) {
    throw new Error("Only active payroll runs can be calculated.");
  }

  return prisma.$transaction(async (tx) => {
    const policy = await tx.payrollPolicy.findFirst({
      where: {
        status: "ACTIVE",
        effectiveFrom: { lte: run.payCycle.periodEnd },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: run.payCycle.periodStart } }],
      },
      include: {
        rules: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
    });

    if (!policy) {
      throw new Error(
        "No active payroll policy configured. Create and activate a policy first.",
      );
    }

    const activeUsers = await tx.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        salary: true,
      },
    });

    const userIds = activeUsers.map((user) => user.id);

    await tx.payrollRunEmployee.deleteMany({
      where: {
        payrollRunId: run.id,
        ...(userIds.length > 0 ? { userId: { notIn: userIds } } : {}),
      },
    });

    let grossTotal = 0;
    let netTotal = 0;

    for (const user of activeUsers) {
      const baseSalary = toMoneyNumber(user.salary);
      const { grossPay, taxesTotal, deductionsTotal, netPay } =
        calculateFromPolicy(baseSalary, policy.rules);

      grossTotal += grossPay;
      netTotal += netPay;

      await tx.payrollRunEmployee.upsert({
        where: {
          payrollRunId_userId: {
            payrollRunId: run.id,
            userId: user.id,
          },
        },
        update: {
          baseSalary: toDecimal(baseSalary),
          grossPay: toDecimal(grossPay),
          taxesTotal: toDecimal(taxesTotal),
          deductionsTotal: toDecimal(deductionsTotal),
          netPay: toDecimal(netPay),
          varianceAmount: toDecimal(0),
          varianceNote: null,
          reviewedAt: null,
          reviewedById: null,
        },
        create: {
          payrollRunId: run.id,
          userId: user.id,
          baseSalary: toDecimal(baseSalary),
          grossPay: toDecimal(grossPay),
          taxesTotal: toDecimal(taxesTotal),
          deductionsTotal: toDecimal(deductionsTotal),
          netPay: toDecimal(netPay),
          varianceAmount: toDecimal(0),
        },
      });
    }

    await tx.payrollRun.update({
      where: { id: run.id },
      data: {
        status: "CALCULATED",
        syncedAt: new Date(),
        startedAt: run.startedAt ?? new Date(),
        reviewedAt: null,
        completedAt: null,
        payrollPolicyId: policy.id,
      },
    });

    await tx.payrollAuditLog.create({
      data: {
        actorId,
        payrollRunId: run.id,
        payCycleId: run.payCycleId,
        action: "PAYROLL_RUN_CALCULATED",
        details: {
          employees: activeUsers.length,
          activeUsers: activeUsers.length,
          policyId: policy.id,
          policyVersion: policy.version,
          grossPay: roundMoney(grossTotal),
          netPay: roundMoney(netTotal),
        },
      },
    });

    return {
      message: `Calculated payroll for ${activeUsers.length} active user(s).`,
      runId: run.id,
    };
  }, PAYROLL_TRANSACTION_OPTIONS);
}

async function handleReview(
  actorId: string,
  payrollRunId?: string | null,
): Promise<PayrollActionResult> {
  const run = await findTargetRun(payrollRunId);
  if (!run || run.status === "COMPLETED") {
    throw new Error("No active payroll run found to review.");
  }
  if (run.status !== "CALCULATED") {
    throw new Error("Run Calculate before Review.");
  }

  return prisma.$transaction(async (tx) => {
    const activeUsers = await tx.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
      },
    });
    const activeUserIds = activeUsers.map((user) => user.id);

    await tx.payrollRunEmployee.deleteMany({
      where: {
        payrollRunId: run.id,
        ...(activeUserIds.length > 0 ? { userId: { notIn: activeUserIds } } : {}),
      },
    });

    const activeUserCount = await tx.payrollRunEmployee.count({
      where: { payrollRunId: run.id },
    });

    if (activeUserCount === 0) {
      throw new Error("No payroll calculations found. Run Calculate first.");
    }

    const reviewedAt = new Date();
    await tx.payrollRunEmployee.updateMany({
      where: {
        payrollRunId: run.id,
        reviewedAt: null,
      },
      data: {
        reviewedAt,
        reviewedById: actorId,
      },
    });

    await tx.payrollRun.update({
      where: { id: run.id },
      data: {
        status: "IN_REVIEW",
        reviewedAt,
      },
    });

    await tx.payrollAuditLog.create({
      data: {
        actorId,
        payrollRunId: run.id,
        payCycleId: run.payCycleId,
        action: "PAYROLL_RUN_REVIEWED",
        details: {
          employeesReviewed: activeUserCount,
          activeUsersReviewed: activeUserCount,
        },
      },
    });

    return {
      message: "Payroll run moved to In Review.",
      runId: run.id,
    };
  }, PAYROLL_TRANSACTION_OPTIONS);
}

async function handleApprove(
  actorId: string,
  payrollRunId?: string | null,
): Promise<PayrollActionResult> {
  const run = await findTargetRun(payrollRunId);
  if (!run || run.status === "COMPLETED") {
    throw new Error("No active payroll run found to approve.");
  }
  if (run.status !== "IN_REVIEW") {
    throw new Error("Run Review before Approve.");
  }

  return prisma.$transaction(async (tx) => {
    const activeUserCount = await tx.payrollRunEmployee.count({
      where: {
        payrollRunId: run.id,
        user: {
          is: {
            isActive: true,
          },
        },
      },
    });

    if (activeUserCount === 0) {
      throw new Error("No payroll calculations found. Run Calculate first.");
    }

    await tx.payrollRun.update({
      where: { id: run.id },
      data: {
        status: "APPROVED",
      },
    });

    await tx.payrollAuditLog.create({
      data: {
        actorId,
        payrollRunId: run.id,
        payCycleId: run.payCycleId,
        action: "PAYROLL_RUN_APPROVED",
        details: {
          employeesApproved: activeUserCount,
          activeUsersApproved: activeUserCount,
        },
      },
    });

    return {
      message: "Payroll run approved and ready to publish.",
      runId: run.id,
    };
  }, PAYROLL_TRANSACTION_OPTIONS);
}

async function handleSync(
  actorId: string,
  payrollRunId?: string | null,
): Promise<PayrollActionResult> {
  const run = await findTargetRun(payrollRunId);
  if (!run || run.status === "COMPLETED") {
    throw new Error("No active payroll run found to sync.");
  }

  return prisma.$transaction(async (tx) => {
    const activeUsers = await tx.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    const activeUserIds = activeUsers.map((user) => user.id);

    await tx.payrollRunEmployee.deleteMany({
      where: {
        payrollRunId: run.id,
        ...(activeUserIds.length > 0 ? { userId: { notIn: activeUserIds } } : {}),
      },
    });

    const now = new Date();
    await tx.payrollRun.update({
      where: { id: run.id },
      data: {
        syncedAt: now,
        startedAt: run.startedAt ?? now,
      },
    });

    const activeEmployeesInRun = await tx.payrollRunEmployee.count({
      where: {
        payrollRunId: run.id,
        user: {
          is: {
            isActive: true,
          },
        },
      },
    });

    await tx.payrollAuditLog.create({
      data: {
        actorId,
        payrollRunId: run.id,
        payCycleId: run.payCycleId,
        action: "PAYROLL_RUN_SYNCED",
        details: {
          activeUsers: activeUsers.length,
          activeUsersInRun: activeEmployeesInRun,
        },
      },
    });

    return {
      message: "Payroll run synced with active users.",
      runId: run.id,
    };
  }, PAYROLL_TRANSACTION_OPTIONS);
}

async function handlePublish(
  actorId: string,
  payrollRunId?: string | null,
): Promise<PayrollActionResult> {
  const run = await findTargetRun(payrollRunId);
  if (!run || run.status === "COMPLETED") {
    throw new Error("No active payroll run found to publish.");
  }
  if (run.status !== "IN_REVIEW" && run.status !== "APPROVED") {
    throw new Error("Review the payroll run before publishing payslips.");
  }

  return prisma.$transaction(async (tx) => {
    const activeUsers = await tx.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
      },
    });
    const activeUserIds = activeUsers.map((user) => user.id);

    await tx.payrollRunEmployee.deleteMany({
      where: {
        payrollRunId: run.id,
        ...(activeUserIds.length > 0 ? { userId: { notIn: activeUserIds } } : {}),
      },
    });

    const runEmployees = await tx.payrollRunEmployee.findMany({
      where: {
        payrollRunId: run.id,
        user: {
          is: {
            isActive: true,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            currency: true,
          },
        },
      },
    });

    if (runEmployees.length === 0) {
      throw new Error("No payroll calculations found. Run Calculate first.");
    }

    const publishedAt = new Date();
    for (const row of runEmployees) {
      const payslip = await tx.payslip.upsert({
        where: {
          payrollRunId_userId: {
            payrollRunId: run.id,
            userId: row.userId,
          },
        },
        update: {
          payrollRunEmployeeId: row.id,
          payDate: run.payCycle.payDate,
          periodStart: run.payCycle.periodStart,
          periodEnd: run.payCycle.periodEnd,
          currency: row.user.currency?.trim() || "GBP",
          grossPay: row.grossPay,
          taxesTotal: row.taxesTotal,
          deductionsTotal: row.deductionsTotal,
          netPay: row.netPay,
          status: "PUBLISHED",
          publishedAt,
        },
        create: {
          payrollRunId: run.id,
          payrollRunEmployeeId: row.id,
          userId: row.userId,
          payDate: run.payCycle.payDate,
          periodStart: run.payCycle.periodStart,
          periodEnd: run.payCycle.periodEnd,
          currency: row.user.currency?.trim() || "GBP",
          grossPay: row.grossPay,
          taxesTotal: row.taxesTotal,
          deductionsTotal: row.deductionsTotal,
          netPay: row.netPay,
          status: "PUBLISHED",
          publishedAt,
        },
      });

      await tx.payslipEarning.deleteMany({ where: { payslipId: payslip.id } });
      await tx.payslipTax.deleteMany({ where: { payslipId: payslip.id } });
      await tx.payslipDeduction.deleteMany({ where: { payslipId: payslip.id } });

      await tx.payslipEarning.create({
        data: {
          payslipId: payslip.id,
          label: "Base salary",
          amount: row.baseSalary,
          sortOrder: 0,
        },
      });
      await tx.payslipTax.create({
        data: {
          payslipId: payslip.id,
          label: "Payroll taxes",
          amount: row.taxesTotal,
          sortOrder: 0,
        },
      });
      await tx.payslipDeduction.create({
        data: {
          payslipId: payslip.id,
          label: "Payroll deductions",
          amount: row.deductionsTotal,
          sortOrder: 0,
        },
      });

      await tx.payrollAuditLog.create({
        data: {
          actorId,
          payrollRunId: run.id,
          payCycleId: run.payCycleId,
          userId: row.userId,
          payslipId: payslip.id,
          action: "PAYSLIP_PUBLISHED",
          details: {
            status: "PUBLISHED",
          },
        },
      });
    }

    await tx.payrollRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        completedAt: publishedAt,
      },
    });

    await tx.payCycle.update({
      where: { id: run.payCycleId },
      data: { status: "CLOSED" },
    });

    await tx.payrollAuditLog.create({
      data: {
        actorId,
        payrollRunId: run.id,
        payCycleId: run.payCycleId,
        action: "PAYROLL_RUN_PUBLISHED",
        details: {
          payslipsPublished: runEmployees.length,
        },
      },
    });

    return {
      message: `Published ${runEmployees.length} payslip(s).`,
      runId: run.id,
    };
  }, PAYROLL_TRANSACTION_OPTIONS);
}

export async function executePayrollAction(params: {
  action: PayrollAction;
  actorId: string;
  payrollRunId?: string | null;
}): Promise<PayrollActionResult> {
  const { action, actorId, payrollRunId } = params;

  if (action === "START_RUN") {
    return handleStartRun(actorId, payrollRunId);
  }
  if (action === "CALCULATE") {
    return handleCalculate(actorId, payrollRunId);
  }
  if (action === "REVIEW") {
    return handleReview(actorId, payrollRunId);
  }
  if (action === "APPROVE") {
    return handleApprove(actorId, payrollRunId);
  }
  if (action === "SYNC") {
    return handleSync(actorId, payrollRunId);
  }

  return handlePublish(actorId, payrollRunId);
}
