import { adminHomePath, canAccessAdminArea } from "@/lib/auth/rbac";

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Super Admin",
  HR: "HR Manager",
  USER: "Employee",
  FINANCE: "Payroll Admin",
};

export function formatUserRoleLabel(role?: string | null) {
  const normalized = String(role ?? "").trim().toUpperCase();
  if (!normalized) return "";
  return ROLE_LABELS[normalized] ?? formatEnumLabel(normalized);
}

export { canAccessAdminArea, adminHomePath };
