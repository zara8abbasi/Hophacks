"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-card";
import { celebrateDisposal } from "@/lib/celebrate-disposal";
import {
  btnOutlineForestClass,
  btnPrimaryClass,
} from "@/lib/hophacks-ui";
import { clearLocationGuidanceSession } from "@/lib/location-guidance-session";
import { AtHomeDisposalCard } from "@/components/at-home-disposal-card";
import { GeneralDisposalGuidance } from "@/components/general-disposal-guidance";
import { BaltimoreGuidanceDisplay } from "@/components/baltimore-guidance-display";
import type { LocationGuidanceSession } from "@/lib/location-guidance-session";

type LocationGuidanceViewProps = {
  session: LocationGuidanceSession;
};

const DISPOSED_NAV_DELAY_MS = 1100;

export function LocationGuidanceView({ session }: LocationGuidanceViewProps) {
  const router = useRouter();
  const [disposing, setDisposing] = useState(false);
  const { classification, origin, scope, guidance, locationNote } = session;
  const inBaltimore = scope === "baltimore" && guidance;

  function handleDisposed() {
    if (disposing) return;
    setDisposing(true);
    celebrateDisposal();
    window.setTimeout(() => {
      clearLocationGuidanceSession();
      router.push("/disposed");
    }, DISPOSED_NAV_DELAY_MS);
  }

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
