import type { DescriptionClassification } from "@/lib/description-classification";
import type { DisposalGuidanceResponse } from "@/app/api/disposal-guidance/route";

export type DisposalGuidanceClientResult =
  | { ok: true; guidance: DisposalGuidanceResponse }
  | { ok: false; errorMessage: string; reason?: string };

export async function fetchDisposalGuidance(
  classification: DescriptionClassification,
  address: string
): Promise<DisposalGuidanceClientResult> {
  const res = await fetch("/api/disposal-guidance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classification, address }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      ok: false,
      errorMessage:
        typeof data.error === "string"
          ? data.error
          : "Could not load disposal guidance.",
      reason: typeof data.reason === "string" ? data.reason : undefined,
    };
  }

  return { ok: true, guidance: data as DisposalGuidanceResponse };
}
