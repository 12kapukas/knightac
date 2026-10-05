import { NextResponse } from "next/server";
import { getSession, getUserByCode } from "@/lib/store";

// Scanner calls: GET /api/verify-code?code=XXXXXX
// Accepts BOTH: personal code (KNIGHT-...) and staff session PIN (6 chars).
// Any random code -> valid:false, scanner blocks the scan.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ valid: false });

  // 1. session PIN?
  const s = await getSession(code);
  if (s) {
    if (s.used) return NextResponse.json({ valid: false, reason: "PIN already used." });
    if (Date.now() > s.expiresAt) return NextResponse.json({ valid: false, reason: "PIN expired." });
    return NextResponse.json({ valid: true, mode: "session", username: s.owner, playerName: s.playerName, pin: s.pin });
  }
  // 2. personal code?
  const user = await getUserByCode(code);
  if (!user) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: true, mode: "personal", username: user.username });
}

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    const c = ((code as string) || "").trim().toUpperCase();
    const s = await getSession(c);
    if (s) {
      if (s.used || Date.now() > s.expiresAt) return NextResponse.json({ valid: false });
      return NextResponse.json({ valid: true, mode: "session", username: s.owner, playerName: s.playerName });
    }
    const user = await getUserByCode(c);
    if (!user) return NextResponse.json({ valid: false });
    return NextResponse.json({ valid: true, mode: "personal", username: user.username });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
