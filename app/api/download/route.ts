import { NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

// Staff download button — login required.
// Put your built file at public/downloads/KnightAC.exe (new name)
// or public/downloads/Knight.exe (old name still works), or set DOWNLOAD_URL env.
export async function GET(req: Request) {
  const tok = getTokenFromRequest(req);
  const data = tok ? verifyToken(tok) : null;
  if (!data?.u) return NextResponse.json({ error: "Login to download." }, { status: 401 });

  const url = process.env.DOWNLOAD_URL;
  if (url) return NextResponse.redirect(url);

  return NextResponse.redirect(new URL("/downloads/KnightAC.exe", req.url));
}
