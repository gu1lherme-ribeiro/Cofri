import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/session";
import {
  budgetUpsertSchema,
  deleteBudget,
  isValidCategory,
  upsertBudget,
} from "@/lib/budgets";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ category: string }> };

export async function PUT(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { category } = await params;
  const decoded = decodeURIComponent(category);
  if (!isValidCategory(decoded)) {
    return NextResponse.json({ error: "invalid_category" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = budgetUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const item = await upsertBudget(userId, decoded, parsed.data.monthlyAmount);
  return NextResponse.json({ item });
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { category } = await params;
  const decoded = decodeURIComponent(category);
  if (!isValidCategory(decoded)) {
    return NextResponse.json({ error: "invalid_category" }, { status: 400 });
  }

  await deleteBudget(userId, decoded);
  return NextResponse.json({ ok: true });
}
