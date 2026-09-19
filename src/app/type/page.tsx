"use client";

import { useState } from "react";
import { HopHacksShell } from "@/components/hophacks-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function TypePage() {
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">(
    "idle"
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    window.setTimeout(() => setStatus("done"), 600);
  }

  return (
    <HopHacksShell showBack>
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/20 bg-white/95 p-6 text-black shadow-lg sm:p-8"
      >
        <h1 className="text-2xl font-bold tracking-tight">Type A Description</h1>
        <p className="mt-2 text-sm text-black/70 sm:text-base">
          Include material (plastic, metal, glass), condition, and anything on
          the label. Baltimore disposal rules will be matched here soon.
        </p>

        <label className="mt-6 block text-sm font-medium" htmlFor="item-description">
          What are you trying to dispose of?
        </label>
        <Textarea
          id="item-description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="Example: cracked #5 plastic takeout container, greasy"
          rows={5}
          className="mt-2 min-h-[140px] resize-y border-black/15 bg-white text-base"
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? "desc-error" : undefined}
        />

        {status === "error" && (
          <p id="desc-error" className="mt-2 text-sm text-red-700" role="alert">
            Please enter a short description before continuing.
          </p>
        )}

        {status === "submitting" && (
          <p className="mt-4 text-sm text-black/60">Saving your description…</p>
        )}

        {status === "done" && (
          <p className="mt-4 rounded-lg bg-[#1a3d2e]/10 px-4 py-3 text-sm text-[#1a3d2e]">
            Got it. Disposal instructions and nearby centers will appear here once
            Open Baltimore data and guidance are wired up.
          </p>
        )}

        <Button
          type="submit"
          disabled={status === "submitting"}
          className="mt-6 h-11 w-full bg-black text-white hover:bg-black/90 sm:w-auto sm:min-w-[12rem]"
        >
          {status === "submitting" ? "Sending…" : "Continue"}
        </Button>
      </form>
    </HopHacksShell>
  );
}
