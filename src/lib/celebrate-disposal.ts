import confetti from "canvas-confetti";
import { incrementDisposalTreeLayers } from "@/lib/disposal-tree-layers";

const DISPOSAL_COLORS = ["#c8e4c4", "#9fcf9a", "#1a3d2e", "#e8dcc8", "#ffffff"];

/** Short burst of confetti when the user marks an item disposed. */
export function celebrateDisposal(): void {
  const end = Date.now() + 900;

  confetti({
    particleCount: 70,
    spread: 72,
    startVelocity: 38,
    origin: { y: 0.62 },
    colors: DISPOSAL_COLORS,
    disableForReducedMotion: true,
  });

  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 48,
      origin: { x: 0, y: 0.65 },
      colors: DISPOSAL_COLORS,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 48,
      origin: { x: 1, y: 0.65 },
      colors: DISPOSAL_COLORS,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();

  incrementDisposalTreeLayers();
}
