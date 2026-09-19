"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HopHacksShell } from "@/components/hophacks-shell";
import { LoadingCard, PageCard } from "@/components/page-card";
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
        <LoadingCard message="Loading disposal guidance…" />
      </HopHacksShell>
    );
  }

  return (
    <HopHacksShell showBack>
      <PageCard>
        <DisposalResultView session={session} />
      </PageCard>
    </HopHacksShell>
  );
}
