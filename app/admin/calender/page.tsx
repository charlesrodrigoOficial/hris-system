import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { getCalendarEvents } from "@/lib/calender";
import CreateCalendarItemModal from "@/components/admin/calendar/create-calendar-item";
import { prisma } from "@/db/prisma";
import { isGoogleMeetUrl } from "@/lib/calender/functions/meeting-link";
import {
  ADMIN_CALENDAR_ROLES,
  buildEventsByDate,
  formatMonthParam,
  getCalendarGrid,
  getEventStyles,
  getLegendItems,
  getMonthLabel,
  getMonthRange,
  parseMonthParam,
  toDateKey,
  WEEK_DAYS,
} from "./functions";
import type { SearchParams } from "./types";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/sign-in");
  }

  if (!ADMIN_CALENDAR_ROLES.has(session.user.role as UserRole)) {
    redirect("/user");
  }

  const { month } = await searchParams;
  const currentMonth = parseMonthParam(month);
  const prevMonth = new Date(
    Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 1, 1),
  );
  const nextMonth = new Date(
    Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + 1, 1),
  );

  const { start, end } = getMonthRange(currentMonth);
  const visibleDays = getCalendarGrid(currentMonth);

  const events = await getCalendarEvents({
    start,
    end,
    viewer: {
      id: session.user.id,
      role: session.user.role as UserRole,
      departmentId: null,
      country: null,
    },
    filters: {
      includeAttendance: false,
    },
  });

  const eventsByDate = buildEventsByDate(events, visibleDays);
  const todayKey = toDateKey(new Date());
  const legendItems = getLegendItems();
  const [departments, users] = await Promise.all([
    prisma.department.findMany({
      select: {
        id: true,
        departmentName: true,
      },
      orderBy: {
        departmentName: "asc",
      },
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        name: true,
        departmentId: true,
      },
      orderBy: {
        fullName: "asc",
      },
    }),
  ]);

  const departmentOptions = departments.map((department) => ({
    id: department.id,
    name: department.departmentName,
  }));

  const userOptions = users.map((user) => ({
    id: user.id,
    name: user.fullName || user.name || user.id,
    departmentId: user.departmentId,
  }));
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 rounded-3xl border bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">HRIS Calendar</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Admin Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Company events, birthdays, approved leave, and upcoming planning
            items.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/calender?month=${formatMonthParam(prevMonth)}`}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Previous
          </Link>

          <div className="min-w-[180px] rounded-xl border bg-slate-50 px-4 py-2 text-center text-sm font-semibold text-slate-800">
            {getMonthLabel(currentMonth)}
          </div>

          <Link
            href={`/admin/calender?month=${formatMonthParam(nextMonth)}`}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Next
          </Link>

          <Link
            href={`/admin/calender?month=${formatMonthParam(new Date())}`}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Today
          </Link>

          <CreateCalendarItemModal
            departments={departmentOptions}
            users={userOptions}
            canCreateCompanyEvents={
              session.user.role === UserRole.SUPER_ADMIN ||
              session.user.role === UserRole.HR_MANAGER
            }
          />
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {legendItems.map((item) => (
            <div
              key={item.label}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-slate-700" 
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b bg-slate-50">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="border-r px-4 py-3 text-sm font-semibold text-slate-600 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {visibleDays.map((day, index) => {
            const key = toDateKey(day);
            const dayEvents = eventsByDate.get(key) ?? [];
            const isCurrentMonth =
              day.getUTCMonth() === currentMonth.getUTCMonth();
            const isToday = key === todayKey;

            return (
              <div
                key={`${key}-${index}`}
                className={[
                  "min-h-[160px] border-r border-b p-3 align-top",
                  index % 7 === 6 ? "border-r-0" : "",
                  !isCurrentMonth ? "bg-slate-50/70" : "bg-white",
                ].join(" ")}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={[
                      "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                      isToday
                        ? "bg-blue-600 text-white"
                        : isCurrentMonth
                          ? "text-slate-900"
                          : "text-slate-400",
                    ].join(" ")}
                  >
                    {day.getUTCDate()}
                  </span>

                  {dayEvents.length > 0 ? (
                    <span className="text-xs font-medium text-slate-400">
                      {dayEvents.length} item{dayEvents.length > 1 ? "s" : ""}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2">
                  {dayEvents.slice(0, 4).map((event) => {
                    const eventStyles = getEventStyles(event);

                    return (
                      <div
                        key={`${key}-${event.id}`}
                        className="rounded-xl border px-2.5 py-2 text-xs font-medium"
                        style={eventStyles}
                        title={event.title}
                      >
                        {event.meetLink && isGoogleMeetUrl(event.meetLink) ? (
                          <a
                            href={event.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate underline underline-offset-2 hover:opacity-80"
                          >
                            {event.title}
                          </a>
                        ) : (
                          <div className="truncate">{event.title}</div>
                        )}
                      </div>
                    );
                  })}

                  {dayEvents.length > 4 ? (
                    <div className="px-1 text-xs font-medium text-slate-500">
                      +{dayEvents.length - 4} more
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
