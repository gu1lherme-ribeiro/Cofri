import { SignJWT, jwtVerify } from "jose";

const ISSUER = "pingo";
const AUDIENCE_MAGIC = "pingo-dashboard-magic";
const AUDIENCE_SESSION = "pingo-dashboard-session";
const ALG = "HS256";

const DEFAULT_MAGIC_TTL = 60 * 10;
const DEFAULT_SESSION_TTL = 60 * 60 * 24 * 30;

export type Claims = {
  userId: string;
};
export type MagicLinkClaims = Claims;
export type SessionClaims = Claims;

export type IssueOptions = {
  ttlSeconds?: number;
};

function toKey(secret: string): Uint8Array {
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_JWT_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

async function sign(
  audience: string,
  ttl: number,
  claims: Claims,
  secret: string,
): Promise<string> {
  return new SignJWT({ sub: claims.userId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(audience)
    .setExpirationTime(`${ttl}s`)
    .sign(toKey(secret));
}

async function verify(
  audience: string,
  token: string,
  secret: string,
): Promise<Claims> {
  const { payload } = await jwtVerify(token, toKey(secret), {
    issuer: ISSUER,
    audience,
    algorithms: [ALG],
  });
  if (typeof payload.sub !== "string" || payload.sub === "") {
    throw new Error("token missing subject");
  }
  return { userId: payload.sub };
}

export function issueMagicLink(
  claims: MagicLinkClaims,
  secret: string,
  opts: IssueOptions = {},
): Promise<string> {
  return sign(AUDIENCE_MAGIC, opts.ttlSeconds ?? DEFAULT_MAGIC_TTL, claims, secret);
}

export function verifyMagicLink(
  token: string,
  secret: string,
): Promise<MagicLinkClaims> {
  return verify(AUDIENCE_MAGIC, token, secret);
}

export function issueSession(
  claims: SessionClaims,
  secret: string,
  opts: IssueOptions = {},
): Promise<string> {
  return sign(
    AUDIENCE_SESSION,
    opts.ttlSeconds ?? DEFAULT_SESSION_TTL,
    claims,
    secret,
  );
}

export function verifySession(
  token: string,
  secret: string,
): Promise<SessionClaims> {
  return verify(AUDIENCE_SESSION, token, secret);
}

export function buildMagicLinkUrl(dashboardUrl: string, token: string): string {
  const base = dashboardUrl.endsWith("/")
    ? dashboardUrl.slice(0, -1)
    : dashboardUrl;
  return `${base}/auth?token=${encodeURIComponent(token)}`;
}

export const SESSION_DEFAULT_TTL = DEFAULT_SESSION_TTL;
export const MAGIC_LINK_DEFAULT_TTL = DEFAULT_MAGIC_TTL;
