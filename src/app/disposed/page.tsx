"use client";

import Link from "next/link";
import { HopHacksShell } from "@/components/hophacks-shell";

export default function DisposedPage() {
  return (
    <HopHacksShell>
      <div
        className="rounded-2xl border border-[var(--litter-mint)]/35 bg-gradient-to-b from-[var(--litter-forest)] via-[#234a38] to-[#1a3d2e] px-6 py-10 text-center text-white shadow-[0_16px_48px_rgba(15,30,22,0.35)] sm:px-10 sm:py-12"
        role="status"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--litter-mint)]">
          Disposal complete
        </p>
        <h1 className="font-home-display mt-3 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          Nice work
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/88 sm:text-base">
          Item marked disposed. Thanks for keeping waste out of the wrong bin.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/25 bg-white/95 px-5 text-sm font-medium text-[var(--litter-forest)] transition hover:bg-white"
          >
            Identify another item
          </Link>
        </div>
      </div>
    </HopHacksShell>
  );
}
