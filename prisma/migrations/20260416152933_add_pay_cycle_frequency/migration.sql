-- CreateEnum
CREATE TYPE "PayCycleFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "pay_cycles" ADD COLUMN     "frequency" "PayCycleFrequency" NOT NULL DEFAULT 'MONTHLY';
