-- CreateTable
CREATE TABLE "BirthdayWish" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "birthdayUserId" UUID NOT NULL,
    "wishedById" UUID NOT NULL,
    "wishDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BirthdayWish_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BirthdayWish_birthdayUserId_wishDate_key" ON "BirthdayWish"("birthdayUserId", "wishDate");

-- CreateIndex
CREATE INDEX "BirthdayWish_wishDate_idx" ON "BirthdayWish"("wishDate");

-- CreateIndex
CREATE INDEX "BirthdayWish_wishedById_idx" ON "BirthdayWish"("wishedById");

-- AddForeignKey
ALTER TABLE "BirthdayWish" ADD CONSTRAINT "BirthdayWish_birthdayUserId_fkey" FOREIGN KEY ("birthdayUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BirthdayWish" ADD CONSTRAINT "BirthdayWish_wishedById_fkey" FOREIGN KEY ("wishedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
