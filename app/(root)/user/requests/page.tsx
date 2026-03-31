import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import RequestsPageClient from "@/components/shared/requests/requests-page-client";

export default async function RequestsPage(props: {
  searchParams: Promise<{ mode?: string; focus?: string }>;
}) {
  const session = await auth();
  const searchParams = await props.searchParams;

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const mode = searchParams.mode;
  const focusRequestId = searchParams.focus;
  const leaveOnly = mode === "leave";
  const supportOnly = mode === "support";

  const [user, departmentsWithManagers, leaveRequests] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        fullName: true,
        email: true,
        currency: true,
        position: true,
      },
    }),
    prisma.department.findMany({
      where: {
        depManagerId: {
          not: null,
        },
      },
      orderBy: {
        departmentName: "asc",
      },
      select: {
        departmentName: true,
        depManager: {
          select: {
            id: true,
            fullName: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    leaveOnly
      ? prisma.request.findMany({
          where: {
            userId: session.user.id,
            type: "LEAVE",
          },
          select: {
            status: true,
            startDate: true,
            endDate: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const requester = {
    fullName: user?.fullName ?? user?.name ?? "Employee",
    email: user?.email ?? "",
    position: user?.position
      ? formatEnumLabel(user.position)
      : "Not assigned",
    currency: user?.currency ?? "GBP",
    managers: departmentsWithManagers.flatMap((department) =>
      department.depManager
        ? [
            {
              id: department.depManager.id,
              name: `${department.depManager.fullName ?? department.depManager.name ?? department.depManager.email} (${department.departmentName})`,
            },
          ]
        : [],
    ),
  };

  const annualAllowanceDays = 24;
  const approvedDays = leaveRequests
    .filter((request) => request.status === "APPROVED")
    .reduce((sum, request) => {
      return sum + countWeekdaysInclusive(request.startDate, request.endDate);
    }, 0);
  const pendingDays = leaveRequests
    .filter(
      (request) =>
        request.status === "PENDING" || request.status === "PROCESSING",
    )
    .reduce((sum, request) => {
      return sum + countWeekdaysInclusive(request.startDate, request.endDate);
    }, 0);

  const timeOffSummary = leaveOnly
    ? {
        annualAllowanceDays,
        approvedDays,
        pendingDays,
        remainingDays: Math.max(annualAllowanceDays - approvedDays, 0),
        recordCount: leaveRequests.length,
      }
    : null;

  return (
    <RequestsPageClient
      requester={requester}
      initialType={leaveOnly ? "LEAVE" : "SUPPORT"}
      timeOffSummary={timeOffSummary}
      focusRequestId={focusRequestId}
      allowedTypes={
        leaveOnly
          ? ["LEAVE"]
          : supportOnly
            ? ["SUPPORT", "CLAIM"]
            : ["SUPPORT", "LEAVE", "CLAIM"]
      }
    />
  );
}

function formatEnumLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed.includes("_")) return trimmed;

  return trimmed
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function countWeekdaysInclusive(
  startDate: Date | null,
  endDate: Date | null,
) {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  if (end < start) return 0;

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6) {
      count += 1;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
}
