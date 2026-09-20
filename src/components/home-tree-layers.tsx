"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDisposalTreeLayerCount,
  MAX_TREE_LAYERS,
  TREE_LAYERS_CHANGED_EVENT,
} from "@/lib/disposal-tree-layers";

/** Depth plane styling: back (0) → front (4). */
const DEPTH_PLANES = [
  {
    ridge: 0.38,
    trees: 14,
    seed: 11,
    fillTop: "rgba(196, 218, 208, 0.55)",
    fillMid: "rgba(142, 178, 162, 0.72)",
    fillBottom: "rgba(98, 138, 122, 0.88)",
    mist: "rgba(232, 243, 238, 0.42)",
    blur: 2.5,
    opacity: 0.92,
  },
  {
    ridge: 0.48,
    trees: 16,
    seed: 23,
    fillTop: "rgba(168, 198, 186, 0.5)",
    fillMid: "rgba(118, 158, 142, 0.78)",
    fillBottom: "rgba(72, 108, 94, 0.9)",
    mist: "rgba(220, 236, 228, 0.35)",
    blur: 1.8,
    opacity: 0.94,
  },
  {
    ridge: 0.58,
    trees: 18,
    seed: 37,
    fillTop: "rgba(130, 168, 152, 0.45)",
    fillMid: "rgba(82, 124, 108, 0.82)",
    fillBottom: "rgba(45, 78, 64, 0.92)",
    mist: "rgba(200, 224, 214, 0.28)",
    blur: 1.2,
    opacity: 0.96,
  },
  {
    ridge: 0.7,
    trees: 20,
    seed: 53,
    fillTop: "rgba(88, 128, 112, 0.5)",
    fillMid: "rgba(42, 72, 58, 0.88)",
    fillBottom: "rgba(22, 48, 38, 0.95)",
    mist: "rgba(180, 210, 198, 0.22)",
    blur: 0.6,
    opacity: 0.97,
  },
  {
    ridge: 0.82,
    trees: 22,
    seed: 71,
    fillTop: "rgba(52, 88, 72, 0.55)",
    fillMid: "rgba(24, 52, 40, 0.92)",
    fillBottom: "rgba(10, 28, 22, 0.98)",
    mist: "rgba(160, 190, 178, 0.15)",
    blur: 0,
    opacity: 1,
  },
] as const;

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function buildPineRidgePath(
  w: number,
  h: number,
  treeCount: number,
  seed: number,
  ridgeRatio: number
): string {
  const ground = h * ridgeRatio;
  const step = w / treeCount;
  let d = `M 0 ${h} L 0 ${ground}`;

  for (let i = 0; i < treeCount; i++) {
    const baseX = i * step;
    const r0 = pseudo(seed + i * 3.1);
    const r1 = pseudo(seed + i * 5.7 + 1);
    const r2 = pseudo(seed + i * 7.3 + 2);
    const peakH = (0.12 + r0 * 0.28) * h;
    const widthBias = 0.28 + r1 * 0.22;
    const peakX = baseX + step * (0.35 + r2 * 0.3);
    const leftX = baseX + step * 0.08;
    const rightX = baseX + step * 0.92;
    const shoulderL = baseX + step * widthBias;
    const shoulderR = baseX + step * (1 - widthBias);

    d += ` L ${leftX} ${ground - peakH * 0.22}`;
    d += ` L ${shoulderL} ${ground - peakH * 0.55}`;
    d += ` L ${peakX} ${ground - peakH}`;
    d += ` L ${shoulderR} ${ground - peakH * 0.5}`;
    d += ` L ${rightX} ${ground - peakH * 0.18}`;
  }

  d += ` L ${w} ${ground} L ${w} ${h} Z`;
  return d;
}

function MistForestPlane({ layerIndex }: { layerIndex: number }) {
  const plane =
    DEPTH_PLANES[layerIndex] ?? DEPTH_PLANES[MAX_TREE_LAYERS - 1];
  const path = useMemo(
    () => buildPineRidgePath(1200, 900, plane.trees, plane.seed, plane.ridge),
    [plane]
  );
  const gradId = `tree-grad-${layerIndex}`;
  const mistId = `tree-mist-${layerIndex}`;

  return (
    <div
      className="absolute inset-0"
      style={{
        opacity: plane.opacity,
        filter: plane.blur > 0 ? `blur(${plane.blur}px)` : undefined,
      }}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 900"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={plane.fillTop} />
            <stop offset="42%" stopColor={plane.fillMid} />
            <stop offset="100%" stopColor={plane.fillBottom} />
          </linearGradient>
          <linearGradient id={mistId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={plane.mist} />
            <stop offset="55%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <path d={path} fill={`url(#${gradId})`} />
        <rect
          x="0"
          y="0"
          width="1200"
          height="900"
          fill={`url(#${mistId})`}
        />
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
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#dfe8e2]/55 via-[#8fa898]/12 to-transparent"
        aria-hidden
      />
      {Array.from({ length: count }, (_, i) => (
        <MistForestPlane key={i} layerIndex={i} />
      ))}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#eef4f1]/70 via-transparent to-[#0a1410]/25"
        aria-hidden
      />
    </div>
  );
}
