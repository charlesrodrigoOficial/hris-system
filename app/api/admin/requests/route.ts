import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET() {
  const requests = await prisma.request.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  
  return NextResponse.json(requests);
}
