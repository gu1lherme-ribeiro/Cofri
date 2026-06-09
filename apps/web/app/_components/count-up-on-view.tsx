"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// ease-out-quint igual ao token do design system
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

type Props = {
  /** Valor final */
  value: number;
  /** Duração em ms. Default 1200. */
  duration?: number;
  /** Formatter — recebe o valor corrente, devolve string ou JSX. */
  format: (n: number) => ReactNode;
  /** 0..1 — porção visível antes de disparar. Default 0.4. */
  amount?: number;
  className?: string;
};

/**
 * CountUpOnView — conta de 0 até `value` quando entra no viewport.
 * Diferente do `useCountUp` do dashboard (que parte do valor anterior),
 * esse aqui parte de 0 — é um momento de impacto, não uma transição.
 *
 * Respeita `prefers-reduced-motion`: renderiza valor final direto.
 */
export function CountUpOnView({
  value,
  duration = 1200,
  format,
  amount = 0.4,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(value);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || startedRef.current) return;
        startedRef.current = true;
        io.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          setCurrent(easeOutQuint(t) * value);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: amount },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [value, duration, amount]);

  return (
    <span ref={ref} className={className}>
      {format(current)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Presets serializáveis — formatters não cruzam a fronteira RSC,     */
/* então usamos kind: "percent" | "seconds" | "money" como dispatch.  */
/* ------------------------------------------------------------------ */

type StatKind = "percent" | "seconds" | "money";

const FORMATTERS: Record<StatKind, (n: number) => ReactNode> = {
  percent: (n) => (
    <>
      {Math.round(n)}
      <span className="text-ink-muted">%</span>
    </>
  ),
  seconds: (n) => (
    <>
      {n.toFixed(1).replace(".", ",")}
      <span className="text-ink-muted">s</span>
    </>
  ),
  money: (n) => (
    <>
      <span className="text-ink-muted">R$</span>
      {n.toFixed(2).replace(".", ",")}
    </>
  ),
};

export function StatCountUp({
  value,
  kind,
  duration,
  amount,
  className,
}: {
  value: number;
  kind: StatKind;
  duration?: number;
  amount?: number;
  className?: string;
}) {
  return (
    <CountUpOnView
      value={value}
      duration={duration}
      amount={amount}
      className={className}
      format={FORMATTERS[kind]}
    />
  );
}
