"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-card";
import type { DisposalResultSession } from "@/lib/disposal-result-session";
import {
  clearDisposalResultSession,
  markDisposalIdentificationConfirmed,
} from "@/lib/disposal-result-session";
import { recycleReadoutSentence } from "@/lib/recycle-readout-sentence";
import { speakRecycleReadout } from "@/lib/recycle-readout-client";
import {
  btnOutlineForestClass,
  btnPrimaryClass,
  classificationPanelClass,
  insetPanelClass,
  sectionLabelClass,
} from "@/lib/hophacks-ui";

type IdentifyConfirmViewProps = {
  session: DisposalResultSession;
};

export function IdentifyConfirmView({ session }: IdentifyConfirmViewProps) {
  const router = useRouter();
  const { classification, origin, inputSummary, photoPreviewUrl } = session;

  const descriptionLabel = useMemo(() => {
    switch (origin) {
      case "/speech":
        return "Transcript";
      case "/picture":
        return "Photo context";
      default:
        return "Your description";
    }
  }, [origin]);

  function handleYes() {
    markDisposalIdentificationConfirmed();
    if (origin === "/speech") {
      void speakRecycleReadout(recycleReadoutSentence(classification));
    }
    router.push("/result");
  }

  function handleNo() {
    clearDisposalResultSession();
    router.replace(origin);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Confirm identification"
        description="Grok identified the item below. Does this match what you're trying to dispose of?"
      />

      {inputSummary ? (
        <blockquote className={`${insetPanelClass} px-4 py-3 text-sm text-black/85`}>
          <p className={sectionLabelClass}>{descriptionLabel}</p>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed">{inputSummary}</p>
        </blockquote>
      ) : null}

      {photoPreviewUrl ? (
        <div className="overflow-hidden rounded-xl border border-black/10 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoPreviewUrl}
            alt="Item you photographed"
            className="max-h-40 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="rounded-xl border border-[var(--litter-forest)]/15 bg-white px-4 py-4 shadow-sm">
        <p className={sectionLabelClass}>Identified item</p>
        <p className="mt-2 text-xl font-bold text-[var(--litter-forest)]">
          {classification.objectName}
        </p>
      </div>

      <div className={classificationPanelClass}>
        <p className="font-semibold">Classification</p>
        <dl className="mt-3 space-y-3">
          <div>
            <dt className={sectionLabelClass}>Category</dt>
            <dd className="mt-0.5 text-base font-medium">{classification.category}</dd>
          </div>
          <div>
            <dt className={sectionLabelClass}>Class</dt>
            <dd className="mt-0.5 text-base font-medium">{classification.class}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row-reverse">
        <Button
          type="button"
          onClick={handleYes}
          className={`flex-1 ${btnPrimaryClass}`}
        >
          Yes, that&apos;s correct
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleNo}
          className={`flex-1 ${btnOutlineForestClass}`}
        >
          No, try again
        </Button>
      </div>
    </div>
  );
}
