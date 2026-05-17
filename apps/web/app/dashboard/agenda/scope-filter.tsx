"use client";

import { Tabs } from "../_components/tabs";

const OPTIONS = [
  { value: "upcoming", label: "Próximos" },
  { value: "past", label: "Passados" },
  { value: "all", label: "Tudo" },
] as const;

type Props = {
  scope: string;
  onScopeChange: (value: string) => void;
};

export function ScopeFilter({ scope, onScopeChange }: Props) {
  return (
    <div className="mb-6 border-b border-rule pb-3">
      <Tabs items={OPTIONS} active={scope} onChange={onScopeChange} />
    </div>
  );
}
