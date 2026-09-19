"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HopHacksShell } from "@/components/hophacks-shell";
import { LoadingCard, PageCard } from "@/components/page-card";
import { LocationGuidanceView } from "@/components/location-guidance-view";
import {
  loadLocationGuidanceSession,
  type LocationGuidanceSession,
} from "@/lib/location-guidance-session";

export default function GuidancePage() {
  const router = useRouter();
  const [session, setSession] = useState<LocationGuidanceSession | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const loaded = loadLocationGuidanceSession();
    setSession(loaded);
    setChecked(true);
    if (!loaded) {
      router.replace("/");
    }
  }, [router]);

  if (!checked || !session) {
    return (
      <HopHacksShell showBack>
        <LoadingCard message="Loading location guidance…" />
      </HopHacksShell>
    );
  }

  return (
    <HopHacksShell showBack>
      <PageCard>
        <LocationGuidanceView session={session} />
      </PageCard>
    </HopHacksShell>
  );
}
