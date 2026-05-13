"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { TransactionUpdate } from "@/lib/transactions";

export function useMutateTransaction(id: string) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function update(patch: TransactionUpdate): Promise<void> {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      let detail = "";
      try {
        const j = (await res.json()) as { error?: string };
        detail = j.error ?? "";
      } catch {}
      throw new Error(detail || `Falha ao atualizar (HTTP ${res.status})`);
    }
    startTransition(() => router.refresh());
  }

  async function remove(): Promise<void> {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Falha ao excluir (HTTP ${res.status})`);
    startTransition(() => router.refresh());
  }

  return { update, remove, pending };
}
