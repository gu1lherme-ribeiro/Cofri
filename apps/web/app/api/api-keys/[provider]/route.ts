import { NextResponse, type NextRequest } from "next/server";
import { PROVIDERS, deleteApiKey, type Provider } from "@/lib/api-keys";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ provider: string }> };

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { provider } = await params;
  if (!PROVIDERS.includes(provider as Provider)) {
    return NextResponse.json({ error: "unknown_provider" }, { status: 400 });
  }
  await deleteApiKey(userId, provider as Provider);
  return NextResponse.json({ ok: true });
}
