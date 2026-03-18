import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

const LONDON_TZ = "Europe/London";
const CRON_SECRET = process.env.CRON_SECRET!;

function londonYMD(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LONDON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function londonDateAsUTCDateFromYMD(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

function getYesterdayLondonYMD() {
  const todayYMD = londonYMD(new Date());
  const todayUTC = new Date(`${todayYMD}T00:00:00.000Z`);
  todayUTC.setUTCDate(todayUTC.getUTCDate() - 1);
  return londonYMD(todayUTC);
}

function isWeekend(ymd: string) {
  const dt = new Date(`${ymd}T00:00:00.000Z`);
  const day = dt.getUTCDay();
  return day === 0 || day === 6;
}

function hoursBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, ms / (1000 * 60 * 60));
}

function requiredHoursByType(type?: string | null) {
  return type === "PART_TIME" ? 4 : 8;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secretFromQuery = searchParams.get("secret");
  const dateOverride = searchParams.get("date");
  const authHeader = req.headers.get("authorization");

  if (
    !CRON_SECRET ||
    (authHeader !== `Bearer ${CRON_SECRET}` && secretFromQuery !== CRON_SECRET)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ymd = dateOverride ?? getYesterdayLondonYMD();

  if (isWeekend(ymd)) {
    return NextResponse.json({ ok: true, skipped: "WEEKOFF", date: ymd });
  }

  const date = londonDateAsUTCDateFromYMD(ymd);

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: {
      id: true,
      employmentType: true,
    },
  });

  const existing = await prisma.attendance.findMany({
    where: { date, userId: { in: employees.map((e) => e.id) } },
    select: { id: true, userId: true, checkIn: true, checkOut: true, status: true },
  });

  const byUser = new Map(existing.map((a) => [a.userId, a]));

  // 1) Create ABSENT for missing users
  const missing = employees.filter((e) => !byUser.has(e.id));

  if (missing.length) {
    await prisma.attendance.createMany({
      data: missing.map((e) => ({
        userId: e.id,
        date,
        status: "ABSENT",
      })),
      skipDuplicates: true,
    });
  }

  // 2) Update completed records with hours + policy
  const tx: any[] = [];

  for (const e of employees) {
    const row = byUser.get(e.id);
    if (!row) continue;
    if (!row.checkIn || !row.checkOut) continue;

    const worked = hoursBetween(new Date(row.checkIn), new Date(row.checkOut));
    const workedRounded = Math.round(worked * 100) / 100;

    const required = requiredHoursByType(e.employmentType);
    const status = workedRounded >= required ? "PRESENT" : "HALF_DAY";

    tx.push(
      prisma.attendance.update({
        where: { id: row.id },
        data: {
          workingHours: workedRounded,
          status,
        },
      })
    );
  }

  const updated = tx.length ? await prisma.$transaction(tx) : [];

  return NextResponse.json({
    ok: true,
    date: ymd,
    createdAbsent: missing.length,
    updated: updated.length,
  });
}
