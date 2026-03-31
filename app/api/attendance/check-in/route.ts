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
    });

    // Block if special status already exists
    if (
      existing &&
      ["LEAVE", "HOLIDAY", "PUBLIC_HOLIDAY", "WEEKOFF"].includes(existing.status)
    ) {
      return NextResponse.json(
        { error: `Cannot check in. Status is ${existing.status}` },
        { status: 400 },
      );
    }

    // ✅ Block if already checked out
    if (existing?.checkOut) {
      return NextResponse.json(
        { error: "Already checked out today" },
        { status: 400 },
      );
    }

    // Block double check-in
    if (existing?.checkIn) {
      return NextResponse.json(
        { error: "Already checked in today" },
        { status: 400 },
      );
    }

    const attendance = await prisma.attendance.upsert({
      where: { userId_date: { userId, date } },
      create: {
        userId,
        date,
        checkIn: now,
        status: "PRESENT", // (or IN_PROGRESS if your enum supports it)
        workMode,
      },
      update: {
        checkIn: now,
        status: "PRESENT", // (or IN_PROGRESS if your enum supports it)
        workMode,
      },
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("Attendance check-in failed", error);
    return NextResponse.json(
      { error: "Check-in failed. Please try again." },
      { status: 500 },
    );
  }
}
