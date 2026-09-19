import type { DescriptionClassification } from "@/lib/description-classification";

type DescriptionClassificationPanelProps = {
  classification: DescriptionClassification;
  source: "live" | "mock";
};

export function DescriptionClassificationPanel({
  classification,
  source,
}: DescriptionClassificationPanelProps) {
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
        className="rounded-xl border-2 border-dashed border-[#1a3d2e]/40 bg-[#1a3d2e]/5 px-4 py-4"
        data-temporary-slice="grok-object-print"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1a3d2e]/70">
          Temporary — identified object (remove later)
        </p>
        <p className="mt-2 text-xl font-bold text-[#1a3d2e]">
          {classification.objectName}
        </p>
      </div>

      <div className="rounded-lg bg-[#1a3d2e]/10 px-4 py-4 text-sm text-[#1a3d2e]">
        <p className="font-semibold">Classification</p>
        <dl className="mt-3 space-y-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[#1a3d2e]/70">
              Category
            </dt>
            <dd className="text-base font-medium">{classification.category}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[#1a3d2e]/70">
              Class
            </dt>
            <dd className="text-base font-medium">{classification.class}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
