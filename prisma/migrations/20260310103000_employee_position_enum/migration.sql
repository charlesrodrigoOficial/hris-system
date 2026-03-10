-- CreateEnum
CREATE TYPE "PositionTitle" AS ENUM (
  'FRONTEND_INTERN',
  'BACKEND_INTERN',
  'JUNIOR_SE',
  'SENIOR_SE',
  'MANAGER'
);

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "position" "PositionTitle";

-- Migrate existing position relations into the enum column.
UPDATE "Employee" AS e
SET "position" = CASE
  WHEN p."name" IN ('Frontend_Intern', 'FRONTEND_INTERN', 'Frontend Intern') THEN 'FRONTEND_INTERN'::"PositionTitle"
  WHEN p."name" IN ('Backend_Intern', 'BACKEND_INTERN', 'Backend Intern') THEN 'BACKEND_INTERN'::"PositionTitle"
  WHEN p."name" IN ('Junior_SE', 'JUNIOR_SE', 'Junior SE') THEN 'JUNIOR_SE'::"PositionTitle"
  WHEN p."name" IN ('Senior_SE', 'SENIOR_SE', 'Senior SE') THEN 'SENIOR_SE'::"PositionTitle"
  WHEN p."name" IN ('Manager', 'MANAGER') THEN 'MANAGER'::"PositionTitle"
  ELSE NULL
END
FROM "Position" AS p
WHERE e."positionId" = p."id";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT IF EXISTS "Employee_positionId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Position_name_key";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN IF EXISTS "positionId";

-- DropTable
DROP TABLE IF EXISTS "Position";
