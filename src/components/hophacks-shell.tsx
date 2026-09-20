import Link from "next/link";
import { HomeTreeLayers } from "@/components/home-tree-layers";
import { homePageColumnClass, innerPageColumnClass } from "@/lib/hophacks-ui";
import { cn } from "@/lib/utils";

type HopHacksShellProps = {
  children: React.ReactNode;
  className?: string;
  showBack?: boolean;
  /** Home framed card; omit on inner routes so they share the wider column. */
  home?: boolean;
};

export function HopHacksShell({
  children,
  className,
  showBack = false,
  home = false,
}: HopHacksShellProps) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-gradient-to-b from-[#3d4b40] via-[#526a56] to-[#6f8676]"
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
          home ? homePageColumnClass : innerPageColumnClass,
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
