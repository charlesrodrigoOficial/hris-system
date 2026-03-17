-- CreateEnum
CREATE TYPE "CompanyDocumentCategory" AS ENUM (
    'EMPLOYMENT_LETTER',
    'CONTRACT',
    'HANDBOOK',
    'HR_POLICY',
    'GUIDE'
);

-- CreateTable
CREATE TABLE "CompanyDocument" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "category" "CompanyDocumentCategory" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "sourceLabel" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyDocument_category_idx" ON "CompanyDocument"("category");
