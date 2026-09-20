"use client";

import { useEffect, useState } from "react";
import {
  getDisposalTreeLayerCount,
  MAX_TREE_LAYERS,
  TREE_LAYERS_CHANGED_EVENT,
} from "@/lib/disposal-tree-layers";

const LAYER_HEIGHT_REM = 3.25;

const LAYER_PALETTE = [
  { canopy: "#0f2419", trunk: "#0a1a12" },
  { canopy: "#143022", trunk: "#0d1f16" },
  { canopy: "#1a3d2e", trunk: "#122a1f" },
  { canopy: "#234a38", trunk: "#1a3328" },
  { canopy: "#2d5c45", trunk: "#234a38" },
] as const;

function PineTree({
  canopy,
  trunk,
  scale = 1,
}: {
  canopy: string;
  trunk: string;
  scale?: number;
}) {
  const w = 56 * scale;
  const h = 72 * scale;
  return (
    <svg
      viewBox="0 0 56 72"
      width={w}
      height={h}
      className="shrink-0"
      aria-hidden
    >
      <polygon points="28,6 50,46 6,46" fill={canopy} />
      <polygon points="28,22 44,54 12,54" fill={canopy} opacity={0.92} />
      <rect x="24" y="46" width="8" height="18" rx="1" fill={trunk} />
    </svg>
  );
}

function TreeLayerRow({ layerIndex }: { layerIndex: number }) {
  const palette = LAYER_PALETTE[layerIndex] ?? LAYER_PALETTE[MAX_TREE_LAYERS - 1];
  const scales = [0.85, 1, 0.92, 1.08, 0.88, 1.02, 0.95, 1.1, 0.9, 1, 0.87, 1.05];

  return (
    <div
      className="flex w-full items-end justify-center gap-0 sm:gap-0.5"
      style={{ height: `${LAYER_HEIGHT_REM}rem` }}
    >
      {scales.map((scale, i) => (
        <PineTree
          key={i}
          canopy={palette.canopy}
          trunk={palette.trunk}
          scale={scale}
        />
      ))}
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[5] flex flex-col justify-end overflow-hidden"
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => (
        <TreeLayerRow key={i} layerIndex={i} />
      ))}
    </div>
  );
}
