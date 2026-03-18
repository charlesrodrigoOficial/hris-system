"use server";

import { prisma } from "@/db/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const DEFAULT_DEPARTMENT_NAME = "ADMINISTRATION";

export async function getUsersWithEmployeeRole() {
  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
      phoneNo: true,
      employmentType: true,
      isActive: true,
      contractEndDate: true,
      department: { select: { departmentName: true } },
      branch: { select: { branchName: true } },
      position: true,
      shift: { select: { name: true } },
    },
  });

  return users;
}

function safeFullName(name: string | null | undefined, email: string) {
  if (name && name.trim().length > 0) return name.trim();
  return email.split("@")[0] ?? "Employee";
}

export async function ensureEmployeeAndRedirect(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("Missing userId");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) throw new Error("User not found");
  if (user.role !== "EMPLOYEE") throw new Error("This user is not an EMPLOYEE");

  const defaultDept = await prisma.department.upsert({
    where: { departmentName: DEFAULT_DEPARTMENT_NAME },
    update: {},
    create: { departmentName: DEFAULT_DEPARTMENT_NAME },
    select: { id: true },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName: user.name ?? safeFullName(user.name, user.email),
      departmentId: defaultDept.id,
      isActive: true,
      employmentType: "FULL_TIME",
    },
  });

  redirect(`/admin/employees/${user.id}/edit`);
}

export async function toggleEmployeeStatus(formData: FormData) {
  const userId = String(formData.get("userId"));

  const employee = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true, role: true },
  });

  if (!employee) return;
  if (employee.role !== "EMPLOYEE") return;

  await prisma.user.update({
    where: { id: employee.id },
    data: { isActive: !employee.isActive },
  });

  revalidatePath("/admin/employees/employees-with-role");
}
