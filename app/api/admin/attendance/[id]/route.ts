import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";

const ALLOWED_ROLES = ["SUPER_ADMIN", "HR_MANAGER"];
const BLOCKED_STATUSES = new Set(["LEAVE", "HOLIDAY", "PUBLIC_HOLIDAY", "WEEKOFF"]);

function requiredHoursByType(type?: string | null) {
  return type === "PART_TIME" ? 4 : 8;
}

function roundToTwo(num: number) {
  return Math.round(num * 100) / 100;
}

function parseDateInput(value: unknown) {
  if (value === null || value === "") {
    return { ok: true as const, value: null as Date | null };
  }

  if (typeof value !== "string") {
    return { ok: false as const, value: null as Date | null };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false as const, value: null as Date | null };
  }

  return { ok: true as const, value: parsed };
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = (await req.json().catch(() => null)) as
      | { checkIn?: unknown; checkOut?: unknown }
      | null;

    const hasCheckIn = Boolean(body && "checkIn" in body);
    const hasCheckOut = Boolean(body && "checkOut" in body);

    if (!hasCheckIn && !hasCheckOut) {
      return NextResponse.json(
        { error: "Provide checkIn or checkOut to update attendance." },
        { status: 400 },
      );
    }

    const existing = await prisma.attendance.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        checkIn: true,
        checkOut: true,
        user: {
          select: {
            employmentType: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Attendance record not found." }, { status: 404 });
    }

    const parsedCheckIn = hasCheckIn ? parseDateInput(body?.checkIn) : null;
    const parsedCheckOut = hasCheckOut ? parseDateInput(body?.checkOut) : null;

    if ((parsedCheckIn && !parsedCheckIn.ok) || (parsedCheckOut && !parsedCheckOut.ok)) {
      return NextResponse.json(
        { error: "Invalid check-in or check-out datetime value." },
        { status: 400 },
      );
    }

    const nextCheckIn = hasCheckIn ? parsedCheckIn!.value : existing.checkIn;
    const nextCheckOut = hasCheckOut ? parsedCheckOut!.value : existing.checkOut;

    if (nextCheckOut && !nextCheckIn) {
      return NextResponse.json(
        { error: "Cannot set check-out without check-in." },
        { status: 400 },
      );
    }

    if (nextCheckIn && nextCheckOut && nextCheckOut <= nextCheckIn) {
      return NextResponse.json(
        { error: "Check-out time must be later than check-in time." },
        { status: 400 },
      );
    }

    let nextStatus = existing.status;
    let nextWorkingHours: number | null = null;

    if (nextCheckIn && nextCheckOut) {
      const ms = nextCheckOut.getTime() - nextCheckIn.getTime();
      const hours = roundToTwo(Math.max(0, ms / (1000 * 60 * 60)));
      const requiredHours = requiredHoursByType(existing.user.employmentType);
      nextWorkingHours = hours;
      nextStatus = hours >= requiredHours ? "PRESENT" : "HALF_DAY";
    } else if (nextCheckIn && !nextCheckOut) {
      nextWorkingHours = null;
      nextStatus = "PRESENT";
    } else if (!nextCheckIn && !nextCheckOut) {
      nextWorkingHours = null;
      nextStatus = BLOCKED_STATUSES.has(existing.status) ? existing.status : "ABSENT";
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
        workingHours: nextWorkingHours,
        status: nextStatus,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
            employmentType: true,
          },
        },
      },
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("Failed to update attendance record", error);
    return NextResponse.json(
      { error: "Failed to update attendance record." },
      { status: 500 },
    );
  }
}
