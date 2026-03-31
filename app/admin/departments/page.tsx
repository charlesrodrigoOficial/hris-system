import Link from "next/link";
import { prisma } from "@/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteDepartment } from "@/lib/actions/department.actions";
import DeleteDialog from "@/components/shared/delete-dialog";
import DepartmentUsersDropdown from "./department-users-dropdown";

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({
    include: {
      depManager: {
        select: {
          fullName: true,
          name: true,
          email: true,
        },
      },
      employees: {
        select: {
          id: true,
          image: true,
          firstName: true,
          fullName: true,
          name: true,
          email: true,
          country: true,
        },
        orderBy: [{ fullName: "asc" }, { name: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Departments</CardTitle>
        <Link href="/admin/departments/new">
          <Button>Add Department</Button>
        </Link>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department Name</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Department Manager</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {departments.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <DepartmentUsersDropdown
                    departmentId={item.id}
                    departmentName={item.departmentName}
                    users={item.employees.map((u) => ({
                      id: u.id,
                      image: u.image ?? null,
                      firstName: u.firstName ?? null,
                      fullName: u.fullName ?? null,
                      name: u.name ?? null,
                      email: u.email,
                      country: u.country ? String(u.country) : null,
                    }))}
                  />
                </TableCell>
                <TableCell>
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {item.depManager
                    ? item.depManager.fullName ??
                      item.depManager.name ??
                      item.depManager.email
                    : "No manager assigned"}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Link href={`/admin/departments/${item.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <DeleteDialog id={item.id} action={deleteDepartment} />
                </TableCell>
              </TableRow>
            ))}

            {departments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No departments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
