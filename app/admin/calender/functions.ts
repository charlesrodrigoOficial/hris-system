import { UserRole } from "@prisma/client";

import { type CalendarEvent } from "@/lib/calender";

import type { EventStyle, LegendItem } from "./types";

export const ADMIN_CALENDAR_ROLES = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.HR,
  UserRole.MANAGER,
]);

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatMonthParam(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

export function parseMonthParam(month?: string) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthIndex - 1, 1));
}

export function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

export function endOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

export function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function getMonthRange(monthDate: Date) {
  const start = new Date(
    Date.UTC(
      monthDate.getUTCFullYear(),
      monthDate.getUTCMonth(),
      1,
      0,
      0,
      0,
      0,
    ),
  );

  const end = new Date(
    Date.UTC(
      monthDate.getUTCFullYear(),
      monthDate.getUTCMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    ),
  );

  return { start, end };
}

export function getCalendarGridStart(monthStart: Date) {
  const day = monthStart.getUTCDay();
  const mondayBasedOffset = day === 0 ? 6 : day - 1;
  return addUtcDays(monthStart, -mondayBasedOffset);
}

export function getCalendarGrid(monthDate: Date) {
  const monthStart = new Date(
    Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1),
  );
  const gridStart = getCalendarGridStart(monthStart);

  return Array.from({ length: 42 }, (_, index) => addUtcDays(gridStart, index));
}

export function toDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

export function buildEventsByDate(events: CalendarEvent[], visibleDays: Date[]) {
  const visibleKeys = new Set(visibleDays.map(toDateKey));
  const map = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    let current = startOfUtcDay(new Date(event.start));
    const end = endOfUtcDay(new Date(event.end));

    while (current <= end) {
      const key = toDateKey(current);

      if (visibleKeys.has(key)) {
        const existing = map.get(key) ?? [];
        existing.push(event);
        map.set(key, existing);
      }

      current = addUtcDays(current, 1);
    }
  }

  for (const [key, value] of map.entries()) {
    value.sort((a, b) => {
      if (a.type === "BIRTHDAY" && b.type !== "BIRTHDAY") {
        return -1;
      }

      if (a.type !== "BIRTHDAY" && b.type === "BIRTHDAY") {
        return 1;
      }

      return a.title.localeCompare(b.title);
    });

    map.set(key, value);
  }

  return map;
}

export function getEventStyles(event: CalendarEvent): EventStyle {
  if (event.color) {
    return {
      backgroundColor: `${event.color}20`,
      borderColor: event.color,
      color: event.color,
    };
  }

  switch (event.type) {
    case "BIRTHDAY":
      return {
        backgroundColor: "#ec489920",
        borderColor: "#ec4899",
        color: "#be185d",
      };
    case "LEAVE":
      return {
        backgroundColor: "#eab30820",
        borderColor: "#eab308",
        color: "#a16207",
      };
    case "MEETING":
      return {
        backgroundColor: "#8b5cf620",
        borderColor: "#8b5cf6",
        color: "#6d28d9",
      };
    case "PAYROLL":
      return {
        backgroundColor: "#22c55e20",
        borderColor: "#22c55e",
        color: "#15803d",
      };
    case "HOLIDAY":
      return {
        backgroundColor: "#3b82f620",
        borderColor: "#3b82f6",
        color: "#1d4ed8",
      };
    case "ATTENDANCE":
      return {
        backgroundColor: "#ef444420",
        borderColor: "#ef4444",
        color: "#b91c1c",
      };
    default:
      return {
        backgroundColor: "#64748b20",
        borderColor: "#94a3b8",
        color: "#334155",
      };
  }
}

export function getLegendItems(): LegendItem[] {
  return [
    { label: "Birthday", color: "#ec4899" },
    { label: "Leave", color: "#eab308" },
    { label: "Holiday", color: "#3b82f6" },
    { label: "Meeting", color: "#8b5cf6" },
    { label: "Payroll", color: "#22c55e" },
    { label: "Other", color: "#94a3b8" },
  ];
}
