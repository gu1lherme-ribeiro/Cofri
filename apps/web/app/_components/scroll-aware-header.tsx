"use client";

import { useEffect, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Px do topo que ativa o estado "scrolled". Default 24. */
  threshold?: number;
};

/**
 * Wrapper que adiciona `data-scrolled="true"` quando o usuário rola
 * além do threshold. O estilo visual fica em classes Tailwind nos
 * filhos, encadeado por `[data-scrolled='true']:bg-canvas/95` etc.
 */
export function ScrollAwareHeader({ children, threshold = 24 }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return (
    <header
      data-scrolled={scrolled ? "true" : undefined}
      className="sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300 ease-[var(--ease-out-quint)] border-b border-transparent bg-canvas/60 backdrop-blur-md data-[scrolled=true]:border-rule data-[scrolled=true]:bg-canvas/85 data-[scrolled=true]:shadow-[0_8px_24px_-12px_oklch(0_0_0/0.4)]"
    >
      {children}
    </header>
  );
}
