import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import RequestsPageClient from "@/components/shared/requests/requests-page-client";

export default async function RequestsPage(props: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await auth();
  const searchParams = await props.searchParams;

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [user, departmentsWithManagers] = await Promise.all([
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

  const mode = searchParams.mode;
  const leaveOnly = mode === "leave";
  const supportOnly = mode === "support";

  return (
    <RequestsPageClient
      requester={requester}
      initialType={leaveOnly ? "LEAVE" : "SUPPORT"}
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
