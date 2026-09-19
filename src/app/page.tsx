import { HopHacksShell } from "@/components/hophacks-shell";
import { HomeOptionLink } from "@/components/home-option-link";

export default function Home() {
  return (
    <HopHacksShell>
      <header className="mb-10 text-center sm:mb-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
          Baltimore
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          HopHacks
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-white/90 sm:text-lg">
          Tell us what you need to throw away. We&apos;ll show how to dispose of
          it and where to go in the city.
        </p>
      </header>
      <nav
        className="flex flex-col gap-4 sm:gap-5"
        aria-label="Choose how to describe your item"
      >
        <HomeOptionLink
          href="/picture"
          title="Take A Picture"
          description="Snap a photo of the item for identification."
        />
        <HomeOptionLink
          href="/type"
          title="Type A Description"
          description="Describe the material, size, or label in your own words."
        />
        <HomeOptionLink
          href="/speech"
          title="Use Speech Input"
          description="Say what you’re holding and we’ll transcribe it."
        />
      </nav>
      <p className="mt-10 text-center text-xs text-white/70 sm:mt-14">
        Recycling center maps and AI guidance are coming in a later release.
      </p>
    </HopHacksShell>
  );
}
