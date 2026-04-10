import {
  AttendanceStatus,
  CalendarVisibility,
  Prisma,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/db/prisma";
import { CalendarEvent, Viewer } from "@/lib/calender/types/calendar-event.types";

const ADMIN_LIKE_ROLES = new Set<UserRole>([
  "SUPER_ADMIN",
  "HR_MANAGER",
]);

export const CALENDAR_ATTENDANCE_STATUSES: AttendanceStatus[] = [
  AttendanceStatus.ABSENT,
  AttendanceStatus.HALF_DAY,
  AttendanceStatus.LEAVE,
  AttendanceStatus.HOLIDAY,
  AttendanceStatus.PUBLIC_HOLIDAY,
];

export function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
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

export function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function getBirthdayInYear(dateOfBirth: Date, year: number) {
  const month = dateOfBirth.getUTCMonth();
  const day = dateOfBirth.getUTCDate();

  if (month === 1 && day === 29 && !isLeapYear(year)) {
    return new Date(Date.UTC(year, 1, 28, 0, 0, 0, 0));
  }

  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

export function overlaps(
  rangeStart: Date,
  rangeEnd: Date,
  itemStart: Date,
  itemEnd: Date,
) {
  return itemStart <= rangeEnd && itemEnd >= rangeStart;
}

export function sortEvents(events: CalendarEvent[]) {
  return events.sort((a, b) => {
    const aTime = new Date(a.start).getTime();
    const bTime = new Date(b.start).getTime();

    if (aTime !== bTime) {
      return aTime - bTime;
    }

    return a.title.localeCompare(b.title);
  });
}

export async function getManagerScopeUserIds(viewerId: string) {
  const reports = await prisma.user.findMany({
    where: {
      OR: [{ managerId: viewerId }, { secondLevelManagerId: viewerId }],
    },
    select: { id: true },
  });

  return Array.from(new Set([viewerId, ...reports.map((user) => user.id)]));
}

export function getScopedCalendarVisibility(
  viewer: Viewer,
): Prisma.CalendarItemWhereInput | undefined {
  if (ADMIN_LIKE_ROLES.has(viewer.role)) {
    return undefined;
  }

  const orConditions: Prisma.CalendarItemWhereInput[] = [
    {
      visibility: CalendarVisibility.COMPANY,
    },
    {
      visibility: CalendarVisibility.PERSONAL,
      userId: viewer.id,
    },
  ];

  if (viewer.departmentId) {
    orConditions.push({
      visibility: CalendarVisibility.DEPARTMENT,
      departmentId: viewer.departmentId,
    });
  }

  return {
    OR: orConditions,
  };
}

export async function getScopedUserIdsForRestrictedSources(viewer: Viewer) {
  if (ADMIN_LIKE_ROLES.has(viewer.role)) {
    return null;
  }

  return [viewer.id];
}
