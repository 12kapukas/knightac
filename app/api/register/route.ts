import { NextResponse } from "next/server";
import { hashPassword, makeUserCode, signToken } from "@/lib/auth";
import { getUser, saveUser } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const { username, password, confirm } = await req.json();
    const u = (username || "").trim();
    const p = (password || "").trim();
    const c = (confirm || "").trim();
    if (!u || !p || !c) return NextResponse.json({ error: "Užpildyk visus laukus." }, { status: 400 });
    if (u.length < 3 || u.length > 20) return NextResponse.json({ error: "Username 3–20 simbolių." }, { status: 400 });
    if (!/^[a-zA-Z0-9_]+$/.test(u)) return NextResponse.json({ error: "Username tik raidės, skaičiai, _" }, { status: 400 });
    if (p.length < 4) return NextResponse.json({ error: "Slaptažodis per trumpas (min 4)." }, { status: 400 });
    if (p !== c) return NextResponse.json({ error: "Slaptažodžiai nesutampa." }, { status: 400 });

    const exists = await getUser(u);
    if (exists) return NextResponse.json({ error: "Toks username jau užimtas." }, { status: 409 });

    const user = { username: u.toLowerCase(), passhash: hashPassword(p), code: makeUserCode(), createdAt: Date.now() };
    await saveUser(user);
    const token = signToken({ u: user.username });
    const res = NextResponse.json({ ok: true, username: user.username, code: user.code });
    res.cookies.set("knight_session", token, { httpOnly: true, path: "/", maxAge: 7 * 86400, sameSite: "lax" });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "Klaida: " + e.message }, { status: 500 });
  }
}
