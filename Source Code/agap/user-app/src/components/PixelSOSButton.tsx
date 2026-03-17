"use client";

import { useEffect, useRef, useCallback } from "react";

// ── Layout constants ──────────────────────────────────────────────────────────
// SIZE is the logical canvas size. On phones the wrapper is constrained by CSS
// so the canvas never overflows — we just render at this resolution.
const SIZE = 220;
const CENTER = SIZE / 2;
const PIXEL = 5;
const GAP = 3;
const STEP = PIXEL + GAP;
const RADIUS = CENTER - 10;

type Dot = { cx: number; cy: number; normDist: number; angle: number };

function buildDots(): Dot[] {
  const dots: Dot[] = [];
  for (let gx = 0; gx * STEP < SIZE; gx++) {
    for (let gy = 0; gy * STEP < SIZE; gy++) {
      const cx = gx * STEP + PIXEL / 2;
      const cy = gy * STEP + PIXEL / 2;
      const dx = cx - CENTER;
      const dy = cy - CENTER;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= RADIUS) {
        dots.push({
          cx,
          cy,
          normDist: dist / RADIUS,
          angle: Math.atan2(dy, dx),
        });
      }
    }
  }
  return dots;
}

const DOTS = buildDots();

interface Props {
  onClick: () => void;
  sublabel?: string;
}

export const PixelSOSButton = ({
  onClick,
  sublabel = "Tap to speak",
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const tRef = useRef(0);
  const pressedRef = useRef(false);
  const scaleRef = useRef(1);
  const cursorRef = useRef({ x: 0, y: 0 });

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    tRef.current += 0.038;
    const t = tRef.current;

    // Smooth press scale lerp
    const target = pressedRef.current ? 0.92 : 1;
    scaleRef.current += (target - scaleRef.current) * 0.16;
    const s = scaleRef.current;

    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.scale(s, s);
    ctx.translate(-CENTER, -CENTER);

    const { x: curX, y: curY } = cursorRef.current;

    for (const { cx, cy, normDist, angle } of DOTS) {
      // 4-layer wave field
      const w1 = Math.sin(normDist * Math.PI * 6 - t * 3.8);
      const w2 = Math.sin(normDist * Math.PI * 3.5 - t * 2.3) * 0.6;
      const w3 = Math.sin(angle * 5 + t * 1.5) * 0.4;
      const w4 = Math.sin(normDist * Math.PI * 9 - t * 5.2) * 0.25;
      const wave = (w1 + w2 + w3 + w4) / 2.25;

      // Cursor proximity (normalised dot coords vs cursor -1..1)
      const nx = (cx - CENTER) / RADIUS;
      const ny = (cy - CENTER) / RADIUS;
      const cdx = nx - curX;
      const cdy = ny - curY;
      const proximity = Math.max(0, 1 - Math.sqrt(cdx * cdx + cdy * cdy) * 1.4);

      // Brightness
      const brightness = Math.max(
        0.05,
        1 - normDist * 0.5 + wave * 0.42 + proximity * 0.55,
      );

      // Colour: deep red core → orange-red edge, warms near cursor
      const hue = normDist * 22 + proximity * 30;
      const sat = 82 + proximity * 14;
      const light = 36 + brightness * 30;
      const alpha = Math.min(1, 0.12 + brightness * 0.88);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsl(${hue},${sat}%,${light}%)`;
      ctx.fillRect(cx - PIXEL / 2, cy - PIXEL / 2, PIXEL, PIXEL);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
    frameRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = SIZE;
    canvas.height = SIZE;
    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    cursorRef.current = {
      x: ((e.clientX - r.left) / r.width) * 2 - 1,
      y: ((e.clientY - r.top) / r.height) * 2 - 1,
    };
  }, []);

  const onLeave = useCallback(() => {
    pressedRef.current = false;
    const drift = () => {
      const { x, y } = cursorRef.current;
      cursorRef.current = { x: x * 0.88, y: y * 0.88 };
      if (
        Math.abs(cursorRef.current.x) > 0.01 ||
        Math.abs(cursorRef.current.y) > 0.01
      )
        requestAnimationFrame(drift);
      else cursorRef.current = { x: 0, y: 0 };
    };
    drift();
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 select-none w-full">
      {/* Label sits above the canvas */}
      <div className="text-center">
        <span
          className="block text-xs font-semibold uppercase tracking-widest mt-1.5"
          style={{ color: "var(--tx-dim)" }}
        >
          {sublabel}
        </span>
      </div>

      {/* Canvas wrapper — constrained so it never overflows on 320px screens */}
      <div
        role="button"
        tabIndex={0}
        aria-label="AGAP — Tap to speak your emergency"
        className="relative cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-red-400 focus-visible:ring-offset-4 rounded-full"
        style={{ width: SIZE, height: SIZE, maxWidth: "min(220px, 56vw)" }}
        onPointerMove={onMove}
        onPointerDown={() => {
          pressedRef.current = true;
        }}
        onPointerUp={() => {
          pressedRef.current = false;
          onClick();
        }}
        onPointerLeave={onLeave}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClick();
        }}
      >
        {/* Neumorphic raised ring — theme-aware via CSS var */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: "var(--nm-shadow)" }}
        />
        {/* Ambient red glow */}
        <div
          className="absolute inset-3 rounded-full pointer-events-none"
          style={{ boxShadow: "0 0 28px 6px rgba(220,38,38,0.18)" }}
        />
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            imageRendering: "pixelated",
            borderRadius: "50%",
            display: "block",
          }}
        />
      </div>
    </div>
  );
};
