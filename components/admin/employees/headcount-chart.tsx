"use client"

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts"

type Props = {
  data: {
    role: string
    count: number
  }[]
}

type ChartRow = {
  name: string
  value: number
}

type AvatarLabelProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  value?: number
  payload?: ChartRow
}

function AvatarLabel({ x, y, width, height, value, payload }: AvatarLabelProps) {
  if (
    value === undefined ||
    value <= 0 ||
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined ||
    !payload
  ) {
    return null
  }

  if (height < 28) {
    return null
  }

  const cx = x + width / 2
  const cy = y + Math.min(24, Math.max(height / 2, 18))

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={16}
        fill="#f1f5f9"
        stroke="#ffffff"
        strokeWidth={2}
      />
      <circle cx={cx} cy={cy - 4.5} r={4.5} fill="#475569" />
      <path
        d={`
          M ${cx - 8} ${cy + 8}
          a 8 6.5 0 1 1 16 0
          Z
        `}
        fill="#475569"
      />
    </g>
  )
}

export default function HeadcountChart({ data }: Props) {
  const formattedData = data.map((item) => ({
    name: item.role.replaceAll("_", " "),
    value: item.count,
  }))

  const barGradients = [
    { id: "headcount-role-1", start: "#2563eb", end: "#60a5fa" },
    { id: "headcount-role-2", start: "#0891b2", end: "#67e8f9" },
    { id: "headcount-role-3", start: "#7c3aed", end: "#c4b5fd" },
    { id: "headcount-role-4", start: "#d97706", end: "#fcd34d" },
    { id: "headcount-role-5", start: "#16a34a", end: "#86efac" },
    { id: "headcount-role-6", start: "#db2777", end: "#f9a8d4" },
    { id: "headcount-role-7", start: "#ea580c", end: "#fdba74" },
  ]

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer>
        <BarChart data={formattedData}>
          <defs>
            {barGradients.map((gradient) => (
              <linearGradient
                key={gradient.id}
                id={gradient.id}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={gradient.start} />
                <stop offset="100%" stopColor={gradient.end} />
              </linearGradient>
            ))}
          </defs>

          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            tick={{ fill: "#000000" }}
            axisLine={{ stroke: "#94a3b8" }}
            tickLine={{ stroke: "#94a3b8" }}
          />

          <YAxis
            stroke="#94a3b8"
            tick={{ fill: "#cbd5e1" }}
            allowDecimals={false}
            axisLine={{ stroke: "#94a3b8" }}
            tickLine={{ stroke: "#94a3b8" }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#fff",
            }}
          />

          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
            isAnimationActive
            animationDuration={1100}
            animationEasing="ease-out"
          >
            <LabelList dataKey="value" content={<AvatarLabel />} />
            {formattedData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={`url(#${barGradients[index % barGradients.length].id})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
