import fs from "node:fs";
import path from "node:path";
import proj4 from "proj4";

const DATA_DIR = path.join(process.cwd(), "data");

/** Maryland State Plane NAD83 (US foot) — Baltimore City open data x/y */
const MD_STATE_PLANE =
  "+proj=lcc +lat_1=38.3 +lat_2=39.45 +lat_0=38 +lon_0=-77 +x_0=400000 +y_0=0 +datum=NAD83 +units=us-ft +no_defs";

export type DropOffCenter = {
  objectId: string;
  address: string;
  name: string;
  url: string;
  lat: number;
  lng: number;
};

export type RecyclingDayZone = {
  objectId1: string;
  objectid: string;
  daytext: string;
  trashDay: string;
  recycDay: string;
  shapeArea: number;
  shapeLength: number;
  globalId: string;
};

export type CsvLoadError = {
  kind: "missing_file" | "parse_error";
  message: string;
};

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  fields.push(current);
  return fields;
}

function readCsvFile(filename: string): string[][] {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw { kind: "missing_file" as const, message: `Missing data file: ${filename}` };
  }
  const raw = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").trim();
  if (!raw) {
    throw { kind: "parse_error" as const, message: `Empty CSV: ${filename}` };
  }
  const lines = raw.split("\n");
  const rows: string[][] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    rows.push(parseCsvLine(line));
  }
  return rows;
}

function statePlaneToWgs84(x: number, y: number): { lat: number; lng: number } {
  const [lng, lat] = proj4(MD_STATE_PLANE, "WGS84", [x, y]) as [number, number];
  return { lat, lng };
}

export function loadDropOffCenters(): {
  centers: DropOffCenter[];
  error: CsvLoadError | null;
} {
  try {
    const rows = readCsvFile("trash-drop-off-centers.csv");
    const header = rows[0];
    if (!header) {
      return {
        centers: [],
        error: { kind: "parse_error", message: "Drop-off centers CSV has no header row." },
      };
    }
    const norm = header.map((h) => h.trim().toLowerCase());
    const idx = {
      objectId: norm.indexOf("objectid"),
      address: norm.indexOf("address"),
      name: norm.indexOf("name"),
      url: norm.indexOf("url"),
      x: norm.indexOf("x"),
      y: norm.indexOf("y"),
    };
    if (
      idx.objectId < 0 ||
      idx.address < 0 ||
      idx.name < 0 ||
      idx.x < 0 ||
      idx.y < 0
    ) {
      return {
        centers: [],
        error: {
          kind: "parse_error",
          message:
            "Drop-off centers CSV must include OBJECTID, Address, Name, x, and y columns.",
        },
      };
    }

    const centers: DropOffCenter[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const x = Number.parseFloat(row[idx.x] ?? "");
      const y = Number.parseFloat(row[idx.y] ?? "");
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const { lat, lng } = statePlaneToWgs84(x, y);
      centers.push({
        objectId: row[idx.objectId] ?? String(i),
        address: row[idx.address] ?? "",
        name: row[idx.name] ?? "",
        url: idx.url >= 0 ? row[idx.url] ?? "" : "",
        lat,
        lng,
      });
    }
    return { centers, error: null };
  } catch (err) {
    if (err && typeof err === "object" && "kind" in err) {
      return { centers: [], error: err as CsvLoadError };
    }
    return {
      centers: [],
      error: {
        kind: "parse_error",
        message: err instanceof Error ? err.message : "Failed to read drop-off centers CSV.",
      },
    };
  }
}

export function loadRecyclingDayZones(): {
  zones: RecyclingDayZone[];
  error: CsvLoadError | null;
} {
  try {
    const rows = readCsvFile("trash-and-recycling-days.csv");
    const header = rows[0];
    if (!header) {
      return {
        zones: [],
        error: { kind: "parse_error", message: "Recycling days CSV has no header row." },
      };
    }
    const norm = header.map((h) => h.trim().toLowerCase());
    const idx = {
      objectId1: norm.indexOf("objectid_1"),
      objectid: norm.indexOf("objectid"),
      daytext: norm.indexOf("daytext"),
      trashDay: norm.indexOf("trash_day"),
      recycDay: norm.indexOf("recyc_day"),
      shapeArea: norm.indexOf("shape__area"),
      shapeLength: norm.indexOf("shape__length"),
      globalId: norm.indexOf("globalid"),
    };
    if (
      idx.daytext < 0 ||
      idx.trashDay < 0 ||
      idx.recycDay < 0 ||
      idx.globalId < 0
    ) {
      return {
        zones: [],
        error: {
          kind: "parse_error",
          message:
            "Recycling days CSV must include daytext, trash_day, recyc_day, and GlobalID columns.",
        },
      };
    }

    const zones: RecyclingDayZone[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      zones.push({
        objectId1: idx.objectId1 >= 0 ? row[idx.objectId1] ?? "" : "",
        objectid: idx.objectid >= 0 ? row[idx.objectid] ?? "" : "",
        daytext: row[idx.daytext] ?? "",
        trashDay: row[idx.trashDay] ?? "",
        recycDay: row[idx.recycDay] ?? "",
        shapeArea:
          idx.shapeArea >= 0
            ? Number.parseFloat(row[idx.shapeArea] ?? "") || 0
            : 0,
        shapeLength:
          idx.shapeLength >= 0
            ? Number.parseFloat(row[idx.shapeLength] ?? "") || 0
            : 0,
        globalId: row[idx.globalId] ?? "",
      });
    }
    return { zones, error: null };
  } catch (err) {
    if (err && typeof err === "object" && "kind" in err) {
      return { zones: [], error: err as CsvLoadError };
    }
    return {
      zones: [],
      error: {
        kind: "parse_error",
        message: err instanceof Error ? err.message : "Failed to read recycling days CSV.",
      },
    };
  }
}
