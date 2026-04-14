-- CreateEnum
CREATE TYPE "PayrollPolicyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PayrollRuleKind" AS ENUM ('EARNING', 'TAX', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "PayrollRuleValueType" AS ENUM ('PERCENT', 'FIXED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Country" ADD VALUE 'INDONESIA';
ALTER TYPE "Country" ADD VALUE 'THAILAND';

-- AlterEnum
ALTER TYPE "FeedPostType" ADD VALUE 'BIRTHDAY';

-- AlterEnum
ALTER TYPE "PayrollRunStatus" ADD VALUE 'CALCULATED';

-- AlterTable
ALTER TABLE "FeedPost" ADD COLUMN     "birthdayUserId" UUID,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "payroll_runs" ADD COLUMN     "payrollPolicyId" UUID;

-- CreateTable
CREATE TABLE "payroll_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "PayrollPolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "notes" TEXT,
    "created_by_id" UUID,
    "approved_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_policy_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policy_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "PayrollRuleKind" NOT NULL,
    "valueType" "PayrollRuleValueType" NOT NULL,
    "value" DECIMAL(12,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "min_amount" DECIMAL(12,2),
    "max_amount" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_policy_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payroll_policies_status_effective_from_effective_to_idx" ON "payroll_policies"("status", "effective_from", "effective_to");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_policies_name_version_key" ON "payroll_policies"("name", "version");

-- CreateIndex
CREATE INDEX "payroll_policy_rules_policy_id_kind_sort_order_idx" ON "payroll_policy_rules"("policy_id", "kind", "sort_order");

-- CreateIndex
CREATE INDEX "FeedPost_birthdayUserId_idx" ON "FeedPost"("birthdayUserId");

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_birthdayUserId_fkey" FOREIGN KEY ("birthdayUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_payrollPolicyId_fkey" FOREIGN KEY ("payrollPolicyId") REFERENCES "payroll_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_policies" ADD CONSTRAINT "payroll_policies_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_policies" ADD CONSTRAINT "payroll_policies_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_policy_rules" ADD CONSTRAINT "payroll_policy_rules_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "payroll_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
