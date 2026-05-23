import type { MapPoint } from "@/lib/listings-page";
import { slugify } from "@/lib/directory";

export type BrowserCoordinates = {
  latitude: number;
  longitude: number;
};

export type NearestAreaResult = {
  area: string;
  slug: string;
};

export function nearestAreaFromCoordinates(
  coordinates: BrowserCoordinates,
  points: MapPoint[]
): NearestAreaResult | undefined {
  const nearest = points
    .filter((point) => point.area)
    .map((point) => ({
      point,
      distance: distanceKm(coordinates.latitude, coordinates.longitude, point.latitude, point.longitude)
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.point;

  if (!nearest?.area) return undefined;

  return {
    area: nearest.area,
    slug: slugify(nearest.area)
  };
}

function distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
