import { UserRole } from "@prisma/client";
import { PayrollPermission, payrollRolePermissions } from "./payroll";

export function hasPayrollPermission(
  role: UserRole,
  permission: PayrollPermission
) {
  return payrollRolePermissions[role]?.includes(permission) ?? false;
}