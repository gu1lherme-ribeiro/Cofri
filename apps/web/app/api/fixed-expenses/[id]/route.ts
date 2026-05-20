import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/session";
import {
  deleteFixedExpense,
  fixedExpenseUpdateSchema,
  FixedExpenseNotFoundError,
  FixedExpenseValidationError,
  updateFixedExpense,
} from "@/lib/fixed-expenses";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = fixedExpenseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const item = await updateFixedExpense(userId, id, parsed.data);
    return NextResponse.json({ item });
  } catch (e) {
    if (e instanceof FixedExpenseNotFoundError) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (e instanceof FixedExpenseValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await deleteFixedExpense(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof FixedExpenseNotFoundError) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    throw e;
  }
}
