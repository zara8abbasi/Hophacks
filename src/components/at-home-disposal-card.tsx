import { classificationPanelClass, sectionLabelClass } from "@/lib/hophacks-ui";
import type { DescriptionClassification } from "@/lib/description-classification";
import {
  isAtHomeStream,
  resolveAtHomeDisposal,
} from "@/lib/at-home-disposal";

type AtHomeDisposalCardProps = {
  classification: DescriptionClassification;
};

export function AtHomeDisposalCard({
  classification,
}: AtHomeDisposalCardProps) {
  const atHome = resolveAtHomeDisposal(classification);
  const showCard =
    isAtHomeStream(atHome.stream) || atHome.stream === "unknown_caution";

  if (!showCard && atHome.stream === "not_at_home") {
    return (
      <section
        className="rounded-lg border border-amber-300/70 bg-amber-50/80 px-4 py-3 text-sm"
        aria-live="polite"
      >
        <p className="font-semibold text-[var(--litter-forest)]">{atHome.headline}</p>
        <p className="mt-2 text-black/80">{atHome.detail}</p>
      </section>
    );
  }

  if (!showCard) return null;

  const streamLabel =
    atHome.stream === "recycle"
      ? "Recycle"
      : atHome.stream === "compost"
        ? "Compost"
        : atHome.stream === "trash"
          ? "Trash"
          : atHome.stream === "reuse"
            ? "Reuse / donate"
            : atHome.stream === "drain_dry"
              ? "Dry out first"
              : "At home";

  return (
    <section className={`${classificationPanelClass} py-3`} aria-live="polite">
      <p className={sectionLabelClass}>At home — {streamLabel}</p>
      <p className="mt-2 font-semibold text-[var(--litter-forest)]">{atHome.headline}</p>
      <p className="mt-2 text-black/80">{atHome.detail}</p>
    </section>
  );
}
