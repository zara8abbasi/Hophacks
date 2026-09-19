"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CLARIFICATION_DONT_KNOW_ANSWER,
  type DescriptionClassification,
} from "@/lib/description-classification";

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
          Add more detail about material, condition, or labels—or choose
          &ldquo;I don&apos;t know&rdquo; for cautious drop-off guidance for the
          broader category.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void onSubmitClarification(CLARIFICATION_DONT_KNOW_ANSWER)}
            className="h-11 flex-1 border-[#1a3d2e]/30 bg-white text-[#1a3d2e] hover:bg-[#1a3d2e]/5"
          >
            I don&apos;t know
          </Button>
          <Button
            type="button"
            onClick={onTryAgain}
            disabled={busy}
            className="h-11 flex-1 bg-black text-white hover:bg-black/90"
          >
            {tryAgainLabel}
          </Button>
        </div>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          disabled={busy || !clarificationAnswer.trim()}
          onClick={() => void onSubmitClarification(clarificationAnswer.trim())}
          className="h-11 flex-1 bg-black text-white hover:bg-black/90 sm:min-w-[10rem]"
        >
          {busy ? "Classifying…" : "Submit answer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void onSubmitClarification(CLARIFICATION_DONT_KNOW_ANSWER)}
          className="h-11 flex-1 border-[#1a3d2e]/30 bg-white text-[#1a3d2e] hover:bg-[#1a3d2e]/5 sm:min-w-[10rem]"
        >
          I don&apos;t know
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onTryAgain}
          disabled={busy}
          className="h-11 flex-1 border-black/20 bg-white text-black sm:min-w-[10rem]"
        >
          {tryAgainLabel}
        </Button>
      </div>
    </div>
  );
}
