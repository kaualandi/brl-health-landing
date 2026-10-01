"use client";

import { animate } from "animejs";
import { useEffect, useMemo, useRef } from "react";

type Particle = {
  color: string;
  size: number;
  top: number;
  left: number;
  duration: number;
  drift: { x: number; y: number };
};

const COLORS = ["#9656a1", "#ff8906", "#004643"] as const;

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 0x100000000;
    return state / 0x100000000;
  };
}

function buildParticles(): Particle[] {
  const rand = seededRandom(0xb8a11e);
  return Array.from({ length: 12 }, (_, i) => {
    const size = 8 + Math.floor(rand() * 16);
    return {
      color: COLORS[i % COLORS.length],
      size,
      top: Math.floor(rand() * 100),
      left: Math.floor(rand() * 100),
      duration: 2000 + Math.floor(rand() * 2000),
      drift: {
        x: Math.round((rand() - 0.5) * 80),
        y: Math.round((rand() - 0.5) * 80),
      },
    };
  });
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const particles = useMemo(() => buildParticles(), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (prefersReducedMotion()) return;

    const nodes = Array.from(
      container.querySelectorAll<HTMLElement>("[data-particle]"),
    );
    if (nodes.length === 0) return;

    const animations = nodes.map((node, index) => {
      const particle = particles[index];
      return animate(node, {
        translateX: [0, particle.drift.x],
        translateY: [0, particle.drift.y],
        scale: [0.8, 1.2],
        opacity: [0.15, 0.45],
        duration: particle.duration,
        ease: "inOutQuad",
        alternate: true,
        loop: true,
        delay: index * 120,
      });
    });

    return () => {
      for (const anim of animations) anim.cancel();
    };
  }, [particles]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {particles.map((p, i) => (
        <span
          key={i}
          data-particle="true"
          className="absolute rounded-full blur-[1px]"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: 0.15,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
}
