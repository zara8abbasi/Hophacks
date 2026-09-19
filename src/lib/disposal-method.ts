import type { DescriptionClassification } from "@/lib/description-classification";

export type DisposalMethod =
  | "curbside_trash"
  | "curbside_recycling"
  | "drop_off_center"
  | "hhw_drop_off";

export type DisposalMethodResult = {
  method: DisposalMethod;
  headline: string;
  detail: string;
  /** When true, user should also use nearest drop-off for certain materials */
  alsoMentionDropOff: boolean;
};

function haystack(c: DescriptionClassification): string {
  return `${c.objectName} ${c.category} ${c.class}`.toLowerCase();
}

/**
 * Baltimore-oriented routing from Grok category/class (not a substitute for official DPW rules).
 */
export function resolveDisposalMethod(
  classification: DescriptionClassification
): DisposalMethodResult {
  const text = haystack(classification);

  const hhwPatterns =
    /\b(paint|latex|oil-based|motor oil|pesticide|herbicide|aerosol|propane|fluorescent|mercury|asbestos|hazardous|hhw|household hazardous)\b/;
  const batteryPatterns = /\b(battery|batteries|lithium|lead-acid)\b/;
  const ewastePatterns =
    /\b(e-?waste|electronics|television|tv\b|monitor|computer|laptop|phone|tablet|appliance)\b/;
  const recyclingPatterns =
    /\b(recycl|cardboard|paper\b|newspaper|metal can|aluminum|tin can|glass bottle|jar\b|#1\b|#2\b|#3\b|#4\b|#5\b|#6\b|#7\b|plastic bottle|rigid plastic)\b/;
  const trashPatterns =
    /\b(trash|garbage|landfill|styrofoam|foam\b|diaper|food waste|organic|yard waste)\b/;

  if (hhwPatterns.test(text) || (/\bpaint\b/.test(text) && !/\bempty\b/.test(text))) {
    return {
      method: "hhw_drop_off",
      headline: "Household hazardous waste — drop-off only",
      detail:
        "Liquid paint, chemicals, and similar household hazardous waste are not accepted in curbside trash or recycling. Take them to the Sisson Street RRC on household hazardous waste collection days (first Friday and Saturday, June–December). Never pour chemicals down drains.",
      alsoMentionDropOff: true,
    };
  }

  if (batteryPatterns.test(text) || ewastePatterns.test(text)) {
    return {
      method: "drop_off_center",
      headline: "Special drop-off — not curbside",
      detail:
        "Batteries and most electronics should go to a citizen drop-off center or designated e-waste program—not in your recycling cart. The nearest Baltimore drop-off center can take many of these items.",
      alsoMentionDropOff: true,
    };
  }

  if (recyclingPatterns.test(text) && !trashPatterns.test(text)) {
    return {
      method: "curbside_recycling",
      headline: "Curbside recycling (set out on recycling day)",
      detail:
        "Rinse containers when needed and place in your city recycling cart. Set out by 6 PM the night before your recycling collection day (see schedule below).",
      alsoMentionDropOff: false,
    };
  }

  if (trashPatterns.test(text) && !recyclingPatterns.test(text)) {
    return {
      method: "curbside_trash",
      headline: "Curbside trash",
      detail:
        "Bag securely and place in your trash cart. Set out by 6 PM the night before your trash collection day (see schedule below).",
      alsoMentionDropOff: false,
    };
  }

  return {
    method: "curbside_trash",
    headline: "Likely curbside trash — confirm locally",
    detail:
      "We could not match a specific Baltimore stream from this classification. Most non-recyclable household items go in curbside trash; if the item is electronic, chemical, or battery-powered, use a drop-off center instead.",
    alsoMentionDropOff: true,
  };
}
