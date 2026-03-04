-- AlterTable
ALTER TABLE "FeedPost" ADD COLUMN     "pollOptions" JSONB,
ADD COLUMN     "pollQuestion" TEXT,
ADD COLUMN     "type" "FeedPostType" NOT NULL DEFAULT 'SHOUTOUT';

-- CreateIndex
CREATE INDEX "FeedPost_type_idx" ON "FeedPost"("type");
