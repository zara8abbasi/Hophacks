import Link from "next/link";
import { cn } from "@/lib/utils";

type HomeOptionLinkProps = {
  href: string;
  title: string;
  description: string;
  className?: string;
};

export function HomeOptionLink({
  href,
  title,
  description,
  className,
}: HomeOptionLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full min-h-[4.5rem] flex-col justify-center rounded-xl border border-black/10 bg-white px-6 py-4 text-left text-black shadow-md transition hover:bg-white/95 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-[5rem] sm:px-8",
        className
      )}
    >
      <span className="text-lg font-semibold tracking-tight sm:text-xl">
        {title}
      </span>
      <span className="mt-1 text-sm text-black/65 sm:text-base">
        {description}
      </span>
    </Link>
  );
}
