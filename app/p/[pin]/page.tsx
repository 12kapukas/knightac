"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type St = { state: string; label?: string; playerName?: string; pin?: string };

export default function PinPage() {
  const params = useParams();
  const pin = String((params as any)?.pin || "").toUpperCase();
  const [st, setSt] = useState<St>({ state: "loading" });

  async function load() {
    try {
      const r = await fetch(`/api/sessions/status?pin=${pin}`, { cache: "no-store" });
      setSt(await r.json());
    } catch {
      setSt({ state: "invalid", label: "nebegalioja" });
    }
  }
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [pin]);

  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <div className="nav">
        <div className="brand"><div className="shield">ā™˛</div> KNIGHTROOT</div>
        <span className="topbar-link">player scan</span>
      </div>
      <div className="card">
        <h2 style={{ margin: "0 0 6px" }}>Player scan ā€” {st.playerName || pin}</h2>
        {st.state === "loading" && <div className="shimmer" style={{ height: 60 }} />}
        {st.state === "active" && (
          <>
            <div><span className="badge"><span className="dot" /> ACTIVE ā€” code ready</span></div>
            <div className="small" style={{ marginTop: 8 }}>Your code is pre-filled. Download both files into ONE folder, then run KnightRoot ā€” the code fills in automatically.</div>
            <div className="codebox">{pin}</div>
            <div className="row">
              <a href="/downloads/KnightRoot.exe" style={{ flex: 2, textDecoration: "none" }}><button style={{ width: "100%" }}>ā¬‡ Download KnightRoot.exe</button></a>
              <a href={`/api/sessions/pinfile?pin=${pin}`} style={{ flex: 1, textDecoration: "none" }}><button className="ghost" style={{ width: "100%" }}>ā¬‡ pin.txt (auto-code)</button></a>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="ghost" style={{ flex: 1 }} onClick={() => navigator.clipboard.writeText(pin)}>Copy code</button>
            </div>
            <ol className="steps small">
              <li>1. Put <span className="kbd">KnightRoot.exe</span> + <span className="kbd">pin.txt</span> in one folder</li>
              <li>2. Run KnightRoot ā†’ code auto-fills ā†’ press VERIFY + SCAN</li>
              <li>3. Keep Minecraft running. Wait for Done. Staff sees your logs.</li>
            </ol>
            <p className="small">No account needed. This link is your key ā€” random codes are rejected.</p>
          </>
        )}
        {st.state === "used" && (
          <>
            <div><span className="badge"><span className="dot used" /> USED ā€” panaudotas</span></div>
            <div className="codebox" style={{ opacity: .6 }}>{pin}</div>
            <p className="small">This code was already used for a scan. Ask staff for a new link if needed. Staff already has your logs.</p>
          </>
        )}
        {(st.state === "expired" || st.state === "invalid") && (
          <>
            <div><span className="badge"><span className="dot expired" /> EXPIRED ā€” nebegalioja</span></div>
            <div className="codebox" style={{ opacity: .5 }}>{pin}</div>
            <p className="small">This code is no longer valid (expired or checked). Ask staff for a fresh PIN link.</p>
          </>
        )}
      </div>
      <p className="small" style={{ textAlign: "center", opacity: .6 }}>KnightRoot ā€¢ read-only scan ā€¢ staff reviews the result</p>
    </div>
  );
}

