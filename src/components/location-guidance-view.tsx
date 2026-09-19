"use client";

import Link from "next/link";
import { AtHomeDisposalCard } from "@/components/at-home-disposal-card";
import { GeneralDisposalGuidance } from "@/components/general-disposal-guidance";
import { BaltimoreGuidanceDisplay } from "@/components/baltimore-guidance-display";
import type { LocationGuidanceSession } from "@/lib/location-guidance-session";

type LocationGuidanceViewProps = {
  session: LocationGuidanceSession;
};

export function LocationGuidanceView({ session }: LocationGuidanceViewProps) {
  const { classification, origin, scope, guidance, locationNote } = session;
  const inBaltimore = scope === "baltimore" && guidance;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Location-based disposal
        </h1>
        <p className="mt-2 text-sm text-black/70 sm:text-base">
          How to dispose of your item based on where you are — no need to
          re-identify it here.
        </p>
      </div>

      <AtHomeDisposalCard classification={classification} />

      {inBaltimore ? (
        <>
          <p className="text-sm text-black/65">
            Baltimore City drop-off and collection details are below. Hazardous
            or electronic items may still need special handling even when
            curbside pickup applies.
          </p>
          <div
            className="space-y-4 rounded-lg border border-[#1a3d2e]/25 bg-white px-4 py-4"
            aria-live="polite"
          >
            <p className="text-sm font-semibold text-[#1a3d2e]">
              Baltimore disposal details
            </p>
            <BaltimoreGuidanceDisplay guidance={guidance} />
          </div>
        </>
      ) : (
        <>
          {locationNote ? (
            <p className="text-sm text-amber-950" role="status">
              {locationNote}
            </p>
          ) : (
            <p className="text-sm text-amber-950" role="status">
              Your location is outside Baltimore City. Use general guidance below
              and check your local municipality for drop-off options.
            </p>
          )}
          <GeneralDisposalGuidance
            classification={classification}
            showBaltimoreHint={false}
          />
        </>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <Link
          href="/result"
          className="text-sm font-medium text-[#1a3d2e] underline underline-offset-2"
        >
          ← Back to disposal guidance
        </Link>
        <Link
          href={origin}
          className="text-sm font-medium text-[#1a3d2e] underline underline-offset-2"
        >
          Identify another item
        </Link>
      </div>
    </div>
  );
}
