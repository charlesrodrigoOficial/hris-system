import type { UserPayStub } from "./payroll-data";

export type PayrollClientPayStub = Omit<
  UserPayStub,
  "payDate" | "periodStart" | "periodEnd"
> & {
  payDate: Date;
  periodStart: Date;
  periodEnd: Date;
};

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export function normalizePayStubs(payStubs: UserPayStub[]): PayrollClientPayStub[] {
  return payStubs.map((stub) => ({
    ...stub,
    payDate: toDate(stub.payDate),
    periodStart: toDate(stub.periodStart),
    periodEnd: toDate(stub.periodEnd),
  }));
}

export function safeCurrency(code: string) {
  const trimmed = String(code || "").trim().toUpperCase();
  return trimmed || "GBP";
}

export function formatMoney(amount: number, currency: string) {
  const value = Number.isFinite(amount) ? amount : 0;
  const code = safeCurrency(currency);
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${code}`;
  }
}

export function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatShortRange(start: Date, end: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

export function monthName(monthIndex: number) {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    new Date(2025, monthIndex, 1),
  );
}

export function getInitials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export function getYtdTotals(
  payStubs: PayrollClientPayStub[],
  selected: PayrollClientPayStub,
) {
  const yearStubs = payStubs
    .filter((s) => s.year === selected.year && s.payDate <= selected.payDate)
    .sort((a, b) => a.payDate.getTime() - b.payDate.getTime());

  return yearStubs.reduce(
    (acc, stub) => {
      acc.gross += stub.gross;
      acc.net += stub.net;
      acc.taxes += stub.taxes;
      acc.deductions += stub.deductions;
      acc.timeOffDays += stub.timeOffDays;
      return acc;
    },
    { gross: 0, net: 0, taxes: 0, deductions: 0, timeOffDays: 0 },
  );
}
