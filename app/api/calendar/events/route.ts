import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { getCalendarEvents } from "@/lib/calender";

function parseMonthParam(month: string | null) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthIndex - 1, 1));
}

function getMonthRange(monthDate: Date) {
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

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      departmentId: true,
      country: true,
    },
  });

  if (!viewer) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const month = request.nextUrl.searchParams.get("month");
  const monthDate = parseMonthParam(month);
  const { start, end } = getMonthRange(monthDate);

  const events = await getCalendarEvents({
    start,
    end,
    viewer: {
      id: viewer.id,
      role: viewer.role,
      departmentId: viewer.departmentId,
      country: viewer.country,
    },
    filters: {
      includeAttendance: false,
    },
  });

  const calendarItems = events.filter((event) => event.source === "calendar_item");

  return NextResponse.json(
    { events: calendarItems },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
