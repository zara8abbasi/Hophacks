"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-card";
import { BaltimoreDisposalGuidance } from "@/components/baltimore-disposal-guidance";
import { BaltimoreGuidanceDisplay } from "@/components/baltimore-guidance-display";
import { AtHomeDisposalCard } from "@/components/at-home-disposal-card";
import { GeneralDisposalGuidance } from "@/components/general-disposal-guidance";
import type { DisposalResultSession } from "@/lib/disposal-result-session";
import type { LocationGuidanceSession } from "@/lib/location-guidance-session";

type DisposalResultViewProps = {
  session: DisposalResultSession;
};

export function DisposalResultView({ session }: DisposalResultViewProps) {
  const { classification, origin } = session;

  const [baltimoreConfirmed, setBaltimoreConfirmed] = useState(false);
  const [outsideBaltimoreGps, setOutsideBaltimoreGps] = useState(false);
  const [locationGuidance, setLocationGuidance] = useState<
    Omit<LocationGuidanceSession, "savedAt"> | null
  >(null);

  const originLabel = useMemo(() => {
    switch (origin) {
      case "/type":
        return "typed description";
      case "/picture":
        return "photo";
      case "/speech":
        return "voice description";
      default:
        return "your input";
    }
  }, [origin]);

  const showGeneralPrimary = !baltimoreConfirmed || outsideBaltimoreGps;
  const inBaltimore =
    locationGuidance?.scope === "baltimore" && locationGuidance.guidance;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disposal guidance"
        description={
          <>
            How to handle{" "}
            <span className="font-semibold text-[var(--litter-forest)]">
              {classification.objectName}
            </span>{" "}
            based on your {originLabel}.
          </>
        }
      />

      <BaltimoreDisposalGuidance
        classification={classification}
        origin={origin}
        placement="top"
        onGuidanceResolved={(payload) => {
          setLocationGuidance(payload);
        }}
        onBaltimoreLocationConfirmed={() => {
          setBaltimoreConfirmed(true);
          setOutsideBaltimoreGps(false);
        }}
        onOutsideBaltimore={() => setOutsideBaltimoreGps(true)}
      />

      <AtHomeDisposalCard classification={classification} />

      {showGeneralPrimary ? (
        <GeneralDisposalGuidance classification={classification} />
      ) : (
        <p className="text-sm text-black/65">
          Baltimore City local drop-off and collection details are below. Rules
          still follow general safety guidance for hazardous or electronic items.
        </p>
      )}

      {outsideBaltimoreGps && !baltimoreConfirmed ? (
        <p className="text-sm text-amber-950" role="status">
          GPS shows you outside Baltimore City — general disposal is your primary
          answer. Enter a Baltimore address above only if you need city-specific
          centers.
        </p>
      ) : null}

      {locationGuidance ? (
        inBaltimore ? (
          <div
            className="space-y-4 rounded-xl border border-[var(--litter-forest)]/15 bg-white px-4 py-4 shadow-sm"
            aria-live="polite"
          >
            <p className="text-sm font-semibold text-[var(--litter-forest)]">
              Baltimore disposal details
            </p>
            <BaltimoreGuidanceDisplay guidance={locationGuidance.guidance!} />
          </div>
        ) : (
          <div className="space-y-3" aria-live="polite">
            {locationGuidance.locationNote ? (
              <p className="text-sm text-amber-950" role="status">
                {locationGuidance.locationNote}
              </p>
            ) : (
              <p className="text-sm text-amber-950" role="status">
                Your location is outside Baltimore City. Use general guidance
                above and check your local municipality for drop-off options.
              </p>
            )}
          </div>
        )
      ) : null}

      <Link
        href={origin}
        className="inline-flex text-sm font-medium text-[var(--litter-forest)] underline decoration-[var(--litter-forest)]/30 underline-offset-4 hover:decoration-[var(--litter-forest)]"
      >
        ← Identify another item
      </Link>
    </div>
  );
}
