import { NextResponse } from "next/server";
import { getSession } from "@/lib/store";

// PUBLIC: GET /api/sessions/pinfile?pin=AB12CD -> downloads pin.txt
// Player puts pin.txt next to KnightAC.exe -> scanner auto-fills the code.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const pin = (url.searchParams.get("pin") || "").trim().toUpperCase();
  const s = pin ? await getSession(pin) : null;
  if (!s) return NextResponse.json({ error: "Invalid PIN." }, { status: 404 });
  return new NextResponse(`${s.pin}\n`, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="pin.txt"`
    }
  });
}
