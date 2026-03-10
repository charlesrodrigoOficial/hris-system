DO $$
BEGIN
    CREATE TYPE "SupportRequestType" AS ENUM (
        'RECOMMENDATION_LETTER',
        'EMPLOYMENT_VERIFICATION',
        'PROOF_OF_INCOME',
        'CONTRACT_COPY',
        'OPERATIONAL_REQUEST',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Request"
ADD COLUMN IF NOT EXISTS "supportRequestType" "SupportRequestType",
ADD COLUMN IF NOT EXISTS "supportRequestTypeOther" TEXT,
ADD COLUMN IF NOT EXISTS "expectedCompletionDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "supportAdditionalNotes" TEXT;

CREATE INDEX IF NOT EXISTS "Request_supportRequestType_idx"
ON "Request"("supportRequestType");
