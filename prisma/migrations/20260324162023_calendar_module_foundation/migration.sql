-- CreateEnum
CREATE TYPE "CalendarItemType" AS ENUM ('EVENT', 'HOLIDAY', 'MEETING', 'PAYROLL', 'SHIFT', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "CalendarVisibility" AS ENUM ('COMPANY', 'DEPARTMENT', 'PERSONAL');

-- CreateTable
CREATE TABLE "CalendarItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "CalendarItemType" NOT NULL,
    "visibility" "CalendarVisibility" NOT NULL DEFAULT 'COMPANY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "country" "Country",
    "userId" UUID,
    "departmentId" UUID,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarItem_type_idx" ON "CalendarItem"("type");

-- CreateIndex
CREATE INDEX "CalendarItem_visibility_idx" ON "CalendarItem"("visibility");

-- CreateIndex
CREATE INDEX "CalendarItem_startDate_idx" ON "CalendarItem"("startDate");

-- CreateIndex
CREATE INDEX "CalendarItem_endDate_idx" ON "CalendarItem"("endDate");

-- CreateIndex
CREATE INDEX "CalendarItem_country_idx" ON "CalendarItem"("country");

-- CreateIndex
CREATE INDEX "CalendarItem_userId_idx" ON "CalendarItem"("userId");

-- CreateIndex
CREATE INDEX "CalendarItem_departmentId_idx" ON "CalendarItem"("departmentId");

-- CreateIndex
CREATE INDEX "CalendarItem_createdById_idx" ON "CalendarItem"("createdById");

-- CreateIndex
CREATE INDEX "Attendance_status_date_idx" ON "Attendance"("status", "date");

-- CreateIndex
CREATE INDEX "Request_userId_idx" ON "Request"("userId");

-- CreateIndex
CREATE INDEX "Request_type_status_idx" ON "Request"("type", "status");

-- CreateIndex
CREATE INDEX "Request_startDate_idx" ON "Request"("startDate");

-- CreateIndex
CREATE INDEX "Request_endDate_idx" ON "Request"("endDate");

-- CreateIndex
CREATE INDEX "User_dateOfBirth_idx" ON "User"("dateOfBirth");

-- CreateIndex
CREATE INDEX "User_country_idx" ON "User"("country");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- AddForeignKey
ALTER TABLE "CalendarItem" ADD CONSTRAINT "CalendarItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarItem" ADD CONSTRAINT "CalendarItem_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarItem" ADD CONSTRAINT "CalendarItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
