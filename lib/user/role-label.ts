import { adminHomePath, canAccessAdminArea } from "@/lib/auth/rbac";

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  HR_MANAGER: "HR Manager",
  PAYROLL_MANAGER: "Payroll Manager",
  EMPLOYEE: "Employee",
};

export function formatUserRoleLabel(role?: string | null) {
  const normalized = String(role ?? "").trim().toUpperCase();
  if (!normalized) return "";
  return ROLE_LABELS[normalized] ?? formatEnumLabel(normalized);
}

export { canAccessAdminArea, adminHomePath };
