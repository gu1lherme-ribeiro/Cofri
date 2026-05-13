import {
  SESSION_DEFAULT_TTL,
  issueSession,
  verifySession,
} from "@cofri/auth";
import { cookies } from "next/headers";
import { SESSION_COOKIE, serverEnv } from "./env";

export async function setSessionCookie(userId: string): Promise<void> {
  const token = await issueSession({ userId }, serverEnv.authJwtSecret);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DEFAULT_TTL,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { userId } = await verifySession(token, serverEnv.authJwtSecret);
    return userId;
  } catch {
    return null;
  }
}

export async function requireSessionUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("unauthorized");
  return userId;
}
