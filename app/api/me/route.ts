import { NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getUser } from "@/lib/store";

export async function GET(req: Request) {
  const tok = getTokenFromRequest(req);
  const data = tok ? verifyToken(tok) : null;
  if (!data?.u) return NextResponse.json({ logged: false });
  const user = await getUser(data.u);
  if (!user) return NextResponse.json({ logged: false });
  return NextResponse.json({ logged: true, username: user.username, code: user.code });
}
