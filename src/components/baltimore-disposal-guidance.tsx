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

type BaltimoreDisposalGuidanceProps = {
  classification: DescriptionClassification;
};

export function BaltimoreDisposalGuidance({
  classification,
}: BaltimoreDisposalGuidanceProps) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<DisposalGuidanceResponse | null>(
    null
  );

  async function loadGuidance() {
    setLoading(true);
    setError(null);
    const result: DisposalGuidanceClientResult = await fetchDisposalGuidance(
      classification,
      address
    );
    setLoading(false);
    if (!result.ok) {
      setGuidance(null);
      setError(result.errorMessage);
      return;
    }
    setGuidance(result.guidance);
  }

  useEffect(() => {
    setGuidance(null);
    setError(null);
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
          Based on your item classification — add your address for collection
          days and the nearest drop-off center.
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
              <p className="mt-2 text-amber-900">{guidance.schedule.message}</p>
            )}
          </section>

          <section>
            <p className="font-semibold text-[#1a3d2e]">
              Nearest drop-off center
            </p>
            {guidance.nearestCenter.ok ? (
              <div className="mt-2 space-y-2 text-black/80">
                <p className="font-medium">{guidance.nearestCenter.name}</p>
                <p>{guidance.nearestCenter.address}</p>
                <p className="text-black/60">
                  About {guidance.nearestCenter.distanceMiles} mi away
                  (straight-line). The centers CSV does not list accepted
                  materials per site — confirm hours and items on the city site.
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

      <label className="block text-sm font-medium" htmlFor="baltimore-address">
        Baltimore address or lat, lng
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
        onClick={() => void loadGuidance()}
        className="h-11 w-full bg-black text-white hover:bg-black/90 sm:w-auto sm:min-w-[12rem]"
      >
        {loading ? "Looking up…" : "Get collection & drop-off info"}
      </Button>
    </div>
  );
}
