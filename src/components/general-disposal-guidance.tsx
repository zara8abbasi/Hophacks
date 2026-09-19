import type { DescriptionClassification } from "@/lib/description-classification";
import { resolveGeneralDisposal } from "@/lib/general-disposal";

type GeneralDisposalGuidanceProps = {
  classification: DescriptionClassification;
  showBaltimoreHint?: boolean;
};

export function GeneralDisposalGuidance({
  classification,
  showBaltimoreHint = true,
}: GeneralDisposalGuidanceProps) {
  const general = resolveGeneralDisposal(classification);

  return (
    <div
      className="space-y-3 rounded-xl border border-[var(--litter-forest)]/15 bg-white px-4 py-4 shadow-sm"
      aria-live="polite"
    >
      <div>
        <p className="text-sm font-semibold text-[var(--litter-forest)]">
          General disposal method
        </p>
        <p className="mt-1 text-sm text-black/70">
          Based on your item — check your local municipality for exact rules.
        </p>
      </div>
      <section className="rounded-xl border border-[var(--litter-forest)]/10 bg-[var(--litter-forest)]/[0.06] px-4 py-3 text-sm">
        <p className="font-semibold text-[var(--litter-forest)]">{general.headline}</p>
        <p className="mt-2 text-black/80">{general.detail}</p>
      </section>
      {showBaltimoreHint ? (
        <p className="text-xs text-black/55">
          In Baltimore City? Add your address below for nearest drop-off
          centers, hours, and curbside collection days when they apply.
        </p>
      ) : null}
    </div>
  );
}
