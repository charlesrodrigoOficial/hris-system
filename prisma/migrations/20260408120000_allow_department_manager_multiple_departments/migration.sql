-- Allow a manager (User) to manage multiple departments by dropping the unique index on depManagerId.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Department_depManagerId_key'
  ) THEN
    EXECUTE 'DROP INDEX "Department_depManagerId_key"';
  END IF;
END $$;

-- Keep a non-unique index for lookups.
CREATE INDEX IF NOT EXISTS "Department_depManagerId_idx" ON "Department"("depManagerId");

