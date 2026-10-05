import { NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getResultsFor } from "@/lib/store";

export async function GET(req: Request) {
  const tok = getTokenFromRequest(req);
  const data = tok ? verifyToken(tok) : null;
  if (!data?.u) return NextResponse.json({ error: "Neprisijungęs." }, { status: 401 });
  const list = await getResultsFor(data.u);
  return NextResponse.json({ results: list });
}
