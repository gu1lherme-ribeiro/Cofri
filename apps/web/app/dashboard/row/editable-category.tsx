"use client";

import { useMemo, useState } from "react";
import { Select, type SelectOption } from "../_components/select";

type Props = {
  value: string;
  pending?: boolean;
  /** Lista de categorias disponíveis pro usuário (default + custom).
   *  Vem da página/dashboard, que computa via `loadUserCategories`. */
  options: string[];
  onSave: (next: string) => Promise<void>;
};

export function EditableCategory({ value, pending, options, onSave }: Props) {
  const [local, setLocal] = useState(value);
  const [error, setError] = useState(false);

  const selectOptions = useMemo<SelectOption[]>(() => {
    // Garante que a categoria atual aparece na lista mesmo se ela foi removida
    // dos orçamentos depois (transação órfã apontando pra nome antigo).
    const list = options.includes(local) ? options : [local, ...options];
    return list.map((c) => ({ value: c, label: c }));
  }, [options, local]);

  async function commit(next: string) {
    if (next === local) return;
    const prev = local;
    setLocal(next);
    setError(false);
    try {
      await onSave(next);
    } catch {
      setLocal(prev);
      setError(true);
    }
  }

  return (
    <Select
      options={selectOptions}
      value={local}
      onChange={(v) => void commit(v)}
      label="Mudar categoria"
      disabled={pending}
      alignRight={false}
      renderTrigger={({ open, toggle, ref, ariaProps }) => (
        <button
          ref={ref}
          type="button"
          disabled={pending}
          onClick={toggle}
          {...ariaProps}
          className={`font-mono text-[11px] uppercase tracking-[0.18em] inline-flex items-center gap-1.5 hover:underline decoration-dotted decoration-ink-faint underline-offset-4 focus:outline-none focus:text-accent transition-colors duration-[var(--duration-base)] ${
            error ? "text-negative" : "text-ink-faint"
          } ${pending ? "opacity-60" : ""}`}
          title="Clicar para mudar categoria"
        >
          {local}
          <svg
            width="8"
            height="5"
            viewBox="0 0 10 6"
            aria-hidden
            className={`opacity-60 transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quint)] ${
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
      )}
    />
  );
}
