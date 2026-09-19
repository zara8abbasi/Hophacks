"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1a3d2e]">
          Disposal guidance
        </h1>
        <p className="mt-2 text-sm text-black/70 sm:text-base">
          How to handle{" "}
          <span className="font-medium text-[#1a3d2e]">
            {classification.objectName}
          </span>{" "}
          based on {originLabel}.
        </p>
      </div>

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
            className="space-y-4 rounded-lg border border-[#1a3d2e]/25 bg-white px-4 py-4"
            aria-live="polite"
          >
            <p className="text-sm font-semibold text-[#1a3d2e]">
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
        className="inline-block text-sm font-medium text-[#1a3d2e] underline underline-offset-2"
      >
        ← Identify another item
      </Link>
    </div>
  );
}
