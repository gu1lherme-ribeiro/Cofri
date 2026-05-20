"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type TabItem = {
  value: string;
  label: string;
  /** Quando presente, o tab vira um <Link> com prefetch — útil pra navegação
   *  entre rotas. Sem href, segue como <button onClick={onChange}>. */
  href?: string;
};

type Props = {
  items: ReadonlyArray<TabItem>;
  active: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

type Indicator = { left: number; width: number };

export function Tabs({ items, active, onChange, disabled }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Map<string, HTMLElement>>(new Map());
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
      className="no-scrollbar relative flex items-baseline gap-4 sm:gap-7 text-sm overflow-x-auto whitespace-nowrap"
    >
      {items.map((item) => {
        const isActive = item.value === active;
        // pt-2 -mt-2 + pb-3 -mb-3 estendem a área tap-able pra ~44px no mobile
        // sem afetar o baseline visual (negative margins compensam).
        const className = `relative pt-2 -mt-2 pb-3 -mb-3 transition-colors duration-[var(--duration-base)] ${
          isActive ? "text-ink" : "text-ink-muted hover:text-ink"
        }`;
        const setRef = (el: HTMLButtonElement | HTMLAnchorElement | null) => {
          if (el) btnRefs.current.set(item.value, el);
          else btnRefs.current.delete(item.value);
        };

        if (item.href) {
          return (
            <Link
              key={item.value}
              href={item.href}
              prefetch
              ref={setRef}
              className={className}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        }
        return (
          <button
            key={item.value}
            ref={setRef}
            onClick={() => onChange?.(item.value)}
            disabled={disabled}
            className={className}
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
