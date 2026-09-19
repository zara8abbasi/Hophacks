"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-card";
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
      <PageHeader
        title="Location-based disposal"
        description="Drop-off centers and collection details for your item based on where you are—no need to identify it again."
      />

      <AtHomeDisposalCard classification={classification} />

      {inBaltimore ? (
        <>
          <p className="text-sm text-black/65">
            Baltimore City drop-off and collection details are below. Hazardous
            or electronic items may still need special handling even when
            curbside pickup applies.
          </p>
          <div
            className="space-y-4 rounded-xl border border-[var(--litter-forest)]/15 bg-white px-4 py-4 shadow-sm"
            aria-live="polite"
          >
            <p className="text-sm font-semibold text-[var(--litter-forest)]">
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
          className="text-sm font-medium text-[var(--litter-forest)] underline decoration-[var(--litter-forest)]/30 underline-offset-4 hover:decoration-[var(--litter-forest)]"
        >
          ← Back to disposal guidance
        </Link>
        <Link
          href={origin}
          className="text-sm font-medium text-[var(--litter-forest)] underline decoration-[var(--litter-forest)]/30 underline-offset-4 hover:decoration-[var(--litter-forest)]"
        >
          Identify another item
        </Link>
      </div>
    </div>
  );
}
