import Link from "next/link";
import { HomeTreeLayers } from "@/components/home-tree-layers";
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
        className="pointer-events-none fixed inset-0 -z-20 bg-gradient-to-b from-[#e8f3f6] via-[#d4e4ea] to-[#b8cdd4]"
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
      <HomeTreeLayers />
      <div
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-8 sm:px-8 sm:py-12",
          className
        )}
      >
        {showBack && (
          <Link
            href="/"
            className="mb-6 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/95 backdrop-blur-sm transition hover:border-white/35 hover:bg-white/15"
          >
            ← Home
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
