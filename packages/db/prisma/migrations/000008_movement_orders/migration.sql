-- CreateEnum
CREATE TYPE "MovementOrderType" AS ENUM ('SCOUT', 'ATTACK', 'RETURN');

-- CreateEnum
CREATE TYPE "MovementOrderStatus" AS ENUM ('IN_TRANSIT', 'ARRIVED', 'RESOLVED', 'RETURNING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "MovementOrder" (
    "id" TEXT NOT NULL,
    "sourceKingdomId" TEXT NOT NULL,
    "targetKingdomId" TEXT NOT NULL,
    "orderType" "MovementOrderType" NOT NULL,
    "status" "MovementOrderStatus" NOT NULL DEFAULT 'IN_TRANSIT',
    "unitsJson" JSONB NOT NULL,
    "distanceM" INTEGER NOT NULL,
    "travelTicks" INTEGER NOT NULL,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "arrivalAt" TIMESTAMP(3) NOT NULL,
    "returnAt" TIMESTAMP(3),
    "parentOrderId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovementOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MovementOrder_parentOrderId_key" ON "MovementOrder"("parentOrderId");

-- CreateIndex
CREATE INDEX "MovementOrder_sourceKingdomId_status_idx" ON "MovementOrder"("sourceKingdomId", "status");

-- CreateIndex
CREATE INDEX "MovementOrder_targetKingdomId_status_idx" ON "MovementOrder"("targetKingdomId", "status");

-- CreateIndex
CREATE INDEX "MovementOrder_status_arrivalAt_idx" ON "MovementOrder"("status", "arrivalAt");

-- AddForeignKey
ALTER TABLE "MovementOrder" ADD CONSTRAINT "MovementOrder_sourceKingdomId_fkey" FOREIGN KEY ("sourceKingdomId") REFERENCES "Kingdom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementOrder" ADD CONSTRAINT "MovementOrder_targetKingdomId_fkey" FOREIGN KEY ("targetKingdomId") REFERENCES "Kingdom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementOrder" ADD CONSTRAINT "MovementOrder_parentOrderId_fkey" FOREIGN KEY ("parentOrderId") REFERENCES "MovementOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;