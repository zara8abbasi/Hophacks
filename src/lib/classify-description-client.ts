import type { ClassifyDescriptionResponse } from "@/app/api/classify-description/route";
import type { DescriptionClassification } from "@/lib/description-classification";

export type ClassifyDescriptionResult =
  | { ok: true; classification: DescriptionClassification; source: "live" | "mock" }
  | { ok: false; errorMessage: string };

export async function classifyDescriptionFromText(
  description: string
): Promise<ClassifyDescriptionResult> {
  const trimmed = description.trim();
  if (!trimmed) {
    return {
      ok: false,
      errorMessage: "Please enter a short description before continuing.",
    };
  }

  try {
    const res = await fetch("/api/classify-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: trimmed }),
    });

    const data = (await res.json()) as
      | ClassifyDescriptionResponse
      | { error?: string };

    if (!res.ok) {
      const errPayload = data as { error?: string };
      return {
        ok: false,
        errorMessage:
          typeof errPayload.error === "string" && errPayload.error
            ? errPayload.error
            : "We couldn’t classify that description. Check your connection and try again.",
      };
    }

    const success = data as ClassifyDescriptionResponse;
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
