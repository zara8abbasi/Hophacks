"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  btnOutlineForestClass,
  btnPrimaryClass,
  insetPanelClass,
} from "@/lib/hophacks-ui";
import type { DescriptionClassification } from "@/lib/description-classification";
import {
  fetchDisposalGuidance,
  type DisposalGuidanceClientResult,
} from "@/lib/disposal-guidance-client";
import {
  isCurbsideDisposalMethod,
  resolveDisposalMethod,
} from "@/lib/disposal-method";
import { isInsideBaltimore } from "@/lib/baltimore-geocode";
import type { DisposalResultOrigin } from "@/lib/disposal-result-session";
import {
  saveLocationGuidanceSession,
  type LocationGuidanceSession,
} from "@/lib/location-guidance-session";

type BaltimoreDisposalGuidanceProps = {
  classification: DescriptionClassification;
  origin: DisposalResultOrigin;
  /** Fired when a Baltimore City location was used for guidance. */
  onBaltimoreLocationConfirmed?: () => void;
  /** Fired when GPS coordinates are outside Baltimore City. */
  onOutsideBaltimore?: () => void;
  /** When set, show guidance on the same page instead of navigating to /guidance. */
  onGuidanceResolved?: (payload: Omit<LocationGuidanceSession, "savedAt">) => void;
  /** Compact header when location is the first block on the page. */
  placement?: "default" | "top";
};

type GeoStatus = "idle" | "requesting" | "denied" | "error" | "ready";

export function BaltimoreDisposalGuidance({
  classification,
  origin,
  onBaltimoreLocationConfirmed,
  onOutsideBaltimore,
  onGuidanceResolved,
  placement = "default",
}: BaltimoreDisposalGuidanceProps) {
  const router = useRouter();
  const disposalPreview = resolveDisposalMethod(classification);
  const showCollectionDays = isCurbsideDisposalMethod(disposalPreview.method);

  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  function deliverLocationGuidance(
    payload: Omit<LocationGuidanceSession, "savedAt">
  ) {
    saveLocationGuidanceSession(payload);
    if (onGuidanceResolved) {
      onGuidanceResolved(payload);
      return;
    }
    router.push("/guidance");
  }

  async function loadGuidance(
    location:
      | { mode: "address"; address: string }
      | { mode: "coordinates"; lat: number; lng: number }
  ) {
    setLoading(true);
    setError(null);
    const result: DisposalGuidanceClientResult = await fetchDisposalGuidance(
      classification,
      location
    );
    setLoading(false);
    if (!result.ok) {
      if (result.reason === "outside_baltimore") {
        onOutsideBaltimore?.();
        deliverLocationGuidance({
          classification,
          origin,
          scope: "outside_baltimore",
          guidance: null,
          locationNote: result.errorMessage,
        });
        return;
      }
      setError(result.errorMessage);
      return;
    }
    onBaltimoreLocationConfirmed?.();
    deliverLocationGuidance({
      classification,
      origin,
      scope: "baltimore",
      guidance: result.guidance,
    });
  }

  function requestGeolocation() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoMessage("This browser does not support geolocation.");
      return;
    }
    setGeoStatus("requesting");
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (!isInsideBaltimore(lat, lng)) {
          setGeoCoords(null);
          setGeoStatus("error");
          const note =
            "Your location appears outside Baltimore City. General disposal guidance applies.";
          setGeoMessage(note);
          onOutsideBaltimore?.();
          deliverLocationGuidance({
            classification,
            origin,
            scope: "outside_baltimore",
            guidance: null,
            locationNote: note,
          });
          return;
        }
        setGeoCoords({ lat, lng });
        setGeoStatus("ready");
        setGeoMessage("Using your device location for the nearest center.");
        void loadGuidance({ mode: "coordinates", lat, lng });
      },
      (err) => {
        setGeoCoords(null);
        setGeoStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
        setGeoMessage(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — enter a Baltimore address below."
            : "Could not read your location. Try typing an address instead."
        );
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 }
    );
  }

  useEffect(() => {
    setError(null);
    setGeoStatus("idle");
    setGeoCoords(null);
    setGeoMessage(null);
  }, [classification.objectName, classification.class, classification.category]);

  return (
    <div
      className={
        placement === "top"
          ? `space-y-4 ${insetPanelClass} px-4 py-4`
          : "mt-6 space-y-4 rounded-xl border border-[var(--litter-forest)]/15 bg-white px-4 py-4 shadow-sm"
      }
      aria-live="polite"
    >
      <div>
        <p className="text-sm font-semibold text-[var(--litter-forest)]">
          {placement === "top" ? "Your location" : "Baltimore disposal next steps"}
        </p>
        <p className="mt-1 text-sm text-black/70">
          Use your location or enter a Baltimore address for the nearest drop-off
          center
          {showCollectionDays
            ? " and your curbside collection days"
            : ", hours, and drop-off alerts"}
          {placement === "top"
            ? ". Local details appear below once we resolve your location."
            : ". You'll see full location guidance on the next screen."}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          disabled={loading || geoStatus === "requesting"}
          onClick={() => requestGeolocation()}
          className={btnOutlineForestClass}
        >
          {geoStatus === "requesting"
            ? "Getting location…"
            : geoCoords
              ? "Refresh my location"
              : "Use my location"}
        </Button>
        {geoMessage && (
          <p className="text-xs text-black/60" role="status">{geoMessage}</p>
        )}
      </div>

      <label className="block text-sm font-medium" htmlFor="baltimore-address">
        Baltimore address (if you skip GPS)
      </label>
      <Input
        id="baltimore-address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Example: 100 N Holliday St, Baltimore, MD"
        disabled={loading}
        className="border-black/15 bg-white text-base"
      />

      {error && (
        <p className="text-sm text-red-700" role="alert">{error}</p>
      )}

      <Button
        type="button"
        disabled={loading || !address.trim()}
        onClick={() =>
          void loadGuidance({ mode: "address", address: address.trim() })
        }
        className={`w-full sm:w-auto sm:min-w-[12rem] ${btnPrimaryClass}`}
      >
        {loading
          ? "Looking up…"
          : showCollectionDays
            ? "Get collection & drop-off info"
            : "Get drop-off info"}
      </Button>
    </div>
  );
}
