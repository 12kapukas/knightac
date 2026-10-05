import { NextResponse } from "next/server";
import { signToken, verifyPassword } from "@/lib/auth";
import { getUser } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const u = (username || "").trim().toLowerCase();
    const p = (password || "").trim();
    if (!u || !p) return NextResponse.json({ error: "Enter username and password." }, { status: 400 });
    const user = await getUser(u);
    if (!user || !verifyPassword(p, user.passhash))
      return NextResponse.json({ error: "Wrong username or password." }, { status: 401 });
    const token = signToken({ u: user.username });
    const res = NextResponse.json({ ok: true, username: user.username });
    res.cookies.set("knight_session", token, { httpOnly: true, path: "/", maxAge: 7 * 86400, sameSite: "lax" });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "Error: " + e.message }, { status: 500 });
  }
}
