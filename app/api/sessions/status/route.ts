import { NextResponse } from "next/server";
import { getSession } from "@/lib/store";

// PUBLIC: GET /api/sessions/status?pin=AB12CD
// Player page polls this. No login needed — knowing the PIN is the key.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const pin = (url.searchParams.get("pin") || "").trim().toUpperCase();
  if (!pin) return NextResponse.json({ state: "invalid" });
  const s = await getSession(pin);
  if (!s) return NextResponse.json({ state: "invalid", label: "nebegalioja" });
  if (Date.now() > s.expiresAt) return NextResponse.json({ state: "expired", label: "nebegalioja", playerName: s.playerName, pin: s.pin });
  if (s.used) return NextResponse.json({ state: "used", label: "panaudotas", playerName: s.playerName, pin: s.pin });
  return NextResponse.json({ state: "active", label: "active", playerName: s.playerName, pin: s.pin, expiresAt: s.expiresAt });
}
