import { getElevenLabsApiKey } from "@/lib/elevenlabs-stt";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
const DEFAULT_TTS_MODEL = "eleven_turbo_v2_5";

export function isElevenLabsTtsConfigured(): boolean {
  return Boolean(getElevenLabsApiKey());
}

function getVoiceId(): string {
  const fromEnv = process.env.ELEVENLABS_VOICE_ID?.trim();
  return fromEnv || DEFAULT_VOICE_ID;
}

export async function synthesizeSpeechWithElevenLabs(
  text: string
): Promise<Uint8Array> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new Error("ElevenLabs API key is not configured.");
  }

  const sentence = text.trim();
  if (!sentence) {
    throw new Error("Nothing to speak.");
  }

  const voiceId = encodeURIComponent(getVoiceId());
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: sentence,
        model_id: DEFAULT_TTS_MODEL,
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs TTS error (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`
    );
  }

  const buffer = new Uint8Array(await response.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new Error("ElevenLabs returned empty audio.");
  }
  return buffer;
}
