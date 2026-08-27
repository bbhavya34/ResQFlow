/**
 * offlineRouting.ts
 * ============================================================================
 * QFlow Offline Spatial Routing - powered by @turf/turf (no network required).
 * ============================================================================
 */

import * as turf from "@turf/turf";
import { getCachedSafehouses, type Safehouse } from "./offlineStore";

export interface RoutingResult {
  name: string;
  distanceKm: number;
  bearingAngle: number;
  cardinalHeading: CardinalDirection;
  coordinates: [number, number];
  safehouse: Safehouse;
}

export type CardinalDirection =
  | "N"
  | "NE"
  | "E"
  | "SE"
  | "S"
  | "SW"
  | "W"
  | "NW";

function bearingToCardinal(bearing: number): CardinalDirection {
  const normalised = ((bearing % 360) + 360) % 360;
  const directions: CardinalDirection[] = [
    "N", "NE", "E", "SE", "S", "SW", "W", "NW",
  ];
  const index = Math.round(normalised / 45) % 8;
  return directions[index] ?? "N";
}

function assertValidCoords(lat: number, lng: number): void {
  if (!isFinite(lat) || !isFinite(lng)) {
    throw new Error(
      `[QFlow/offlineRouting] GPS coordinates invalid: lat=${lat}, lng=${lng}.`,
    );
  }
  if (lat < -90 || lat > 90) {
    throw new Error(
      `[QFlow/offlineRouting] Latitude ${lat} is out of range [-90, 90].`,
    );
  }
  if (lng < -180 || lng > 180) {
    throw new Error(
      `[QFlow/offlineRouting] Longitude ${lng} is out of range [-180, 180].`,
    );
  }
}

export async function calculateNearestSafehouse(
  userLat: number,
  userLng: number,
): Promise<RoutingResult> {
  assertValidCoords(userLat, userLng);
  const safehouses = await getCachedSafehouses();
  const userPoint = turf.point([userLng, userLat]);

  let nearest: Safehouse | null = null;
  let minDistanceKm = Infinity;

  for (const sh of safehouses) {
    if (!isFinite(sh.lat) || !isFinite(sh.lng)) {
      continue;
    }

    const shPoint = turf.point([sh.lng, sh.lat]);
    const distKm = turf.distance(userPoint, shPoint, { units: "kilometers" });

    if (distKm < minDistanceKm) {
      minDistanceKm = distKm;
      nearest = sh;
    }
  }

  if (!nearest) {
    throw new Error(
      "[QFlow/offlineRouting] Could not identify a nearest safehouse.",
    );
  }

  const nearestPoint = turf.point([nearest.lng, nearest.lat]);
  const rawBearing = turf.bearing(userPoint, nearestPoint);
  const bearingAngle = ((rawBearing % 360) + 360) % 360;
  const cardinalHeading = bearingToCardinal(bearingAngle);

  return {
    name: nearest.name,
    distanceKm: Math.round(minDistanceKm * 100) / 100,
    bearingAngle: Math.round(bearingAngle * 10) / 10,
    cardinalHeading,
    coordinates: [nearest.lng, nearest.lat],
    safehouse: nearest,
  };
}
