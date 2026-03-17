"use client";

import { useEffect, useRef } from "react";

const COLS = 40;
const ROWS = 12;
const DOT = 5;
const GAP = 4;
const STEP = DOT + GAP;

export const SiriWave = ({ active = true }: { active?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = COLS * STEP;
    const H = ROWS * STEP;
    canvas.width = W;
    canvas.height = H;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      tRef.current += active ? 0.06 : 0.008;
      const t = tRef.current;

      for (let col = 0; col < COLS; col++) {
        const xNorm = col / (COLS - 1); // 0..1

        // Layered sine waves — gives the Siri multi-wave feel
        const wave1 = Math.sin(xNorm * Math.PI * 4 - t * 2.2) * 0.55;
        const wave2 = Math.sin(xNorm * Math.PI * 6 - t * 1.4) * 0.3;
        const wave3 = Math.sin(xNorm * Math.PI * 2 - t * 0.9) * 0.15;
        const combined = wave1 + wave2 + wave3; // -1..1

        // Amplitude envelope — quiet at edges, loud in centre
        const envelope = Math.sin(xNorm * Math.PI);
        const amplitude = active ? envelope * 4.5 : envelope * 1.2;
        const centerRow = (ROWS - 1) / 2;
        const peakRow = centerRow + combined * amplitude;

        for (let row = 0; row < ROWS; row++) {
          const dist = Math.abs(row - peakRow);
          const alpha = active
            ? Math.max(0, 1 - dist * 0.72)
            : Math.max(0, 1 - dist * 1.8) * 0.35;

          if (alpha < 0.04) continue;

          // Colour: red → orange gradient across columns
          const hue = 0 + xNorm * 22; // 0° red → 22° orange-red
          const sat = active ? 85 : 55;
          const light = active ? 52 : 62;

          ctx.globalAlpha = alpha;
          ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;

          const x = col * STEP;
          const y = row * STEP;
          ctx.fillRect(x, y, DOT, DOT); // square pixels — pixelated look
        }
      }
      ctx.globalAlpha = 1;
      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: COLS * STEP,
        height: ROWS * STEP,
        imageRendering: "pixelated",
      }}
    />
  );
};
