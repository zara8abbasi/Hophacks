import type { RecyclingDayZone } from "@/lib/baltimore-csv";

const ARCGIS_SCHEDULE_QUERY =
  "https://baltegis.baltimorecity.gov/mapping/rest/services/CityView/dmxBoundaries_c/FeatureServer/13/query";

export type ScheduleLookupResult =
  | {
      ok: true;
      trashDay: string;
      recycDay: string;
      daytext: string;
      source: "arcgis" | "csv_attribute_only";
    }
  | {
      ok: false;
      reason: "no_zone" | "service_error";
      message: string;
    };

type Ring = number[][];

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygonCoords(
  lng: number,
  lat: number,
  coordinates: number[][][] | number[][][][] 
): boolean {
  if (!coordinates.length) return false;
  if (typeof coordinates[0][0][0] === "number") {
    const rings = coordinates as number[][][];
    const outer = rings[0];
    if (!outer || !pointInRing(lng, lat, outer)) return false;
    for (let r = 1; r < rings.length; r++) {
      if (pointInRing(lng, lat, rings[r])) return false;
    }
    return true;
  }
  const polys = coordinates as number[][][][];
  return polys.some((poly) => pointInPolygonCoords(lng, lat, poly));
}

type CachedGeometry = {
  globalId: string;
  trashDay: string;
  recycDay: string;
  daytext: string;
  coordinates: number[][][] | number[][][][];
};

let geometryCache: CachedGeometry[] | null = null;
let geometryLoadPromise: Promise<CachedGeometry[] | null> | null = null;

async function loadZoneGeometry(
  zonesByGlobalId: Map<string, RecyclingDayZone>
): Promise<CachedGeometry[] | null> {
  const url = new URL(ARCGIS_SCHEDULE_QUERY);
  url.searchParams.set("where", "1=1");
  url.searchParams.set(
    "outFields",
    "GlobalID,TRASH_DAY,RECYC_DAY,DAYTEXT"
  );
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("f", "geojson");

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const geojson = (await res.json()) as {
      features?: Array<{
        properties?: Record<string, string>;
        geometry?: { type: string; coordinates: number[][][] | number[][][][] };
      }>;
    };
    const out: CachedGeometry[] = [];
    for (const feature of geojson.features ?? []) {
      const props = feature.properties ?? {};
      const globalId = (props.GlobalID ?? props.globalid ?? "").toLowerCase();
      const csvRow = globalId ? zonesByGlobalId.get(globalId) : undefined;
      const geom = feature.geometry;
      if (!geom?.coordinates) continue;
      out.push({
        globalId,
        trashDay: csvRow?.trashDay ?? props.TRASH_DAY ?? props.trash_day ?? "",
        recycDay: csvRow?.recycDay ?? props.RECYC_DAY ?? props.recyc_day ?? "",
        daytext: csvRow?.daytext ?? props.DAYTEXT ?? props.daytext ?? "",
        coordinates: geom.coordinates,
      });
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
}

function lookupFromCache(
  lat: number,
  lng: number,
  cache: CachedGeometry[]
): CachedGeometry | null {
  for (const zone of cache) {
    if (pointInPolygonCoords(lng, lat, zone.coordinates)) {
      return zone;
    }
  }
  return null;
}

async function queryArcgisPoint(
  lat: number,
  lng: number,
  zonesByGlobalId: Map<string, RecyclingDayZone>
): Promise<ScheduleLookupResult> {
  const url = new URL(ARCGIS_SCHEDULE_QUERY);
  url.searchParams.set("geometry", `${lng},${lat}`);
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("outFields", "GlobalID,TRASH_DAY,RECYC_DAY,DAYTEXT");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("f", "json");

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) {
      return {
        ok: false,
        reason: "service_error",
        message: "Could not load collection schedule for this location.",
      };
    }
    const data = (await res.json()) as {
      features?: Array<{ attributes?: Record<string, string> }>;
    };
    const attrs = data.features?.[0]?.attributes;
    if (!attrs) {
      return {
        ok: false,
        reason: "no_zone",
        message:
          "No Baltimore trash/recycling zone matched this location. Double-check the address is inside the city.",
      };
    }
    const globalId = (attrs.GlobalID ?? "").toLowerCase();
    const csvRow = globalId ? zonesByGlobalId.get(globalId) : undefined;
    return {
      ok: true,
      trashDay: csvRow?.trashDay ?? attrs.TRASH_DAY ?? "",
      recycDay: csvRow?.recycDay ?? attrs.RECYC_DAY ?? "",
      daytext: csvRow?.daytext ?? attrs.DAYTEXT ?? "",
      source: "arcgis",
    };
  } catch {
    return {
      ok: false,
      reason: "service_error",
      message: "Collection schedule lookup failed. Try again in a moment.",
    };
  }
}

export async function lookupRecyclingSchedule(
  lat: number,
  lng: number,
  zones: RecyclingDayZone[]
): Promise<ScheduleLookupResult> {
  const zonesByGlobalId = new Map(
    zones.map((z) => [z.globalId.toLowerCase(), z])
  );

  if (!geometryLoadPromise) {
    geometryLoadPromise = loadZoneGeometry(zonesByGlobalId).then((cache) => {
      geometryCache = cache;
      return cache;
    });
  }
  const cache = geometryCache ?? (await geometryLoadPromise);

  if (cache?.length) {
    const hit = lookupFromCache(lat, lng, cache);
    if (hit) {
      return {
        ok: true,
        trashDay: hit.trashDay,
        recycDay: hit.recycDay,
        daytext: hit.daytext,
        source: "csv_attribute_only",
      };
    }
    return {
      ok: false,
      reason: "no_zone",
      message:
        "No collection zone polygon contains this point. Verify the address is in Baltimore City.",
    };
  }

  return queryArcgisPoint(lat, lng, zonesByGlobalId);
}
