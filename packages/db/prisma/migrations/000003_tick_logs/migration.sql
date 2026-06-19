-- CreateEnum
CREATE TYPE "TickLogStatus" AS ENUM ('STARTED', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "TickLog" (
    "id" TEXT NOT NULL,
    "tickKey" TEXT NOT NULL,
    "status" "TickLogStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "processedKingdomCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TickLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TickLog_tickKey_key" ON "TickLog"("tickKey");

-- CreateIndex
CREATE INDEX "TickLog_status_idx" ON "TickLog"("status");

-- CreateIndex
CREATE INDEX "TickLog_startedAt_idx" ON "TickLog"("startedAt");
