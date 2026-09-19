"use client";

import { useState } from "react";
import { HopHacksShell } from "@/components/hophacks-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClassificationOutcomeActions } from "@/components/classification-outcome-actions";
import { useDisposalResultNavigation } from "@/hooks/use-disposal-result-navigation";
import { DescriptionClassificationPanel } from "@/components/description-classification-panel";
import { classifyDescriptionFromText } from "@/lib/classify-description-client";
import {
  classificationAfterDeclinedClarification,
  isDeclinedClarificationAnswer,
  mergeDescriptionWithClarification,
} from "@/lib/description-classification";
import type { DescriptionClassification } from "@/lib/description-classification";

type FlowStatus = "idle" | "loading" | "success" | "validation_error" | "api_error";

export default function TypePage() {
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<FlowStatus>("idle");
  const [classification, setClassification] =
    useState<DescriptionClassification | null>(null);
  const [source, setSource] = useState<"live" | "mock" | null>(null);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [originalInput, setOriginalInput] = useState("");

  async function runClassification(
    text: string,
    options?: { keepPrevious?: boolean }
  ) {
    setStatus("loading");
    if (!options?.keepPrevious) {
      setClassification(null);
      setSource(null);
    }
    setApiErrorMessage(null);

    const result = await classifyDescriptionFromText(text);
    if (!result.ok) {
      setStatus(
        result.errorMessage.includes("enter") ? "validation_error" : "api_error"
      );
      setApiErrorMessage(
        result.errorMessage.includes("enter") ? null : result.errorMessage
      );
      return;
    }

    setClassification(result.classification);
    setSource(result.source);
    setStatus("success");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) {
      setStatus("validation_error");
      setClassification(null);
      setSource(null);
      setApiErrorMessage(null);
      return;
    }

    setOriginalInput(trimmed);
    await runClassification(trimmed);
  }

  function handleTryAgain() {
    setClassification(null);
    setSource(null);
    setApiErrorMessage(null);
    setStatus("idle");
    setOriginalInput("");
  }

  async function handleClarification(answer: string) {
    if (classification && isDeclinedClarificationAnswer(answer)) {
      setClassification(classificationAfterDeclinedClarification(classification));
      setStatus("success");
      return;
    }
    const merged = mergeDescriptionWithClarification(originalInput, answer);
    setDescription(merged);
    await runClassification(merged, { keepPrevious: true });
  }

  const showOutcomePanel =
    (status === "success" || status === "loading") &&
    classification &&
    source &&
    (classification.status === "identified" ||
      classification.status === "unsure" ||
      classification.status === "needs_clarification");

  useDisposalResultNavigation({
    classification,
    source,
    origin: "/type",
    inputSummary: originalInput || description,
    enabled: status === "success",
  });

  return (
    <HopHacksShell showBack>
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/20 bg-white/95 p-6 text-black shadow-lg sm:p-8"
      >
        <h1 className="text-2xl font-bold tracking-tight">Type A Description</h1>
        <p className="mt-2 text-sm text-black/70 sm:text-base">
          Describe what you want to throw away—material, condition, and anything
          on the label. We&apos;ll identify the item and classify it for Baltimore
          disposal rules next.
        </p>

        <label className="mt-6 block text-sm font-medium" htmlFor="item-description">
          What are you trying to dispose of?
        </label>
        <Textarea
          id="item-description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (status === "validation_error") {
              setStatus("idle");
            }
          }}
          placeholder="Example: cracked #5 plastic takeout container, greasy"
          rows={5}
          className="mt-2 min-h-[140px] resize-y border-black/15 bg-white text-base"
          aria-invalid={status === "validation_error"}
          aria-describedby={
            status === "validation_error" ? "desc-error" : undefined
          }
          disabled={status === "loading"}
        />

        {status === "validation_error" && (
          <p id="desc-error" className="mt-2 text-sm text-red-700" role="alert">
            Please enter a short description before continuing.
          </p>
        )}

        {status === "loading" && (
          <p className="mt-4 text-sm text-black/60" aria-live="polite">
            Identifying your item with Grok…
          </p>
        )}

        {status === "api_error" && apiErrorMessage && (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {apiErrorMessage}
          </p>
        )}

        {showOutcomePanel && (
          <div className="mt-6">
            <DescriptionClassificationPanel
              classification={classification}
              source={source}
            />
            <ClassificationOutcomeActions
              classification={classification}
              busy={status === "loading"}
              tryAgainLabel="Try again with new description"
              onTryAgain={handleTryAgain}
              onSubmitClarification={handleClarification}
            />
          </div>
        )}

        {classification?.status !== "needs_clarification" ? (
          <Button
            type="submit"
            disabled={status === "loading"}
            className="mt-6 h-11 w-full bg-black text-white hover:bg-black/90 sm:w-auto sm:min-w-[12rem]"
          >
            {status === "loading" ? "Classifying…" : "Classify item"}
          </Button>
        ) : null}
      </form>
    </HopHacksShell>
  );
}
