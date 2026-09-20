"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDisposalTreeLayerCount,
  TREE_LAYERS_CHANGED_EVENT,
} from "@/lib/disposal-tree-layers";

/** Foreground pine row — darkest green only (no pale depth planes). */
const DARK_PINE = {
  fill: "#1a4638",
  trees: 26,
  seed: 71,
  baseLift: 0.015,
  heightScale: 0.52,
} as const;

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Jagged stepped pine silhouettes anchored at the bottom of the viewBox,
 * styled like a dense foreground conifer row.
 */
function buildDarkPineForegroundPath(
  w: number,
  h: number,
  treeCount: number,
  seed: number,
  baseLift: number,
  heightScale: number
): string {
  const ground = h * (1 - baseLift);
  const step = w / treeCount;
  let d = `M 0 ${h} L 0 ${ground}`;

  for (let i = 0; i < treeCount; i++) {
    const baseX = i * step;
    const r0 = pseudo(seed + i * 3.1);
    const r1 = pseudo(seed + i * 5.7 + 1);
    const r2 = pseudo(seed + i * 7.3 + 2);
    const r3 = pseudo(seed + i * 9.1 + 3);
    const r4 = pseudo(seed + i * 11.3 + 4);
    const peakH = (0.5 + r0 * 0.5) * h * heightScale;
    const center = baseX + step * (0.32 + r1 * 0.28);
    const halfW = step * (0.38 + r2 * 0.14);

    const tiers = 5;
    for (let t = tiers; t >= 0; t--) {
      const tierRatio = t / tiers;
      const y = ground - peakH * tierRatio;
      const inset = halfW * (0.12 + tierRatio * 0.88);
      const jag = (r3 - 0.5) * step * 0.055 * (1 - tierRatio * 0.85);
      const skew = (r4 - 0.5) * step * 0.03;

      if (t === tiers) {
        d += ` L ${center + jag + skew} ${ground - peakH}`;
      } else {
        const left = center - inset + jag;
        const right = center + inset + jag - skew * 0.5;
        d += ` L ${left} ${y}`;
        if (t > 0) {
          const midBump = center + (r3 - 0.5) * inset * 0.35;
          d += ` L ${midBump} ${y - peakH * 0.018}`;
          d += ` L ${right} ${y}`;
        }
      }
    }

    const footR = baseX + step * (0.9 + r2 * 0.08);
    d += ` L ${footR} ${ground}`;
  }

  d += ` L ${w} ${ground} L ${w} ${h} Z`;
  return d;
}

function DarkPineForeground() {
  const path = useMemo(
    () =>
      buildDarkPineForegroundPath(
        1200,
        900,
        DARK_PINE.trees,
        DARK_PINE.seed,
        DARK_PINE.baseLift,
        DARK_PINE.heightScale
      ),
    []
  );

  return (
    <div
      className="absolute inset-x-0 bottom-0"
      style={{ height: "46%" }}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 900"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d={path} fill={DARK_PINE.fill} />
      </svg>
    </div>
  );
}

export function HomeTreeLayers() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getDisposalTreeLayerCount());

    const onChange = (event: Event) => {
      const custom = event as CustomEvent<number>;
      if (typeof custom.detail === "number") {
        setCount(custom.detail);
      } else {
        setCount(getDisposalTreeLayerCount());
      }
    };

    window.addEventListener(TREE_LAYERS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(TREE_LAYERS_CHANGED_EVENT, onChange);
  }, []);

  if (count <= 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <DarkPineForeground />
    </div>
  );
}
