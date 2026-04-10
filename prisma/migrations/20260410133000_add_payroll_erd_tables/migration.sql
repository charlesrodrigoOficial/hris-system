-- CreateEnum
CREATE TYPE "PayCycleStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PayslipStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'VOIDED');

-- CreateTable
CREATE TABLE "pay_cycles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "pay_date" DATE NOT NULL,
    "status" "PayCycleStatus" NOT NULL DEFAULT 'OPEN',
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pay_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pay_cycle_id" UUID NOT NULL,
    "run_number" INTEGER NOT NULL DEFAULT 1,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "started_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "synced_at" TIMESTAMP(3),
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_run_employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payroll_run_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "base_salary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gross_pay" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxes_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductions_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_pay" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "variance_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "variance_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_run_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payroll_run_id" UUID NOT NULL,
    "payroll_run_employee_id" UUID,
    "employee_id" UUID NOT NULL,
    "pay_date" DATE NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "gross_pay" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxes_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductions_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_pay" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "PayslipStatus" NOT NULL DEFAULT 'DRAFT',
    "pdf_url" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip_earnings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payslip_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslip_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip_taxes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payslip_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslip_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip_deductions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payslip_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslip_deductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID NOT NULL,
    "employee_id" UUID,
    "pay_cycle_id" UUID,
    "payroll_run_id" UUID,
    "payslip_id" UUID,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pay_cycles_period_start_period_end_key" ON "pay_cycles"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "pay_cycles_pay_date_idx" ON "pay_cycles"("pay_date");

-- CreateIndex
CREATE INDEX "pay_cycles_status_idx" ON "pay_cycles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_pay_cycle_id_run_number_key" ON "payroll_runs"("pay_cycle_id", "run_number");

-- CreateIndex
CREATE INDEX "payroll_runs_status_idx" ON "payroll_runs"("status");

-- CreateIndex
CREATE INDEX "payroll_runs_pay_cycle_id_idx" ON "payroll_runs"("pay_cycle_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_run_employees_payroll_run_id_employee_id_key" ON "payroll_run_employees"("payroll_run_id", "employee_id");

-- CreateIndex
CREATE INDEX "payroll_run_employees_employee_id_idx" ON "payroll_run_employees"("employee_id");

-- CreateIndex
CREATE INDEX "payroll_run_employees_reviewed_by_id_idx" ON "payroll_run_employees"("reviewed_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payroll_run_employee_id_key" ON "payslips"("payroll_run_employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payroll_run_id_employee_id_key" ON "payslips"("payroll_run_id", "employee_id");

-- CreateIndex
CREATE INDEX "payslips_employee_id_pay_date_idx" ON "payslips"("employee_id", "pay_date");

-- CreateIndex
CREATE INDEX "payslips_status_idx" ON "payslips"("status");

-- CreateIndex
CREATE INDEX "payslip_earnings_payslip_id_idx" ON "payslip_earnings"("payslip_id");

-- CreateIndex
CREATE INDEX "payslip_taxes_payslip_id_idx" ON "payslip_taxes"("payslip_id");

-- CreateIndex
CREATE INDEX "payslip_deductions_payslip_id_idx" ON "payslip_deductions"("payslip_id");

-- CreateIndex
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log"("actor_id");

-- CreateIndex
CREATE INDEX "audit_log_employee_id_idx" ON "audit_log"("employee_id");

-- CreateIndex
CREATE INDEX "audit_log_payroll_run_id_idx" ON "audit_log"("payroll_run_id");

-- CreateIndex
CREATE INDEX "audit_log_payslip_id_idx" ON "audit_log"("payslip_id");

-- AddForeignKey
ALTER TABLE "pay_cycles" ADD CONSTRAINT "pay_cycles_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_pay_cycle_id_fkey"
FOREIGN KEY ("pay_cycle_id") REFERENCES "pay_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_run_employees" ADD CONSTRAINT "payroll_run_employees_payroll_run_id_fkey"
FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_run_employees" ADD CONSTRAINT "payroll_run_employees_employee_id_fkey"
FOREIGN KEY ("employee_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_run_employees" ADD CONSTRAINT "payroll_run_employees_reviewed_by_id_fkey"
FOREIGN KEY ("reviewed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_run_id_fkey"
FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_run_employee_id_fkey"
FOREIGN KEY ("payroll_run_employee_id") REFERENCES "payroll_run_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_fkey"
FOREIGN KEY ("employee_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_earnings" ADD CONSTRAINT "payslip_earnings_payslip_id_fkey"
FOREIGN KEY ("payslip_id") REFERENCES "payslips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_taxes" ADD CONSTRAINT "payslip_taxes_payslip_id_fkey"
FOREIGN KEY ("payslip_id") REFERENCES "payslips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_deductions" ADD CONSTRAINT "payslip_deductions_payslip_id_fkey"
FOREIGN KEY ("payslip_id") REFERENCES "payslips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey"
FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_employee_id_fkey"
FOREIGN KEY ("employee_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_pay_cycle_id_fkey"
FOREIGN KEY ("pay_cycle_id") REFERENCES "pay_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_payroll_run_id_fkey"
FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_payslip_id_fkey"
FOREIGN KEY ("payslip_id") REFERENCES "payslips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
