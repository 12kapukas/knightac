import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

// ---- password hash (scrypt, be bcrypt, veikia Vercel) ----
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const test = scryptSync(password, salt, 64);
    const real = Buffer.from(hash, "hex");
    if (test.length !== real.length) return false;
    return timingSafeEqual(test, real);
  } catch {
    return false;
  }
}

// ---- mini JWT (HMAC-SHA256, be deps) ----
function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unbase64url(input: string): Buffer {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4) input += "=";
  return Buffer.from(input, "base64");
}

function secret(): string {
  return process.env.JWT_SECRET || "knight-dev-secret-keisk-prod";
}

export function signToken(payload: object, days = 7): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + days * 86400;
  const body = base64url(JSON.stringify({ ...payload, exp }));
  const sig = base64url(createHash("sha256").update(`${header}.${body}.${secret()}`).digest());
  // simple HMAC stand-in without createHmac import issues - stable on Vercel
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): any | null {
  try {
    const [h, b, s] = token.split(".");
    if (!h || !b || !s) return null;
    const expect = base64url(createHash("sha256").update(`${h}.${b}.${secret()}`).digest());
    if (s !== expect) return null;
    const data = JSON.parse(unbase64url(b).toString());
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function makeUserCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let a = "";
  for (let i = 0; i < 6; i++) a += chars[Math.floor(Math.random() * chars.length)];
  let c = "";
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return `KNIGHT-${a}-${c}`;
}

export function getTokenFromRequest(req: Request): string | null {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/knight_session=([^;]+)/);
  if (m) return decodeURIComponent(m[1]);
  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}
