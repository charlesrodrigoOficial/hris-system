-- AlterTable
ALTER TABLE "User"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "postCode" TEXT;

-- AlterTable
ALTER TABLE "Employee" RENAME COLUMN "bankAccountNumber" TO "accountNumber";

-- AlterTable
ALTER TABLE "Employee"
ALTER COLUMN "position" TYPE TEXT USING "position"::text,
ADD COLUMN "accountName" TEXT,
ADD COLUMN "swiftCode" TEXT,
ADD COLUMN "iban" TEXT,
ADD COLUMN "sortCode" TEXT,
ADD COLUMN "workEligibility" TEXT,
ADD COLUMN "originalCompany" TEXT,
ADD COLUMN "officeLocation" TEXT,
ADD COLUMN "onboardingLocation" TEXT,
ADD COLUMN "onboardingTravel" TEXT,
ADD COLUMN "orgLevel" TEXT,
ADD COLUMN "managerId" UUID,
ADD COLUMN "secondLevelManagerId" UUID;

-- DropEnum
DROP TYPE IF EXISTS "PositionTitle";

-- CreateIndex
CREATE INDEX "Employee_managerId_idx" ON "Employee"("managerId");

-- CreateIndex
CREATE INDEX "Employee_secondLevelManagerId_idx" ON "Employee"("secondLevelManagerId");

-- AddForeignKey
ALTER TABLE "Employee"
ADD CONSTRAINT "Employee_managerId_fkey"
FOREIGN KEY ("managerId") REFERENCES "Employee"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee"
ADD CONSTRAINT "Employee_secondLevelManagerId_fkey"
FOREIGN KEY ("secondLevelManagerId") REFERENCES "Employee"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
