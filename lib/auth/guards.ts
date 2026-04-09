import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { adminHomePath, canAccessAdminArea, hasPermission, type Permission } from "./rbac";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();
  if (!canAccessAdminArea(session.user.role)) {
    redirect("/");
  }
  return session;
}

export async function requireAdminPermission(permission: Permission) {
  const session = await requireAdminSession();
  if (!hasPermission(session.user.role, permission)) {
    redirect(adminHomePath(session.user.role));
  }
  return session;
}
