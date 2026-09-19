import type { DescriptionClassification } from "@/lib/description-classification";
import { resolveDisposalMethod } from "@/lib/disposal-method";

export type GeneralDisposalResult = {
  headline: string;
  detail: string;
  method: ReturnType<typeof resolveDisposalMethod>["method"];
};

/**
 * Location-agnostic disposal guidance (no Baltimore collection days or CityView as primary).
 */
export function resolveGeneralDisposal(
  classification: DescriptionClassification
): GeneralDisposalResult {
  const routed = resolveDisposalMethod(classification);

  switch (routed.method) {
    case "hhw_drop_off":
      return {
        method: routed.method,
        headline: "Household hazardous waste — facility drop-off",
        detail:
          "Take liquid paint, chemicals, and similar HHW to your county or city hazardous waste collection event or permanent drop-off. Do not put them in household trash or recycling, and never pour them down drains.",
      };
    case "drop_off_center":
      return {
        method: routed.method,
        headline: "Special drop-off — not curbside",
        detail:
          "Batteries, electronics, and many bulky or hazardous items belong at retailer take-back programs, e-waste drives, or municipal citizen drop-off sites—not in curbside carts.",
      };
    case "curbside_recycling":
      return {
        method: routed.method,
        headline: "Recycling (curbside or drop-off)",
        detail:
          "Rinse containers when needed and place them in your recycling program per local rules (plastic numbers, glass, cardboard).",
      };
    case "curbside_trash":
      return {
        method: routed.method,
        headline: "Household trash",
        detail:
          "Bag securely and place in your regular trash collection. If you’re unsure whether something is hazardous or electronic, use drop-off instead of guessing.",
      };
    default:
      return {
        method: routed.method,
        headline: routed.headline,
        detail: routed.detail.replace(/Baltimore/gi, "your local"),
      };
  }
}
