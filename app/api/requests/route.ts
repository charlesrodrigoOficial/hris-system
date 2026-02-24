import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.request.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const created = await prisma.request.create({
    data: {
      type: body.type,                 // SUPPORT | LEAVE | CLAIM
      title: body.title,
      description: body.description ?? null,
      status: "PENDING",
      userId: session.user.id,         // ✅ this links request to logged-in user

      // Optional (only if you added these columns in Prisma)
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      amount: body.amount ?? null,
      currency: body.currency ?? null,
    },
  });

  return NextResponse.json(created);
}