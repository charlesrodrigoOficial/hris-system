import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Users,
  Receipt,
  Landmark,
  BadgePoundSterling,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PayrollDonutChart from "./payroll-donut-chart.client";

export type PayrollSummary = {
  activeUsersInRun: number;
  grossPay: number;
  taxes: number;
  deductions: number;
  netPay: number;
  alertsCount: number;
  variancePercent: number;
};
function formatCurrency(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PayrollSummaryCards({
  summary,
  currencyCode = "GBP",
}: {
  summary: PayrollSummary;
  currencyCode?: string;
}) {
  const donutData = [
    { name: "Net pay", value: summary.netPay, color: "#22c55e" },
    { name: "Taxes", value: summary.taxes, color: "#f97316" },
    { name: "Deductions", value: summary.deductions, color: "#e11d48" },
  ];

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Active users in run
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {summary.activeUsersInRun}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Receipt className="h-4 w-4" />
              Gross pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {formatCurrency(summary.grossPay, currencyCode)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Landmark className="h-4 w-4" />
              Taxes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {formatCurrency(summary.taxes, currencyCode)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <BadgePoundSterling className="h-4 w-4" />
              Deductions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {formatCurrency(summary.deductions, currencyCode)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Net pay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {formatCurrency(summary.netPay, currencyCode)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Alerts / Variances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3">
              <p
                className={cn(
                  "text-3xl font-semibold tracking-tight",
                  summary.alertsCount > 0 ? "text-amber-600" : "text-emerald-600",
                )}
              >
                {summary.alertsCount}
              </p>
              <p className="text-sm text-muted-foreground">
                {summary.variancePercent}% vs last cycle
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">
            Gross Pay Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {donutData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-muted-foreground">{item.name}</span>
                <span className="ml-auto font-medium text-foreground">
                  {summary.grossPay > 0
                    ? Math.round((item.value / summary.grossPay) * 1000) / 10
                    : 0}
                  %
                </span>
              </div>
            ))}
          </div>

          <PayrollDonutChart
            data={donutData}
            totalLabel={formatCurrency(summary.grossPay, currencyCode)}
          />
        </CardContent>
      </Card>
    </section>
  );
}
