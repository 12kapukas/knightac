import { NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

// Staff download — login required. Serves KnightRoot.exe.
export async function GET(req: Request) {
  const tok = getTokenFromRequest(req);
  const data = tok ? verifyToken(tok) : null;
  if (!data?.u) return NextResponse.json({ error: "Login to download." }, { status: 401 });

  const url = process.env.DOWNLOAD_URL;
  if (url) return NextResponse.redirect(url);

  return NextResponse.redirect(new URL("/downloads/KnightRoot.exe", req.url));
}
