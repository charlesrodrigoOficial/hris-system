import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ensureEmployeeAndRedirect, toggleEmployeeStatus } from "@/lib/actions/employee.actions";

type EmployeeRow = {
  id: string; // row key (employeeId or userId)
  userId: string; // ✅ ALWAYS userId

  fullName: string;
  email: string;
  phoneNo: string | null; // keep string

  employmentType?: string;
  isActive?: boolean;
  contractEndDate?: Date | null;

  user?: { name: string | null; email: string; role: string } | null;
  department?: { departmentName: string } | null;
  branch?: { branchName: string } | null;
  position?: string | null;
  shift?: { name: string } | null;
};

type Props = {
  employees: EmployeeRow[];
  title?: string;
};

function labelEnum(value?: string) {
  if (!value) return "—";
  return value.replaceAll("_", " ");
}

function formatDate(d?: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(d));
}

export default function EmployeeTable({ employees, title = "Employees" }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>

        {/* <Button asChild>
          <Link href="/admin/employees/new">Add Employee</Link>
        </Button> */}
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Employment Type</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contract End</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {employees.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{e.fullName}</span>
                    <span className="text-xs text-muted-foreground">
                      {e.user?.email ?? e.email}
                    </span>
                  </div>
                </TableCell>

                <TableCell>{e.user?.role ?? "—"}</TableCell>
                <TableCell>{labelEnum(e.employmentType)}</TableCell>

                <TableCell>{e.department?.departmentName ?? "—"}</TableCell>
                <TableCell>{e.branch?.branchName ?? "—"}</TableCell>

                <TableCell>
                  {e.isActive ? (
                    <Badge variant="secondary">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </TableCell>

                <TableCell>{formatDate(e.contractEndDate ?? null)}</TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* Toggle Active */}
                    <form action={toggleEmployeeStatus}>
                      <input type="hidden" name="userId" value={e.userId} />
                      <Button
                        type="submit"
                        size="sm"
                        variant={e.isActive ? "destructive" : "secondary"}
                      >
                        {e.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </form>

                    {/* Edit */}
                    <form action={ensureEmployeeAndRedirect}>
                      <input type="hidden" name="userId" value={e.userId} />
                      <Button type="submit" size="sm" variant="outline">
                        Edit
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {employees.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
