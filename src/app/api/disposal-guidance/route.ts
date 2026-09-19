import { NextResponse } from "next/server";
import {
  loadDropOffCenters,
  loadRecyclingDayZones,
} from "@/lib/baltimore-csv";
import { geocodeBaltimoreAddress } from "@/lib/baltimore-geocode";
import { resolveDisposalMethod } from "@/lib/disposal-method";
import type { DescriptionClassification } from "@/lib/description-classification";
import { findNearestDropOffCenter } from "@/lib/nearest-drop-off";
import { lookupRecyclingSchedule } from "@/lib/recycling-schedule";

export type DisposalGuidanceResponse = {
  disposal: ReturnType<typeof resolveDisposalMethod>;
  schedule:
    | {
        ok: true;
        trashDay: string;
        recycDay: string;
        daytext: string;
      }
    | { ok: false; message: string };
  nearestCenter:
    | {
        ok: true;
        name: string;
        address: string;
        url: string;
        distanceMiles: number;
        directionsUrl: string;
      }
    | { ok: false; message: string };
  location: { displayName: string; lat: number; lng: number } | null;
  dataErrors: string[];
};

export async function POST(request: Request) {
  let body: {
    classification?: DescriptionClassification;
    address?: string;
    lat?: number;
    lng?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const classification = body.classification;
  if (
    !classification?.objectName ||
    !classification.category ||
    !classification.class
  ) {
    return NextResponse.json(
      { error: "Missing classification fields." },
      { status: 400 }
    );
  }

  const dataErrors: string[] = [];
  const { centers, error: centersError } = loadDropOffCenters();
  if (centersError) dataErrors.push(centersError.message);

  const { zones, error: zonesError } = loadRecyclingDayZones();
  if (zonesError) dataErrors.push(zonesError.message);

  const disposal = resolveDisposalMethod(classification);

  let lat = body.lat;
  let lng = body.lng;
  let displayName: string | null = null;

  if (body.address?.trim()) {
    const geo = await geocodeBaltimoreAddress(body.address);
    if (!geo.ok) {
      return NextResponse.json(
        {
          error: geo.message,
          reason: geo.reason,
          disposal,
          dataErrors,
        },
        { status: geo.reason === "empty" ? 400 : 422 }
      );
    }
    lat = geo.lat;
    lng = geo.lng;
    displayName = geo.displayName;
  } else if (
    lat === undefined ||
    lng === undefined ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return NextResponse.json(
      {
        error:
          "Add a Baltimore address or latitude/longitude to see collection days and the nearest drop-off center.",
        reason: "address_required",
        disposal,
        dataErrors,
      },
      { status: 400 }
    );
  } else {
    displayName = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  let schedule: DisposalGuidanceResponse["schedule"];
  if (zonesError || !zones.length) {
    schedule = {
      ok: false,
      message:
        zonesError?.message ??
        "Collection schedule data could not be loaded from CSV.",
    };
  } else {
    const result = await lookupRecyclingSchedule(lat, lng, zones);
    schedule = result.ok
      ? {
          ok: true,
          trashDay: result.trashDay,
          recycDay: result.recycDay,
          daytext: result.daytext,
        }
      : { ok: false, message: result.message };
  }

  let nearestCenter: DisposalGuidanceResponse["nearestCenter"];
  if (centersError || !centers.length) {
    nearestCenter = {
      ok: false,
      message:
        centersError?.message ??
        "Drop-off center list could not be loaded from CSV.",
    };
  } else {
    const nearest = findNearestDropOffCenter(lat, lng, centers);
    nearestCenter = nearest
      ? {
          ok: true,
          name: nearest.center.name,
          address: nearest.center.address,
          url: nearest.center.url,
          distanceMiles: Math.round(nearest.distanceMiles * 10) / 10,
          directionsUrl: nearest.directionsUrl,
        }
      : {
          ok: false,
          message: "No drop-off centers found in the loaded data.",
        };
  }

  const payload: DisposalGuidanceResponse = {
    disposal,
    schedule,
    nearestCenter,
    location: displayName ? { displayName, lat, lng } : null,
    dataErrors,
  };

  return NextResponse.json(payload);
}
