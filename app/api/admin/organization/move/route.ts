import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

const payloadSchema = z.object({
  userId: z.string().uuid(),
  managerId: z.string().uuid().nullable(),
});

async function wouldCreateCycle(params: { userId: string; managerId: string }) {
  const { userId, managerId } = params;
  if (userId === managerId) return true;

  const seen = new Set<string>();
  let current: string | null = managerId;

  while (current) {
    if (current === userId) return true;
    if (seen.has(current)) return true;
    seen.add(current);

    const row: { managerId: string | null } | null = await prisma.user.findUnique({
      where: { id: current },
      select: { managerId: true },
    });

    current = row?.managerId ?? null;
  }

  return false;
}

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = ["SUPER_ADMIN", "HR_MANAGER"];
  if (!allowed.includes(String(user.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let parsed: z.infer<typeof payloadSchema>;
  try {
    parsed = payloadSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { id: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (parsed.managerId) {
    const managerExists = await prisma.user.findUnique({
      where: { id: parsed.managerId },
      select: { id: true },
    });

    if (!managerExists) {
      return NextResponse.json({ error: "Manager not found" }, { status: 400 });
    }

    const cycle = await wouldCreateCycle({
      userId: parsed.userId,
      managerId: parsed.managerId,
    });

    if (cycle) {
      return NextResponse.json(
        { error: "Invalid move: would create a cycle" },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: parsed.userId },
    data: { managerId: parsed.managerId },
    select: { id: true, managerId: true },
  });

  return NextResponse.json(updated);
}
