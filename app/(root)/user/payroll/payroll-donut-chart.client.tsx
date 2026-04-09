"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type DonutDatum = {
  name: string;
  value: number;
  color: string;
};

function formatPercent(value: number, total: number) {
  if (!Number.isFinite(total) || total <= 0) return "0%";
  return `${Math.round((value / total) * 1000) / 10}%`;
}

export default function PayrollDonutChart({
  data,
  totalLabel,
}: {
  data: DonutDatum[];
  totalLabel: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="relative h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            formatter={(v: unknown, name: unknown) => {
              const value = typeof v === "number" ? v : Number(v);
              const label = typeof name === "string" ? name : String(name);
              return [`${formatPercent(value, total)}`, label];
            }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={90}
            paddingAngle={2}
            stroke="transparent"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Gross pay</p>
          <p className="text-lg font-semibold tracking-tight text-foreground">
            {totalLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

