"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { btnOutlineForestClass } from "@/lib/hophacks-ui";
import {
  fetchTtsProvider,
  speakRecycleReadout,
  type TtsProvider,
} from "@/lib/recycle-readout-client";
import { recycleReadoutSentence } from "@/lib/recycle-readout-sentence";
import type { DescriptionClassification } from "@/lib/description-classification";

type VoiceRecycleReadoutProps = {
  classification: DescriptionClassification;
  /** Auto-speak once when guidance is ready (voice path only). */
  autoPlay?: boolean;
};

export function VoiceRecycleReadout({
  classification,
  autoPlay = true,
}: VoiceRecycleReadoutProps) {
  const sentence = useMemo(
    () => recycleReadoutSentence(classification),
    [classification]
  );
  const [provider, setProvider] = useState<TtsProvider>("unknown");
  const [speaking, setSpeaking] = useState(false);
  const [playBlocked, setPlayBlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const play = useCallback(
    async (force: boolean) => {
      setErrorMessage(null);
      setSpeaking(true);
      try {
        await speakRecycleReadout(sentence, { force });
        setPlayBlocked(false);
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError") {
          setPlayBlocked(true);
        } else {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "Couldn’t play spoken guidance."
          );
        }
      } finally {
        setSpeaking(false);
      }
    },
    [sentence]
  );

  useEffect(() => {
    let cancelled = false;
    void fetchTtsProvider().then((next) => {
      if (!cancelled) setProvider(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    let cancelled = false;
    void (async () => {
      try {
        await speakRecycleReadout(sentence, { force: false });
        if (!cancelled) setPlayBlocked(false);
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError") {
          setPlayBlocked(true);
        } else {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "Couldn’t play spoken guidance."
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [autoPlay, sentence]);

  const providerHint =
    provider === "browser"
      ? "Using browser speech — add ELEVENLABS_API_KEY to .env.local for ElevenLabs voices."
      : provider === "elevenlabs"
        ? "Reading this sentence with ElevenLabs."
        : null;

  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-[var(--litter-forest)]/15 bg-white px-3 py-3 shadow-sm"
      aria-live="polite"
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={`mt-0.5 shrink-0 ${btnOutlineForestClass} size-10`}
        aria-label={speaking ? "Reading disposal destination" : "Read where to recycle"}
        onClick={() => void play(true)}
        disabled={speaking}
      >
        <Volume2 className={speaking ? "animate-pulse" : undefined} />
      </Button>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--litter-forest)]/70">
          {speaking ? "Reading destination" : "Where to recycle"}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[#1a2e24]">{sentence}</p>
        {playBlocked ? (
          <p className="mt-1 text-xs text-amber-950">
            Tap the speaker to hear this sentence.
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-1 text-xs text-red-800">{errorMessage}</p>
        ) : null}
        {providerHint && !errorMessage ? (
          <p className="mt-1 text-xs text-black/50">{providerHint}</p>
        ) : null}
      </div>
    </div>
  );
}
