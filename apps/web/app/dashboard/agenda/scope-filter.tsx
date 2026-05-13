"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Tabs } from "../_components/tabs";

const OPTIONS = [
  { value: "upcoming", label: "Próximos" },
  { value: "past", label: "Passados" },
  { value: "all", label: "Tudo" },
] as const;

type Props = {
  current: string;
};

export function ScopeFilter({ current }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function setScope(value: string) {
    const next = new URLSearchParams(params);
    if (value === "upcoming") next.delete("scope");
    else next.set("scope", value);
    startTransition(() => {
      router.push(`/dashboard/agenda?${next.toString()}`);
    });
  }

  return (
    <div className="mb-6 border-b border-rule pb-3">
      <Tabs
        items={OPTIONS}
        active={current}
        onChange={setScope}
        disabled={pending}
      />
    </div>
  );
}
