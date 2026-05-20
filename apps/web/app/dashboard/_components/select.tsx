"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectTriggerProps = {
  open: boolean;
  toggle: () => void;
  current: SelectOption | undefined;
  disabled?: boolean;
  /** Liga este ref ao seu elemento focável (foco volta aqui ao fechar). */
  ref: RefObject<HTMLButtonElement | null>;
  /** Props ARIA necessárias no elemento clicável. */
  ariaProps: {
    "aria-haspopup": "listbox";
    "aria-expanded": boolean;
    "aria-label"?: string;
  };
};

type Props = {
  options: ReadonlyArray<SelectOption>;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  /** Posiciona o popover alinhado à direita do trigger (default true). */
  alignRight?: boolean;
  /** Inicia já aberto (útil pra edição inline acionada por click externo). */
  defaultOpen?: boolean;
  /** Notifica quando o popover fecha (pra dar back o estado de edição). */
  onClose?: () => void;
  /** Render custom do trigger. Default: button com chevron. */
  renderTrigger?: (props: SelectTriggerProps) => ReactNode;
};

export type SelectHandle = {
  open: () => void;
  close: () => void;
};

export const Select = forwardRef<SelectHandle, Props>(function Select(
  {
    options,
    value,
    onChange,
    label,
    disabled,
    alignRight = true,
    defaultOpen = false,
    onClose,
    renderTrigger,
  },
  ref,
) {
  const baseId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [highlight, setHighlight] = useState(-1);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const current = options.find((o) => o.value === value);

  useImperativeHandle(
    ref,
    () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
    }),
    [],
  );

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setHighlight(idx >= 0 ? idx : 0);
    } else {
      setHighlight(-1);
      onClose?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function isInside(target: Node | null): boolean {
      if (!target) return false;
      if (triggerRef.current?.contains(target)) return true;
      if (popoverRef.current?.contains(target)) return true;
      return false;
    }

    function onPointerDown(e: MouseEvent) {
      if (!isInside(e.target as Node)) setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => Math.min(options.length - 1, h + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => Math.max(0, h - 1));
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        setHighlight(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        setHighlight(options.length - 1);
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        if (highlight >= 0 && highlight < options.length) {
          e.preventDefault();
          const opt = options[highlight];
          if (opt) {
            onChange(opt.value);
            setOpen(false);
            triggerRef.current?.focus();
          }
        }
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, highlight, options, onChange]);

  useEffect(() => {
    if (!open || highlight < 0) return;
    itemRefs.current[highlight]?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  // Sempre abre pra baixo, ancorado ao trigger.
  // Cinturão de segurança: max-h = min(18rem, viewport-32px) pra nunca passar
  // do viewport, mesmo em telas baixinhas.
  useLayoutEffect(() => {
    if (!open) {
      setMaxHeight(undefined);
      return;
    }
    function recompute() {
      const remPx = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      const naturalMax = 18 * remPx;
      const viewportMax = window.innerHeight - 32;
      setMaxHeight(Math.min(naturalMax, viewportMax));
    }
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [open]);

  // Quando o popover transbordaria a viewport, rola a página suave pra trazer.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const popover = popoverRef.current;
      if (!popover) return;
      const rect = popover.getBoundingClientRect();
      const safety = 16;
      const overflow = rect.bottom - (window.innerHeight - safety);
      if (overflow > 0) {
        const reduceMotion =
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollBy({
          top: overflow,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const ariaProps = {
    "aria-haspopup": "listbox" as const,
    "aria-expanded": open,
    ...(label ? { "aria-label": label } : {}),
  };

  const toggle = () => setOpen((o) => !o);

  const defaultTrigger = (
    <button
      ref={triggerRef}
      type="button"
      disabled={disabled}
      onClick={toggle}
      {...ariaProps}
      className="flex items-center gap-2 bg-transparent text-ink py-2 sm:py-1 pl-2 pr-1 -mr-1 focus:outline-none focus:text-accent transition-colors duration-[var(--duration-base)] text-sm disabled:opacity-50"
    >
      <span>{current?.label ?? "—"}</span>
      <svg
        width="10"
        height="6"
        viewBox="0 0 10 6"
        aria-hidden
        className={`text-ink-faint transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quint)] ${
          open ? "rotate-180" : ""
        }`}
      >
        <path
          d="M1 1l4 4 4-4"
          stroke="currentColor"
          fill="none"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  return (
    <div className="relative inline-block">
      {renderTrigger
        ? renderTrigger({
            open,
            toggle,
            current,
            disabled,
            ref: triggerRef,
            ariaProps,
          })
        : defaultTrigger}

      {open && (
        <div
          ref={popoverRef}
          role="listbox"
          aria-activedescendant={
            highlight >= 0 && options[highlight]
              ? `${baseId}-${options[highlight]?.value}`
              : undefined
          }
          style={maxHeight ? { maxHeight } : undefined}
          className={`absolute z-50 top-full mt-1 min-w-[10rem] overflow-y-auto bg-surface border border-rule rounded-[var(--radius-card)] py-1 shadow-[0_8px_24px_-12px_oklch(0%_0_0/0.5)] animate-fade-in ${
            alignRight ? "right-0" : "left-0"
          }`}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isHighlighted = i === highlight;
            return (
              <button
                key={opt.value}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                id={`${baseId}-${opt.value}`}
                role="option"
                aria-selected={isSelected}
                type="button"
                onMouseEnter={() => setHighlight(i)}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors duration-[100ms] ${
                  isHighlighted
                    ? "bg-surface-2 text-ink"
                    : isSelected
                      ? "text-ink"
                      : "text-ink-muted"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
