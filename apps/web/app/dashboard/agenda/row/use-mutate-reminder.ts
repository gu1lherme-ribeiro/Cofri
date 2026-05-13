"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ReminderUpdate } from "@/lib/reminders";

export function useMutateReminder(id: string) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function update(patch: ReminderUpdate): Promise<void> {
    const res = await fetch(`/api/reminders/${id}`, {
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
    const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Falha ao excluir (HTTP ${res.status})`);
    startTransition(() => router.refresh());
  }

  return { update, remove, pending };
}
