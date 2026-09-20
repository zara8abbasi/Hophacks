"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-card";
import { celebrateDisposal } from "@/lib/celebrate-disposal";
import {
  btnOutlineForestClass,
  btnPrimaryClass,
} from "@/lib/hophacks-ui";
import { clearDisposalResultSession } from "@/lib/disposal-result-session";
import { BaltimoreDisposalGuidance } from "@/components/baltimore-disposal-guidance";
import { BaltimoreGuidanceDisplay } from "@/components/baltimore-guidance-display";
import { AtHomeDisposalCard } from "@/components/at-home-disposal-card";
import { GeneralDisposalGuidance } from "@/components/general-disposal-guidance";
import { VoiceRecycleReadout } from "@/components/voice-recycle-readout";
import type { DisposalResultSession } from "@/lib/disposal-result-session";
import type { LocationGuidanceSession } from "@/lib/location-guidance-session";

type DisposalResultViewProps = {
  session: DisposalResultSession;
};

const DISPOSED_NAV_DELAY_MS = 1100;

export function DisposalResultView({ session }: DisposalResultViewProps) {
  const router = useRouter();
  const { classification, origin } = session;
  const [disposing, setDisposing] = useState(false);

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

  function handleDisposed() {
    if (disposing) return;
    setDisposing(true);
    celebrateDisposal();
    window.setTimeout(() => {
      clearDisposalResultSession();
      router.push("/disposed");
    }, DISPOSED_NAV_DELAY_MS);
  }

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

      {origin === "/speech" ? (
        <VoiceRecycleReadout classification={classification} autoPlay />
      ) : null}

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

      <div className="flex flex-col gap-3 pt-1 sm:flex-row-reverse">
        <Button
          type="button"
          disabled={disposing}
          onClick={handleDisposed}
          className={`flex-1 ${btnPrimaryClass}`}
        >
          {disposing ? "Marking disposed…" : "Disposed of this item"}
        </Button>
        <Button
          render={<Link href={origin} />}
          nativeButton={false}
          variant="outline"
          className={`flex-1 ${btnOutlineForestClass}`}
        >
          Identify another item
        </Button>
      </div>
    </div>
  );
}
