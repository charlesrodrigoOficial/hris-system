import { getAttendanceAlerts } from "@/lib/attendance/getAttendanceAlert";
import { getTodayWorkforce } from "@/lib/attendance/getTodayWorkForce";
import { prisma } from "@/db/prisma";

export type Role = "ADMIN" | "HR" | "MANAGER" | "FINANCE" | "EMPLOYEE";

export type AttendanceRow = {
  id: string;
  name: string;
  role: Role;
  country: string;
  checkInAt?: string;
  checkOutAt?: string;
  workingHours: number;
};

export type NotActiveRow = {
  id: string;
  name: string;
  role: Role;
  country: string;
  reason: "On Leave" | "Public Holiday" | "No Check-in";
  leaveNote?: string;
};

export function formatHours(hours: number) {
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded}h`;
}

export function roleBadgeVariant(role: Role) {
  return "outline" as const;
}

export function roleBadgeClass(role: Role) {
  switch (role) {
    case "ADMIN":
      return "border-red-200 bg-red-100 text-red-800 hover:bg-red-100";
    case "HR":
      return "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-100";
    case "MANAGER":
      return "border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100";
    case "FINANCE":
      return "border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
    case "EMPLOYEE":
    default:
      return "border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100";
  }
}

export function reasonBadgeClass(reason: NotActiveRow["reason"]) {
  switch (reason) {
    case "On Leave":
      return "bg-yellow-100 text-yellow-900 hover:bg-yellow-100";
    case "Public Holiday":
      return "bg-blue-100 text-blue-900 hover:bg-blue-100";
    case "No Check-in":
    default:
      return "bg-red-100 text-red-900 hover:bg-red-100";
  }
}

export function kpiValue(n: number) {
  return n.toLocaleString();
}

export function getCountryFlagClass(country: string) {
  const flags: Record<string, string> = {
    UNITED_KINGDOM: "gb",
    PAKISTAN: "pk",
    MALAYSIA: "my",
    INDIA: "in",
    SRI_LANKA: "lk",
    BANGLADESH: "bd",
    USA: "us",
    CANADA: "ca",
    AUSTRALIA: "au",
  };

  const code = flags[country];

  return code ? `fi fi-${code}` : "";
}

export function formatCountryName(country: string) {
  if (!country || country === "-") {
    return "-";
  }

  return country
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getOverviewPageData() {
  const data = await getTodayWorkforce();

  const onlineToday: AttendanceRow[] = data.rows
    .filter((row) => row.isOnline)
    .map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role as Role,
      country: row.country ?? "-",
      checkInAt: row.checkIn ?? "-",
      checkOutAt: row.checkOut ?? undefined,
      workingHours: row.workingHours ?? 0,
    }));

  const notActiveToday: NotActiveRow[] = data.rows
    .filter((row) => !row.isOnline)
    .map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role as Role,
      country: row.country ?? "-",
      reason: "No Check-in",
      leaveNote: undefined,
    }));

  const alerts = await getAttendanceAlerts({
    windowDays: 7,
    minMissingDays: 2,
  });

  const pendingRequestCount = await prisma.request.count({
    where: { status: { in: ["PENDING", "PROCESSING"] } },
  });

  return {
    onlineToday,
    notActiveToday,
    alerts,
    onlineCount: data.onlineCount,
    notActiveCount: data.notActiveCount,
    alertCount: alerts.length,
    pendingRequestCount,
  };
}
