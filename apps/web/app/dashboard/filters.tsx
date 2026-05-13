"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CATEGORIES } from "@/lib/transactions";
import { Select } from "./_components/select";
import { Tabs } from "./_components/tabs";

const KIND_OPTIONS = [
  { value: "", label: "Tudo" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Receitas" },
] as const;

const CATEGORY_OPTIONS = [
  { value: "", label: "todas" },
  ...CATEGORIES.map((c) => ({ value: c, label: c })),
];

type Props = {
  current: {
    category?: string;
    kind?: string;
  };
};

export function Filters({ current }: Props) {
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
    <div className="flex items-baseline justify-between gap-6 mb-6 border-b border-rule pb-3">
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
          options={CATEGORY_OPTIONS}
          value={current.category ?? ""}
          onChange={(v) => setParam("category", v)}
          label="Filtrar por categoria"
          disabled={pending}
        />
      </div>
    </div>
  );
}
