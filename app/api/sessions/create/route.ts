import { NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { createSession } from "@/lib/store";

function siteUrl(req: Request): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "knightac.vercel.app";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host.includes("localhost")) return `http://${host}`;
  return `https://${host}`;
}

// Staff: POST /api/sessions/create { playerName } -> { pin, link }
export async function POST(req: Request) {
  const tok = getTokenFromRequest(req);
  const data = tok ? verifyToken(tok) : null;
  if (!data?.u) return NextResponse.json({ error: "Login required." }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({}));
    const playerName = String(body.playerName || "player").trim().slice(0, 32) || "player";
    const s = await createSession(data.u, playerName);
    const link = `${siteUrl(req)}/p/${s.pin}`;
    return NextResponse.json({ ok: true, pin: s.pin, playerName: s.playerName, expiresAt: s.expiresAt, link });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
