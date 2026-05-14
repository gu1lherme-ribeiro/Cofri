import { prisma, Prisma } from "@cofri/db";
import type { ParsedMessage } from "@cofri/parser";
import { broadcast } from "./realtime.js";

export type TransactionPersisted = {
  amount: number;
  kind: "expense" | "income";
  category: string;
  description: string;
  occurredAt: Date;
};

export type ReminderPersisted = {
  text: string;
  dueAt: Date;
};

export async function persistTransaction(
  userId: string,
  parsed: ParsedMessage,
  rawMessage: string,
): Promise<TransactionPersisted> {
  if (parsed.intent !== "expense" && parsed.intent !== "income") {
    throw new Error(`persistTransaction: invalid intent ${parsed.intent}`);
  }
  if (parsed.amount == null) {
    throw new Error("persistTransaction: amount is required");
  }

  const occurredAt = parsed.occurredAt ? new Date(parsed.occurredAt) : new Date();
  const category = parsed.category ?? "outros";

  const row = await prisma.transaction.create({
    data: {
      userId,
      amount: new Prisma.Decimal(parsed.amount),
      kind: parsed.intent,
      category,
      description: parsed.description,
      occurredAt,
      rawMessage,
    },
  });

  broadcast(userId, {
    type: "transaction.created",
    payload: {
      id: row.id,
      amount: row.amount.toNumber(),
      kind: row.kind as "expense" | "income",
      category: row.category,
      description: row.description,
      occurredAt: row.occurredAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      rawMessage: row.rawMessage,
    },
  });

  return {
    amount: parsed.amount,
    kind: parsed.intent,
    category,
    description: parsed.description,
    occurredAt,
  };
}

export async function persistReminder(
  userId: string,
  parsed: ParsedMessage,
): Promise<ReminderPersisted> {
  if (parsed.intent !== "reminder") {
    throw new Error(`persistReminder: invalid intent ${parsed.intent}`);
  }
  if (!parsed.occurredAt) {
    throw new Error("persistReminder: occurredAt is required");
  }

  const dueAt = new Date(parsed.occurredAt);
  const row = await prisma.reminder.create({
    data: { userId, text: parsed.description, dueAt },
  });

  broadcast(userId, {
    type: "reminder.created",
    payload: {
      id: row.id,
      text: row.text,
      dueAt: row.dueAt.toISOString(),
      notifiedAt: row.notifiedAt ? row.notifiedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    },
  });

  return { text: parsed.description, dueAt };
}
