import type { ClassifyPictureResponse } from "@/app/api/classify-picture/route";
import type { DescriptionClassification } from "@/lib/description-classification";

export type ClassifyPictureResult =
  | { ok: true; classification: DescriptionClassification; source: "live" | "mock" }
  | { ok: false; errorMessage: string };

export async function classifyPictureFromDataUrl(
  imageDataUrl: string,
  supplementalText?: string
): Promise<ClassifyPictureResult> {
  const image = imageDataUrl.trim();
  if (!image) {
    return { ok: false, errorMessage: "Capture a photo before classifying." };
  }

  try {
    const res = await fetch("/api/classify-picture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image,
        supplementalText: supplementalText?.trim() || undefined,
      }),
    });

    const data = (await res.json()) as
      | ClassifyPictureResponse
      | { error?: string };

    if (!res.ok) {
      const errPayload = data as { error?: string };
      return {
        ok: false,
        errorMessage:
          typeof errPayload.error === "string" && errPayload.error
            ? errPayload.error
            : "We couldn’t classify that photo. Check your connection and try again.",
      };
    }

    const success = data as ClassifyPictureResponse;
    return {
      ok: true,
      classification: success.classification,
      source: success.source,
    };
  } catch {
    return {
      ok: false,
      errorMessage:
        "Something went wrong while contacting the server. Try again in a moment.",
    };
  }
}
