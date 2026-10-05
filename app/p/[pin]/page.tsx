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
      setSt({ state: "invalid", label: "expired" });
    }
  }
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [pin]);

  return (
    <>
      <div className="bg-stage" />
      <div className="orb a" /><div className="orb b" />
      <div className="wrap" style={{ maxWidth: 640 }}>
        <div className="nav">
          <div className="brand"><div className="shield">R</div> KNIGHTROOT</div>
          <span className="topbar-link">player scan</span>
        </div>
        <div className="card"><div className="shine" />
          <h2 style={{ margin: "0 0 6px" }}>{st.playerName || pin}</h2>
          {st.state === "active" && (
            <>
              <div><span className="badge"><span className="dot" /> ACTIVE</span></div>
              <div className="codebox">{pin}</div>
              <div className="row">
                <a href="/downloads/KnightRoot.exe" style={{ flex: 2, textDecoration: "none" }}><button style={{ width: "100%" }}>Download KnightRoot.exe</button></a>
                <a href={`/api/sessions/pinfile?pin=${pin}`} style={{ flex: 1, textDecoration: "none" }}><button className="ghost" style={{ width: "100%" }}>pin.txt</button></a>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <button className="ghost" style={{ flex: 1 }} onClick={() => navigator.clipboard.writeText(pin)}>Copy code</button>
              </div>
              <ol className="steps small">
                <li>Put KnightRoot.exe + pin.txt in one folder</li>
                <li>Run it, press VERIFY + SCAN</li>
                <li>Keep Minecraft running</li>
              </ol>
            </>
          )}
          {st.state === "used" && (
            <>
              <div><span className="badge"><span className="dot used" /> USED</span></div>
              <div className="codebox" style={{ opacity: .6 }}>{pin}</div>
            </>
          )}
          {(st.state === "expired" || st.state === "invalid") && (
            <>
              <div><span className="badge"><span className="dot expired" /> EXPIRED</span></div>
              <div className="codebox" style={{ opacity: .5 }}>{pin}</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
