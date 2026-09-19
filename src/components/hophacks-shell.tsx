import Link from "next/link";
import { cn } from "@/lib/utils";

type HopHacksShellProps = {
  children: React.ReactNode;
  className?: string;
  showBack?: boolean;
};

export function HopHacksShell({
  children,
  className,
  showBack = false,
}: HopHacksShellProps) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-gradient-to-b from-[#5f7260] via-[#7f9a7a] to-[#a8bc94]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.62] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "96px 96px",
        }}
        aria-hidden
      />
      <div className={cn("relative mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-10 sm:px-8 sm:py-14", className)}>
        {showBack && (
          <Link
            href="/"
            className="mb-8 text-sm font-medium text-white/90 underline-offset-4 hover:text-white hover:underline"
          >
            ← Back to home
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
