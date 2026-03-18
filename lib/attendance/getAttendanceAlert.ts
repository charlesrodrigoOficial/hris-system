import { prisma } from "@/db/prisma";
import { AttendanceStatus } from "@prisma/client";

export type AttendanceAlertRow = {
  id: string;
  name: string;
  role: string;
  country: string;
  lastActivity: string;
  daysMissing: number;
};

function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getAttendanceAlerts(options?: {
  windowDays?: number;
  minMissingDays?: number;
}) {
  const windowDays = options?.windowDays ?? 7;
  const minMissingDays = options?.minMissingDays ?? 2;

  const today = startOfDayLocal(new Date());
  const from = new Date(today);
  from.setDate(from.getDate() - windowDays);

  const employees = await prisma.user.findMany({
    where: { isActive: true, role: "EMPLOYEE" },
    select: {
      id: true,
      fullName: true,
      name: true,
      role: true,
      country: true,
      attendances: {
        where: {
          OR: [
            { checkIn: { not: null } },
            {
              status: {
                in: [AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY],
              },
            },
          ],
        },
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      },
      _count: {
        select: {
          attendances: {
            where: {
              date: { gte: from, lt: today },
              status: AttendanceStatus.ABSENT,
            },
          },
        },
      },
    },
  });

  const alerts: AttendanceAlertRow[] = employees
    .map((employee) => {
      const last = employee.attendances[0]?.date ?? null;
      const missing = employee._count.attendances ?? 0;

      if (missing < minMissingDays) return null;

      return {
        id: employee.id,
        name: employee.fullName ?? employee.name ?? "Employee",
        role: employee.role,
        country: employee.country ?? "-",
        lastActivity: last ? new Date(last).toISOString().slice(0, 10) : "Never",
        daysMissing: missing,
      };
    })
    .filter(Boolean) as AttendanceAlertRow[];

  alerts.sort((a, b) => b.daysMissing - a.daysMissing);
  return alerts;
}
