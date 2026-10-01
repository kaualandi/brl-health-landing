"use client";

import { animate } from "animejs";
import { useEffect, useRef } from "react";

type AnimatedCounterProps = {
  from?: number;
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AnimatedCounter({
  from = 0,
  to,
  duration = 1500,
  suffix = "",
  prefix = "",
  className,
}: AnimatedCounterProps) {
  const nodeRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    if (prefersReducedMotion()) {
      node.textContent = `${prefix}${to}${suffix}`;
      return;
    }

    node.textContent = `${prefix}${from}${suffix}`;

    let anim: ReturnType<typeof animate> | null = null;
    let played = false;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !played) {
            played = true;
            const state = { value: from };
            anim = animate(state, {
              value: to,
              duration,
              ease: "outExpo",
              onUpdate: () => {
                node.textContent = `${prefix}${Math.round(state.value)}${suffix}`;
              },
              onComplete: () => {
                node.textContent = `${prefix}${to}${suffix}`;
              },
            });
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (anim) anim.cancel();
    };
  }, [from, to, duration, prefix, suffix]);

  return (
    <span ref={nodeRef} className={className}>
      {prefix}
      {from}
      {suffix}
    </span>
  );
}
