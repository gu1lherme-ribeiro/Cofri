"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "./tabs";

const ITEMS = [
  { value: "/dashboard", href: "/dashboard", label: "Finanças" },
  { value: "/dashboard/agenda", href: "/dashboard/agenda", label: "Agenda" },
  { value: "/dashboard/insights", href: "/dashboard/insights", label: "Insights" },
  { value: "/dashboard/orcamento", href: "/dashboard/orcamento", label: "Orçamento" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();
  return <Tabs items={ITEMS} active={pathname} />;
}
