"use client";

import { useState } from "react";
import { HopHacksShell } from "@/components/hophacks-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ClassifyDescriptionResponse } from "@/app/api/classify-description/route";
import type { DescriptionClassification } from "@/lib/description-classification";

type FlowStatus = "idle" | "loading" | "success" | "validation_error" | "api_error";

export default function TypePage() {
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<FlowStatus>("idle");
  const [classification, setClassification] =
    useState<DescriptionClassification | null>(null);
  const [source, setSource] = useState<"live" | "mock" | null>(null);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

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

    setStatus("loading");
    setClassification(null);
    setSource(null);
    setApiErrorMessage(null);

    try {
      const res = await fetch("/api/classify-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed }),
      });

      const data = (await res.json()) as
        | ClassifyDescriptionResponse
        | { error?: string };

      if (!res.ok) {
        setStatus("api_error");
        const errPayload = data as { error?: string };
        setApiErrorMessage(
          typeof errPayload.error === "string" && errPayload.error
            ? errPayload.error
            : "We couldn’t classify that description. Check your connection and try again."
        );
        return;
      }

      const success = data as ClassifyDescriptionResponse;
      setClassification(success.classification);
      setSource(success.source);
      setStatus("success");
    } catch {
      setStatus("api_error");
      setApiErrorMessage(
        "Something went wrong while contacting the server. Try again in a moment."
      );
    }
  }

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

        {status === "success" && classification && (
          <div className="mt-6 space-y-4" aria-live="polite">
            {source === "mock" && (
              <p
                className="rounded-lg border border-amber-600/30 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                role="status"
              >
                Using mock classification — add{" "}
                <code className="text-xs">XAI_API_KEY</code> or{" "}
                <code className="text-xs">GROK_API_KEY</code> to{" "}
                <code className="text-xs">.env.local</code> for live Grok results.
              </p>
            )}

            {/* TEMP(slice): remove when product no longer needs on-screen object debug print */}
            <div
              className="rounded-xl border-2 border-dashed border-[#1a3d2e]/40 bg-[#1a3d2e]/5 px-4 py-4"
              data-temporary-slice="grok-object-print"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1a3d2e]/70">
                Temporary — identified object (remove later)
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
          </div>
        )}

        <Button
          type="submit"
          disabled={status === "loading"}
          className="mt-6 h-11 w-full bg-black text-white hover:bg-black/90 sm:w-auto sm:min-w-[12rem]"
        >
          {status === "loading" ? "Classifying…" : "Classify item"}
        </Button>
      </form>
    </HopHacksShell>
  );
}
