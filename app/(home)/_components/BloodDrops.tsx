"use client";

import { useEffect, useRef, useCallback } from "react";

interface Drop {
  x: number;
  y: number;
  vy: number;
  size: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
  trail: { x: number; y: number; opacity: number }[];
}

export function BloodDrops({
  count = 18,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<Drop[]>([]);
  const animRef = useRef<number>(0);

  const createDrop = useCallback(
    (width: number, height: number, startY?: number): Drop => ({
      x: Math.random() * width,
      y: startY ?? -(Math.random() * height * 0.5),
      vy: 0.4 + Math.random() * 1.2,
      size: 2 + Math.random() * 4,
      opacity: 0.15 + Math.random() * 0.45,
      wobble: 0,
      wobbleSpeed: 0.01 + Math.random() * 0.02,
      trail: [],
    }),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Initialize drops spread across the canvas
    const rect = canvas.getBoundingClientRect();
    dropsRef.current = Array.from({ length: count }, () =>
      createDrop(rect.width, rect.height, Math.random() * rect.height)
    );

    const drawDrop = (drop: Drop) => {
      // Draw trail
      for (let i = 0; i < drop.trail.length; i++) {
        const t = drop.trail[i];
        const trailSize = drop.size * (0.3 + (i / drop.trail.length) * 0.4);
        ctx.beginPath();
        ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(185, 28, 28, ${t.opacity * 0.3})`;
        ctx.fill();
      }

      // Draw main drop (teardrop shape)
      ctx.save();
      ctx.translate(drop.x, drop.y);

      // Teardrop
      ctx.beginPath();
      ctx.moveTo(0, -drop.size * 1.6);
      ctx.bezierCurveTo(
        -drop.size * 0.6, -drop.size * 0.8,
        -drop.size, drop.size * 0.3,
        0, drop.size
      );
      ctx.bezierCurveTo(
        drop.size, drop.size * 0.3,
        drop.size * 0.6, -drop.size * 0.8,
        0, -drop.size * 1.6
      );
      ctx.closePath();

      const grad = ctx.createRadialGradient(
        -drop.size * 0.2, 0, 0,
        0, 0, drop.size * 1.2
      );
      grad.addColorStop(0, `rgba(239, 68, 68, ${drop.opacity})`);
      grad.addColorStop(0.5, `rgba(185, 28, 28, ${drop.opacity})`);
      grad.addColorStop(1, `rgba(127, 29, 29, ${drop.opacity * 0.6})`);
      ctx.fillStyle = grad;
      ctx.fill();

      // Subtle highlight
      ctx.beginPath();
      ctx.arc(-drop.size * 0.2, -drop.size * 0.4, drop.size * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${drop.opacity * 0.3})`;
      ctx.fill();

      ctx.restore();
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      for (const drop of dropsRef.current) {
        // Update trail
        drop.trail.push({ x: drop.x, y: drop.y, opacity: drop.opacity });
        if (drop.trail.length > 6) drop.trail.shift();

        // Fade trail
        for (const t of drop.trail) {
          t.opacity *= 0.92;
        }

        // Move
        drop.wobble += drop.wobbleSpeed;
        drop.x += Math.sin(drop.wobble) * 0.3;
        drop.y += drop.vy;

        // Accelerate slightly (gravity)
        drop.vy += 0.005;

        // Reset when off screen
        if (drop.y > h + 20) {
          Object.assign(drop, createDrop(w, h));
          drop.trail = [];
        }

        drawDrop(drop);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [count, createDrop]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
