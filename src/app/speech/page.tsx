"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HopHacksShell } from "@/components/hophacks-shell";
import { Button } from "@/components/ui/button";
import { DescriptionClassificationPanel } from "@/components/description-classification-panel";
import { ClassificationOutcomeActions } from "@/components/classification-outcome-actions";
import { useDisposalResultNavigation } from "@/hooks/use-disposal-result-navigation";
import { classifyDescriptionFromText } from "@/lib/classify-description-client";
import {
  classificationAfterDeclinedClarification,
  isDeclinedClarificationAnswer,
  mergeDescriptionWithClarification,
} from "@/lib/description-classification";
import type { TranscribeSpeechConfigResponse } from "@/app/api/transcribe-speech/route";
import type { DescriptionClassification } from "@/lib/description-classification";

type SttProvider = "elevenlabs" | "browser" | "unknown";

type RecordPhase =
  | "idle"
  | "recording"
  | "transcribing"
  | "classifying"
  | "success"
  | "unsupported"
  | "error";

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognition)
  | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export default function SpeechPage() {
  const [sttProvider, setSttProvider] = useState<SttProvider>("unknown");
  const [phase, setPhase] = useState<RecordPhase>("idle");
  const [transcript, setTranscript] = useState("");
  const [sttSource, setSttSource] = useState<"live" | "mock" | null>(null);
  const [classification, setClassification] =
    useState<DescriptionClassification | null>(null);
  const [classifySource, setClassifySource] = useState<"live" | "mock" | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [originalTranscript, setOriginalTranscript] = useState("");

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const browserTranscriptRef = useRef("");

  const releaseMic = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/transcribe-speech");
        if (!res.ok) return;
        const data = (await res.json()) as TranscribeSpeechConfigResponse;
        if (!cancelled) {
          setSttProvider(data.provider);
        }
      } catch {
        if (!cancelled) setSttProvider("browser");
      }
    })();
    return () => {
      cancelled = true;
      releaseMic();
    };
  }, [releaseMic]);

  const runClassification = useCallback(
    async (text: string, options?: { isInitial?: boolean; keepPrevious?: boolean }) => {
      setPhase("classifying");
      if (!options?.keepPrevious) {
        setClassification(null);
        setClassifySource(null);
      }
      setErrorMessage(null);

      const result = await classifyDescriptionFromText(text);
      if (!result.ok) {
        setPhase("error");
        setErrorMessage(result.errorMessage);
        return;
      }

      if (options?.isInitial) {
        setOriginalTranscript(text.trim());
      }

      setClassification(result.classification);
      setClassifySource(result.source);
      setPhase("success");
    },
    []
  );

  const transcribeWithElevenLabs = useCallback(async (blob: Blob) => {
    const form = new FormData();
    form.append("audio", blob, "recording.webm");
    const res = await fetch("/api/transcribe-speech", {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as
      | { transcript?: string; source?: "live" | "mock"; error?: string }
      | { error?: string };

    if (!res.ok) {
      const err = data as { error?: string };
      throw new Error(
        err.error ??
          "We couldn’t transcribe your recording. Try again or type a description."
      );
    }

    const success = data as { transcript: string; source: "live" | "mock" };
    const text = success.transcript?.trim() ?? "";
    if (!text) {
      throw new Error(
        "We didn’t catch any words. Speak clearly and try a shorter clip."
      );
    }
    setSttSource(success.source);
    setTranscript(text);
    await runClassification(text, { isInitial: true });
  }, [runClassification]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    recognitionRef.current?.stop();
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    setTranscript("");
    setSttSource(null);
    setClassification(null);
    setClassifySource(null);
    chunksRef.current = [];
    browserTranscriptRef.current = "";

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPhase("unsupported");
      setErrorMessage(
        "This browser can’t access a microphone. Use Type A Description instead."
      );
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setPhase("unsupported");
      setErrorMessage(
        "Audio recording isn’t supported here. Use Type A Description or Chrome on desktop."
      );
      return;
    }

    setPhase("idle");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setPhase("error");
        setErrorMessage(
          "Microphone access was denied. Allow the mic in your browser settings, then try again."
        );
        return;
      }
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setPhase("error");
        setErrorMessage(
          "No microphone was found on this device. Plug one in or use Type A Description."
        );
        return;
      }
      setPhase("error");
      setErrorMessage(
        "We couldn’t open the microphone. Check permissions and try again."
      );
      return;
    }

    mediaStreamRef.current = stream;

    const useBrowserStt = sttProvider !== "elevenlabs";
    if (useBrowserStt) {
      const SpeechRecognitionCtor = getSpeechRecognitionCtor();
      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let text = "";
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          const trimmed = text.trim();
          if (trimmed) {
            browserTranscriptRef.current = trimmed;
          }
        };
        recognition.onerror = () => {
          /* keep MediaRecorder path; transcript may still be partial */
        };
        try {
          recognition.start();
        } catch {
          recognitionRef.current = null;
        }
      }
    }

    const mimeType = pickRecorderMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      releaseMic();
      setPhase("error");
      setErrorMessage("Could not start audio recording on this device.");
      return;
    }

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      releaseMic();
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || mimeType || "audio/webm",
      });
      chunksRef.current = [];

      if (blob.size === 0) {
        setPhase("error");
        setErrorMessage("No audio was captured. Hold the button and speak, then stop.");
        return;
      }

      setPhase("transcribing");

      try {
        if (sttProvider === "elevenlabs") {
          await transcribeWithElevenLabs(blob);
          return;
        }

        const browserText = browserTranscriptRef.current.trim();
        if (browserText) {
          setSttSource("live");
          setTranscript(browserText);
          await runClassification(browserText, { isInitial: true });
          return;
        }

        setSttSource("mock");
        setTranscript("");
        setPhase("error");
        setErrorMessage(
          "Browser speech recognition didn’t return a transcript. Add ELEVENLABS_API_KEY to .env.local for ElevenLabs STT, or use Chrome and try again."
        );
      } catch (err) {
        setPhase("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Transcription failed. Please try again."
        );
      }
    };

    recorder.start();
    setPhase("recording");
  }, [releaseMic, runClassification, sttProvider, transcribeWithElevenLabs]);

  const resetFlow = useCallback(() => {
    releaseMic();
    setPhase("idle");
    setTranscript("");
    setSttSource(null);
    setClassification(null);
    setClassifySource(null);
    setErrorMessage(null);
    setOriginalTranscript("");
    chunksRef.current = [];
    browserTranscriptRef.current = "";
  }, [releaseMic]);

  const busy =
    phase === "recording" ||
    phase === "transcribing" ||
    phase === "classifying";

  useDisposalResultNavigation({
    classification,
    source: classifySource,
    origin: "/speech",
    inputSummary: transcript,
    enabled: phase === "success",
  });

  return (
    <HopHacksShell showBack>
      <div className="rounded-2xl border border-white/20 bg-white/95 p-6 text-black shadow-lg sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Use Speech Input</h1>
        <p className="mt-2 text-sm text-black/70 sm:text-base">
          Record a short description of what you need to throw away. We transcribe
          your speech, then identify and classify the item with Grok—same as Type
          A Description.
        </p>

        {sttProvider === "browser" && (
          <p
            className="mt-4 rounded-lg border border-amber-600/30 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            Using browser speech recognition — add{" "}
            <code className="text-xs">ELEVENLABS_API_KEY</code> to{" "}
            <code className="text-xs">.env.local</code> for ElevenLabs Scribe
            transcription (Creator plan works).
          </p>
        )}

        <div
          className="mt-8 flex flex-col items-center rounded-xl border border-dashed border-black/20 bg-[#e8dcc8]/40 px-6 py-10 text-center"
          aria-live="polite"
        >
          {phase === "idle" && (
            <p className="text-sm text-black/65">
              Tap record, describe your item, then stop when you&apos;re done.
            </p>
          )}
          {phase === "recording" && (
            <>
              <span className="inline-flex h-3 w-3 animate-pulse rounded-full bg-red-500" />
              <p className="mt-3 text-sm font-medium">Recording…</p>
              <p className="mt-1 text-xs text-black/55">Tap stop when finished.</p>
            </>
          )}
          {phase === "transcribing" && (
            <p className="text-sm text-black/65">Transcribing your recording…</p>
          )}
          {phase === "classifying" && (
            <p className="text-sm text-black/65">
              Identifying your item with Grok…
            </p>
          )}
          {phase === "unsupported" && (
            <p className="text-sm text-black/70">
              Speech input isn&apos;t available in this browser. Use Type A
              Description on the home screen instead.
            </p>
          )}
          {transcript && phase !== "unsupported" && (
            <blockquote className="mt-4 w-full rounded-lg bg-white px-4 py-3 text-left text-base text-black/85">
              <span className="text-xs font-semibold uppercase tracking-wide text-black/50">
                Transcript
              </span>
              <p className="mt-1">&ldquo;{transcript}&rdquo;</p>
              {sttSource === "mock" && (
                <p className="mt-2 text-xs text-amber-900">STT: mock / fallback</p>
              )}
            </blockquote>
          )}
        </div>

        {errorMessage && (
          <p
            className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        {(phase === "success" || phase === "classifying") &&
          classification &&
          classifySource && (
          <div className="mt-6">
            <DescriptionClassificationPanel
              classification={classification}
              source={classifySource}
            />
            <ClassificationOutcomeActions
              classification={classification}
              busy={phase === "classifying"}
              tryAgainLabel="Record again"
              onTryAgain={resetFlow}
              onSubmitClarification={async (answer) => {
                if (classification && isDeclinedClarificationAnswer(answer)) {
                  setClassification(
                    classificationAfterDeclinedClarification(classification)
                  );
                  setPhase("success");
                  return;
                }
                const merged = mergeDescriptionWithClarification(
                  originalTranscript || transcript,
                  answer
                );
                setTranscript(merged);
                await runClassification(merged, { keepPrevious: true });
              }}
            />
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {phase === "recording" ? (
            <Button
              type="button"
              onClick={stopRecording}
              className="h-11 flex-1 bg-black text-white hover:bg-black/90"
            >
              Stop recording
            </Button>
          ) : (
            <Button
              type="button"
              onClick={startRecording}
              disabled={busy || phase === "unsupported"}
              className="h-11 flex-1 bg-black text-white hover:bg-black/90"
            >
              {phase === "transcribing"
                ? "Transcribing…"
                : phase === "classifying"
                  ? "Classifying…"
                  : "Record description"}
            </Button>
          )}
          {(transcript || phase === "success" || phase === "error") && (
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 border-black/20 bg-white text-black"
              onClick={resetFlow}
              disabled={busy}
            >
              Start over
            </Button>
          )}
        </div>
      </div>
    </HopHacksShell>
  );
}
