import { verifyMagicLink } from "@cofri/auth";
import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/auth/erro?reason=missing", req.url));
  }

  let userId: string;
  try {
    const claims = await verifyMagicLink(token, serverEnv.authJwtSecret);
    userId = claims.userId;
  } catch {
    return NextResponse.redirect(new URL("/auth/erro?reason=expired", req.url));
  }

  await setSessionCookie(userId);
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
