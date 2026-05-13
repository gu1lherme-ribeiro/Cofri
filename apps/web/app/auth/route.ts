import { verifyMagicLink } from "@pingo/auth";
import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { setSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return errorPage(
      "Link inválido",
      "Não recebi um token. Volte ao Telegram e mande /dashboard de novo.",
    );
  }

  let userId: string;
  try {
    const claims = await verifyMagicLink(token, serverEnv.authJwtSecret);
    userId = claims.userId;
  } catch {
    return errorPage(
      "Link expirado ou inválido",
      "Este link já expirou (são 10 minutos). Volte ao Telegram e mande /dashboard de novo.",
    );
  }

  await setSessionCookie(userId);
  return NextResponse.redirect(new URL("/dashboard", req.url));
}

function errorPage(title: string, body: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<title>Pingo · ${title}</title>
<style>
  body{background:#0b0b0f;color:#ededf3;font-family:system-ui;display:flex;
       align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}
  .card{max-width:480px;background:#151520;border:1px solid #2a2a3a;border-radius:12px;padding:32px}
  h1{margin:0 0 12px;font-size:20px}
  p{margin:0;color:#8b8ba0;line-height:1.5}
</style></head>
<body><div class="card"><h1>${title}</h1><p>${body}</p></div></body></html>`;
  return new NextResponse(html, {
    status: 400,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
