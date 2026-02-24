import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updated = await prisma.notification.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: { isRead: true },
  });

  return NextResponse.json(updated);
}
