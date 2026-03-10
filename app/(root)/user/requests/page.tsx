import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import RequestsPageClient from "@/components/shared/requests/requests-page-client";

export default async function RequestsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [user, employee, departmentsWithManagers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
      },
    }),
    prisma.employee.findUnique({
      where: { userId: session.user.id },
      select: {
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
          },
        },
      },
    }),
  ]);

  const requester = {
    fullName: employee?.fullName ?? user?.name ?? "Employee",
    email: employee?.email ?? user?.email ?? "",
    position: employee?.position
      ? formatEnumLabel(employee.position)
      : "Not assigned",
    currency: employee?.currency ?? "GBP",
    managers: departmentsWithManagers.flatMap((department) =>
      department.depManager
        ? [
            {
              id: department.depManager.id,
              name: `${department.depManager.fullName} (${department.departmentName})`,
            },
          ]
        : [],
    ),
  };

  return <RequestsPageClient requester={requester} />;
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
