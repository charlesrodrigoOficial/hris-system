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
ADD COLUMN     "supportRequestType" "SupportRequestType",
ADD COLUMN     "supportRequestTypeOther" TEXT,
ADD COLUMN     "expectedCompletionDate" TIMESTAMP(3),
ADD COLUMN     "supportAdditionalNotes" TEXT;

CREATE INDEX "Request_supportRequestType_idx" ON "Request"("supportRequestType");
