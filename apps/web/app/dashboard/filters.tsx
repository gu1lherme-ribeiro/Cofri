"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { Select } from "./_components/select";
import { Tabs } from "./_components/tabs";

const KIND_OPTIONS = [
  { value: "", label: "Tudo" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Receitas" },
] as const;

type Props = {
  current: {
    category?: string;
    kind?: string;
  };
  availableCategories: string[];
};

export function Filters({ current, availableCategories }: Props) {
  const categoryOptions = useMemo(
    () => [
      { value: "", label: "todas" },
      ...availableCategories.map((c) => ({ value: c, label: c })),
    ],
    [availableCategories],
  );
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value === "") next.delete(key);
    else next.set(key, value);
    startTransition(() => {
      router.push(`/dashboard?${next.toString()}`);
    });
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 sm:gap-6 mb-6 border-b border-rule pb-3">
      <Tabs
        items={KIND_OPTIONS}
        active={current.kind ?? ""}
        onChange={(v) => setParam("kind", v)}
        disabled={pending}
      />

      <div className="flex items-center gap-3 text-sm">
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-ink-faint">
          Categoria
        </span>
        <Select
          options={categoryOptions}
          value={current.category ?? ""}
          onChange={(v) => setParam("category", v)}
          label="Filtrar por categoria"
          disabled={pending}
        />
      </div>
    </div>
  );
}
