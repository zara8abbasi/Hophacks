import Link from "next/link";
import { HopHacksShell } from "@/components/hophacks-shell";

const FOREST = "#1a3d2e";
const MINT = "#c8e4c4";
const TITLE_PILL = "#9fcf9a";

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
        stroke={FOREST}
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
        fill={FOREST}
        opacity="0.9"
      />
      <path
        d="M92 72 L76 44 L68 52 L80 76 Z"
        fill={FOREST}
        opacity="0.9"
      />
      <path
        d="M60 100 L48 80 L72 80 Z"
        fill={FOREST}
        opacity="0.9"
      />
    </svg>
  );
}

const homeActions = [
  { href: "/picture", label: "Upload Picture" },
  { href: "/type", label: "Type a description" },
  { href: "/speech", label: "Verbal input" },
] as const;

export default function Home() {
  return (
    <HopHacksShell className="max-w-xl justify-center py-8 sm:py-10">
      <div
        className="w-full rounded-[1.25rem] p-3 sm:rounded-[1.5rem] sm:p-4"
        style={{ backgroundColor: FOREST }}
      >
        <div
          className="flex min-h-[min(32rem,78dvh)] flex-col rounded-2xl px-5 py-7 sm:min-h-[34rem] sm:rounded-[1.25rem] sm:px-8 sm:py-9"
          style={{ backgroundColor: MINT }}
        >
          <header className="flex shrink-0 items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <div
                className="inline-block rounded-full px-5 py-2.5 sm:px-7 sm:py-3"
                style={{ backgroundColor: TITLE_PILL }}
              >
                <h1
                  className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl"
                  style={{ color: FOREST }}
                >
                  Litter LookUp
                </h1>
              </div>
              <p
                className="mt-4 max-w-md text-sm leading-snug sm:text-base sm:leading-relaxed"
                style={{ color: FOREST }}
              >
                Tell us what you need to throw away. We&apos;ll show you how to
                dispose of it and where to go in the city!
              </p>
            </div>
            <RecycleEarthIcon className="h-16 w-16 shrink-0 sm:h-20 sm:w-20 md:h-24 md:w-24" />
          </header>

          <nav
            className="mt-auto flex flex-1 flex-col items-center justify-center gap-4 py-8 sm:gap-5 sm:py-10"
            aria-label="Choose how to describe your item"
          >
            {homeActions.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex w-full max-w-md min-h-[3.75rem] items-center justify-center rounded-full bg-white px-8 py-4 text-center text-lg font-semibold shadow-sm transition hover:bg-[#f7f7f5] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:min-h-[4.25rem] sm:text-xl"
                style={{
                  color: FOREST,
                  outlineColor: FOREST,
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </HopHacksShell>
  );
}
