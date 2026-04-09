-- Safety net: if the unique constraint/index on Department.depManagerId still exists, drop it.
ALTER TABLE "Department" DROP CONSTRAINT IF EXISTS "Department_depManagerId_key";
DROP INDEX IF EXISTS "Department_depManagerId_key";

-- Ensure a non-unique index exists for lookups.
CREATE INDEX IF NOT EXISTS "Department_depManagerId_idx" ON "Department"("depManagerId");

