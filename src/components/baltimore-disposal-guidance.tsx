"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DescriptionClassification } from "@/lib/description-classification";
import {
  fetchDisposalGuidance,
  type DisposalGuidanceClientResult,
} from "@/lib/disposal-guidance-client";
import type { DisposalGuidanceResponse } from "@/app/api/disposal-guidance/route";
import {
  isCurbsideDisposalMethod,
  resolveDisposalMethod,
} from "@/lib/disposal-method";
import { isInsideBaltimore } from "@/lib/baltimore-geocode";

type BaltimoreDisposalGuidanceProps = {
  classification: DescriptionClassification;
  /** Fired when a Baltimore City location was used for guidance. */
  onBaltimoreLocationConfirmed?: () => void;
  /** Fired when GPS coordinates are outside Baltimore City. */
  onOutsideBaltimore?: () => void;
};

type GeoStatus = "idle" | "requesting" | "denied" | "error" | "ready";

export function BaltimoreDisposalGuidance({
  classification,
  onBaltimoreLocationConfirmed,
  onOutsideBaltimore,
}: BaltimoreDisposalGuidanceProps) {
  const disposalPreview = resolveDisposalMethod(classification);
  const showCollectionDays = isCurbsideDisposalMethod(disposalPreview.method);

  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<DisposalGuidanceResponse | null>(
    null
  );
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

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
      setGuidance(null);
      setError(result.errorMessage);
      return;
    }
    setGuidance(result.guidance);
    onBaltimoreLocationConfirmed?.();
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
          setGeoMessage(
            "Your location appears outside Baltimore City. General disposal guidance above applies; enter a Baltimore address here for city drop-off centers."
          );
          onOutsideBaltimore?.();
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
    setGuidance(null);
    setError(null);
    setGeoStatus("idle");
    setGeoCoords(null);
    setGeoMessage(null);
  }, [classification.objectName, classification.class, classification.category]);

  return (
    <div
      className="mt-6 space-y-4 rounded-lg border border-[#1a3d2e]/25 bg-white px-4 py-4"
      aria-live="polite"
    >
      <div>
        <p className="text-sm font-semibold text-[#1a3d2e]">
          Baltimore disposal next steps
        </p>
        <p className="mt-1 text-sm text-black/70">
          Based on your item classification — use your location or add your
          address for the nearest drop-off center
          {showCollectionDays
            ? " and your curbside collection days"
            : ", hours, and drop-off alerts"}
          .
        </p>
      </div>

      {guidance ? (
        <div className="space-y-4 text-sm">
          <section className="rounded-lg bg-[#1a3d2e]/10 px-4 py-3">
            <p className="font-semibold text-[#1a3d2e]">
              {guidance.disposal.headline}
            </p>
            <p className="mt-2 text-black/80">{guidance.disposal.detail}</p>
          </section>

          {guidance.location && (
            <p className="text-xs text-black/55">
              Location: {guidance.location.displayName}
            </p>
          )}

          {guidance.dropOffWarnings.length > 0 && (
            <section className="space-y-2" role="status">
              <p className="font-semibold text-[#1a3d2e]">Drop-off alerts</p>
              {guidance.dropOffWarnings.map((w, i) => (
                <div
                  key={`${w.title}-${i}`}
                  className={
                    w.severity === "warning"
                      ? "rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-amber-950"
                      : "rounded-lg border border-black/10 bg-black/[0.03] px-3 py-2 text-black/75"
                  }
                >
                  <p className="font-medium">{w.title}</p>
                  <p className="mt-1">{w.message}</p>
                  {w.nextOpen ? (
                    <p className="mt-1 text-xs font-medium opacity-90">
                      Next window: {w.nextOpen}
                    </p>
                  ) : null}
                </div>
              ))}
            </section>
          )}

          {guidance.hhwSummary && (
            <p className="text-xs text-black/60">
              HHW schedule (city): {guidance.hhwSummary}
            </p>
          )}

          {guidance.dataLimitationNote && (
            <p className="text-xs text-black/55">{guidance.dataLimitationNote}</p>
          )}

          {isCurbsideDisposalMethod(guidance.disposal.method) ? (
            <section>
              <p className="font-semibold text-[#1a3d2e]">Collection days</p>
              {guidance.schedule.ok ? (
                <ul className="mt-2 list-inside list-disc space-y-1 text-black/80">
                  <li>
                    <span className="font-medium">Trash:</span>{" "}
                    {guidance.schedule.trashDay}
                  </li>
                  <li>
                    <span className="font-medium">Recycling:</span>{" "}
                    {guidance.schedule.recycDay}
                  </li>
                  {guidance.schedule.daytext ? (
                    <li className="list-none pl-0 text-black/65">
                      {guidance.schedule.daytext}
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p className="mt-2 text-amber-900">
                  {guidance.schedule.message}
                </p>
              )}
            </section>
          ) : null}

          <section>
            <p className="font-semibold text-[#1a3d2e]">
              Nearest drop-off center
            </p>
            {guidance.nearestCenter.ok ? (
              <div className="mt-2 space-y-2 text-black/80">
                <p className="font-medium">{guidance.nearestCenter.name}</p>
                <p>{guidance.nearestCenter.address}</p>
                {guidance.nearestCenter.hoursSummary ? (
                  <p className="text-black/60">
                    Posted hours: {guidance.nearestCenter.hoursSummary}
                  </p>
                ) : (
                  <p className="text-black/60">
                    Hours for this site are not on the city&apos;s five-center
                    residential list — confirm on the city site before visiting.
                  </p>
                )}
                <p className="text-black/60">
                  About {guidance.nearestCenter.distanceMiles} mi away
                  (straight-line).
                </p>
                <a
                  href={guidance.nearestCenter.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-medium text-[#1a3d2e] underline underline-offset-2"
                >
                  Open directions in Google Maps
                </a>
              </div>
            ) : (
              <p className="mt-2 text-amber-900">
                {guidance.nearestCenter.message}
              </p>
            )}
          </section>

          {guidance.dataErrors.length > 0 && (
            <p className="text-xs text-amber-900" role="status">
              Data note: {guidance.dataErrors.join(" ")}
            </p>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          disabled={loading || geoStatus === "requesting"}
          onClick={() => requestGeolocation()}
          className="h-11 border-[#1a3d2e]/30 bg-white text-[#1a3d2e] hover:bg-[#1a3d2e]/5"
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
        className="h-11 w-full bg-black text-white hover:bg-black/90 sm:w-auto sm:min-w-[12rem]"
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
