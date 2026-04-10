import { UserRole } from "@prisma/client";

export type PayrollPermission =
  | "view_own_payslip"
  | "view_any_payslip"
  | "download_payslip_pdf"
  | "view_pay_history"
  | "view_payroll_list"
  | "view_variance_alerts"
  | "click_review"
  | "use_actions_dropdown"
  | "view_run_detail"
  | "edit_employee_values_draft"
  | "advance_run_status"
  | "trigger_sync_all"
  | "edit_after_sync_override"
  | "view_pay_cycles"
  | "manage_pay_cycles"
  | "delete_pay_cycle"
  | "view_payroll_reports"
  | "view_audit_log"
  | "export_reports_csv"
  | "view_integrations"
  | "configure_integrations"
  | "manage_user_roles";

export const payrollRolePermissions: Record<UserRole, PayrollPermission[]> = {
  SUPER_ADMIN: [
    "view_own_payslip",
    "view_any_payslip",
    "download_payslip_pdf",
    "view_pay_history",
    "view_payroll_list",
    "view_variance_alerts",
    "click_review",
    "use_actions_dropdown",
    "view_run_detail",
    "edit_employee_values_draft",
    "advance_run_status",
    "trigger_sync_all",
    "edit_after_sync_override",
    "view_pay_cycles",
    "manage_pay_cycles",
    "delete_pay_cycle",
    "view_payroll_reports",
    "view_audit_log",
    "export_reports_csv",
    "view_integrations",
    "configure_integrations",
    "manage_user_roles",
  ],
  HR_MANAGER: [
    "view_own_payslip",
    "view_any_payslip",
    "download_payslip_pdf",
    "view_pay_history",
    "view_payroll_list",
    "view_variance_alerts",
    "click_review",
    "view_run_detail",
    "view_pay_cycles",
    "view_payroll_reports",
    "view_audit_log",
    "export_reports_csv",
  ],
  PAYROLL_MANAGER: [
    "view_own_payslip",
    "view_any_payslip",
    "download_payslip_pdf",
    "view_pay_history",
    "view_payroll_list",
    "view_variance_alerts",
    "click_review",
    "use_actions_dropdown",
    "view_run_detail",
    "edit_employee_values_draft",
    "advance_run_status",
    "trigger_sync_all",
    "view_pay_cycles",
    "manage_pay_cycles",
    "view_payroll_reports",
    "view_audit_log",
    "export_reports_csv",
    "view_integrations",
  ],
  EMPLOYEE: [
    "view_own_payslip",
    "download_payslip_pdf",
    "view_pay_history",
  ],
};
