import {
  AttendanceStatus,
  Country,
  Prisma,
  RequestStatus,
  RequestType,
} from "@prisma/client";

import { prisma } from "@/db/prisma";
import {
  CALENDAR_ATTENDANCE_STATUSES,
  endOfUtcDay,
  getBirthdayInYear,
  getScopedCalendarVisibility,
  getScopedUserIdsForRestrictedSources,
  overlaps,
  sortEvents,
  startOfUtcDay,
  toDate,
} from "@/lib/calender/functions/calendar-event.helpers";
import {
  CalendarAttendanceRow,
  CalendarEvent,
  GetCalendarEventsParams,
} from "@/lib/calender/types/calendar-event.types";

export async function getCalendarEvents({
  start,
  end,
  viewer,
  filters,
}: GetCalendarEventsParams): Promise<CalendarEvent[]> {
  const rangeStart = startOfUtcDay(toDate(start));
  const rangeEnd = endOfUtcDay(toDate(end));
  const includeAttendance = filters?.includeAttendance ?? false;

  const restrictedUserIds = await getScopedUserIdsForRestrictedSources(viewer);
  const scopedCalendarVisibility = getScopedCalendarVisibility(viewer);

  const calendarItemWhere: Prisma.CalendarItemWhereInput = {
    AND: [
      {
        startDate: { lte: rangeEnd },
      },
      {
        endDate: { gte: rangeStart },
      },
      ...(scopedCalendarVisibility ? [scopedCalendarVisibility] : []),
      ...(filters?.userId ? [{ userId: filters.userId }] : []),
      ...(filters?.departmentId
        ? [{ departmentId: filters.departmentId }]
        : []),
      ...(filters?.country ? [{ country: filters.country }] : []),
    ],
  };

  const birthdayUserWhere: Prisma.UserWhereInput = {
    isActive: true,
    dateOfBirth: { not: null },
    ...(filters?.userId ? { id: filters.userId } : {}),
    ...(filters?.departmentId ? { departmentId: filters.departmentId } : {}),
    ...(filters?.country ? { country: filters.country } : {}),
  };

  const leaveWhere: Prisma.RequestWhereInput = {
    type: RequestType.LEAVE,
    status: RequestStatus.APPROVED,
    startDate: { not: null, lte: rangeEnd },
    endDate: { not: null, gte: rangeStart },
    ...(filters?.userId ? { userId: filters.userId } : {}),
    ...(restrictedUserIds ? { userId: { in: restrictedUserIds } } : {}),
    user: {
      ...(filters?.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters?.country ? { country: filters.country } : {}),
    },
  };

  const attendanceWhere: Prisma.AttendanceWhereInput = {
    date: {
      gte: rangeStart,
      lte: rangeEnd,
    },
    ...(filters?.userId ? { userId: filters.userId } : {}),
    ...(restrictedUserIds ? { userId: { in: restrictedUserIds } } : {}),
    user: {
      ...(filters?.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters?.country ? { country: filters.country } : {}),
    },
  };

  const [calendarItems, birthdayUsers, leaveRequests, attendanceRows] =
    await Promise.all([
      prisma.calendarItem.findMany({
        where: calendarItemWhere,
        select: {
          id: true,
          title: true,
          description: true,
          meetLink: true,
          type: true,
          startDate: true,
          endDate: true,
          allDay: true,
          color: true,
          country: true,
          userId: true,
          departmentId: true,
        },
        orderBy: [{ startDate: "asc" }],
      }),
      prisma.user.findMany({
        where: birthdayUserWhere,
        select: {
          id: true,
          name: true,
          fullName: true,
          dateOfBirth: true,
          departmentId: true,
          country: true,
        },
      }),
      prisma.request.findMany({
        where: leaveWhere,
        select: {
          id: true,
          title: true,
          description: true,
          leaveType: true,
          startDate: true,
          endDate: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              fullName: true,
              departmentId: true,
              country: true,
            },
          },
        },
        orderBy: [{ startDate: "asc" }],
      }),
      includeAttendance
        ? prisma.attendance.findMany({
            where: attendanceWhere,
            select: {
              id: true,
              date: true,
              status: true,
              workMode: true,
              checkIn: true,
              checkOut: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  fullName: true,
                  departmentId: true,
                  country: true,
                },
              },
            },
            orderBy: [{ date: "asc" }],
          })
        : Promise.resolve([]),
    ]);

  const manualEvents: CalendarEvent[] = calendarItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    meetLink: item.meetLink,
    type: item.type,
    source: "calendar_item",
    start: item.startDate.toISOString(),
    end: item.endDate.toISOString(),
    allDay: item.allDay,
    color: item.color,
    userId: item.userId,
    departmentId: item.departmentId,
    country: item.country,
  }));

  const birthdayEvents: CalendarEvent[] = [];
  const startYear = rangeStart.getUTCFullYear();
  const endYear = rangeEnd.getUTCFullYear();

  for (const user of birthdayUsers) {
    if (!user.dateOfBirth) {
      continue;
    }

    for (let year = startYear; year <= endYear; year += 1) {
      const birthday = getBirthdayInYear(user.dateOfBirth, year);
      const birthdayEnd = endOfUtcDay(birthday);

      if (!overlaps(rangeStart, rangeEnd, birthday, birthdayEnd)) {
        continue;
      }

      const displayName = user.fullName || user.name || "Employee";

      birthdayEvents.push({
        id: `birthday-${user.id}-${year}`,
        title: `${displayName}'s Birthday`,
        description: null,
        type: "BIRTHDAY",
        source: "birthday",
        start: birthday.toISOString(),
        end: birthdayEnd.toISOString(),
        allDay: true,
        color: "#ec4899",
        userId: user.id,
        departmentId: user.departmentId,
        country: user.country,
        meta: {
          birthYear: user.dateOfBirth.getUTCFullYear(),
        },
      });
    }
  }

  const leaveEvents: CalendarEvent[] = leaveRequests
    .filter((request) => request.startDate && request.endDate)
    .map((request) => {
      const displayName =
        request.user.fullName || request.user.name || "Employee";

      return {
        id: `leave-${request.id}`,
        title: `${displayName} - Leave`,
        description: request.description,
        type: "LEAVE",
        source: "leave",
        start: request.startDate!.toISOString(),
        end: request.endDate!.toISOString(),
        allDay: true,
        color: "#eab308",
        userId: request.userId,
        departmentId: request.user.departmentId,
        country: request.user.country,
        meta: {
          leaveType: request.leaveType,
          requestTitle: request.title,
        },
      } satisfies CalendarEvent;
    });

  const attendanceEvents: CalendarEvent[] = (attendanceRows as CalendarAttendanceRow[])
    .filter((row) => CALENDAR_ATTENDANCE_STATUSES.includes(row.status))
    .map((row) => {
      const displayName = row.user.fullName || row.user.name || "Employee";
      const dayStart = startOfUtcDay(row.date);
      const dayEnd = endOfUtcDay(row.date);

      return {
        id: `attendance-${row.id}`,
        title: `${displayName} - ${row.status.replaceAll("_", " ")}`,
        description: null,
        type: "ATTENDANCE",
        source: "attendance",
        start: dayStart.toISOString(),
        end: dayEnd.toISOString(),
        allDay: true,
        color:
          row.status === AttendanceStatus.ABSENT
            ? "#ef4444"
            : row.status === AttendanceStatus.HALF_DAY
              ? "#f97316"
              : "#3b82f6",
        userId: row.userId,
        departmentId: row.user.departmentId,
        country: row.user.country,
        meta: {
          status: row.status,
          workMode: row.workMode,
          checkIn: row.checkIn?.toISOString() ?? null,
          checkOut: row.checkOut?.toISOString() ?? null,
        },
      } satisfies CalendarEvent;
    });

  return sortEvents([
    ...manualEvents,
    ...birthdayEvents,
    ...leaveEvents,
    ...attendanceEvents,
  ]);
}
