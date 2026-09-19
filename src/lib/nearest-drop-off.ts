import type { DropOffCenter } from "@/lib/baltimore-csv";

export type NearestCenterResult = {
  center: DropOffCenter;
  distanceMiles: number;
  directionsUrl: string;
};

function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function googleMapsDirectionsUrl(
  center: DropOffCenter,
  fromLat?: number,
  fromLng?: number
): string {
  const dest = `${center.lat},${center.lng}`;
  const params = new URLSearchParams({ api: "1", destination: dest });
  if (fromLat !== undefined && fromLng !== undefined) {
    params.set("origin", `${fromLat},${fromLng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function findNearestDropOffCenter(
  lat: number,
  lng: number,
  centers: DropOffCenter[]
): NearestCenterResult | null {
  if (!centers.length) return null;
  let best: DropOffCenter | null = null;
  let bestDist = Infinity;
  for (const center of centers) {
    const d = haversineMiles(lat, lng, center.lat, center.lng);
    if (d < bestDist) {
      bestDist = d;
      best = center;
    }
  }
  if (!best) return null;
  return {
    center: best,
    distanceMiles: bestDist,
    directionsUrl: googleMapsDirectionsUrl(best, lat, lng),
  };
}
