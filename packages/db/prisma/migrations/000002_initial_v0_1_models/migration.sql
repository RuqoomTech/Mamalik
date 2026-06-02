-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLAYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "AreaType" AS ENUM ('STANDARD');

-- CreateEnum
CREATE TYPE "DistrictType" AS ENUM ('ECONOMIC', 'MILITARY', 'RESIDENTIAL', 'RESEARCH', 'DEFENSIVE');

-- CreateEnum
CREATE TYPE "BuildingType" AS ENUM ('FARM', 'MARKET', 'TAX_OFFICE', 'PALACE', 'HOUSES', 'BARRACKS', 'STABLES', 'WATCHTOWER', 'WALL', 'SCHOLAR_HALL');

-- CreateEnum
CREATE TYPE "BuildingStatus" AS ENUM ('ACTIVE', 'CONSTRUCTING', 'UPGRADING');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('INFANTRY', 'ARCHERS', 'CAVALRY', 'SCOUTS', 'SIEGE');

-- CreateEnum
CREATE TYPE "UnitLocationType" AS ENUM ('GARRISON', 'MOVING');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('BATTLE', 'SCOUT', 'LAND_PURCHASE', 'CONSTRUCTION', 'TRAINING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleSubject" TEXT,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
    "role" "UserRole" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kingdom" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "visibleBorderGeojson" JSONB NOT NULL,
    "visibleAreaM2" INTEGER NOT NULL,
    "usableLandM2" INTEGER NOT NULL DEFAULT 50000,
    "usedLandM2" INTEGER NOT NULL DEFAULT 0,
    "population" INTEGER NOT NULL DEFAULT 1000,
    "protectionEndsAt" TIMESTAMP(3) NOT NULL,
    "areaType" "AreaType" NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kingdom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "kingdomId" TEXT NOT NULL,
    "type" "DistrictType" NOT NULL,
    "allocatedLandM2" INTEGER NOT NULL,
    "usedLandM2" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceStockpile" (
    "id" TEXT NOT NULL,
    "kingdomId" TEXT NOT NULL,
    "money" INTEGER NOT NULL DEFAULT 10000,
    "food" INTEGER NOT NULL DEFAULT 5000,
    "manpower" INTEGER NOT NULL DEFAULT 500,
    "knowledge" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceStockpile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingInstance" (
    "id" TEXT NOT NULL,
    "kingdomId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "type" "BuildingType" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "status" "BuildingStatus" NOT NULL DEFAULT 'ACTIVE',
    "landUsedM2" INTEGER NOT NULL,
    "constructionRemainingTicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitStack" (
    "id" TEXT NOT NULL,
    "kingdomId" TEXT NOT NULL,
    "unitType" "UnitType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "locationType" "UnitLocationType" NOT NULL DEFAULT 'GARRISON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitStack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandPurchaseCooldown" (
    "id" TEXT NOT NULL,
    "kingdomId" TEXT NOT NULL,
    "packageSizeM2" INTEGER NOT NULL,
    "availableAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandPurchaseCooldown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "kingdomId" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "bodyJson" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");

-- CreateIndex
CREATE UNIQUE INDEX "Kingdom_userId_key" ON "Kingdom"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Kingdom_slug_key" ON "Kingdom"("slug");

-- CreateIndex
CREATE INDEX "Kingdom_centerLat_centerLng_idx" ON "Kingdom"("centerLat", "centerLng");

-- CreateIndex
CREATE UNIQUE INDEX "District_kingdomId_type_key" ON "District"("kingdomId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceStockpile_kingdomId_key" ON "ResourceStockpile"("kingdomId");

-- CreateIndex
CREATE INDEX "BuildingInstance_kingdomId_idx" ON "BuildingInstance"("kingdomId");

-- CreateIndex
CREATE INDEX "BuildingInstance_districtId_idx" ON "BuildingInstance"("districtId");

-- CreateIndex
CREATE INDEX "BuildingInstance_type_idx" ON "BuildingInstance"("type");

-- CreateIndex
CREATE UNIQUE INDEX "UnitStack_kingdomId_unitType_locationType_key" ON "UnitStack"("kingdomId", "unitType", "locationType");

-- CreateIndex
CREATE UNIQUE INDEX "LandPurchaseCooldown_kingdomId_packageSizeM2_key" ON "LandPurchaseCooldown"("kingdomId", "packageSizeM2");

-- CreateIndex
CREATE INDEX "Report_kingdomId_createdAt_idx" ON "Report"("kingdomId", "createdAt");

-- AddForeignKey
ALTER TABLE "Kingdom" ADD CONSTRAINT "Kingdom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_kingdomId_fkey" FOREIGN KEY ("kingdomId") REFERENCES "Kingdom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceStockpile" ADD CONSTRAINT "ResourceStockpile_kingdomId_fkey" FOREIGN KEY ("kingdomId") REFERENCES "Kingdom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingInstance" ADD CONSTRAINT "BuildingInstance_kingdomId_fkey" FOREIGN KEY ("kingdomId") REFERENCES "Kingdom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingInstance" ADD CONSTRAINT "BuildingInstance_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitStack" ADD CONSTRAINT "UnitStack_kingdomId_fkey" FOREIGN KEY ("kingdomId") REFERENCES "Kingdom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandPurchaseCooldown" ADD CONSTRAINT "LandPurchaseCooldown_kingdomId_fkey" FOREIGN KEY ("kingdomId") REFERENCES "Kingdom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_kingdomId_fkey" FOREIGN KEY ("kingdomId") REFERENCES "Kingdom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
