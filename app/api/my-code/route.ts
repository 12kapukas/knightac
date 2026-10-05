import { NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getUser } from "@/lib/store";

export async function GET(req: Request) {
  const tok = getTokenFromRequest(req);
  const data = tok ? verifyToken(tok) : null;
  if (!data?.u) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const user = await getUser(data.u);
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  return NextResponse.json({ code: user.code, username: user.username });
}
