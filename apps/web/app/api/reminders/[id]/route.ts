import { Prisma, prisma } from "@pingo/db";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { reminderUpdateSchema } from "@/lib/reminders";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

async function authedReminder(id: string) {
  const userId = await getSessionUserId();
  if (!userId) return { error: "unauthorized" as const };
  const existing = await prisma.reminder.findFirst({
    where: { id, userId },
  });
  if (!existing) return { error: "not_found" as const };
  return { userId, existing };
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { id } = await params;
  const ctx = await authedReminder(id);
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

  const parsed = reminderUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data: Prisma.ReminderUpdateInput = {};
  if (parsed.data.text !== undefined) data.text = parsed.data.text;
  if (parsed.data.dueAt !== undefined) data.dueAt = new Date(parsed.data.dueAt);

  const updated = await prisma.reminder.update({ where: { id }, data });
  return NextResponse.json({
    item: {
      id: updated.id,
      text: updated.text,
      dueAt: updated.dueAt.toISOString(),
      notifiedAt: updated.notifiedAt ? updated.notifiedAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { id } = await params;
  const ctx = await authedReminder(id);
  if ("error" in ctx) {
    return NextResponse.json(
      { error: ctx.error },
      { status: ctx.error === "unauthorized" ? 401 : 404 },
    );
  }
  await prisma.reminder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
