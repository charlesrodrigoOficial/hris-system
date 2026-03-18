import { prisma } from "@/db/prisma";
import { notFound } from "next/navigation";
import { updateDepartment } from "@/lib/actions/department.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
        in: ["EMPLOYEE", "MANAGER", "HR", "ADMIN"],
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
        <form action={updateDepartment} className="space-y-4">
          <input type="hidden" name="id" value={department.id} />

          <div className="space-y-2">
            <label className="text-sm font-medium">Department Name</label>
            <Input
              name="departmentName"
              defaultValue={department.departmentName}
              placeholder="Enter department name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Department Manager</label>
            <select
              name="depManagerId"
              defaultValue={department.depManagerId ?? ""}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">No manager assigned</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName ?? employee.name ?? employee.email}{" "}
                  {employee.email ? `- ${employee.email}` : ""}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit">Save changes</Button>
        </form>
      </CardContent>
    </Card>
  );
}
