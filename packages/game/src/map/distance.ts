export const EARTH_MEAN_RADIUS_M = 6_371_000;

export type GeoCoordinates = {
  lat: number;
  lng: number;
};

/**
 * Great-circle (haversine) distance in meters between two WGS84 points.
 * Shared by map validation and Sprint 5 movement so distance math stays
 * identical everywhere instead of being re-implemented per feature.
 */
export function calculateGreatCircleDistanceMeters(
  first: GeoCoordinates,
  second: GeoCoordinates,
): number {
  const deltaLat = toRadians(second.lat - first.lat);
  const deltaLng = toRadians(second.lng - first.lng);
  const firstLat = toRadians(first.lat);
  const secondLat = toRadians(second.lat);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_MEAN_RADIUS_M * Math.asin(Math.sqrt(haversine));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}