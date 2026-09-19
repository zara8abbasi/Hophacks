"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HopHacksShell } from "@/components/hophacks-shell";
import { DisposalResultView } from "@/components/disposal-result-view";
import {
  loadDisposalResultSession,
  type DisposalResultSession,
} from "@/lib/disposal-result-session";

export default function ResultPage() {
  const router = useRouter();
  const [session, setSession] = useState<DisposalResultSession | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const loaded = loadDisposalResultSession();
    setSession(loaded);
    setChecked(true);
    if (!loaded) {
      router.replace("/");
      return;
    }
    if (!loaded.identificationConfirmed) {
      router.replace("/identify");
    }
  }, [router]);

  if (!checked || !session) {
    return (
      <HopHacksShell showBack>
        <p className="rounded-2xl border border-white/20 bg-white/95 p-6 text-sm text-black/70 shadow-lg">
          Loading your disposal results…
        </p>
      </HopHacksShell>
    );
  }

  return (
    <HopHacksShell showBack>
      <div className="rounded-2xl border border-white/20 bg-white/95 p-6 text-black shadow-lg sm:p-8">
        <DisposalResultView session={session} />
      </div>
    </HopHacksShell>
  );
}
