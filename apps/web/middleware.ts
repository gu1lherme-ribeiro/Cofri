import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "cofri_session";

function key(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) throw new Error("AUTH_JWT_SECRET missing in middleware runtime");
  return new TextEncoder().encode(secret);
}

async function isValidSession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, key(), {
      issuer: "cofri",
      audience: "cofri-dashboard-session",
      algorithms: ["HS256"],
    });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get(COOKIE)?.value;
  const authed = token ? await isValidSession(token) : false;

  if (!authed) {
    const res = NextResponse.redirect(new URL("/", req.url));
    if (token) res.cookies.delete(COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Protege /dashboard/*, /conta(/*), e /api/* exceto /api/auth (não temos hoje).
  matcher: [
    "/dashboard/:path*",
    "/conta",
    "/conta/:path*",
    "/api/((?!auth).*)",
  ],
};
