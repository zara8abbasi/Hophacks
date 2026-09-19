import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.join(
  process.cwd(),
  "data",
  "baltimore-drop-off-official.json"
);

export type ResidentialCenterHours = {
  objectId: string;
  name: string;
  address: string;
  phone?: string;
  openDays: string[];
  hours: { open: string; close: string };
  notes?: string[];
  siteRules?: {
    acceptsHhwOnScheduledDays?: boolean;
    doesNotAccept?: string[];
  };
};

export type BaltimoreDropOffOfficial = {
  sources: Array<{ id: string; url: string; fetchedForEncoding?: string; note?: string }>;
  generalDropOff: {
    residentRequirement: string;
    feeNote: string;
    acceptedAtResidentialCenters: string[];
    notAcceptedAtRegularResidentialDropOff: string[];
    hhwNote: string;
  };
  hhw: {
    locationName: string;
    address: string;
    telephone: string;
    centerObjectId: string;
    scheduleRule: { months: string; when: string; holidayNote: string };
    publishedDropOffDates2025: Array<{ label: string; hours: string }>;
    businesses: string;
    commercialVehicles: string;
    packagingRule: string;
    acceptable: string[];
    fluorescentBulbNote: string;
    unacceptable: string[];
  };
  hardToRecycle: Array<{
    id: string;
    title: string;
    guidance: string;
    dropOffScope: string;
    excludedCenterObjectIds?: string[];
  }>;
  residentialCentersHours: ResidentialCenterHours[];
  dataLimitations: {
    perSiteDailyMaterialCalendar: string;
    openBaltimoreExtraSites: string;
  };
};

let cached: BaltimoreDropOffOfficial | null = null;

export function loadBaltimoreDropOffOfficial(): BaltimoreDropOffOfficial | null {
  if (cached) return cached;
  if (!fs.existsSync(DATA_PATH)) return null;
  try {
    cached = JSON.parse(
      fs.readFileSync(DATA_PATH, "utf8")
    ) as BaltimoreDropOffOfficial;
    return cached;
  } catch {
    return null;
  }
}

export function getResidentialHoursByObjectId(
  objectId: string
): ResidentialCenterHours | undefined {
  const data = loadBaltimoreDropOffOfficial();
  return data?.residentialCentersHours.find((c) => c.objectId === objectId);
}
