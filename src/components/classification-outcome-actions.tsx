"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DescriptionClassification } from "@/lib/description-classification";

type ClassificationOutcomeActionsProps = {
  classification: DescriptionClassification;
  onTryAgain: () => void;
  onSubmitClarification: (answer: string) => void | Promise<void>;
  tryAgainLabel: string;
  busy?: boolean;
};

export function ClassificationOutcomeActions({
  classification,
  onTryAgain,
  onSubmitClarification,
  tryAgainLabel,
  busy = false,
}: ClassificationOutcomeActionsProps) {
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const status = classification.status ?? "identified";

  if (status === "identified") {
    return null;
  }

  if (status === "unsure") {
    return (
      <div
        className="mt-4 space-y-4 rounded-lg border border-[#1a3d2e]/25 bg-[#e8dcc8]/50 px-4 py-4"
        role="status"
      >
        <p className="text-sm font-medium text-[#1a3d2e]">
          Grok isn&apos;t confident enough to classify this item (confidence{" "}
          {classification.confidence}%).
        </p>
        <p className="text-sm text-black/70">
          Add more detail about material, condition, or labels—or try again with
          a clearer description.
        </p>
        <Button
          type="button"
          onClick={onTryAgain}
          disabled={busy}
          className="h-11 w-full bg-black text-white hover:bg-black/90 sm:w-auto sm:min-w-[12rem]"
        >
          {tryAgainLabel}
        </Button>
      </div>
    );
  }

  return (
    <div
      className="mt-4 space-y-4 rounded-lg border border-[#1a3d2e]/25 bg-[#e8dcc8]/50 px-4 py-4"
      role="status"
    >
      <p className="text-sm font-medium text-[#1a3d2e]">
        We need a bit more detail before disposal rules are clear.
      </p>
      <p className="text-sm text-black/80">{classification.clarifyingQuestion}</p>
      <label className="block text-sm font-medium" htmlFor="clarification-answer">
        Your answer
      </label>
      <Input
        id="clarification-answer"
        value={clarificationAnswer}
        onChange={(e) => setClarificationAnswer(e.target.value)}
        placeholder="Example: The paint can is empty and dry"
        disabled={busy}
        className="border-black/15 bg-white text-base"
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          disabled={busy || !clarificationAnswer.trim()}
          onClick={() => void onSubmitClarification(clarificationAnswer.trim())}
          className="h-11 flex-1 bg-black text-white hover:bg-black/90"
        >
          {busy ? "Classifying…" : "Submit answer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onTryAgain}
          disabled={busy}
          className="h-11 flex-1 border-black/20 bg-white text-black"
        >
          {tryAgainLabel}
        </Button>
      </div>
    </div>
  );
}
