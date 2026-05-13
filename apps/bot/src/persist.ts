import { prisma, Prisma } from "@pingo/db";
import type { ParsedMessage } from "@pingo/parser";

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

  await prisma.transaction.create({
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
  await prisma.reminder.create({
    data: { userId, text: parsed.description, dueAt },
  });

  return { text: parsed.description, dueAt };
}
