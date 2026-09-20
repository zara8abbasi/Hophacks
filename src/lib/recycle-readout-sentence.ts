import type { DescriptionClassification } from "@/lib/description-classification";
import { resolveAtHomeDisposal } from "@/lib/at-home-disposal";
import { resolveDisposalMethod } from "@/lib/disposal-method";

const ITEM_FALLBACK = "this item";

function itemPhrase(classification: DescriptionClassification): string {
  const name = classification.objectName?.trim();
  if (!name) return ITEM_FALLBACK;
  const lower = name.charAt(0).toLowerCase() + name.slice(1);
  return lower;
}

/**
 * One spoken sentence: where to recycle or dispose, matching existing routing.
 */
export function recycleReadoutSentence(
  classification: DescriptionClassification
): string {
  const item = itemPhrase(classification);
  const atHome = resolveAtHomeDisposal(classification);
  const method = resolveDisposalMethod(classification);

  if (method.method === "hhw_drop_off" || atHome.stream === "not_at_home") {
    if (method.method === "hhw_drop_off") {
      return `Take ${item} to a household hazardous waste drop-off; do not put it in curbside trash or recycling.`;
    }
    return `Take ${item} to a special drop-off center; it is not accepted in curbside recycling or trash.`;
  }

  if (method.method === "drop_off_center") {
    return `Take ${item} to a drop-off center; it does not go in your curbside recycling cart.`;
  }

  if (atHome.stream === "compost") {
    return `Put ${item} in compost or organics collection, not mixed recycling.`;
  }

  if (atHome.stream === "drain_dry") {
    return `Dry ${item} out completely, then follow local rules before placing the empty can in trash.`;
  }

  if (atHome.stream === "reuse") {
    return `Reuse or donate ${item} if it is still in good condition; otherwise follow local recycling or trash rules.`;
  }

  if (method.method === "curbside_recycling" || atHome.stream === "recycle") {
    return `Place ${item} in your curbside recycling cart.`;
  }

  if (method.method === "curbside_trash" || atHome.stream === "trash") {
    if (method.alsoMentionDropOff || atHome.stream === "unknown_caution") {
      return `Put ${item} in household trash unless it is electronic, chemical, or battery-powered, in which case use drop-off.`;
    }
    return `Put ${item} in household trash, not recycling.`;
  }

  return `Check local rules for ${item}; when unsure, use drop-off rather than guessing curbside recycling.`;
}
