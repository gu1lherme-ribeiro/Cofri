"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION = 350;

// ease-out-quint igual ao cubic-bezier(0.22, 1, 0.36, 1)
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Anima do valor anterior pro novo valor numa janela curta.
 * Na 1ª render não anima — começa direto no target (evita FOUC).
 */
export function useCountUp(target: number, durationMs = DEFAULT_DURATION): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);
  const isFirstRef = useRef(true);

  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      fromRef.current = target;
      setValue(target);
      return;
    }

    if (prefersReducedMotion() || durationMs <= 0) {
      fromRef.current = target;
      setValue(target);
      return;
    }

    const from = fromRef.current;
    const to = target;
    if (from === to) return;

    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeOutQuint(t);
      const current = from + (to - from) * eased;
      setValue(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
        rafRef.current = null;
      }
    }

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return value;
}
