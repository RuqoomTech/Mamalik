// Deterministic, organic kingdom border shapes. The same seed always produces the same
// outline, and the outline is scaled so its planar area matches the requested area, so a
// kingdom keeps its recognisable silhouette while growing as it gains land.

export type KingdomShapePolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

export const KINGDOM_SHAPE_VERTEX_COUNT = 20;
const RADIUS_VARIATION = 0.32;
const ANGLE_JITTER = 0.35;
const METERS_PER_DEGREE_LAT = 111_320;

export function getKingdomShapeSeed(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

// Unit outline in local meters before scaling: [x (east), y (north)] pairs.
export function createKingdomShapeOutline(seed: string, vertexCount = KINGDOM_SHAPE_VERTEX_COUNT): Array<[number, number]> {
  const random = createSeededRandom(seed);
  const rawNoise = Array.from({ length: vertexCount }, () => random() * 2 - 1);
  const jitter = Array.from({ length: vertexCount }, () => (random() * 2 - 1) * ANGLE_JITTER);
  const step = (Math.PI * 2) / vertexCount;
  const rotation = random() * Math.PI * 2;

  return rawNoise.map((_, index) => {
    // Smooth the noise with its neighbours so the coast looks like terrain, not a star.
    const previous = rawNoise[(index - 1 + vertexCount) % vertexCount] ?? 0;
    const current = rawNoise[index] ?? 0;
    const next = rawNoise[(index + 1) % vertexCount] ?? 0;
    const smoothed = (previous + current * 2 + next) / 4;
    const radius = 1 + smoothed * RADIUS_VARIATION;
    const angle = rotation + index * step + (jitter[index] ?? 0) * step;

    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
}

export function calculatePlanarArea(points: Array<[number, number]>): number {
  let twiceArea = 0;

  for (let index = 0; index < points.length; index += 1) {
    const [x1, y1] = points[index] ?? [0, 0];
    const [x2, y2] = points[(index + 1) % points.length] ?? [0, 0];
    twiceArea += x1 * y2 - x2 * y1;
  }

  return Math.abs(twiceArea) / 2;
}

export function generateKingdomShape(input: {
  lat: number;
  lng: number;
  areaM2: number;
  seed?: string;
}): KingdomShapePolygon {
  const seed = input.seed ?? getKingdomShapeSeed(input.lat, input.lng);
  const outline = createKingdomShapeOutline(seed);
  const unitArea = calculatePlanarArea(outline);
  const areaM2 = Number.isFinite(input.areaM2) && input.areaM2 > 0 ? input.areaM2 : 1;
  const scale = Math.sqrt(areaM2 / unitArea);
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.max(Math.cos((input.lat * Math.PI) / 180), 0.01);

  const ring = outline.map(([x, y]) => [
    roundCoordinate(input.lng + (x * scale) / metersPerDegreeLng),
    roundCoordinate(input.lat + (y * scale) / METERS_PER_DEGREE_LAT),
  ]);
  const first = ring[0];

  if (first) {
    ring.push([first[0] ?? 0, first[1] ?? 0]);
  }

  return { type: "Polygon", coordinates: [ring] };
}

function roundCoordinate(value: number): number {
  return Math.round(value * 1e7) / 1e7;
}

function createSeededRandom(seed: string): () => number {
  // FNV-1a hash of the seed feeding a mulberry32 generator.
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  let state = hash >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
