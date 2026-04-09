"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import PayrollDonutChart from "./payroll-donut-chart.client";

type UserPayrollView = {
  name: string;
  image: string | null;
  currency: string;
  salary: number | null;
};

type PayStubLine = {
  label: string;
  current: number;
  ytd: number;
};

type PayStub = {
  id: string;
  year: number;
  monthIndex: number; // 0..11
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

function safeCurrency(code: string) {
  const trimmed = String(code || "").trim().toUpperCase();
  return trimmed || "GBP";
}

function formatMoney(amount: number, currency: string) {
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

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatShortRange(start: Date, end: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

function monthName(monthIndex: number) {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    new Date(2025, monthIndex, 1),
  );
}

function buildPayStubs({
  salary,
  years,
}: {
  salary: number;
  years: number[];
}): PayStub[] {
  const stubs: PayStub[] = [];
  const grossMonthly = Math.max(0, salary);

  for (const year of years) {
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      // pay period: 01..14, pay date: 16
      const periodStart = new Date(year, monthIndex, 1);
      const periodEnd = new Date(year, monthIndex, 14);
      const payDate = new Date(year, monthIndex, 16);

      const overtime = ((monthIndex % 3) + 1) * 250;
      const bonus = monthIndex === 11 ? 1500 : monthIndex === 5 ? 800 : 0;
      const commission = monthIndex % 2 === 0 ? 500 : 250;
      const gross = grossMonthly + overtime + bonus + commission;

      const taxes = gross * 0.247;
      const deductions = gross * 0.152;
      const net = Math.max(0, gross - taxes - deductions);

      const timeOffDays = monthIndex % 4 === 0 ? 2 : monthIndex % 4 === 1 ? 1 : 0;

      stubs.push({
        id: `${year}-${monthIndex + 1}`,
        year,
        monthIndex,
        payDate,
        periodStart,
        periodEnd,
        gross,
        net,
        taxes,
        deductions,
        timeOffDays,
        lines: {
          earnings: [
            { label: "Base salary", current: grossMonthly, ytd: 0 },
            { label: "Overtime", current: overtime, ytd: 0 },
            { label: "Bonus", current: bonus, ytd: 0 },
            { label: "Commission", current: commission, ytd: 0 },
          ],
          taxes: [
            { label: "PAYE / Income tax", current: taxes * 0.78, ytd: 0 },
            { label: "National Insurance", current: taxes * 0.22, ytd: 0 },
          ],
          deductions: [
            { label: "Pension", current: deductions * 0.5, ytd: 0 },
            { label: "Health insurance", current: deductions * 0.25, ytd: 0 },
            { label: "Other", current: deductions * 0.25, ytd: 0 },
          ],
          timeOff: [
            {
              label: "Time off taken",
              current: timeOffDays,
              ytd: 0,
            },
          ],
        },
      });
    }
  }

  // add YTD numbers per year
  const byYear = new Map<number, PayStub[]>();
  for (const stub of stubs) {
    byYear.set(stub.year, [...(byYear.get(stub.year) ?? []), stub]);
  }

  for (const [year, yearStubs] of byYear.entries()) {
    yearStubs.sort((a, b) => a.monthIndex - b.monthIndex);

    const running = {
      earnings: new Map<string, number>(),
      taxes: new Map<string, number>(),
      deductions: new Map<string, number>(),
      timeOff: new Map<string, number>(),
    };

    for (const stub of yearStubs) {
      for (const section of Object.keys(stub.lines) as Array<
        keyof PayStub["lines"]
      >) {
        for (const line of stub.lines[section]) {
          const bucket = running[section];
          const prev = bucket.get(line.label) ?? 0;
          bucket.set(line.label, prev + line.current);
          line.ytd = bucket.get(line.label) ?? 0;
        }
      }
    }
  }

  return stubs.sort((a, b) => b.payDate.getTime() - a.payDate.getTime());
}

function getInitials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

function getYtdTotals(payStubs: PayStub[], selected: PayStub) {
  const yearStubs = payStubs
    .filter((s) => s.year === selected.year && s.monthIndex <= selected.monthIndex)
    .sort((a, b) => a.monthIndex - b.monthIndex);

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

function LineTable({
  currency,
  lines,
  valueKind,
}: {
  currency: string;
  lines: PayStubLine[];
  valueKind: "money" | "days";
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="grid grid-cols-[1fr_140px_140px] gap-3 border-b bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground">
        <div />
        <div className="text-right">Current</div>
        <div className="text-right">Year-to-date</div>
      </div>
      <div className="divide-y">
        {lines.map((line) => (
          <div
            key={line.label}
            className="grid grid-cols-[1fr_140px_140px] items-center gap-3 px-4 py-3 text-sm"
          >
            <div className="text-foreground">{line.label}</div>
            <div className="text-right font-medium text-foreground">
              {valueKind === "days"
                ? `${line.current} day${line.current === 1 ? "" : "s"}`
                : formatMoney(line.current, currency)}
            </div>
            <div className="text-right text-muted-foreground">
              {valueKind === "days"
                ? `${line.ytd} day${line.ytd === 1 ? "" : "s"}`
                : formatMoney(line.ytd, currency)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PayrollClient({ user }: { user: UserPayrollView }) {
  const currency = safeCurrency(user.currency);
  const salaryFallback = 15500;
  const baseSalary = Number.isFinite(user.salary ?? NaN)
    ? Math.max(0, user.salary as number)
    : salaryFallback;

  const currentYear = new Date().getFullYear();
  const years = React.useMemo(() => [currentYear, currentYear - 1], [currentYear]);

  const payStubs = React.useMemo(
    () => buildPayStubs({ salary: baseSalary, years }),
    [baseSalary, years],
  );

  const [selectedId, setSelectedId] = React.useState(payStubs[0]?.id ?? "");
  const selected = React.useMemo(
    () => payStubs.find((s) => s.id === selectedId) ?? payStubs[0],
    [payStubs, selectedId],
  );

  const [viewMode, setViewMode] = React.useState<"current" | "ytd">("current");

  if (!selected) return null;

  const ytdTotals = React.useMemo(
    () => getYtdTotals(payStubs, selected),
    [payStubs, selected],
  );

  const totals = viewMode === "ytd" ? ytdTotals : selected;

  const donutData = [
    { name: "Net pay", value: totals.net, color: "#22c55e" },
    { name: "Taxes", value: totals.taxes, color: "#f97316" },
    { name: "Deductions", value: totals.deductions, color: "#e11d48" },
  ];

  const yearsInHistory = Array.from(new Set(payStubs.map((s) => s.year))).sort(
    (a, b) => b - a,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <Avatar className="h-12 w-12">
              {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm text-muted-foreground">Payroll</p>
              <p className="truncate text-lg font-semibold tracking-tight">
                {user.name}
              </p>
            </div>
          </div>

          <div className="space-y-4 px-1">
            <div className="text-sm font-semibold text-muted-foreground">
              Pay history
            </div>
            {yearsInHistory.map((year) => {
              const stubsByYear = payStubs
                .filter((s) => s.year === year)
                .sort((a, b) => b.monthIndex - a.monthIndex);

              return (
                <div key={year} className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">
                    {year}
                  </div>
                  <div className="space-y-1">
                    {stubsByYear.slice(0, 6).map((stub) => {
                      const active = stub.id === selected.id;
                      return (
                        <button
                          key={stub.id}
                          type="button"
                          onClick={() => setSelectedId(stub.id)}
                          className={cn(
                            "w-full rounded-xl border px-3 py-2 text-left transition",
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium">
                              {monthName(stub.monthIndex)}
                            </div>
                            <div
                              className={cn(
                                "text-xs",
                                active ? "text-white/80" : "text-muted-foreground",
                              )}
                            >
                              {formatMoney(stub.net, currency)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border bg-background p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xl font-semibold tracking-tight">
                {formatFullDate(selected.payDate)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pay period: {formatShortRange(selected.periodStart, selected.periodEnd)}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <Tabs
                value={viewMode}
                onValueChange={(v) => setViewMode(v as "current" | "ytd")}
              >
                <TabsList className="rounded-full bg-muted/50">
                  <TabsTrigger value="current" className="rounded-full">
                    Current
                  </TabsTrigger>
                  <TabsTrigger value="ytd" className="rounded-full">
                    Year-to-date
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button className="rounded-full" variant="secondary">
                <Sparkles className="mr-2 h-4 w-4" />
                Ask AI
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">
                  You took home
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-1 rounded-full bg-emerald-500" />
                  <div>
                    <div className="text-3xl font-semibold tracking-tight">
                      {formatMoney(totals.net, currency)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">Taxes</p>
                    <p className="mt-1 text-base font-semibold">
                      {formatMoney(totals.taxes, currency)}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">Deductions</p>
                    <p className="mt-1 text-base font-semibold">
                      {formatMoney(totals.deductions, currency)}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">Time off taken</p>
                    <p className="mt-1 text-base font-semibold">
                      {totals.timeOffDays} day{totals.timeOffDays === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">
                  Gross pay breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-[1fr_180px] sm:items-center">
                <div className="space-y-2">
                  {donutData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: item.color }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="ml-auto font-medium text-foreground">
                        {totals.gross > 0
                          ? Math.round((item.value / totals.gross) * 1000) / 10
                          : 0}
                        %
                      </span>
                    </div>
                  ))}
                </div>

                <PayrollDonutChart
                  data={donutData}
                  totalLabel={formatMoney(totals.gross, currency)}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="earnings">
                <TabsList className="w-full justify-start rounded-xl bg-muted/30">
                  <TabsTrigger value="earnings" className="rounded-lg">
                    Earnings
                  </TabsTrigger>
                  <TabsTrigger value="taxes" className="rounded-lg">
                    Taxes
                  </TabsTrigger>
                  <TabsTrigger value="deductions" className="rounded-lg">
                    Deductions
                  </TabsTrigger>
                  <TabsTrigger value="timeOff" className="rounded-lg">
                    Time off
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="earnings">
                  <LineTable
                    currency={currency}
                    lines={selected.lines.earnings}
                    valueKind="money"
                  />
                </TabsContent>
                <TabsContent value="taxes">
                  <LineTable
                    currency={currency}
                    lines={selected.lines.taxes}
                    valueKind="money"
                  />
                </TabsContent>
                <TabsContent value="deductions">
                  <LineTable
                    currency={currency}
                    lines={selected.lines.deductions}
                    valueKind="money"
                  />
                </TabsContent>
                <TabsContent value="timeOff">
                  <LineTable
                    currency={currency}
                    lines={selected.lines.timeOff}
                    valueKind="days"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
