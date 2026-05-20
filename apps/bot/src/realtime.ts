import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, WebSocket } from "ws";
import { verifyRealtimeToken } from "@cofri/auth";
import { env } from "./env.js";

export type RealtimeEvent =
  | { type: "transaction.created"; payload: SerializedTransaction }
  | { type: "reminder.created"; payload: SerializedReminder }
  | { type: "fixed_expense.created"; payload: SerializedFixedExpense }
  | {
      type: "fixed_expense.completed";
      payload: { id: string; completedAt: string };
    };

export type SerializedTransaction = {
  id: string;
  amount: number;
  kind: "expense" | "income";
  category: string;
  description: string;
  occurredAt: string;
  createdAt: string;
  rawMessage: string;
};

export type SerializedReminder = {
  id: string;
  text: string;
  dueAt: string;
  notifiedAt: string | null;
  createdAt: string;
};

export type SerializedFixedExpense = {
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

const HEARTBEAT_INTERVAL_MS = 30_000;
const WS_PATH = "/ws";

const clients = new Map<string, Set<WebSocket>>();
let wssInstance: WebSocketServer | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;

type TaggedSocket = WebSocket & { userId: string; isAlive: boolean };

export function broadcast(userId: string, event: RealtimeEvent): void {
  const set = clients.get(userId);
  if (!set || set.size === 0) return;
  const data = JSON.stringify(event);
  for (const sock of set) {
    if (sock.readyState === WebSocket.OPEN) sock.send(data);
  }
}

export function attachRealtime(server: HttpServer): void {
  if (wssInstance) return;

  const wss = new WebSocketServer({ noServer: true });
  wssInstance = wss;

  server.on("upgrade", async (req, socket, head) => {
    const url = parseUrl(req);
    if (url.pathname !== WS_PATH) {
      socket.destroy();
      return;
    }

    const token = url.searchParams.get("token");
    if (!token) {
      rejectUpgrade(socket, 401, "missing token");
      return;
    }

    let userId: string;
    try {
      const claims = await verifyRealtimeToken(token, env.authJwtSecret);
      userId = claims.userId;
    } catch {
      rejectUpgrade(socket, 401, "invalid token");
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      registerClient(ws as TaggedSocket, userId);
    });
  });

  heartbeatTimer = setInterval(() => {
    for (const sock of wss.clients) {
      const tagged = sock as TaggedSocket;
      if (!tagged.isAlive) {
        tagged.terminate();
        continue;
      }
      tagged.isAlive = false;
      try {
        tagged.ping();
      } catch {
        tagged.terminate();
      }
    }
  }, HEARTBEAT_INTERVAL_MS);

  console.log(`[realtime] WSS attached on ${WS_PATH}`);
}

function registerClient(ws: TaggedSocket, userId: string): void {
  ws.userId = userId;
  ws.isAlive = true;

  let set = clients.get(userId);
  if (!set) {
    set = new Set();
    clients.set(userId, set);
  }
  set.add(ws);

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("close", () => {
    const s = clients.get(userId);
    if (!s) return;
    s.delete(ws);
    if (s.size === 0) clients.delete(userId);
  });

  ws.on("error", (err) => {
    console.error(`[realtime] socket error (user=${userId}):`, err);
  });

  try {
    ws.send(JSON.stringify({ type: "hello", payload: { userId } }));
  } catch {
    // ignore
  }
}

function parseUrl(req: IncomingMessage): URL {
  const host = req.headers.host ?? "localhost";
  return new URL(req.url ?? "/", `http://${host}`);
}

function rejectUpgrade(socket: Duplex, code: number, reason: string): void {
  socket.write(
    `HTTP/1.1 ${code} ${reason}\r\nConnection: close\r\n\r\n`,
  );
  socket.destroy();
}

export function shutdownRealtime(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (wssInstance) {
    for (const sock of wssInstance.clients) sock.terminate();
    wssInstance.close();
    wssInstance = null;
  }
  clients.clear();
}
