CREATE TABLE "RestrictedZone" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "blockMode" TEXT NOT NULL DEFAULT 'NO_START',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "geom" geometry(MultiPolygon, 4326) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RestrictedZone_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RestrictedZone_code_key" UNIQUE ("code"),
  CONSTRAINT "RestrictedZone_category_check" CHECK (
    "category" IN ('AIRPORT', 'MILITARY', 'PROTECTED_AREA', 'ADMIN_BLOCK', 'TEST_FIXTURE')
  ),
  CONSTRAINT "RestrictedZone_blockMode_check" CHECK ("blockMode" IN ('NO_START'))
);

CREATE INDEX "RestrictedZone_source_category_idx" ON "RestrictedZone"("source", "category");
CREATE INDEX "RestrictedZone_enabled_idx" ON "RestrictedZone"("enabled");
CREATE INDEX "RestrictedZone_geom_gist_idx" ON "RestrictedZone" USING GIST ("geom");
