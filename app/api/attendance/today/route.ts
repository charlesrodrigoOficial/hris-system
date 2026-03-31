import { NextResponse } from "next/server"
import { prisma } from "@/db/prisma"
import { auth } from "@/auth"

const DEFAULT_TZ = "Europe/London"

function ymdInTimeZone(timeZone: string, d = new Date()) {
  const fmt = (tz: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d)

  try {
    return fmt(timeZone)
  } catch {
    return fmt(DEFAULT_TZ)
  }
}

function ymdAsUTCDate(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`)
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tzParam = new URL(req.url).searchParams.get("tz")
    const tz = tzParam && tzParam.trim() ? tzParam.trim() : DEFAULT_TZ
    const date = ymdAsUTCDate(ymdInTimeZone(tz))

    const attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    })

    // frontend can decide what to show
    return NextResponse.json({ attendance })
  } catch (error) {
    console.error("Failed to load today's attendance", error)
    return NextResponse.json(
      { error: "Failed to load attendance. Please try again." },
      { status: 500 },
    )
  }
}
