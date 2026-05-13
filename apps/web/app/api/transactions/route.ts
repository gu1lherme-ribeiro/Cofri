import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/session";
import {
  listTransactions,
  transactionFiltersSchema,
} from "@/lib/transactions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const raw = {
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    category: sp.get("category") ?? undefined,
    kind: sp.get("kind") ?? undefined,
  };

  const parsed = transactionFiltersSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_filters", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const items = await listTransactions(userId, parsed.data);
  return NextResponse.json({ items });
}
