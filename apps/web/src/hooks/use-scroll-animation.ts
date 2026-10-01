"use client";

import { animate, stagger, type AnimationParams } from "animejs";
import { useEffect, type RefObject } from "react";

type EaseName =
  | "outExpo"
  | "outQuad"
  | "outCubic"
  | "outBack"
  | "outSine"
  | "inOutQuad";

export type ScrollAnimationOptions = {
  translateY?: number;
  translateX?: number;
  scale?: number;
  opacity?: boolean;
  duration?: number;
  delay?: number;
  ease?: EaseName;
  rootMargin?: string;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useScrollAnimation<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: ScrollAnimationOptions = {},
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) return;

    if (prefersReducedMotion()) {
      for (const child of children) {
        child.style.opacity = "1";
        child.style.transform = "none";
      }
      return;
    }

    const {
      translateY = 40,
      translateX,
      scale,
      opacity = true,
      duration = 700,
      delay = 80,
      ease = "outExpo",
      rootMargin = "0px 0px -80px 0px",
    } = options;

    for (const child of children) {
      if (opacity) child.style.opacity = "0";
      const transforms: string[] = [];
      if (translateY) transforms.push(`translateY(${translateY}px)`);
      if (translateX) transforms.push(`translateX(${translateX}px)`);
      if (scale !== undefined) transforms.push(`scale(${scale})`);
      if (transforms.length > 0) {
        child.style.transform = transforms.join(" ");
      }
      child.style.willChange = "transform, opacity";
    }

    let anim: ReturnType<typeof animate> | null = null;
    let played = false;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !played) {
            played = true;

            const animationParams: AnimationParams = {
              duration,
              ease,
              delay: stagger(delay),
              onComplete: () => {
                for (const child of children) {
                  child.style.willChange = "";
                }
              },
            };

            if (translateY) animationParams.translateY = [translateY, 0];
            if (translateX) animationParams.translateX = [translateX, 0];
            if (scale !== undefined) animationParams.scale = [scale, 1];
            if (opacity) animationParams.opacity = [0, 1];

            anim = animate(children, animationParams);
            observer.disconnect();
          }
        }
      },
      { rootMargin },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (anim) anim.cancel();
    };
  }, [ref, options]);
}
