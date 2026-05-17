"use client";

import { useMemo } from "react";
import { Select } from "./_components/select";
import { Tabs } from "./_components/tabs";

const KIND_OPTIONS = [
  { value: "", label: "Tudo" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Receitas" },
] as const;

type Props = {
  kind: string;
  category: string;
  onKindChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  availableCategories: string[];
};

export function Filters({
  kind,
  category,
  onKindChange,
  onCategoryChange,
  availableCategories,
}: Props) {
  const categoryOptions = useMemo(
    () => [
      { value: "", label: "todas" },
      ...availableCategories.map((c) => ({ value: c, label: c })),
    ],
    [availableCategories],
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 sm:gap-6 mb-6 border-b border-rule pb-3">
      <Tabs
        items={KIND_OPTIONS}
        active={kind}
        onChange={onKindChange}
      />

      <div className="flex items-center gap-3 text-sm">
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-ink-faint">
          Categoria
        </span>
        <Select
          options={categoryOptions}
          value={category}
          onChange={onCategoryChange}
          label="Filtrar por categoria"
        />
      </div>
    </div>
  );
}
