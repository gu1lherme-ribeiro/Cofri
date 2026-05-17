import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  BudgetConflictError,
  BudgetNameError,
  BudgetNotFoundError,
  renameBudget,
} from "@/lib/budgets";
import { normalizeCategoryName } from "@/lib/categories";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ to: z.string() });

type RouteParams = { params: Promise<{ category: string }> };

export async function POST(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { category } = await params;
  const from = normalizeCategoryName(decodeURIComponent(category));
  if (!from) {
    return NextResponse.json({ error: "invalid_category" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    const item = await renameBudget(userId, from, parsed.data.to);
    return NextResponse.json({ item });
  } catch (e) {
    if (e instanceof BudgetNameError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    if (e instanceof BudgetConflictError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    if (e instanceof BudgetNotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    throw e;
  }
}
