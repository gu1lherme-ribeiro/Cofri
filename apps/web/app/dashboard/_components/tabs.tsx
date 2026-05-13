"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type TabItem = {
  value: string;
  label: string;
};

type Props = {
  items: ReadonlyArray<TabItem>;
  active: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

type Indicator = { left: number; width: number };

export function Tabs({ items, active, onChange, disabled }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  const [animate, setAnimate] = useState(false);

  function measure() {
    const container = containerRef.current;
    const btn = btnRefs.current.get(active);
    if (!container || !btn) return;
    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    setIndicator({
      left: bRect.left - cRect.left,
      width: bRect.width,
    });
  }

  useLayoutEffect(() => {
    measure();
    // segunda render anima; a primeira só posiciona sem transição
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-baseline gap-7 text-sm"
    >
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <button
            key={item.value}
            ref={(el) => {
              if (el) btnRefs.current.set(item.value, el);
              else btnRefs.current.delete(item.value);
            }}
            onClick={() => onChange(item.value)}
            disabled={disabled}
            className={`relative pb-3 -mb-3 transition-colors duration-[var(--duration-base)] ${
              isActive ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        );
      })}
      {indicator && (
        <span
          aria-hidden
          className="absolute -bottom-px h-px bg-accent"
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: `${indicator.width}px`,
            transition: animate
              ? "transform var(--duration-base) var(--ease-out-quint), width var(--duration-base) var(--ease-out-quint)"
              : "none",
          }}
        />
      )}
    </div>
  );
}
