import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listReminders, reminderFiltersSchema } from "@/lib/reminders";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const parsed = reminderFiltersSchema.safeParse({
    scope: sp.get("scope") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_filters", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const items = await listReminders(userId, parsed.data);
  return NextResponse.json({ items });
}
