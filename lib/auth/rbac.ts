export type NormalizedRole =
  | "ADMIN"
  | "HR"
  | "FINANCE"
  | "MANAGER"
  | "EMPLOYEE"
  | "USER"
  | "ANALYST";

export type Permission =
  | "admin:access"
  | "users:view"
  | "users:create"
  | "users:delete"
  | "users:edit_profile"
  | "users:edit_employment"
  | "users:edit_payroll"
  | "roles:assign"
  | "org:manage"
  | "departments:manage"
  | "attendance:review"
  | "requests:manage"
  | "calendar:manage"
  | "payroll:manage"
  | "security:manage";

function normalizeRole(role?: string | null): NormalizedRole | null {
  const normalized = String(role ?? "").trim().toUpperCase();
  if (!normalized) return null;
  return normalized as NormalizedRole;
}

export function isSuperAdmin(role?: string | null) {
  return normalizeRole(role) === "ADMIN";
}

export function isHrManager(role?: string | null) {
  return normalizeRole(role) === "HR";
}

export function isPayrollAdmin(role?: string | null) {
  return normalizeRole(role) === "FINANCE";
}

export function canAccessAdminArea(role?: string | null) {
  const r = normalizeRole(role);
  return r === "ADMIN" || r === "HR" || r === "FINANCE";
}

export function hasPermission(role?: string | null, permission?: Permission) {
  if (!permission) return false;
  const r = normalizeRole(role);
  if (!r) return false;

  // Super Admin owns the system.
  if (r === "ADMIN") return true;

  switch (permission) {
    case "admin:access":
      return canAccessAdminArea(r);

    case "users:view":
      return r === "HR" || r === "FINANCE";

    case "users:create":
    case "users:delete":
    case "roles:assign":
    case "security:manage":
      return false;

    case "users:edit_profile":
    case "users:edit_employment":
      return r === "HR";

    // HR can view payroll-related info, but should not edit it by default.
    case "users:edit_payroll":
    case "payroll:manage":
      return r === "FINANCE";

    case "org:manage":
    case "departments:manage":
    case "attendance:review":
    case "requests:manage":
    case "calendar:manage":
      return r === "HR";

    default:
      return false;
  }
}

export function adminHomePath(role?: string | null) {
  const r = normalizeRole(role);
  if (r === "FINANCE") return "/admin/payrolls";
  return "/admin/overview";
}

