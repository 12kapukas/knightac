import { NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getSessionsFor } from "@/lib/store";

export async function GET(req: Request) {
  const tok = getTokenFromRequest(req);
  const data = tok ? verifyToken(tok) : null;
  if (!data?.u) return NextResponse.json({ error: "Login required." }, { status: 401 });
  const list = await getSessionsFor(data.u);
  return NextResponse.json({ sessions: list });
}
