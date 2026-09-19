"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BaltimoreDisposalGuidance } from "@/components/baltimore-disposal-guidance";
import { AtHomeDisposalCard } from "@/components/at-home-disposal-card";
import { GeneralDisposalGuidance } from "@/components/general-disposal-guidance";
import { DescriptionClassificationPanel } from "@/components/description-classification-panel";
import type { DisposalResultSession } from "@/lib/disposal-result-session";

type DisposalResultViewProps = {
  session: DisposalResultSession;
};

export function DisposalResultView({ session }: DisposalResultViewProps) {
  const { classification, source, origin, inputSummary, photoPreviewUrl } =
    session;

  const [baltimoreConfirmed, setBaltimoreConfirmed] = useState(false);
  const [outsideBaltimoreGps, setOutsideBaltimoreGps] = useState(false);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Disposal results</h1>
        <p className="mt-2 text-sm text-black/70 sm:text-base">
          Here&apos;s how to handle{" "}
          <span className="font-medium text-[#1a3d2e]">
            {classification.objectName}
          </span>{" "}
          based on {originLabel}.
        </p>
      </div>

      {photoPreviewUrl ? (
        <div className="overflow-hidden rounded-xl border border-black/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoPreviewUrl}
            alt="Item you photographed"
            className="max-h-48 w-full object-cover"
          />
        </div>
      ) : null}

      {inputSummary ? (
        <blockquote className="rounded-lg border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/50">
            {origin === "/speech" ? "Transcript" : "Description"}
          </p>
          <p className="mt-2 whitespace-pre-wrap">{inputSummary}</p>
        </blockquote>
      ) : null}

      <DescriptionClassificationPanel
        classification={classification}
        source={source}
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
          answer. Enter a Baltimore address in the section below only if you
          need city-specific centers.
        </p>
      ) : null}

      <BaltimoreDisposalGuidance
        classification={classification}
        origin={origin}
        onBaltimoreLocationConfirmed={() => {
          setBaltimoreConfirmed(true);
          setOutsideBaltimoreGps(false);
        }}
        onOutsideBaltimore={() => setOutsideBaltimoreGps(true)}
      />

      <Link
        href={origin}
        className="inline-block text-sm font-medium text-[#1a3d2e] underline underline-offset-2"
      >
        ← Identify another item
      </Link>
    </div>
  );
}
