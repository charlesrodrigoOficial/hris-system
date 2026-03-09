"use server";

import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createDepartment(formData: FormData) {
  const departmentName = String(formData.get("departmentName") || "").trim();

  if (!departmentName) {
    throw new Error("Department name is required");
  }

  const exists = await prisma.department.findUnique({
    where: { departmentName },
  });

  if (exists) {
    throw new Error("Department already exists");
  }

  await prisma.department.create({
    data: { departmentName },
  });

  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}

export async function updateDepartment(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const departmentName = String(formData.get("departmentName") || "").trim();

  if (!id) {
    throw new Error("Department id is required");
  }

  if (!departmentName) {
    throw new Error("Department name is required");
  }

  const existing = await prisma.department.findFirst({
    where: {
      departmentName,
      NOT: { id },
    },
  });

  if (existing) {
    throw new Error("Another department with this name already exists");
  }

  await prisma.department.update({
    where: { id },
    data: { departmentName },
  });

  revalidatePath("/admin/departments");
  revalidatePath(`/admin/departments/${id}/edit`);
  redirect("/admin/departments");
}

export async function deleteDepartment(id: string) {
  const employeeCount = await prisma.employee.count({
    where: { departmentId: id },
  });

  if (employeeCount > 0) {
    throw new Error(
      "Cannot delete department because employees are assigned to it",
    );
  }

  await prisma.department.delete({
    where: { id },
  });

  revalidatePath("/admin/departments");
}