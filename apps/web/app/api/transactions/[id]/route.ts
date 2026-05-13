import { Prisma, prisma } from "@pingo/db";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/session";
import {
  transactionUpdateSchema,
  type SerializedTransaction,
} from "@/lib/transactions";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

async function authedTx(id: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "unauthorized" as const };
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!existing) return { error: "not_found" as const };
  return { userId, existing };
}

function serialize(
  r: Awaited<ReturnType<typeof prisma.transaction.findFirst>>,
): SerializedTransaction {
  if (!r) throw new Error("nothing to serialize");
  return {
    id: r.id,
    amount: r.amount.toNumber(),
    kind: r.kind as "expense" | "income",
    category: r.category,
    description: r.description,
    occurredAt: r.occurredAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
    rawMessage: r.rawMessage,
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { id } = await params;
  const ctx = await authedTx(id);
  if ("error" in ctx) {
    return NextResponse.json(
      { error: ctx.error },
      { status: ctx.error === "unauthorized" ? 401 : 404 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = transactionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data: Prisma.TransactionUpdateInput = {};
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.category !== undefined) data.category = parsed.data.category;
  if (parsed.data.amount !== undefined) {
    data.amount = new Prisma.Decimal(parsed.data.amount);
  }
  if (parsed.data.occurredAt !== undefined) {
    data.occurredAt = new Date(parsed.data.occurredAt);
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data,
  });
  return NextResponse.json({ item: serialize(updated) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { id } = await params;
  const ctx = await authedTx(id);
  if ("error" in ctx) {
    return NextResponse.json(
      { error: ctx.error },
      { status: ctx.error === "unauthorized" ? 401 : 404 },
    );
  }

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
