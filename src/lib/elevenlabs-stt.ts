const ELEVENLABS_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";
const DEFAULT_SCRIBE_MODEL = "scribe_v2";

export function getElevenLabsApiKey(): string | undefined {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key?.trim()) return undefined;
  return key.trim();
}

export function isElevenLabsSttConfigured(): boolean {
  return Boolean(getElevenLabsApiKey());
}

export type ElevenLabsTranscriptResponse = {
  text?: string;
  language_code?: string;
};

export async function transcribeAudioWithElevenLabs(
  audio: Blob,
  filename = "recording.webm"
): Promise<string> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new Error("ElevenLabs API key is not configured.");
  }

  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model_id", DEFAULT_SCRIBE_MODEL);
  form.append("language_code", "eng");

  const response = await fetch(ELEVENLABS_STT_URL, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs STT error (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`
    );
  }

  const payload = (await response.json()) as ElevenLabsTranscriptResponse;
  const text = payload.text?.trim() ?? "";
  if (!text) {
    throw new Error("ElevenLabs returned an empty transcript.");
  }
  return text;
}
