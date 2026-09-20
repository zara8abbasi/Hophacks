import Link from "next/link";
import { HopHacksShell } from "@/components/hophacks-shell";
import { TrashPileAnimation } from "@/components/trash-pile-animation";

const PANEL_FOREST = "#1a3328";
const BORDER_FOREST = "#2d5c45";
const TEXT_FOREST = "#c8e4c4";
const TITLE_FOREST = "#e8f5ec";

const bodyCopy = `33% of all municipal waste generated globally is handled in an environmentally unsafe manner. 25% of materials placed in residential recycling bins are contaminated by non recyclable garbage, forcing the entire contents to be dumped into landfills. Improper waste disposal has detrimental effects on the environment, and is caused by misinformation, rather than real malicious intent. Through Litter LookUp, we hope to reduce this number by making waste disposal both convenient and accessible. Currently, Litter LookUp is located in Baltimore, however we hope to expand our services across the United States to promote more environmental consciousness!`;

export default function WhyPage() {
  return (
    <HopHacksShell showBack>
      <div
        className="w-full rounded-[1.35rem] p-3 shadow-[0_20px_50px_rgba(10,24,18,0.45)] sm:rounded-[1.5rem] sm:p-3.5"
        style={{ backgroundColor: BORDER_FOREST }}
      >
        <div
          className="relative overflow-hidden rounded-[1.15rem] sm:rounded-[1.25rem]"
          style={{ backgroundColor: PANEL_FOREST }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[min(42%,14rem)]"
            aria-hidden
          >
            <TrashPileAnimation className="h-full w-full" maxPieces={42} />
          </div>

          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#1a3328] via-[#1a3328]/92 to-[#1a3328]/55"
            aria-hidden
          />

          <article
            className="relative z-10 px-8 py-12 text-center sm:px-12 sm:py-16"
          >
            <h1
              className="font-home-display text-[1.65rem] font-bold tracking-tight sm:text-3xl md:text-[2rem]"
              style={{ color: TITLE_FOREST }}
            >
              Why does this matter?
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl text-[0.9375rem] leading-relaxed sm:text-base sm:leading-relaxed"
              style={{ color: TEXT_FOREST }}
            >
              {bodyCopy}
            </p>
          </article>
        </div>
      </div>

      <p className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm font-semibold text-white/90 underline decoration-white/35 underline-offset-4 transition hover:text-white hover:decoration-white/60"
        >
          Back to home
        </Link>
      </p>
    </HopHacksShell>
  );
}
