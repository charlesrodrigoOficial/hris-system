import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.attendance.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      date: true,
      checkIn: true,
      checkOut: true,
      workingHours: true,
      status: true,
      workMode: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    items,
    total: items.length,
  });
}
