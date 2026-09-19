"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HopHacksShell } from "@/components/hophacks-shell";
import { Button } from "@/components/ui/button";

type SpeechState = "idle" | "listening" | "processing" | "done" | "unsupported" | "error";

export default function SpeechPage() {
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const startListening = useCallback(() => {
    setErrorMessage(null);
    setTranscript("");

    const SpeechRecognitionCtor =
      typeof window !== "undefined"
        ? window.SpeechRecognition ?? window.webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognitionCtor) {
      setSpeechState("unsupported");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setSpeechState("listening");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text.trim());
    };

    recognition.onerror = () => {
      setSpeechState("error");
      setErrorMessage(
        "Microphone or speech recognition failed. Try again or use Type A Description."
      );
      stopListening();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setSpeechState((prev) => {
        if (prev === "listening") return "processing";
        return prev;
      });
      window.setTimeout(() => {
        setSpeechState((prev) => (prev === "processing" ? "done" : prev));
      }, 400);
    };

    try {
      recognition.start();
    } catch {
      setSpeechState("error");
      setErrorMessage("Could not start speech input.");
    }
  }, [stopListening]);

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return (
    <HopHacksShell showBack>
      <div className="rounded-2xl border border-white/20 bg-white/95 p-6 text-black shadow-lg sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Use Speech Input</h1>
        <p className="mt-2 text-sm text-black/70 sm:text-base">
          Describe the item out loud. Your browser transcribes speech locally when
          supported.
        </p>

        <div
          className="mt-8 flex flex-col items-center rounded-xl border border-dashed border-black/20 bg-[#e8dcc8]/40 px-6 py-10 text-center"
          aria-live="polite"
        >
          {speechState === "idle" && (
            <p className="text-sm text-black/65">
              Tap the button below and say what you need to throw away.
            </p>
          )}
          {speechState === "listening" && (
            <>
              <span className="inline-flex h-3 w-3 animate-pulse rounded-full bg-red-500" />
              <p className="mt-3 text-sm font-medium">Listening…</p>
            </>
          )}
          {speechState === "processing" && (
            <p className="text-sm text-black/65">Processing speech…</p>
          )}
          {speechState === "unsupported" && (
            <p className="text-sm text-black/70">
              Speech recognition isn&apos;t available here. Use Type A Description
              on the home screen instead.
            </p>
          )}
          {transcript && speechState !== "unsupported" && (
            <blockquote className="mt-4 w-full rounded-lg bg-white px-4 py-3 text-left text-base italic text-black/80">
              &ldquo;{transcript}&rdquo;
            </blockquote>
          )}
          {speechState === "done" && transcript && (
            <p className="mt-4 text-sm text-[#1a3d2e]">
              Transcript captured. Disposal guidance will use this in a later
              release.
            </p>
          )}
        </div>

        {errorMessage && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={startListening}
            disabled={speechState === "listening" || speechState === "processing"}
            className="h-11 flex-1 bg-black text-white hover:bg-black/90"
          >
            {speechState === "listening" ? "Listening…" : "Start speaking"}
          </Button>
          {transcript && (
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 border-black/20 bg-white"
              onClick={() => {
                setTranscript("");
                setSpeechState("idle");
                setErrorMessage(null);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </HopHacksShell>
  );
}
