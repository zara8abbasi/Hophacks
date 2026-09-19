"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { DisposalResultSession } from "@/lib/disposal-result-session";
import {
  clearDisposalResultSession,
  markDisposalIdentificationConfirmed,
} from "@/lib/disposal-result-session";

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
        return "Description";
    }
  }, [origin]);

  function handleYes() {
    markDisposalIdentificationConfirmed();
    router.push("/result");
  }

  function handleNo() {
    clearDisposalResultSession();
    router.replace(origin);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1a3d2e]">
          Confirm identification
        </h1>
        <p className="mt-2 text-sm text-black/70 sm:text-base">
          Grok identified the item below. Is this what you&apos;re trying to
          dispose of?
        </p>
      </div>

      {inputSummary ? (
        <blockquote className="rounded-lg border border-[#1a3d2e]/20 bg-[#e8dcc8]/50 px-4 py-3 text-sm text-black/85">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1a3d2e]/70">
            {descriptionLabel}
          </p>
          <p className="mt-2 whitespace-pre-wrap">{inputSummary}</p>
        </blockquote>
      ) : null}

      {photoPreviewUrl ? (
        <div className="overflow-hidden rounded-xl border border-black/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoPreviewUrl}
            alt="Item you photographed"
            className="max-h-32 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="rounded-lg border border-[#1a3d2e]/25 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1a3d2e]/70">
          What it is
        </p>
        <p className="mt-2 text-xl font-bold text-[#1a3d2e]">
          {classification.objectName}
        </p>
      </div>

      <div className="rounded-lg bg-[#1a3d2e]/10 px-4 py-4 text-sm text-[#1a3d2e]">
        <p className="font-semibold">Classification</p>
        <dl className="mt-3 space-y-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[#1a3d2e]/70">
              Category
            </dt>
            <dd className="text-base font-medium">{classification.category}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[#1a3d2e]/70">
              Class
            </dt>
            <dd className="text-base font-medium">{classification.class}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={handleYes}
          className="h-12 flex-1 border-[#1a3d2e]/30 bg-white text-[#1a3d2e] hover:bg-[#1a3d2e]/5"
        >
          Yes, this is the right object
        </Button>
        <Button
          type="button"
          onClick={handleNo}
          className="h-12 flex-1 bg-black text-white hover:bg-black/90"
        >
          No, this is not the right object
        </Button>
      </div>
    </div>
  );
}
