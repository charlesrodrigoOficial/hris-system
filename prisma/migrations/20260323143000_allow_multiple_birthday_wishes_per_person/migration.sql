DROP INDEX IF EXISTS "BirthdayWish_birthdayUserId_wishDate_key";

CREATE UNIQUE INDEX "BirthdayWish_birthdayUserId_wishedById_wishDate_key"
ON "BirthdayWish"("birthdayUserId", "wishedById", "wishDate");
