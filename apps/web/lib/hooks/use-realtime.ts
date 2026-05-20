"use client";

import { useEffect, useRef } from "react";

export type RealtimeEvent =
  | { type: "hello"; payload: { userId: string } }
  | { type: "transaction.created"; payload: RealtimeTransaction }
  | { type: "reminder.created"; payload: RealtimeReminder }
  | { type: "fixed_expense.created"; payload: RealtimeFixedExpense }
  | {
      type: "fixed_expense.completed";
      payload: { id: string; completedAt: string };
    };

export type RealtimeTransaction = {
  id: string;
  amount: number;
  kind: "expense" | "income";
  category: string;
  description: string;
  occurredAt: string;
  createdAt: string;
  rawMessage: string;
};

export type RealtimeReminder = {
  id: string;
  text: string;
  dueAt: string;
  notifiedAt: string | null;
  createdAt: string;
};

export type RealtimeFixedExpense = {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: string;
  leadDays: number[];
  active: boolean;
  installmentsTotal: number | null;
  installmentsStartMonth: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Handler = (event: RealtimeEvent) => void;

const TOKEN_REFRESH_LEEWAY_MS = 30_000;
const BACKOFF_STEPS_MS = [1_000, 2_000, 4_000, 8_000, 30_000];

type Options = {
  /** Chamado quando reconecta. Útil pra refetch e cobrir eventos perdidos. */
  onReconnect?: () => void;
};

export function useRealtime(
  url: string | undefined,
  onEvent: Handler,
  opts: Options = {},
): void {
  const handlerRef = useRef(onEvent);
  const reconnectRef = useRef(opts.onReconnect);

  // Mantém refs atualizadas sem disparar reconexão a cada render.
  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);
  useEffect(() => {
    reconnectRef.current = opts.onReconnect;
  }, [opts.onReconnect]);

  useEffect(() => {
    if (!url) return;

    let cancelled = false;
    let ws: WebSocket | null = null;
    let attempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let hadConnection = false;

    async function fetchToken(): Promise<{ token: string; expiresAt: number } | null> {
      try {
        const res = await fetch("/api/realtime/token", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return null;
        return (await res.json()) as { token: string; expiresAt: number };
      } catch {
        return null;
      }
    }

    async function connect(): Promise<void> {
      if (cancelled) return;

      const t = await fetchToken();
      if (cancelled) return;
      if (!t) {
        scheduleReconnect();
        return;
      }

      const wsUrl = `${url}?token=${encodeURIComponent(t.token)}`;
      const socket = new WebSocket(wsUrl);
      ws = socket;

      socket.addEventListener("open", () => {
        if (cancelled) return;
        attempt = 0;
        if (hadConnection) reconnectRef.current?.();
        hadConnection = true;
        scheduleTokenRefresh(t.expiresAt);
      });

      socket.addEventListener("message", (ev) => {
        try {
          const parsed = JSON.parse(ev.data as string) as RealtimeEvent;
          handlerRef.current(parsed);
        } catch {
          // ignore malformed frames
        }
      });

      socket.addEventListener("close", () => {
        if (cancelled) return;
        clearRefresh();
        scheduleReconnect();
      });

      socket.addEventListener("error", () => {
        // close handler vai disparar reconexão
        try {
          socket.close();
        } catch {
          // ignore
        }
      });
    }

    function scheduleReconnect(): void {
      if (cancelled) return;
      const delay = BACKOFF_STEPS_MS[Math.min(attempt, BACKOFF_STEPS_MS.length - 1)];
      attempt += 1;
      reconnectTimer = setTimeout(connect, delay);
    }

    function scheduleTokenRefresh(expiresAtSec: number): void {
      clearRefresh();
      const msUntilExpiry = expiresAtSec * 1000 - Date.now();
      const delay = Math.max(5_000, msUntilExpiry - TOKEN_REFRESH_LEEWAY_MS);
      refreshTimer = setTimeout(() => {
        // Fecha pra forçar reconexão com token novo via fetchToken.
        if (ws && ws.readyState === WebSocket.OPEN) ws.close(4000, "token refresh");
      }, delay);
    }

    function clearRefresh(): void {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearRefresh();
      if (ws) {
        try {
          ws.close(1000, "unmount");
        } catch {
          // ignore
        }
      }
    };
  }, [url]);
}
