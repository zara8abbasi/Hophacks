import Link from "next/link";
import { HopHacksShell } from "@/components/hophacks-shell";

const FOREST = "var(--litter-forest)";
const MINT = "var(--litter-mint)";
const TITLE_PILL = "var(--litter-title-pill)";

function RecycleEarthIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M60 8 L108 68 L84 108 L36 108 L12 68 Z"
        stroke="#1a3d2e"
        strokeWidth="6"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M60 22 L96 70 L78 98 L42 98 L24 70 Z"
        fill="#6b9fd4"
        opacity="0.85"
      />
      <path
        d="M60 28 C72 32 82 42 84 56 C78 52 68 50 60 52 C52 54 44 60 40 68 C38 58 44 36 60 28Z"
        fill="#5a9a6e"
      />
      <path
        d="M48 72 C52 78 58 82 66 82 C70 76 72 68 70 60 C62 62 54 66 48 72Z"
        fill="#4d8f5f"
      />
      <path
        d="M28 72 L44 44 L52 52 L40 76 Z"
        fill="#1a3d2e"
        opacity="0.9"
      />
      <path
        d="M92 72 L76 44 L68 52 L80 76 Z"
        fill="#1a3d2e"
        opacity="0.9"
      />
      <path
        d="M60 100 L48 80 L72 80 Z"
        fill="#1a3d2e"
        opacity="0.9"
      />
    </svg>
  );
}

const homeActions = [
  { href: "/picture", label: "Upload a photo" },
  { href: "/type", label: "Type a description" },
  { href: "/speech", label: "Use voice input" },
] as const;

export default function Home() {
  return (
    <HopHacksShell className="max-w-2xl justify-center py-6 sm:max-w-3xl sm:py-10">
      <div
        className="relative w-full rounded-[1.35rem] p-3 shadow-[0_20px_50px_rgba(10,24,18,0.35)] sm:rounded-[1.5rem] sm:p-3.5"
        style={{ backgroundColor: FOREST }}
      >
        <div
          className="font-home-display flex min-h-[min(26rem,58dvh)] flex-col rounded-[1.15rem] px-6 py-8 sm:min-h-[min(28rem,62dvh)] sm:rounded-[1.25rem] sm:px-10 sm:py-10"
          style={{ backgroundColor: MINT }}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 sm:gap-6">
            <div className="min-w-0 flex-1 pt-0.5">
              <div
                className="inline-block rounded-full px-5 py-2 sm:px-7 sm:py-2.5"
                style={{ backgroundColor: TITLE_PILL }}
              >
                <h1
                  className="text-[1.65rem] font-bold tracking-tight sm:text-3xl md:text-[2rem]"
                  style={{ color: FOREST }}
                >
                  Litter LookUp
                </h1>
              </div>
              <p
                className="mt-4 max-w-md text-[0.9375rem] leading-relaxed sm:text-base"
                style={{ color: FOREST }}
              >
                Tell us what you need to throw away. We&apos;ll identify it,
                explain how to dispose of it safely, and point you to Baltimore
                drop-off options when they apply.
              </p>
            </div>
            <RecycleEarthIcon className="mt-1 h-[4.25rem] w-[4.25rem] shrink-0 sm:h-24 sm:w-24" />
          </header>

          <nav
            className="mt-auto flex flex-1 flex-col items-stretch justify-center gap-3.5 py-8 sm:gap-4 sm:py-10"
            aria-label="Choose how to describe your item"
          >
            {homeActions.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-[3.5rem] w-full items-center justify-center rounded-full bg-white px-6 py-3.5 text-center text-base font-semibold shadow-[0_8px_24px_rgba(26,61,46,0.32)] transition hover:bg-[#fafaf8] hover:shadow-[0_10px_28px_rgba(26,61,46,0.38)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:min-h-[3.75rem] sm:text-lg"
                style={{
                  color: FOREST,
                  outlineColor: "#1a3d2e",
                }}
              >
                {label}
              </Link>
            ))}
          </nav>

          <p className="shrink-0 pb-1 text-center">
            <Link
              href="/why"
              className="text-sm font-semibold underline decoration-[var(--litter-forest)]/35 underline-offset-4 transition hover:decoration-[var(--litter-forest)]/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: FOREST, outlineColor: "#1a3d2e" }}
            >
              Why this matters
            </Link>
          </p>
        </div>
      </div>
    </HopHacksShell>
  );
}
