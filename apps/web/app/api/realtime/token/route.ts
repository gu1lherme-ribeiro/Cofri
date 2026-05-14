import { NextResponse } from "next/server";
import { issueRealtimeToken, REALTIME_DEFAULT_TTL } from "@cofri/auth";
import { getSessionUserId } from "@/lib/session";
import { serverEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = await issueRealtimeToken({ userId }, serverEnv.authJwtSecret);
  const expiresAt = Math.floor(Date.now() / 1000) + REALTIME_DEFAULT_TTL;

  return NextResponse.json(
    { token, expiresAt },
    { headers: { "cache-control": "no-store" } },
  );
}
