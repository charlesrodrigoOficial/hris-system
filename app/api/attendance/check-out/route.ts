import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";

const DEFAULT_TZ = "Europe/London";

function ymdInTimeZone(timeZone: string, d = new Date()) {
  const fmt = (tz: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);

  try {
    return fmt(timeZone);
  } catch {
    return fmt(DEFAULT_TZ);
  }
}

function ymdAsUTCDate(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

function hoursBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, ms / (1000 * 60 * 60));
}

function requiredHoursByType(type?: string | null) {
  return type === "PART_TIME" ? 4 : 8; // FULL_TIME default
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const workMode = body?.workMode === "REMOTE" ? "REMOTE" : "OFFICE";
    const tz =
      typeof body?.timeZone === "string" && body.timeZone.trim()
        ? body.timeZone.trim()
        : DEFAULT_TZ;

    const ymd = ymdInTimeZone(tz);
    const date = ymdAsUTCDate(ymd);
    const now = new Date();

    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
      select: {
        id: true,
        status: true,
        checkIn: true,
        checkOut: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "No check-in found for today" },
        { status: 400 },
      );
    }

    // Block special statuses
    if (
      ["LEAVE", "HOLIDAY", "PUBLIC_HOLIDAY", "WEEKOFF"].includes(existing.status)
    ) {
      return NextResponse.json(
        { error: `Cannot check out. Status is ${existing.status}` },
        { status: 400 },
      );
    }

    if (!existing.checkIn) {
      return NextResponse.json(
        { error: "Cannot check out without a check-in" },
        { status: 400 },
      );
    }

    if (existing.checkOut) {
      return NextResponse.json(
        { error: "Already checked out today" },
        { status: 400 },
      );
    }

    // Get employment type to apply policy
    const employee = await prisma.user.findUnique({
      where: { id: userId },
      select: { employmentType: true },
    });

    const required = requiredHoursByType(employee?.employmentType);
    const worked = hoursBetween(new Date(existing.checkIn), now);
    const workedRounded = Math.round(worked * 100) / 100;

    // ✅ Policy enforcement
    const status = workedRounded >= required ? "PRESENT" : "HALF_DAY";

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: now,
        workingHours: workedRounded,
        status,
        workMode,
      },
    });

    return NextResponse.json({
      attendance,
      policy: {
        employmentType: employee?.employmentType ?? "FULL_TIME",
        requiredHours: required,
        workedHours: workedRounded,
      },
    });
  } catch (error) {
    console.error("Attendance check-out failed", error);
    return NextResponse.json(
      { error: "Check-out failed. Please try again." },
      { status: 500 },
    );
  }
}
