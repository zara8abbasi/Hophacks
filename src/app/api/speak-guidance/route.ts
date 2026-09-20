import { NextResponse } from "next/server";
import {
  isElevenLabsTtsConfigured,
  synthesizeSpeechWithElevenLabs,
} from "@/lib/elevenlabs-tts";

export type SpeakGuidanceConfigResponse = {
  provider: "elevenlabs" | "browser";
};

const MAX_TEXT_CHARS = 400;

export async function GET() {
  const payload: SpeakGuidanceConfigResponse = {
    provider: isElevenLabsTtsConfigured() ? "elevenlabs" : "browser",
  };
  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  if (!isElevenLabsTtsConfigured()) {
    return NextResponse.json(
      {
        error:
          "ElevenLabs text-to-speech is not configured. Add ELEVENLABS_API_KEY to .env.local or use browser speechSynthesis.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Send JSON with a text field." },
      { status: 400 }
    );
  }

  const text =
    typeof body === "object" &&
    body !== null &&
    "text" in body &&
    typeof (body as { text: unknown }).text === "string"
      ? (body as { text: string }).text.trim()
      : "";

  if (!text) {
    return NextResponse.json(
      { error: "A spoken sentence is required." },
      { status: 400 }
    );
  }

  if (text.length > MAX_TEXT_CHARS) {
    return NextResponse.json(
      { error: "Spoken text is too long." },
      { status: 413 }
    );
  }

  try {
    const audio = await synthesizeSpeechWithElevenLabs(text);
    return new NextResponse(Buffer.from(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Text-to-speech failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
