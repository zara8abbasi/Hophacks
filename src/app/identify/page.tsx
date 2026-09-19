"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HopHacksShell } from "@/components/hophacks-shell";
import { LoadingCard, PageCard } from "@/components/page-card";
import { IdentifyConfirmView } from "@/components/identify-confirm-view";
import { isClassificationReadyForDisposal } from "@/lib/description-classification";
import {
  loadDisposalResultSession,
  type DisposalResultSession,
} from "@/lib/disposal-result-session";

export default function IdentifyPage() {
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
    if (loaded.identificationConfirmed) {
      router.replace("/result");
      return;
    }
    if (!isClassificationReadyForDisposal(loaded.classification)) {
      router.replace(loaded.origin);
    }
  }, [router]);

  if (!checked || !session) {
    return (
      <HopHacksShell showBack>
        <LoadingCard message="Loading identification…" />
      </HopHacksShell>
    );
  }

  if (!isClassificationReadyForDisposal(session.classification)) {
    return null;
  }

  return (
    <HopHacksShell showBack>
      <PageCard>
        <IdentifyConfirmView session={session} />
      </PageCard>
    </HopHacksShell>
  );
}
