import type { DisposalGuidanceResponse } from "@/app/api/disposal-guidance/route";
import { isCurbsideDisposalMethod } from "@/lib/disposal-method";
import {
  dropOffCenterCardClass,
  dropOffCenterNameClass,
  sectionLabelClass,
} from "@/lib/hophacks-ui";

type BaltimoreGuidanceDisplayProps = {
  guidance: DisposalGuidanceResponse;
};

export function BaltimoreGuidanceDisplay({
  guidance,
}: BaltimoreGuidanceDisplayProps) {
  return (
    <div className="space-y-4 text-sm">
      <section className="rounded-xl border border-[var(--litter-forest)]/10 bg-[var(--litter-forest)]/[0.06] px-4 py-3">
        <p className="font-semibold text-[var(--litter-forest)]">
          {guidance.disposal.headline}
        </p>
        <p className="mt-2 text-black/80">{guidance.disposal.detail}</p>
      </section>

      {guidance.location && (
        <p className="text-xs text-black/55">
          Location: {guidance.location.displayName}
        </p>
      )}

      {guidance.dropOffWarnings.length > 0 && (
        <section className="space-y-2" role="status">
          <p className="font-semibold text-[var(--litter-forest)]">Drop-off alerts</p>
          {guidance.dropOffWarnings.map((w, i) => (
            <div
              key={`${w.title}-${i}`}
              className={
                w.severity === "warning"
                  ? "rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-amber-950"
                  : "rounded-lg border border-black/10 bg-black/[0.03] px-3 py-2 text-black/75"
              }
            >
              <p className="font-medium">{w.title}</p>
              <p className="mt-1">{w.message}</p>
              {w.nextOpen ? (
                <p className="mt-1 text-xs font-medium opacity-90">
                  Next window: {w.nextOpen}
                </p>
              ) : null}
            </div>
          ))}
        </section>
      )}

      {guidance.hhwSummary && (
        <p className="text-xs text-black/60">
          HHW schedule (city): {guidance.hhwSummary}
        </p>
      )}

      {guidance.dataLimitationNote && (
        <p className="text-xs text-black/55">{guidance.dataLimitationNote}</p>
      )}

      {isCurbsideDisposalMethod(guidance.disposal.method) ? (
        <section>
          <p className="font-semibold text-[var(--litter-forest)]">Collection days</p>
          {guidance.schedule.ok ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-black/80">
              <li>
                <span className="font-medium">Trash:</span>{" "}
                {guidance.schedule.trashDay}
              </li>
              <li>
                <span className="font-medium">Recycling:</span>{" "}
                {guidance.schedule.recycDay}
              </li>
              {guidance.schedule.daytext ? (
                <li className="list-none pl-0 text-black/65">
                  {guidance.schedule.daytext}
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="mt-2 text-amber-900">{guidance.schedule.message}</p>
          )}
        </section>
      ) : null}

      <section className={dropOffCenterCardClass} aria-labelledby="nearest-drop-off-heading">
        <p id="nearest-drop-off-heading" className={sectionLabelClass}>
          Nearest drop-off center
        </p>
        {guidance.nearestCenter.ok ? (
          <div className="mt-3 space-y-2.5 text-sm text-black/80 sm:text-base">
            <p className={dropOffCenterNameClass}>{guidance.nearestCenter.name}</p>
            <p className="text-base font-medium leading-snug text-[#1a2e24] sm:text-lg">
              {guidance.nearestCenter.address}
            </p>
            {guidance.nearestCenter.hoursSummary ? (
              <p className="text-black/65">
                Posted hours: {guidance.nearestCenter.hoursSummary}
              </p>
            ) : (
              <p className="text-black/65">
                Hours for this site are not on the city&apos;s five-center
                residential list — confirm on the city site before visiting.
              </p>
            )}
            <p className="text-black/60">
              About {guidance.nearestCenter.distanceMiles} mi away
              (straight-line).
            </p>
            <a
              href={guidance.nearestCenter.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm font-semibold text-[var(--litter-forest)] underline decoration-[var(--litter-forest)]/30 underline-offset-4 hover:decoration-[var(--litter-forest)] sm:text-base"
            >
              Open directions in Google Maps
            </a>
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-900 sm:text-base">
            {guidance.nearestCenter.message}
          </p>
        )}
      </section>

      {guidance.dataErrors.length > 0 && (
        <p className="text-xs text-amber-900" role="status">
          Data note: {guidance.dataErrors.join(" ")}
        </p>
      )}
    </div>
  );
}
