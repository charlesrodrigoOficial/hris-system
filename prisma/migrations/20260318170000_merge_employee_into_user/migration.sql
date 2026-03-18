-- Add missing employee-owned fields to User
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "fullName" TEXT,
ADD COLUMN IF NOT EXISTS "nationalId" TEXT,
ADD COLUMN IF NOT EXISTS "phoneNo" TEXT,
ADD COLUMN IF NOT EXISTS "gender" "Gender",
ADD COLUMN IF NOT EXISTS "accountName" TEXT,
ADD COLUMN IF NOT EXISTS "accountNumber" TEXT,
ADD COLUMN IF NOT EXISTS "swiftCode" TEXT,
ADD COLUMN IF NOT EXISTS "iban" TEXT,
ADD COLUMN IF NOT EXISTS "sortCode" TEXT,
ADD COLUMN IF NOT EXISTS "workEligibility" TEXT,
ADD COLUMN IF NOT EXISTS "hireDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'GBP',
ADD COLUMN IF NOT EXISTS "salary" DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS "employmentType" "EmploymentType",
ADD COLUMN IF NOT EXISTS "contractEndDate" DATE,
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "originalCompany" TEXT,
ADD COLUMN IF NOT EXISTS "officeLocation" TEXT,
ADD COLUMN IF NOT EXISTS "onboardingLocation" TEXT,
ADD COLUMN IF NOT EXISTS "onboardingTravel" TEXT,
ADD COLUMN IF NOT EXISTS "orgLevel" TEXT,
ADD COLUMN IF NOT EXISTS "accessPerssiions" TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS "remoteWork" BOOLEAN,
ADD COLUMN IF NOT EXISTS "departmentId" UUID,
ADD COLUMN IF NOT EXISTS "branchId" UUID,
ADD COLUMN IF NOT EXISTS "position" TEXT,
ADD COLUMN IF NOT EXISTS "managerId" UUID,
ADD COLUMN IF NOT EXISTS "secondLevelManagerId" UUID,
ADD COLUMN IF NOT EXISTS "shiftId" UUID;

-- Copy employee row data onto the owning user row
UPDATE "User" AS u
SET
  "fullName" = COALESCE(u."fullName", e."fullName", u."name"),
  "name" = COALESCE(u."name", e."fullName"),
  "country" = COALESCE(u."country", e."country"),
  "nationalId" = COALESCE(u."nationalId", e."nationalId"),
  "phoneNo" = COALESCE(u."phoneNo", e."phoneNo"),
  "gender" = COALESCE(u."gender", e."gender"),
  "address" = COALESCE(u."address", CASE WHEN e."address" IS NOT NULL THEN e."address"::text ELSE NULL END),
  "accountName" = COALESCE(u."accountName", e."accountName"),
  "accountNumber" = COALESCE(u."accountNumber", e."accountNumber"),
  "swiftCode" = COALESCE(u."swiftCode", e."swiftCode"),
  "iban" = COALESCE(u."iban", e."iban"),
  "sortCode" = COALESCE(u."sortCode", e."sortCode"),
  "workEligibility" = COALESCE(u."workEligibility", e."workEligibility"),
  "hireDate" = COALESCE(u."hireDate", e."hireDate"),
  "currency" = COALESCE(u."currency", e."currency"),
  "salary" = COALESCE(u."salary", e."salary"),
  "employmentType" = COALESCE(u."employmentType", e."employmentType"),
  "contractEndDate" = COALESCE(u."contractEndDate", e."contractEndDate"),
  "isActive" = COALESCE(u."isActive", e."isActive"),
  "originalCompany" = COALESCE(u."originalCompany", e."originalCompany"),
  "officeLocation" = COALESCE(u."officeLocation", e."officeLocation"),
  "onboardingLocation" = COALESCE(u."onboardingLocation", e."onboardingLocation"),
  "onboardingTravel" = COALESCE(u."onboardingTravel", e."onboardingTravel"),
  "orgLevel" = COALESCE(u."orgLevel", e."orgLevel"),
  "accessPerssiions" = COALESCE(u."accessPerssiions", e."accessPerssiions"),
  "remoteWork" = COALESCE(u."remoteWork", e."remoteWork"),
  "departmentId" = COALESCE(u."departmentId", e."departmentId"),
  "branchId" = COALESCE(u."branchId", e."branchId"),
  "position" = COALESCE(u."position", e."position"),
  "managerId" = COALESCE(u."managerId", manager_user."userId"),
  "secondLevelManagerId" = COALESCE(u."secondLevelManagerId", second_manager_user."userId"),
  "shiftId" = COALESCE(u."shiftId", e."shiftId")
FROM "Employee" AS e
LEFT JOIN "Employee" AS manager_user
  ON manager_user."id" = e."managerId"
LEFT JOIN "Employee" AS second_manager_user
  ON second_manager_user."id" = e."secondLevelManagerId"
WHERE u."id" = e."userId";

-- Drop constraints that pointed at Employee before remapping ids
ALTER TABLE "PerformanceReview" DROP CONSTRAINT IF EXISTS "PerformanceReview_employeeId_fkey";
ALTER TABLE "Request" DROP CONSTRAINT IF EXISTS "Request_managerEmployeeId_fkey";
ALTER TABLE "Department" DROP CONSTRAINT IF EXISTS "Department_depManagerId_fkey";
ALTER TABLE "Branch" DROP CONSTRAINT IF EXISTS "Branch_branchManagerId_fkey";

-- Convert foreign keys that currently store Employee ids into User ids
UPDATE "PerformanceReview" AS pr
SET "employeeId" = e."userId"
FROM "Employee" AS e
WHERE pr."employeeId" = e."id";

UPDATE "Request" AS r
SET "managerEmployeeId" = e."userId"
FROM "Employee" AS e
WHERE r."managerEmployeeId" = e."id";

UPDATE "Department" AS d
SET "depManagerId" = e."userId"
FROM "Employee" AS e
WHERE d."depManagerId" = e."id";

UPDATE "Branch" AS b
SET "branchManagerId" = e."userId"
FROM "Employee" AS e
WHERE b."branchManagerId" = e."id";

-- Add indexes for the new User relations
CREATE INDEX IF NOT EXISTS "User_departmentId_idx" ON "User"("departmentId");
CREATE INDEX IF NOT EXISTS "User_branchId_idx" ON "User"("branchId");
CREATE INDEX IF NOT EXISTS "User_managerId_idx" ON "User"("managerId");
CREATE INDEX IF NOT EXISTS "User_secondLevelManagerId_idx" ON "User"("secondLevelManagerId");

-- Add new constraints onto User and other tables
ALTER TABLE "User"
ADD CONSTRAINT "User_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "User"
ADD CONSTRAINT "User_branchId_fkey"
FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "User"
ADD CONSTRAINT "User_managerId_fkey"
FOREIGN KEY ("managerId") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "User"
ADD CONSTRAINT "User_secondLevelManagerId_fkey"
FOREIGN KEY ("secondLevelManagerId") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "User"
ADD CONSTRAINT "User_shiftId_fkey"
FOREIGN KEY ("shiftId") REFERENCES "Shift"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "PerformanceReview"
ADD CONSTRAINT "PerformanceReview_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Request"
ADD CONSTRAINT "Request_managerEmployeeId_fkey"
FOREIGN KEY ("managerEmployeeId") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "Department"
ADD CONSTRAINT "Department_depManagerId_fkey"
FOREIGN KEY ("depManagerId") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "Branch"
ADD CONSTRAINT "Branch_branchManagerId_fkey"
FOREIGN KEY ("branchManagerId") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Remove the legacy employee table
DROP TABLE IF EXISTS "Employee";
