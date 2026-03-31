"use server";

import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formatError } from "@/lib/utils";

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
  try {
    const id = String(formData.get("id") || "").trim();
    const departmentName = String(formData.get("departmentName") || "").trim();
    const depManagerIdRaw = String(formData.get("depManagerId") || "").trim();
    const depManagerId = depManagerIdRaw || null;

    if (!id) {
      return { success: false, message: "Department id is required." };
    }
    if (!departmentName) {
      return { success: false, message: "Department name is required." };
    }

    const existingDepartment = await prisma.department.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingDepartment) {
      return { success: false, message: "Department not found." };
    }

    const nameClash = await prisma.department.findFirst({
      where: {
        departmentName,
        NOT: { id },
      },
      select: { id: true },
    });

    if (nameClash) {
      return { success: false, message: "Department name already exists." };
    }

    if (depManagerId) {
      const manager = await prisma.user.findUnique({
        where: { id: depManagerId },
        select: { id: true },
      });

      if (!manager) {
        return { success: false, message: "Selected manager does not exist." };
      }

      const alreadyManages = await prisma.department.findFirst({
        where: {
          depManagerId,
          NOT: { id },
        },
        select: {
          id: true,
          departmentName: true,
        },
      });

      if (alreadyManages) {
        return {
          success: false,
          message: `This user is already assigned as a Department Manager for "${alreadyManages.departmentName}".`,
        };
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

    return { success: true, message: "Department updated successfully." };
  } catch (error) {
    console.error("Update department error:", error);

    const prismaCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as any).code)
        : null;

    const prismaTarget =
      typeof error === "object" && error !== null && "meta" in error
        ? (error as any).meta?.target
        : null;

    if (prismaCode === "P2002") {
      const target = Array.isArray(prismaTarget)
        ? prismaTarget.join(", ")
        : String(prismaTarget ?? "");

      if (target.includes("depManagerId")) {
        return {
          success: false,
          message:
            "This user is already assigned as a Department Manager for another department.",
        };
      }

      if (target.includes("departmentName")) {
        return { success: false, message: "Department name already exists." };
      }
    }

    return { success: false, message: formatError(error) };
  }
}

export async function deleteDepartment(id: string) {
  try {
    if (!id) {
      return { success: false, message: "Department id is required." };
    }

    const existing = await prisma.department.findUnique({
      where: { id },
      select: { id: true, departmentName: true },
    });

    if (!existing) {
      return { success: false, message: "Department not found." };
    }

    const userCount = await prisma.user.count({
      where: { departmentId: id },
    });

    if (userCount > 0) {
      return {
        success: false,
        message: `Cannot delete "${existing.departmentName}". ${userCount} user(s) are still assigned to this department. Move them to another department and try again.`,
      };
    }

    await prisma.department.delete({
      where: { id },
    });

    revalidatePath("/admin/departments");

    return {
      success: true,
      message: "Department deleted successfully.",
    };
  } catch (error) {
    console.error("Delete department error:", error);

    const prismaCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as any).code)
        : null;

    if (prismaCode === "P2003") {
      return {
        success: false,
        message:
          "Cannot delete this department because it is still referenced by other records.",
      };
    }

    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function removeUserFromDepartment(params: {
  departmentId: string;
  userId: string;
}) {
  try {
    const departmentId = String(params.departmentId || "").trim();
    const userId = String(params.userId || "").trim();

    if (!departmentId) {
      return { success: false, message: "Department id is required." };
    }

    if (!userId) {
      return { success: false, message: "User id is required." };
    }

    const [department, user] = await Promise.all([
      prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true, departmentName: true, depManagerId: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          fullName: true,
          name: true,
          departmentId: true,
        },
      }),
    ]);

    if (!department) {
      return { success: false, message: "Department not found." };
    }

    if (!user) {
      return { success: false, message: "User not found." };
    }

    if (user.departmentId !== departmentId) {
      return {
        success: false,
        message: "This user is not assigned to the selected department.",
      };
    }

    const displayName =
      user.firstName?.trim() ||
      user.fullName?.trim() ||
      user.name?.trim() ||
      user.email;

    await prisma.$transaction(async (tx) => {
      if (department.depManagerId === userId) {
        await tx.department.update({
          where: { id: departmentId },
          data: { depManagerId: null },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { departmentId: null },
      });
    });

    revalidatePath("/admin/departments");

    return {
      success: true,
      message: `${displayName} removed from "${department.departmentName}".`,
    };
  } catch (error) {
    console.error("Remove user from department error:", error);
    return { success: false, message: formatError(error) };
  }
}
