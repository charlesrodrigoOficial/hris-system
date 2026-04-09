import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = ["ADMIN", "HR"];
  if (!allowed.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await prisma.request.findMany({
    include: {
      attachments: {
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          attachmentType: true,
        },
      },
      managerEmployee: {
        select: {
          id: true,
          fullName: true,
        },
      },
      user: {
        select: {
          name: true,
          fullName: true,
          email: true,
          position: true,
          department: {
            select: {
              departmentName: true,
            },
          },
        },
      },
      activities: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  
  return NextResponse.json(requests);
}
