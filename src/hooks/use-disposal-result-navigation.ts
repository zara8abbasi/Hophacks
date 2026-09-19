"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  isClassificationReadyForDisposal,
  type DescriptionClassification,
} from "@/lib/description-classification";
import {
  saveDisposalResultSession,
  type DisposalResultOrigin,
} from "@/lib/disposal-result-session";

type UseDisposalResultNavigationArgs = {
  classification: DescriptionClassification | null;
  source: "live" | "mock" | null;
  origin: DisposalResultOrigin;
  inputSummary?: string;
  photoPreviewUrl?: string | null;
  enabled: boolean;
};

export function useDisposalResultNavigation({
  classification,
  source,
  origin,
  inputSummary,
  photoPreviewUrl,
  enabled,
}: UseDisposalResultNavigationArgs): void {
  const router = useRouter();
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (!enabled || navigatedRef.current) return;
    if (!classification || !source) return;
    if (!isClassificationReadyForDisposal(classification)) return;

    navigatedRef.current = true;
    saveDisposalResultSession({
      classification,
      source,
      origin,
      inputSummary: inputSummary?.trim() || undefined,
      photoPreviewUrl: photoPreviewUrl ?? undefined,
    });
    router.push("/result");
  }, [
    classification,
    source,
    origin,
    inputSummary,
    photoPreviewUrl,
    enabled,
    router,
  ]);
}
