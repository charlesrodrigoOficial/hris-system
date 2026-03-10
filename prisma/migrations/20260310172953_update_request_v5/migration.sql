/*
  Warnings:

  - You are about to drop the column `expectedCompletionDate` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `supportAdditionalNotes` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `supportRequestType` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `supportRequestTypeOther` on the `Request` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Request_supportRequestType_idx";

-- AlterTable
ALTER TABLE "Request" DROP COLUMN "expectedCompletionDate",
DROP COLUMN "supportAdditionalNotes",
DROP COLUMN "supportRequestType",
DROP COLUMN "supportRequestTypeOther";

-- DropEnum
DROP TYPE "SupportRequestType";
