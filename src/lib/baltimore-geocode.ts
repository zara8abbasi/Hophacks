export type GeocodeResult =
  | {
      ok: true;
      lat: number;
      lng: number;
      displayName: string;
    }
  | {
      ok: false;
      reason: "empty" | "not_found" | "outside_baltimore" | "service_error";
      message: string;
    };

/** Rough Baltimore City bounding box (WGS84) */
const BALTIMORE_BOUNDS = {
  minLat: 39.18,
  maxLat: 39.38,
  minLng: -76.72,
  maxLng: -76.52,
};

export function isInsideBaltimore(lat: number, lng: number): boolean {
  return (
    lat >= BALTIMORE_BOUNDS.minLat &&
    lat <= BALTIMORE_BOUNDS.maxLat &&
    lng >= BALTIMORE_BOUNDS.minLng &&
    lng <= BALTIMORE_BOUNDS.maxLng
  );
}

export function parseLatLngInput(
  input: string
): { lat: number; lng: number } | null {
  const trimmed = input.trim();
  const pair = trimmed.match(
    /^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/
  );
  if (!pair) return null;
  const lat = Number.parseFloat(pair[1]);
  const lng = Number.parseFloat(pair[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export async function geocodeBaltimoreAddress(
  address: string
): Promise<GeocodeResult> {
  const trimmed = address.trim();
  if (!trimmed) {
    return {
      ok: false,
      reason: "empty",
      message: "Enter a Baltimore street address or latitude, longitude.",
    };
  }

  const coords = parseLatLngInput(trimmed);
  if (coords) {
    if (!isInsideBaltimore(coords.lat, coords.lng)) {
      return {
        ok: false,
        reason: "outside_baltimore",
        message:
          "Those coordinates look outside Baltimore City. Collection schedules and drop-off guidance here apply to Baltimore addresses only.",
      };
    }
    return {
      ok: true,
      lat: coords.lat,
      lng: coords.lng,
      displayName: `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
    };
  }

  const query = trimmed.toLowerCase().includes("baltimore")
    ? trimmed
    : `${trimmed}, Baltimore, MD`;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "HopHacks-Baltimore-Disposal/1.0 (hackathon; local dev)",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return {
        ok: false,
        reason: "service_error",
        message: "Address lookup is temporarily unavailable. Try lat/lng or try again.",
      };
    }
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    if (!data.length) {
      return {
        ok: false,
        reason: "not_found",
        message:
          "We could not find that address. Include street number and name, or enter latitude, longitude.",
      };
    }
    const hit = data[0];
    const lat = Number.parseFloat(hit.lat);
    const lng = Number.parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return {
        ok: false,
        reason: "not_found",
        message: "Address lookup returned an invalid location. Try a more specific address.",
      };
    }
    if (!isInsideBaltimore(lat, lng)) {
      return {
        ok: false,
        reason: "outside_baltimore",
        message:
          "That address appears to be outside Baltimore City limits. This tool covers Baltimore City collection zones only.",
      };
    }
    return {
      ok: true,
      lat,
      lng,
      displayName: hit.display_name,
    };
  } catch {
    return {
      ok: false,
      reason: "service_error",
      message: "Address lookup failed. Check your connection or use latitude, longitude.",
    };
  }
}
