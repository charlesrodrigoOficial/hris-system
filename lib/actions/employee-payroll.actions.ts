"use server";

import { prisma } from "@/db/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminHomePath, hasPermission, isSuperAdmin } from "@/lib/auth/rbac";

function emptyToNull(value: string | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

export async function updateEmployeePayroll(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const actorRole = session.user.role;
  if (!isSuperAdmin(actorRole) && !hasPermission(actorRole, "users:edit_payroll")) {
    redirect(adminHomePath(actorRole));
  }

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    throw new Error("Employee id is required");
  }

  await prisma.user.update({
    where: { id },
    data: {
      accountName: emptyToNull(formData.get("accountName")?.toString() ?? null),
      accountNumber: emptyToNull(
        formData.get("accountNumber")?.toString() ?? null,
      ),
      swiftCode: emptyToNull(formData.get("swiftCode")?.toString() ?? null),
      iban: emptyToNull(formData.get("iban")?.toString() ?? null),
      sortCode: emptyToNull(formData.get("sortCode")?.toString() ?? null),
    },
  });

  revalidatePath(`/admin/employees/${id}/edit`);
  revalidatePath("/admin/employees");
  redirect(`/admin/employees/${id}/edit`);
}
