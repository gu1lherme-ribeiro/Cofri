"use client";

import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

type Tag = "div" | "section" | "ol" | "ul" | "dl" | "header" | "footer";

type Props = {
  children: ReactNode;
  as?: Tag;
  stagger?: boolean;
  className?: string;
  /** 0..1 — porção da seção que precisa estar visível antes do trigger. */
  amount?: number;
  /** Offset extra antes do trigger (negativo = atrasa). Default `-5%`. */
  rootMarginBottom?: string;
};

/**
 * Reveal — wrap qualquer elemento e adiciona `data-revealed="true"`
 * quando entra na viewport. O CSS em globals.css (`.reveal-on-view`
 * ou `.stagger-children`) cuida da animação. IO desconecta no 1º hit.
 *
 * Respeita `prefers-reduced-motion`: aparece instantâneo, sem animação.
 */
export function Reveal({
  children,
  as = "div",
  stagger = false,
  className = "",
  amount = 0.15,
  rootMarginBottom = "-5%",
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: amount, rootMargin: `0px 0px ${rootMarginBottom} 0px` },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [amount, rootMarginBottom]);

  const Tag = as as ElementType;
  const baseClass = stagger ? "stagger-children" : "reveal-on-view";

  return (
    <Tag
      ref={ref as never}
      className={`${baseClass} ${className}`}
      data-revealed={revealed ? "true" : undefined}
    >
      {children}
    </Tag>
  );
}
