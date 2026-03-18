import { prisma } from "@/db/prisma";
import { notFound } from "next/navigation";
import { updateEmployeeProfile } from "@/lib/actions/employee-profile.actions";
import { Gender } from "@prisma/client";
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

  const employee = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      name: true,
      email: true,
      phoneNo: true,
      nationalId: true,
      gender: true,
      position: true,
      address: true,
      departmentId: true,
      department: { select: { id: true, departmentName: true } },
      branch: { select: { branchName: true } },
      country: true,
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
          Edit Employee: {employee.fullName ?? employee.name ?? employee.email}
        </h1>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Email
              </p>
              <p className="text-sm font-medium text-slate-900">
                {employee.email}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Phone
              </p>
              <p className="text-sm font-medium text-slate-900">
                {employee.phoneNo ?? "Not set"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Department
              </p>
              <p className="text-sm font-medium text-slate-900">
                {employee.department?.departmentName ?? "Not assigned"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Branch
              </p>
              <p className="text-sm font-medium text-slate-900">
                {employee.branch?.branchName ?? "Not assigned"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Position
              </p>
              <p className="text-sm font-medium text-slate-900">
                {employee.position ? formatEnumLabel(employee.position) : "Not assigned"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
        </CardHeader>

        <CardContent>
          <form action={updateEmployeeProfile} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="id" value={employee.id} />

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <DepartmentSelect
                name="departmentId"
                defaultValue={employee.departmentId ?? ""}
                departments={departments}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Country</label>
              <Input
                value={employee.country ? formatEnumLabel(employee.country) : "Not set"}
                disabled
                readOnly
              />
            </div>

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
              <Input
                name="position"
                defaultValue={employee.position ?? ""}
                placeholder="Enter position"
              />
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
              <label className="text-sm font-medium">Address</label>
              <Textarea
                name="address"
                rows={6}
                defaultValue={employee.address ?? ""}
                placeholder="Enter address"
              />
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
  const trimmed = v.trim();
  if (!trimmed.includes("_")) return trimmed;

  return trimmed
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
