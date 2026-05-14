import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listBudgets } from "@/lib/budgets";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const items = await listBudgets(userId);
  return NextResponse.json({ items });
}
