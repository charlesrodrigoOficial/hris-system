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

  // Create notification for the employee
  await prisma.notification.create({
    data: {
      userId: updated.userId,
      title: "Request Status Updated",
      message: `Your request "${updated.title}" is now ${updated.status}.`,
      href: "/user/requests",
    },
  });


  return NextResponse.json(updated);
}