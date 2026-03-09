/*
  Warnings:

  - A unique constraint covering the columns `[departmentName]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - Made the column `departmentId` on table `Employee` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_departmentId_fkey";

-- AlterTable
ALTER TABLE "Department"
ALTER COLUMN "empCount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "departmentId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Department_departmentName_key" ON "Department"("departmentName");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
