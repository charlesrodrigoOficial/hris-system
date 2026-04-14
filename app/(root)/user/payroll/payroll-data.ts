import { prisma } from "@/db/prisma";

export type PayStubLine = {
  label: string;
  current: number;
  ytd: number;
};

export type UserPayStub = {
  id: string;
  year: number;
  monthIndex: number;
  payDate: Date;
  periodStart: Date;
  periodEnd: Date;
  gross: number;
  net: number;
  taxes: number;
  deductions: number;
  timeOffDays: number;
  lines: {
    earnings: PayStubLine[];
    taxes: PayStubLine[];
    deductions: PayStubLine[];
    timeOff: PayStubLine[];
  };
};

function toNumber(value: unknown) {
  const n =
    (value as { toNumber?: () => number })?.toNumber?.() ?? Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function makeLine(label: string, amount: number): PayStubLine {
  return { label, current: amount, ytd: 0 };
}

export async function getUserPayrollData(userId: string): Promise<UserPayStub[]> {
  const payslips = await prisma.payslip.findMany({
    where: {
      userId,
      status: "PUBLISHED",
    },
    orderBy: [{ payDate: "desc" }, { createdAt: "desc" }],
    include: {
      earnings: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      taxes: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      deductions: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });

  const stubs: UserPayStub[] = payslips.map((payslip) => {
    const gross = toNumber(payslip.grossPay);
    const taxes = toNumber(payslip.taxesTotal);
    const deductions = toNumber(payslip.deductionsTotal);
    const net = toNumber(payslip.netPay);

    const earningsLines =
      payslip.earnings.length > 0
        ? payslip.earnings.map((e) => makeLine(e.label, toNumber(e.amount)))
        : [makeLine("Base salary", gross)];

    const taxLines =
      payslip.taxes.length > 0
        ? payslip.taxes.map((t) => makeLine(t.label, toNumber(t.amount)))
        : [makeLine("Payroll taxes", taxes)];

    const deductionLines =
      payslip.deductions.length > 0
        ? payslip.deductions.map((d) => makeLine(d.label, toNumber(d.amount)))
        : [makeLine("Payroll deductions", deductions)];

    const timeOffDays = 0;

    return {
      id: payslip.id,
      year: payslip.payDate.getFullYear(),
      monthIndex: payslip.payDate.getMonth(),
      payDate: payslip.payDate,
      periodStart: payslip.periodStart,
      periodEnd: payslip.periodEnd,
      gross,
      net,
      taxes,
      deductions,
      timeOffDays,
      lines: {
        earnings: earningsLines,
        taxes: taxLines,
        deductions: deductionLines,
        timeOff: [makeLine("Time off taken", timeOffDays)],
      },
    };
  });

  // Fill per-line YTD values by year and label
  const byYear = new Map<number, UserPayStub[]>();
  for (const stub of stubs) {
    byYear.set(stub.year, [...(byYear.get(stub.year) ?? []), stub]);
  }

  for (const [, yearStubs] of byYear) {
    yearStubs.sort((a, b) => a.payDate.getTime() - b.payDate.getTime());

    const running = {
      earnings: new Map<string, number>(),
      taxes: new Map<string, number>(),
      deductions: new Map<string, number>(),
      timeOff: new Map<string, number>(),
    };

    for (const stub of yearStubs) {
      for (const section of Object.keys(stub.lines) as Array<
        keyof UserPayStub["lines"]
      >) {
        for (const line of stub.lines[section]) {
          const prev = running[section].get(line.label) ?? 0;
          const next = prev + line.current;
          running[section].set(line.label, next);
          line.ytd = next;
        }
      }
    }
  }

  return stubs.sort((a, b) => b.payDate.getTime() - a.payDate.getTime());
}
