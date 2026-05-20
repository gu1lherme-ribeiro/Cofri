import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/session";
import {
  createFixedExpense,
  fixedExpenseCreateSchema,
  FixedExpenseValidationError,
  listFixedExpenses,
} from "@/lib/fixed-expenses";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const items = await listFixedExpenses(userId);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = fixedExpenseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const item = await createFixedExpense(userId, parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    if (e instanceof FixedExpenseValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
