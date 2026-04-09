import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";

const LONDON_TZ = "Europe/London";

function londonYMD(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LONDON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function ymdToUTCDate(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  //RBAC
  const role = user.role;
  const allowed = ["ADMIN", "HR", "MANAGER"];
  if (!allowed.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  // filters
  const status = searchParams.get("status") || "ALL";
  const q = searchParams.get("q") || "";
  const from = searchParams.get("from") || londonYMD();
  const to = searchParams.get("to") || londonYMD();

  // pagination
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "20");
  const skip = (page - 1) * pageSize;

  const fromDate = ymdToUTCDate(from);
  const toDateExclusive = ymdToUTCDate(to);
  toDateExclusive.setUTCDate(toDateExclusive.getUTCDate() + 1);

  //Manager scope (department-only)
  let managerDeptId: string | null = null;
  if (role === "MANAGER") {
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { departmentId: true },
    });
    managerDeptId = me?.departmentId ?? null;
    if (!managerDeptId) {
      return NextResponse.json(
        { error: "Manager department not set" },
        { status: 400 },
      );
    }
  }

  const where: any = {
    date: { gte: fromDate, lt: toDateExclusive },
    ...(status !== "ALL" ? { status } : {}),
    user: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(role === "MANAGER"
        ? { departmentId: managerDeptId }
        : {}),
    },
  };

  const [items, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
            employmentType: true,
          },
        },
      },
    }),
    prisma.attendance.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    from,
    to,
  });
}
