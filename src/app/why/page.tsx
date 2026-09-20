import Link from "next/link";
import { HopHacksShell } from "@/components/hophacks-shell";
import { TrashPileAnimation } from "@/components/trash-pile-animation";

const PANEL_BLUE = "#132a45";
const BORDER_BLUE = "#1e4a6e";
const TEXT_BLUE = "#c8d9ec";
const TITLE_BLUE = "#e8f2fc";

const bodyCopy = `33% of all municipal waste generated globally is handled in an environmentally unsafe manner. 25% of materials placed in residential recycling bins are contaminated by non recyclable garbage, forcing the entire contents to be dumped into landfills. Improper waste disposal has detrimental effects on the environment, and is caused by misinformation, rather than real malicious intent. Through Litter LookUp, we hope to reduce this number by making waste disposal both convenient and accessible. Currently, Litter LookUp is located in Baltimore, however we hope to expand our services across the United States to promote more environmental consciousness!`;

export default function WhyPage() {
  return (
    <HopHacksShell showBack className="max-w-2xl sm:max-w-3xl">
      <div
        className="w-full rounded-[1.35rem] p-3 shadow-[0_20px_50px_rgba(4,12,24,0.55)] sm:rounded-[1.5rem] sm:p-3.5"
        style={{ backgroundColor: BORDER_BLUE }}
      >
        <div
          className="relative overflow-hidden rounded-[1.15rem] sm:rounded-[1.25rem]"
          style={{ backgroundColor: PANEL_BLUE }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[min(42%,14rem)]"
            aria-hidden
          >
            <TrashPileAnimation className="h-full w-full" maxPieces={42} />
          </div>

          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-[#132a45] via-[#132a45]/92 to-[#132a45]/55"
            aria-hidden
          />

          <article
            className="relative z-10 px-6 py-10 text-center sm:px-10 sm:py-12"
          >
            <h1
              className="font-home-display text-[1.65rem] font-bold tracking-tight sm:text-3xl md:text-[2rem]"
              style={{ color: TITLE_BLUE }}
            >
              Why does this matter?
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl text-[0.9375rem] leading-relaxed sm:text-base sm:leading-relaxed"
              style={{ color: TEXT_BLUE }}
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
