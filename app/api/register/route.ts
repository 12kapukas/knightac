import { NextResponse } from "next/server";
import { hashPassword, makeUserCode, signToken } from "@/lib/auth";
import { getUser, saveUser } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const { username, password, confirm } = await req.json();
    const u = (username || "").trim();
    const p = (password || "").trim();
    const c = (confirm || "").trim();
    if (!u || !p || !c) return NextResponse.json({ error: "Fill in all fields." }, { status: 400 });
    if (u.length < 3 || u.length > 20) return NextResponse.json({ error: "Username 3-20 characters." }, { status: 400 });
    if (!/^[a-zA-Z0-9_]+$/.test(u)) return NextResponse.json({ error: "Username: letters, numbers, _ only." }, { status: 400 });
    if (p.length < 4) return NextResponse.json({ error: "Password too short (min 4)." }, { status: 400 });
    if (p !== c) return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });

    const exists = await getUser(u);
    if (exists) return NextResponse.json({ error: "Username already taken." }, { status: 409 });

    const user = { username: u.toLowerCase(), passhash: hashPassword(p), code: makeUserCode(), createdAt: Date.now() };
    await saveUser(user);
    const token = signToken({ u: user.username });
    const res = NextResponse.json({ ok: true, username: user.username, code: user.code });
    res.cookies.set("knight_session", token, { httpOnly: true, path: "/", maxAge: 7 * 86400, sameSite: "lax" });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "Error: " + e.message }, { status: 500 });
  }
}
