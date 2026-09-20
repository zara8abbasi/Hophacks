"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDisposalTreeLayerCount,
  MAX_TREE_LAYERS,
  TREE_LAYERS_CHANGED_EVENT,
} from "@/lib/disposal-tree-layers";

/** Back (0) → front (3): palest behind, darkest in front. */
const DEPTH_PLANES = [
  {
    trees: 18,
    seed: 11,
    baseLift: 0.08,
    heightScale: 0.32,
    fill: "#b8cfc2",
  },
  {
    trees: 20,
    seed: 29,
    baseLift: 0.06,
    heightScale: 0.38,
    fill: "#7a9d88",
  },
  {
    trees: 22,
    seed: 47,
    baseLift: 0.04,
    heightScale: 0.44,
    fill: "#4a6b58",
  },
  {
    trees: 24,
    seed: 67,
    baseLift: 0.02,
    heightScale: 0.5,
    fill: "#1e3d2e",
  },
] as const;

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Stepped pine ridge anchored at the bottom of the viewBox. */
function buildPineRidgePath(
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
    const peakH = (0.55 + r0 * 0.45) * h * heightScale;
    const center = baseX + step * (0.38 + r1 * 0.24);
    const halfW = step * (0.34 + r2 * 0.12);

    const tiers = 4;
    for (let t = tiers; t >= 0; t--) {
      const tierRatio = t / tiers;
      const y = ground - peakH * tierRatio;
      const inset = halfW * (0.15 + tierRatio * 0.85);
      const jag = (r3 - 0.5) * step * 0.04 * (1 - tierRatio);
      if (t === tiers) {
        d += ` L ${center + jag} ${ground - peakH}`;
      } else {
        const left = center - inset + jag;
        const right = center + inset + jag;
        d += ` L ${left} ${y}`;
        if (t > 0) {
          d += ` L ${right} ${y}`;
        }
      }
    }

    const footR = baseX + step * (0.92 + r2 * 0.06);
    d += ` L ${footR} ${ground}`;
  }

  d += ` L ${w} ${ground} L ${w} ${h} Z`;
  return d;
}

function PineSilhouettePlane({ layerIndex }: { layerIndex: number }) {
  const plane =
    DEPTH_PLANES[layerIndex] ?? DEPTH_PLANES[MAX_TREE_LAYERS - 1];
  const path = useMemo(
    () =>
      buildPineRidgePath(
        1200,
        900,
        plane.trees,
        plane.seed,
        plane.baseLift,
        plane.heightScale
      ),
    [plane]
  );

  const bottomOffset = layerIndex * 2;

  return (
    <div
      className="absolute inset-x-0 bottom-0"
      style={{
        height: `${42 + layerIndex * 6}%`,
        transform: `translateY(${bottomOffset}px)`,
      }}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 900"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d={path} fill={plane.fill} />
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
      {Array.from({ length: count }, (_, i) => (
        <PineSilhouettePlane key={i} layerIndex={i} />
      ))}
    </div>
  );
}
