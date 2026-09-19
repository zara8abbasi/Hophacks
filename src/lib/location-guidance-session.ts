import type { DescriptionClassification } from "@/lib/description-classification";
import type { DisposalGuidanceResponse } from "@/app/api/disposal-guidance/route";
import type { DisposalResultOrigin } from "@/lib/disposal-result-session";

const STORAGE_KEY = "hophacks-location-guidance";

export type LocationScope = "baltimore" | "outside_baltimore";

export type LocationGuidanceSession = {
  classification: DescriptionClassification;
  origin: DisposalResultOrigin;
  scope: LocationScope;
  guidance: DisposalGuidanceResponse | null;
  locationNote?: string;
  savedAt: number;
};

export function saveLocationGuidanceSession(
  payload: Omit<LocationGuidanceSession, "savedAt">
): void {
  if (typeof window === "undefined") return;
  const session: LocationGuidanceSession = {
    ...payload,
    savedAt: Date.now(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadLocationGuidanceSession(): LocationGuidanceSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocationGuidanceSession;
    if (
      !parsed?.classification?.objectName ||
      !parsed.classification.category ||
      !parsed.classification.class ||
      (parsed.scope !== "baltimore" && parsed.scope !== "outside_baltimore")
    ) {
      return null;
    }
    if (parsed.scope === "baltimore" && !parsed.guidance) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearLocationGuidanceSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
