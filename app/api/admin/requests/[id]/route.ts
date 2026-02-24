import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  const updated = await prisma.request.update({
    where: { id: params.id },
    data: {
      status: body.status,
    },
  });

  return NextResponse.json(updated);
}