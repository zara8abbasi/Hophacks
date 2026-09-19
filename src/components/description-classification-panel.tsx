import { cn } from "@/lib/utils";
import {
  classificationPanelClass,
  insetPanelClass,
  sectionLabelClass,
} from "@/lib/hophacks-ui";
import type { DescriptionClassification } from "@/lib/description-classification";

type DescriptionClassificationPanelProps = {
  classification: DescriptionClassification;
  source: "live" | "mock";
};

export function DescriptionClassificationPanel({
  classification,
  source,
}: DescriptionClassificationPanelProps) {
  const status = classification.status ?? "identified";
  const showUncertain = status === "unsure";

  return (
    <div className="space-y-4" aria-live="polite">
      {source === "mock" && (
        <p
          className="rounded-lg border border-amber-600/30 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          Using mock classification — add{" "}
          <code className="text-xs">XAI_API_KEY</code> or{" "}
          <code className="text-xs">GROK_API_KEY</code> to{" "}
          <code className="text-xs">.env.local</code> for live Grok results.
        </p>
      )}

      {/* TEMP(slice): remove when product no longer needs on-screen object debug print */}
      <div
        className={cn(insetPanelClass, "px-4 py-4")}
        data-temporary-slice="grok-object-print"
      >
        <p className={sectionLabelClass}>Identified item</p>
        <p className="mt-2 text-xl font-bold text-[var(--litter-forest)]">
          {classification.objectName}
          {showUncertain ? (
            <span className="ml-2 text-sm font-semibold normal-case text-amber-900">
              (uncertain)
            </span>
          ) : null}
        </p>
        {showUncertain ? (
          <p className="mt-2 text-sm text-black/65">
            Best guess — confidence {classification.confidence}%.
          </p>
        ) : null}
      </div>

      <div className={classificationPanelClass}>
        <p className="font-semibold">Classification</p>
        <dl className="mt-3 space-y-3">
          <div>
            <dt className={sectionLabelClass}>Category</dt>
            <dd className="mt-0.5 text-base font-medium">{classification.category}</dd>
          </div>
          <div>
            <dt className={sectionLabelClass}>Class</dt>
            <dd className="mt-0.5 text-base font-medium">{classification.class}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
