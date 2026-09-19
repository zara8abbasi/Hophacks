import { NextResponse } from "next/server";
import {
  isElevenLabsSttConfigured,
  transcribeAudioWithElevenLabs,
} from "@/lib/elevenlabs-stt";

export type TranscribeSpeechConfigResponse = {
  provider: "elevenlabs" | "browser";
};

export type TranscribeSpeechResponse = {
  transcript: string;
  source: "live" | "mock";
  sttProvider: "elevenlabs";
};

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export async function GET() {
  const payload: TranscribeSpeechConfigResponse = {
    provider: isElevenLabsSttConfigured() ? "elevenlabs" : "browser",
  };
  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  if (!isElevenLabsSttConfigured()) {
    return NextResponse.json(
      {
        error:
          "ElevenLabs speech-to-text is not configured. Add ELEVENLABS_API_KEY to .env.local or use browser speech recognition.",
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data. Send multipart audio as the audio field." },
      { status: 400 }
    );
  }

  const file = formData.get("audio");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json(
      { error: "Audio recording is required." },
      { status: 400 }
    );
  }

  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "Recording is too large. Try a shorter clip." },
      { status: 413 }
    );
  }

  const filename =
    file instanceof File && file.name ? file.name : "recording.webm";

  try {
    const transcript = await transcribeAudioWithElevenLabs(file, filename);
    const payload: TranscribeSpeechResponse = {
      transcript,
      source: "live",
      sttProvider: "elevenlabs",
    };
    return NextResponse.json(payload);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Transcription failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
