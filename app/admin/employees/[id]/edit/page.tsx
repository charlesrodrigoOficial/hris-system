import { prisma } from "@/db/prisma";
import { notFound } from "next/navigation";
import { updateEmployeeProfile } from "@/lib/actions/employee-profile.actions";
import { Gender, PositionTitle } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DepartmentSelect from "./department-select";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNo: true,
      nationalId: true,
      gender: true,
      position: true,
      address: true,
      departmentId: true,
      department: { select: { id: true, departmentName: true } },
      branch: { select: { branchName: true } },
      // ✅ get country from User
      user: { select: { country: true } },
    },
  });

  if (!employee) return notFound();

  const departments = await prisma.department.findMany({
    orderBy: { departmentName: "asc" },
    select: { id: true, departmentName: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">
          Edit Employee: {employee.fullName}
        </h1>
        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          <div>
            Email: <span className="text-foreground">{employee.email}</span>
          </div>
          <div>
            Phone:{" "}
            <span className="text-foreground">
              {employee.phoneNo ?? "Not set"}
            </span>
          </div>
          <div>
            Department:{" "}
            <span className="text-foreground">
              {employee.department?.departmentName ?? "Not assigned"}
            </span>
          </div>
          <div>
            Position:{" "}
            <span className="text-foreground">
              {employee.position
                ? formatEnumLabel(employee.position)
                : "Not assigned"}
            </span>
          </div>
          <div>
            Branch:{" "}
            <span className="text-foreground">
              {employee.branch?.branchName ?? "Not assigned"}
            </span>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            action={updateEmployeeProfile}
            className="grid gap-4 md:grid-cols-2"
          >
            <input type="hidden" name="id" value={employee.id} />
            {/* ✅ Department select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <DepartmentSelect
                name="departmentId"
                defaultValue={employee.departmentId ?? ""}
                departments={departments}
              />
            </div>
            {/* Country enum */}
            {/* Country (from User) - read-only */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Country</label>
              <Input
                value={
                  employee.user?.country
                    ? formatEnumLabel(employee.user.country)
                    : "Not set"
                }
                disabled
                readOnly
              />
            </div>
            {/* Gender enum */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <select
                name="gender"
                defaultValue={employee.gender ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                <option value="">Select gender</option>
                {Object.values(Gender).map((gender) => (
                  <option key={gender} value={gender}>
                    {formatEnumLabel(gender)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Position</label>
              <select
                name="position"
                defaultValue={employee.position ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              >
                <option value="">Select position</option>
                {Object.values(PositionTitle).map((position) => (
                  <option key={position} value={position}>
                    {formatEnumLabel(position)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">National ID</label>
              <Input
                name="nationalId"
                defaultValue={employee.nationalId ?? ""}
                placeholder="NIC / NIN / Passport"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone No</label>
              <Input
                name="phoneNo"
                defaultValue={employee.phoneNo ?? ""}
                placeholder="+44..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Address (JSON)</label>
              <Textarea
                name="address"
                rows={6}
                defaultValue={
                  employee.address
                    ? JSON.stringify(employee.address, null, 2)
                    : ""
                }
                placeholder='{"line1":"...","city":"...","postcode":"..."}'
              />
              <p className="text-xs text-muted-foreground">
                Keep it valid JSON. Leave empty to clear.
              </p>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function formatEnumLabel(v: string) {
  return v
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
