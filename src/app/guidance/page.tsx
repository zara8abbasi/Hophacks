"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HopHacksShell } from "@/components/hophacks-shell";
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
        <p className="rounded-2xl border border-white/20 bg-white/95 p-6 text-sm text-black/70 shadow-lg">
          Loading disposal guidance…
        </p>
      </HopHacksShell>
    );
  }

  return (
    <HopHacksShell showBack>
      <div className="rounded-2xl border border-white/20 bg-white/95 p-6 text-black shadow-lg sm:p-8">
        <LocationGuidanceView session={session} />
      </div>
    </HopHacksShell>
  );
}
