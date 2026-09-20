import type { SpeakGuidanceConfigResponse } from "@/app/api/speak-guidance/route";

export type TtsProvider = "elevenlabs" | "browser" | "unknown";

let cachedProvider: TtsProvider = "unknown";
let providerPromise: Promise<TtsProvider> | null = null;
let currentAudio: HTMLAudioElement | null = null;
let activeText = "";
let speakGeneration = 0;

function stopBrowserSpeech() {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
}

function stopElevenLabsAudio() {
  if (!currentAudio) return;
  currentAudio.pause();
  currentAudio.src = "";
  currentAudio = null;
}

export function stopRecycleReadout() {
  stopBrowserSpeech();
  stopElevenLabsAudio();
}

export async function fetchTtsProvider(): Promise<TtsProvider> {
  if (cachedProvider !== "unknown") return cachedProvider;
  if (providerPromise) return providerPromise;

  providerPromise = (async () => {
    try {
      const res = await fetch("/api/speak-guidance");
      if (!res.ok) {
        cachedProvider = "browser";
        return cachedProvider;
      }
      const data = (await res.json()) as SpeakGuidanceConfigResponse;
      cachedProvider =
        data.provider === "elevenlabs" ? "elevenlabs" : "browser";
      return cachedProvider;
    } catch {
      cachedProvider = "browser";
      return cachedProvider;
    }
  })();

  return providerPromise;
}

function speakWithBrowser(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("Browser speech synthesis is not available."));
      return;
    }
    stopBrowserSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.onend = () => resolve();
    utterance.onerror = () =>
      reject(new Error("Browser speech synthesis failed."));
    window.speechSynthesis.speak(utterance);
  });
}

async function speakWithElevenLabs(text: string): Promise<void> {
  const res = await fetch("/api/speak-guidance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(
      data?.error ?? "We couldn’t generate spoken guidance. Try again."
    );
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  stopElevenLabsAudio();

  await new Promise<void>((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      reject(new Error("Could not play spoken guidance."));
    };
    void audio.play().catch((err) => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      reject(err instanceof Error ? err : new Error("Playback was blocked."));
    });
  });
}

export async function speakRecycleReadout(
  text: string,
  options?: { force?: boolean }
): Promise<void> {
  const sentence = text.trim();
  if (!sentence) return;
  if (!options?.force && activeText === sentence) {
    return;
  }

  const generation = ++speakGeneration;
  activeText = sentence;
  stopRecycleReadout();

  try {
    const provider = await fetchTtsProvider();
    if (generation !== speakGeneration) return;
    if (provider === "elevenlabs") {
      try {
        await speakWithElevenLabs(sentence);
        return;
      } catch {
        if (generation !== speakGeneration) return;
        await speakWithBrowser(sentence);
        return;
      }
    }

    await speakWithBrowser(sentence);
  } finally {
    if (speakGeneration === generation) {
      activeText = "";
    }
  }
}
