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
      className="space-y-3 rounded-lg border border-[#1a3d2e]/25 bg-white px-4 py-4"
      aria-live="polite"
    >
      <div>
        <p className="text-sm font-semibold text-[#1a3d2e]">
          General disposal method
        </p>
        <p className="mt-1 text-sm text-black/70">
          Based on your item — check your local municipality for exact rules.
        </p>
      </div>
      <section className="rounded-lg bg-[#1a3d2e]/10 px-4 py-3 text-sm">
        <p className="font-semibold text-[#1a3d2e]">{general.headline}</p>
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
