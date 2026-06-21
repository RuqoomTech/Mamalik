-- CreateEnum
CREATE TYPE "TrainingQueueStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TrainingQueueItem" (
    "id" TEXT NOT NULL,
    "kingdomId" TEXT NOT NULL,
    "unitType" "UnitType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "remainingTicks" INTEGER NOT NULL,
    "status" "TrainingQueueStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TrainingQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingQueueItem_kingdomId_status_idx" ON "TrainingQueueItem"("kingdomId", "status");

-- CreateIndex
CREATE INDEX "TrainingQueueItem_status_remainingTicks_idx" ON "TrainingQueueItem"("status", "remainingTicks");

-- AddForeignKey
ALTER TABLE "TrainingQueueItem" ADD CONSTRAINT "TrainingQueueItem_kingdomId_fkey" FOREIGN KEY ("kingdomId") REFERENCES "Kingdom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
