"use client";

import { animate } from "animejs";
import { useEffect, useRef } from "react";

const COLORS = [
  "#9656a1", // brl purple
  "#ff8906", // brl orange
  "#34d399", // emerald
  "#7f5af0", // violet
  "#f25f4c", // coral
  "#f5f2ff", // foreground
];

/**
 * Chuva de confete one-shot. Dispara toda vez que `fireKey` aumenta.
 * Sem libs externas — cria os papéis e anima com anime.js, limpando depois.
 * Respeita `prefers-reduced-motion`.
 */
export function Confetti({ fireKey }: { fireKey: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (fireKey <= 0) return;
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const count = 90;
    const nodes: HTMLSpanElement[] = [];

    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      const size = 6 + Math.random() * 8;
      el.style.position = "absolute";
      el.style.left = `${15 + Math.random() * 70}%`;
      el.style.top = "-6%";
      el.style.width = `${size}px`;
      el.style.height = `${size * (0.4 + Math.random() * 0.6)}px`;
      el.style.background = COLORS[i % COLORS.length];
      el.style.borderRadius = Math.random() > 0.5 ? "9999px" : "2px";
      el.style.willChange = "transform, opacity";
      container.appendChild(el);
      nodes.push(el);
    }

    const anims = nodes.map((el) =>
      animate(el, {
        translateX: [0, (Math.random() - 0.5) * 260],
        translateY: [0, window.innerHeight * (0.75 + Math.random() * 0.5)],
        rotate: [0, Math.random() * 720 - 360],
        opacity: [1, 1, 0],
        duration: 1700 + Math.random() * 1400,
        delay: Math.random() * 250,
        ease: "outQuad",
      }),
    );

    const cleanup = window.setTimeout(() => {
      for (const node of nodes) node.remove();
    }, 3400);

    return () => {
      window.clearTimeout(cleanup);
      for (const anim of anims) anim.cancel();
      for (const node of nodes) node.remove();
    };
  }, [fireKey]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
    />
  );
}
