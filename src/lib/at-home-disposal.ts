import type { DescriptionClassification } from "@/lib/description-classification";

export type AtHomeStream =
  | "recycle"
  | "compost"
  | "trash"
  | "reuse"
  | "drain_dry"
  | "not_at_home"
  | "unknown_caution";

export type AtHomeDisposalResult = {
  stream: AtHomeStream;
  headline: string;
  detail: string;
};

function haystack(c: DescriptionClassification): string {
  return `${c.objectName} ${c.category} ${c.class}`.toLowerCase();
}

/**
 * General at-home stream (recycle / compost / trash / etc.), erring cautious when facts are missing.
 */
export function resolveAtHomeDisposal(
  classification: DescriptionClassification
): AtHomeDisposalResult {
  const text = haystack(classification);

  const hhwPatterns =
    /\b(paint|latex|oil-based|motor oil|pesticide|herbicide|aerosol|propane|fluorescent|mercury|asbestos|hazardous|hhw|household hazardous)\b/;
  const batteryPatterns = /\b(battery|batteries|lithium|lead-acid)\b/;
  const ewastePatterns =
    /\b(e-?waste|electronics|television|tv\b|monitor|computer|laptop|phone|tablet|appliance)\b/;
  const compostPatterns =
    /\b(compost|food scrap|food waste|organic waste|yard waste|leaves|grass clippings|fruit peel|vegetable scrap)\b/;
  const recyclingPatterns =
    /\b(recycl|cardboard|paper\b|newspaper|metal can|aluminum|tin can|glass bottle|jar\b|#1\b|#2\b|#3\b|#4\b|#5\b|#6\b|#7\b|plastic bottle|rigid plastic)\b/;
  const trashPatterns =
    /\b(trash|garbage|landfill|styrofoam|foam\b|diaper)\b/;
  const reusePatterns =
    /\b(reuse|donat|still works|working condition|good condition)\b/;
  const drainDryPatterns =
    /\b(empty (paint|can)|dried paint|dry out)\b/;

  if (hhwPatterns.test(text) || (/\bpaint\b/.test(text) && !/\bempty\b/.test(text))) {
    return {
      stream: "not_at_home",
      headline: "Not for home bins — hazardous or special collection",
      detail:
        "Liquid paint, chemicals, and similar household hazardous waste should not go in household trash or recycling. Take them to a local household hazardous waste (HHW) collection program or designated drop-off. Never pour chemicals down drains.",
    };
  }

  if (batteryPatterns.test(text) || ewastePatterns.test(text)) {
    return {
      stream: "not_at_home",
      headline: "Not for curbside bins — batteries or electronics",
      detail:
        "Batteries and most electronics need a retailer take-back, e-waste program, or municipal drop-off—not your recycling or trash cart.",
    };
  }

  if (drainDryPatterns.test(text) && /\bpaint\b/.test(text)) {
    return {
      stream: "drain_dry",
      headline: "Dry it out, then check local rules",
      detail:
        "Empty latex paint cans can often go in trash once the paint is fully dried out (add kitty litter or newspaper to speed drying). Oil-based or liquid paint still needs HHW drop-off—confirm with your local program.",
    };
  }

  if (reusePatterns.test(text)) {
    return {
      stream: "reuse",
      headline: "Reuse or donate if possible",
      detail:
        "If the item still works or is in good shape, donation or reuse keeps it out of the waste stream. Otherwise follow recycling or trash guidance for the material.",
    };
  }

  if (compostPatterns.test(text) && !recyclingPatterns.test(text)) {
    return {
      stream: "compost",
      headline: "Compost (or organics collection)",
      detail:
        "Food scraps and yard waste belong in a home compost pile or your community organics/yard-waste program—not mixed recycling.",
    };
  }

  if (recyclingPatterns.test(text) && !trashPatterns.test(text)) {
    return {
      stream: "recycle",
      headline: "Recycle",
      detail:
        "Rinse containers when needed and place in your recycling bin or drop-off, following local rules for plastic numbers and glass.",
    };
  }

  if (trashPatterns.test(text) && !recyclingPatterns.test(text)) {
    return {
      stream: "trash",
      headline: "Trash",
      detail:
        "Bag securely and place in your household trash. Styrofoam and similar foams are usually trash, not recycling.",
    };
  }

  if (/\bdetails unknown\b/.test(text) || /\bcondition unknown\b/.test(text)) {
    return {
      stream: "unknown_caution",
      headline: "Use drop-off or ask locally — don’t guess curbside",
      detail:
        "We don’t have enough detail for a safe at-home bin. Use a drop-off or special collection program, or call your local waste authority before putting this in trash or recycling.",
    };
  }

  return {
    stream: "unknown_caution",
    headline: "Confirm before using home bins",
    detail:
      "We couldn’t match a clear at-home stream. If the item is electronic, chemical, or battery-powered, use drop-off. Otherwise check local guidance before trash or recycling.",
  };
}

export function isAtHomeStream(stream: AtHomeStream): boolean {
  return (
    stream === "recycle" ||
    stream === "compost" ||
    stream === "trash" ||
    stream === "reuse" ||
    stream === "drain_dry"
  );
}
