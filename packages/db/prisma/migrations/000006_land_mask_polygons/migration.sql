CREATE TABLE "LandMaskPolygon" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "name" TEXT,
  "geom" geometry(MultiPolygon, 4326) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LandMaskPolygon_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LandMaskPolygon_source_idx" ON "LandMaskPolygon"("source");
CREATE INDEX "LandMaskPolygon_geom_gist_idx" ON "LandMaskPolygon" USING GIST ("geom");
