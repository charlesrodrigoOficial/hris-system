import { prisma } from "@/db/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditDepartmentForm from "./edit-department-form";
import { requireAdminPermission } from "@/lib/auth/guards";

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPermission("departments:manage");
  const { id } = await params;

  const department = await prisma.department.findUnique({
    where: { id },
    select: {
      id: true,
      departmentName: true,
      createdAt: true,
      depManagerId: true,
    },
  });

  if (!department) return notFound();

  const employees = await prisma.user.findMany({
    where: {
      role: {
        in: [
          "EMPLOYEE",
          "HR_MANAGER",
          "PAYROLL_MANAGER",
          "SUPER_ADMIN",
        ],
      },
    },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      name: true,
      email: true,
    },
  });

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Edit Department</CardTitle>
      </CardHeader>
      <CardContent>
        <EditDepartmentForm department={department} employees={employees} />
      </CardContent>
    </Card>
  );
}
