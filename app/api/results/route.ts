import { NextResponse } from "next/server";
import { getSession, getUserByCode, markSessionUsed, pushResult } from "@/lib/store";

// Scanner sends: POST /api/results { code, summary, detections, warnings, data }
// code can be personal code OR session PIN. Result always lands in staff account.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = ((body.code as string) || "").trim().toUpperCase();
    if (!code) return NextResponse.json({ error: "Missing code." }, { status: 400 });

    // session PIN flow (like anticheat.ac)
    const s = await getSession(code);
    if (s) {
      if (Date.now() > s.expiresAt) return NextResponse.json({ error: "PIN expired." }, { status: 403 });
      if (s.used) return NextResponse.json({ error: "PIN already used." }, { status: 403 });
      const r = {
        id: `${Date.now()}-${Math.floor(Math.random() * 9999)}`,
        username: s.owner,
        sessionPin: s.pin,
        playerName: s.playerName,
        date: Date.now(),
        summary: String(body.summary || "Scan finished"),
        detections: Number(body.detections || 0),
        warnings: Number(body.warnings || 0),
        data: body.data || {}
      };
      await pushResult(r);
      await markSessionUsed(s.pin);
      return NextResponse.json({ ok: true, id: r.id });
    }

    // personal code flow
    const user = await getUserByCode(code);
    if (!user) return NextResponse.json({ error: "Bad code. Scan blocked." }, { status: 403 });
    const r = {
      id: `${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      username: user.username,
      date: Date.now(),
      summary: String(body.summary || "Scan finished"),
      detections: Number(body.detections || 0),
      warnings: Number(body.warnings || 0),
      data: body.data || {}
    };
    await pushResult(r);
    return NextResponse.json({ ok: true, id: r.id });
  } catch (e: any) {
    return NextResponse.json({ error: "Error: " + e.message }, { status: 500 });
  }
}
