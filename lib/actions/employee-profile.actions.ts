"use server";

import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Gender } from "@prisma/client";
import { auth } from "@/auth";
import { adminHomePath, hasPermission } from "@/lib/auth/rbac";

export async function updateEmployeeProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  if (!hasPermission(session.user.role, "users:edit_profile")) {
    redirect(adminHomePath(session.user.role));
  }

  const id = String(formData.get("id") || "");

  const genderRaw = String(formData.get("gender") || "");
  const positionRaw = String(formData.get("position") || "");

  const nationalId = String(formData.get("nationalId") || "").trim() || null;
  const phoneNo = String(formData.get("phoneNo") || "").trim() || null;

  const address = String(formData.get("address") || "").trim() || null;

  // enums (allow empty => null)
  const gender = genderRaw ? (genderRaw as Gender) : null;
  const position = positionRaw || null;

  const departmentId = String(formData.get("departmentId") || "");
  if (!departmentId) throw new Error("Department is required");

  await prisma.user.update({
    where: { id },
    data: {
      nationalId,
      phoneNo,
      gender,
      position,
      address,
      departmentId,
    },
  });

  // refresh both edit page and employees list
  revalidatePath(`/admin/employees/${id}/edit`);
  revalidatePath(`/admin/employees/employees-with-role`);

  redirect(`/admin/employees/${id}/edit`);
}
