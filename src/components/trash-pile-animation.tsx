"use client";

import { useEffect, useRef } from "react";

type TrashKind = "bag" | "bottle" | "can";

type TrashPiece = {
  kind: TrashKind;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  color: string;
  accent: string;
  settled: boolean;
  vy: number;
};

const PALETTE = [
  { fill: "#4a5568", accent: "#2d3748" },
  { fill: "#5c6b7a", accent: "#3d4f5f" },
  { fill: "#6b7c8f", accent: "#4a5d70" },
  { fill: "#3d5a6c", accent: "#2a4254" },
  { fill: "#556b2f", accent: "#3d4f22" },
  { fill: "#4a6741", accent: "#354a2e" },
];

function randomKind(): TrashKind {
  const r = Math.random();
  if (r < 0.35) return "bag";
  if (r < 0.7) return "bottle";
  return "can";
}

function drawPiece(ctx: CanvasRenderingContext2D, piece: TrashPiece) {
  ctx.save();
  ctx.translate(piece.x + piece.w / 2, piece.y + piece.h / 2);
  ctx.rotate(piece.rotation);

  const { fill, accent } = {
    fill: piece.color,
    accent: piece.accent,
  };

  if (piece.kind === "bag") {
    ctx.fillStyle = fill;
    roundRect(ctx, -piece.w / 2, -piece.h / 2, piece.w, piece.h, 4);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-piece.w * 0.2, -piece.h / 2);
    ctx.quadraticCurveTo(0, -piece.h / 2 - 5, piece.w * 0.2, -piece.h / 2);
    ctx.strokeStyle = accent;
    ctx.stroke();
  } else if (piece.kind === "bottle") {
    const bw = piece.w * 0.55;
    const neck = piece.h * 0.22;
    ctx.fillStyle = fill;
    roundRect(ctx, -bw / 2, -piece.h / 2 + neck, bw, piece.h - neck, 3);
    ctx.fill();
    ctx.fillStyle = accent;
    roundRect(ctx, -bw * 0.28, -piece.h / 2, bw * 0.56, neck, 2);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#a8c4e0";
    roundRect(ctx, -bw * 0.15, -piece.h / 2 + neck + 4, bw * 0.2, piece.h * 0.5, 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = fill;
    roundRect(ctx, -piece.w / 2, -piece.h / 2, piece.w, piece.h, 3);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-piece.w / 2, -piece.h * 0.15);
    ctx.lineTo(piece.w / 2, -piece.h * 0.15);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.5;
    roundRect(ctx, -piece.w * 0.35, -piece.h * 0.05, piece.w * 0.7, piece.h * 0.35, 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function spawnPiece(width: number, floorY: number): TrashPiece {
  const kind = randomKind();
  const colors = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  let w: number;
  let h: number;
  if (kind === "bag") {
    w = 22 + Math.random() * 18;
    h = 16 + Math.random() * 12;
  } else if (kind === "bottle") {
    w = 12 + Math.random() * 8;
    h = 28 + Math.random() * 16;
  } else {
    w = 14 + Math.random() * 10;
    h = 18 + Math.random() * 10;
  }
  return {
    kind,
    x: Math.random() * (width - w - 16) + 8,
    y: -h - Math.random() * 40,
    w,
    h,
    rotation: (Math.random() - 0.5) * 0.4,
    color: colors.fill,
    accent: colors.accent,
    settled: false,
    vy: 0.8 + Math.random() * 0.6,
  };
}

function findLandingY(
  piece: TrashPiece,
  others: TrashPiece[],
  floorY: number
): number {
  let best = floorY - piece.h;
  for (const other of others) {
    if (other.settled && piece.x < other.x + other.w && piece.x + piece.w > other.x) {
      const top = other.y;
      if (top < best + piece.h) {
        best = top - piece.h;
      }
    }
  }
  return best;
}

type TrashPileAnimationProps = {
  className?: string;
  maxPieces?: number;
};

export function TrashPileAnimation({
  className,
  maxPieces = 48,
}: TrashPileAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const piecesRef = useRef<TrashPiece[]>([]);
  const frameRef = useRef(0);
  const spawnTimerRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const tick = () => {
      if (!running) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const floorY = h - 4;
      const pieces = piecesRef.current;

      spawnTimerRef.current += 1;
      if (
        spawnTimerRef.current > 55 &&
        pieces.filter((p) => p.settled).length < maxPieces
      ) {
        spawnTimerRef.current = 0;
        pieces.push(spawnPiece(w, floorY));
      }

      for (const piece of pieces) {
        if (!piece.settled) {
          piece.vy += 0.12;
          piece.y += piece.vy;
          const landY = findLandingY(piece, pieces, floorY);
          if (piece.y >= landY) {
            piece.y = landY;
            piece.settled = true;
            piece.rotation = (Math.random() - 0.5) * 0.25;
            piece.vy = 0;
          }
        }
      }

      ctx.clearRect(0, 0, w, h);

      const gradient = ctx.createLinearGradient(0, h * 0.35, 0, h);
      gradient.addColorStop(0, "rgba(8, 18, 32, 0)");
      gradient.addColorStop(1, "rgba(8, 18, 32, 0.55)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      const sorted = [...pieces].sort((a, b) => a.y - b.y);
      for (const piece of sorted) {
        ctx.globalAlpha = piece.settled ? 0.72 : 0.85;
        drawPiece(ctx, piece);
      }
      ctx.globalAlpha = 1;

      frameRef.current += 1;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [maxPieces]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
    />
  );
}
