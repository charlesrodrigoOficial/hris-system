"use server";

import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createDepartment(formData: FormData) {
  const departmentName = String(formData.get("departmentName") || "").trim();

  if (!departmentName) {
    throw new Error("Department name is required");
  }

  const exists = await prisma.department.findFirst({
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
  const id = String(formData.get("id") || "");
  const departmentName = String(formData.get("departmentName") || "").trim();
  const depManagerIdRaw = String(formData.get("depManagerId") || "").trim();
  const depManagerId = depManagerIdRaw || null;

  if (!id) throw new Error("Department id is required");
  if (!departmentName) throw new Error("Department name is required");

  const existing = await prisma.department.findFirst({
    where: {
      departmentName,
      NOT: { id },
    },
  });

  if (existing) {
    throw new Error("Department already exists");
  }

  if (depManagerId) {
    const manager = await prisma.user.findUnique({
      where: { id: depManagerId },
    });

    if (!manager) {
      throw new Error("Selected manager does not exist");
    }
  }

  await prisma.department.update({
    where: { id },
    data: {
      departmentName,
      depManagerId,
    },
  });

  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}

export async function deleteDepartment(id: string) {
  const employeeCount = await prisma.user.count({
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
