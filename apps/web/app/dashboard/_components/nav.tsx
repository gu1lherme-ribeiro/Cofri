"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs } from "./tabs";

const ITEMS = [
  { value: "/dashboard", label: "Finanças" },
  { value: "/dashboard/agenda", label: "Agenda" },
  { value: "/dashboard/insights", label: "Insights" },
  { value: "/dashboard/orcamento", label: "Orçamento" },
] as const;

export function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Tabs
      items={ITEMS}
      active={pathname}
      onChange={(v) => router.push(v)}
    />
  );
}
