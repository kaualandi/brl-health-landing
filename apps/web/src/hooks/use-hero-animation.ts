"use client";

/* eslint-disable react-hooks/immutability -- this hook intentionally mutates DOM styles for imperative animation */

import { animate, createTimeline, stagger } from "animejs";
import { useEffect, type RefObject } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wrapWord(word: string): HTMLSpanElement {
  const wrap = document.createElement("span");
  wrap.dataset.word = "true";
  wrap.style.display = "inline-block";
  wrap.style.willChange = "transform, opacity";
  wrap.textContent = word;
  return wrap;
}

function splitIntoWordSpans(heading: HTMLElement): HTMLSpanElement[] {
  if (heading.dataset.splitDone === "true") {
    return Array.from(heading.querySelectorAll<HTMLSpanElement>("[data-word]"));
  }

  const spans: HTMLSpanElement[] = [];
  const childNodes = Array.from(heading.childNodes);

  for (const node of childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      const parts = text.split(/(\s+)/);
      const fragment = document.createDocumentFragment();
      for (const part of parts) {
        if (part === "") continue;
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
        } else {
          const span = wrapWord(part);
          fragment.appendChild(span);
          spans.push(span);
        }
      }
      heading.replaceChild(fragment, node);
    } else if (node instanceof HTMLElement) {
      const text = node.textContent ?? "";
      const parts = text.split(/(\s+)/);
      node.textContent = "";
      for (const part of parts) {
        if (part === "") continue;
        if (/^\s+$/.test(part)) {
          node.appendChild(document.createTextNode(part));
        } else {
          const span = wrapWord(part);
          node.appendChild(span);
          spans.push(span);
        }
      }
    }
  }

  heading.dataset.splitDone = "true";
  return spans;
}

export type HeroAnimationRefs = {
  root: RefObject<HTMLElement | null>;
  badge?: RefObject<HTMLElement | null>;
  heading: RefObject<HTMLElement | null>;
  subtitle?: RefObject<HTMLElement | null>;
  ctas?: RefObject<HTMLElement | null>;
};

export function useHeroAnimation(refs: HeroAnimationRefs) {
  useEffect(() => {
    const heading = refs.heading.current;
    const badge = refs.badge?.current ?? null;
    const subtitle = refs.subtitle?.current ?? null;
    const ctasContainer = refs.ctas?.current ?? null;
    const ctaChildren = ctasContainer
      ? (Array.from(ctasContainer.children) as HTMLElement[])
      : [];

    if (!heading) return;

    if (prefersReducedMotion()) {
      return;
    }

    const wordSpans = splitIntoWordSpans(heading);

    if (badge) {
      badge.style.opacity = "0";
      badge.style.transform = "translateY(-20px)";
      badge.style.willChange = "transform, opacity";
    }
    for (const span of wordSpans) {
      span.style.opacity = "0";
      span.style.transform = "translateY(30px)";
    }
    if (subtitle) {
      subtitle.style.opacity = "0";
      subtitle.style.transform = "translateY(20px)";
      subtitle.style.willChange = "transform, opacity";
    }
    for (const cta of ctaChildren) {
      cta.style.opacity = "0";
      cta.style.transform = "translateX(-20px)";
      cta.style.willChange = "transform, opacity";
    }

    const timeline = createTimeline({
      defaults: { ease: "outExpo" },
    });

    if (badge) {
      timeline.add(badge, {
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 500,
      });
    }

    timeline.add(
      wordSpans,
      {
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: stagger(60),
        onComplete: () => {
          for (const span of wordSpans) span.style.willChange = "";
        },
      },
      badge ? "-=300" : 0,
    );

    if (subtitle) {
      timeline.add(
        subtitle,
        {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 500,
          onComplete: () => {
            subtitle.style.willChange = "";
          },
        },
        "-=200",
      );
    }

    if (ctaChildren.length > 0) {
      timeline.add(
        ctaChildren,
        {
          opacity: [0, 1],
          translateX: [-20, 0],
          duration: 400,
          delay: stagger(100),
          onComplete: () => {
            for (const cta of ctaChildren) cta.style.willChange = "";
          },
        },
        "-=150",
      );
    }

    return () => {
      timeline.cancel();
    };
    // refs are stable containers; dependency list is intentionally empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // expose animate for callers that might want extra effects; currently unused
  void animate;
}
