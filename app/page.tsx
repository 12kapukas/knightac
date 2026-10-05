"use client";
import { useEffect, useRef, useState } from "react";

type Me = { logged: boolean; username?: string; code?: string };
type Scan = { id: string; username: string; sessionPin?: string; playerName?: string; date: number; summary: string; detections: number; warnings: number; data: any };
type Sess = { pin: string; owner: string; playerName: string; createdAt: number; expiresAt: number; used: boolean };

const SITE = "https://knightroot.vercel.app";
const EXE = "/downloads/KnightRoot.exe";

export default function Page() {
  const [me, setMe] = useState<Me>({ logged: false });
  const [tab, setTab] = useState<"login" | "register">("login");
  const [side, setSide] = useState<"generate" | "pins" | "logs">("generate");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ t: "err" | "ok"; s: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Scan[]>([]);
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [lastPin, setLastPin] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  function onTilt(e: React.MouseEvent) {
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  }
  function offTilt() {
    if (tiltRef.current) tiltRef.current.style.transform = "rotateY(0deg) rotateX(0deg)";
  }

  async function refresh() {
    const r = await fetch("/api/me", { cache: "no-store" });
    const j = await r.json();
    setMe(j);
    if (j.logged) {
      const rr = await fetch("/api/my-results", { cache: "no-store" });
      const jj = await rr.json();
      if (jj.results) setResults(jj.results);
      const ss = await fetch("/api/sessions/list", { cache: "no-store" });
      const sj = await ss.json();
      if (sj.sessions) setSessions(sj.sessions);
    }
  }
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (!me.logged) return;
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [me.logged]);

  async function doRegister() {
    setLoading(true); setMsg(null);
    try {
      const r = await fetch("/api/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, confirm })
      });
      const j = await r.json();
      if (!r.ok) setMsg({ t: "err", s: j.error || "Error." });
      else { setMsg({ t: "ok", s: "Done." }); setPassword(""); setConfirm(""); await refresh(); }
    } catch (e: any) { setMsg({ t: "err", s: e.message }); }
    setLoading(false);
  }

  async function doLogin() {
    setLoading(true); setMsg(null);
    try {
      const r = await fetch("/api/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const j = await r.json();
      if (!r.ok) setMsg({ t: "err", s: j.error || "Error." });
      else { setPassword(""); await refresh(); }
    } catch (e: any) { setMsg({ t: "err", s: e.message }); }
    setLoading(false);
  }

  async function genPin() {
    setLoading(true); setMsg(null);
    try {
      const r = await fetch("/api/sessions/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: playerName || "player" })
      });
      const j = await r.json();
      if (!r.ok) setMsg({ t: "err", s: j.error || "Error." });
      else {
        setLastPin(j.pin); setLastLink(j.link); setPlayerName("");
        setSide("pins"); await refresh();
        setMsg({ t: "ok", s: `PIN ${j.pin} ready.` });
      }
    } catch (e: any) { setMsg({ t: "err", s: e.message }); }
    setLoading(false);
  }

  function logout() {
    document.cookie = "knight_session=; path=/; max-age=0";
    setMe({ logged: false }); setResults([]); setSessions([]); setLastPin(null); setLastLink(null);
  }

  function copy(t: string, label: string) {
    navigator.clipboard.writeText(t);
    setMsg({ t: "ok", s: label });
  }

  const now = Date.now();
  const active = sessions.filter((s) => !s.used && s.expiresAt > now);
  const used = sessions.filter((s) => s.used);
  const expired = sessions.filter((s) => !s.used && s.expiresAt <= now);

  return (
    <>
      <div className="bg-stage" />
      <div className="orb a" /><div className="orb b" />
      <div className="wrap">
        <div className="nav">
          <div className="brand"><div className="shield">♞</div> KNIGHTROOT</div>
          <div className="row">
            <span className="topbar-link">knightroot.vercel.app</span>
            {me.logged
              ? (<><span className="small">@{me.username}</span><button className="ghost" onClick={logout}>Logout</button></>)
              : (<a href={EXE} style={{ textDecoration: "none" }}><button>⬇ Download</button></a>)}
          </div>
        </div>

        {!me.logged ? (
          <div className="tilt-scene" onMouseMove={onTilt} onMouseLeave={offTilt}>
            <div className="hero tilt" ref={tiltRef}>
              <div className="hero-visual">
                {/* optional: save chat Audi photo as public/hero.jpg to use it */}
                <img src="/hero.jpg" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="hero-body">
                <h1>KNIGHT<span className="grad">ROOT</span></h1>
                <div className="row" style={{ marginTop: 14 }}>
                  <a href={EXE} style={{ flex: 1, textDecoration: "none" }}><button style={{ width: "100%" }}>⬇ KnightRoot.exe</button></a>
                </div>
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="shine" />
                  <div className="tabs">
                    <button className={tab === "login" ? "" : "ghost"} onClick={() => setTab("login")}>Login</button>
                    <button className={tab === "register" ? "" : "ghost"} onClick={() => setTab("register")}>Register</button>
                  </div>
                  <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
                  {tab === "register" && (<input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="confirm password" />)}
                  {msg && <div className={msg.t}>{msg.s}</div>}
                  {tab === "register"
                    ? <button style={{ width: "100%" }} disabled={loading} onClick={doRegister}>{loading ? "..." : "Create account"}</button>
                    : <button style={{ width: "100%" }} disabled={loading} onClick={doLogin}>{loading ? "..." : "Login"}</button>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="dash">
            <div className="side">
              <div className="small" style={{ opacity: .6, marginBottom: 6 }}>♞ @{me.username}</div>
              <button className={`tab ${side === "generate" ? "on" : ""}`} onClick={() => setSide("generate")}>⚡ Generate</button>
              <button className={`tab ${side === "pins" ? "on" : ""}`} onClick={() => setSide("pins")}>🎫 PINs <span className="count">{active.length} live</span></button>
              <button className={`tab ${side === "logs" ? "on" : ""}`} onClick={() => setSide("logs")}>🧾 Logs <span className="count">{results.length}</span></button>
              <hr style={{ opacity: .12 }} />
              <div className="row">
                <a href={EXE} style={{ flex: 1, textDecoration: "none" }}><button style={{ width: "100%" }}>⬇ .exe</button></a>
                <a href="/api/download" style={{ flex: 1, textDecoration: "none" }}><button className="ghost" style={{ width: "100%" }}>staff dl</button></a>
              </div>
            </div>

            <div>
              {msg && <div className={msg.t}>{msg.s}</div>}
              {side === "generate" && (
                <div className="card"><div className="shine" />
                  <h3 style={{ margin: "0 0 8px" }}>⚡ New PIN + link</h3>
                  <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="player nick" />
                  <button style={{ width: "100%" }} disabled={loading} onClick={genPin}>{loading ? "..." : "Generate"}</button>
                  {lastPin && lastLink && (
                    <>
                      <div className="codebox">{lastPin}</div>
                      <div className="linkbox">{lastLink}</div>
                      <div className="row">
                        <button style={{ flex: 1 }} onClick={() => copy(lastPin!, "Copied.")}>Copy PIN</button>
                        <button className="ghost" style={{ flex: 2 }} onClick={() => copy(lastLink!, "Link copied.")}>Copy link</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {side === "pins" && (
                <div className="card"><div className="shine" />
                  <h3 style={{ margin: "0 0 8px" }}>🎫 PINs</h3>
                  {sessions.length === 0 ? <p className="small">Empty.</p> : (
                    <>
                      {active.map((s) => (
                        <div key={s.pin} className="result">
                          <span className="badge"><span className="dot" /> ACTIVE</span> <b style={{ letterSpacing: 3, fontSize: 18 }}>{s.pin}</b>
                          <div className="small">{s.playerName}</div>
                          <div className="linkbox">{SITE}/p/{s.pin}</div>
                          <button className="ghost" onClick={() => copy(`${SITE}/p/${s.pin}`, "Copied.")}>Copy</button>
                        </div>
                      ))}
                      {used.map((s) => (
                        <div key={s.pin} className="result" style={{ opacity: .8 }}>
                          <span className="badge"><span className="dot used" /> USED</span> <b style={{ letterSpacing: 2 }}>{s.pin}</b>
                          <div className="small">{s.playerName}</div>
                        </div>
                      ))}
                      {expired.map((s) => (
                        <div key={s.pin} className="result" style={{ opacity: .65 }}>
                          <span className="badge"><span className="dot expired" /> EXPIRED</span> <b style={{ letterSpacing: 2 }}>{s.pin}</b>
                          <div className="small">{s.playerName}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {side === "logs" && (
                <div className="card" id="logs"><div className="shine" />
                  <h3 style={{ margin: "0 0 8px" }}>🧾 Logs ({results.length})</h3>
                  {results.length === 0 ? <p className="small">No scans yet.</p> :
                    results.map((r) => {
                      const det = (r.data?.findings || []) as any[];
                      const warn = (r.data?.warnings || []) as any[];
                      return (
                        <div key={r.id} className="result" style={{ borderLeft: r.detections > 0 ? "4px solid #ff5470" : "4px solid #2effa3" }}>
                          <b>{r.playerName ? `${r.playerName} — ` : ""}{r.summary}</b>{" "}
                          <span className="badge">{r.detections} det</span>{" "}
                          <span className="badge">{r.warnings} warn</span>{" "}
                          {r.sessionPin && <span className="badge">{r.sessionPin}</span>}
                          <div className="small">{new Date(r.date).toLocaleString()}</div>
                          <div className="row" style={{ marginTop: 8 }}>
                            <button className="ghost" onClick={() => setOpenId(openId === r.id ? null : r.id)}>{openId === r.id ? "Hide" : "Flags"}</button>
                          </div>
                          {openId === r.id && (
                            <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 10, marginTop: 8 }}>
                              <div className="small"><div><b>Detections</b> ({det.length})</div><div><b>Warnings</b> ({warn.length})</div></div>
                              <div>
                                {det.length === 0 && warn.length === 0 && <div className="small">Clean.</div>}
                                {det.map((f: any, i: number) => (
                                  <div key={i} className="result"><b className="flag-red">{f.name}</b><div className="small">{f.source || ""}</div><div className="small">{f.evidence || ""}</div></div>
                                ))}
                                {warn.map((f: any, i: number) => (
                                  <div key={i} className="result"><b>{f.name}</b><div className="small">{f.evidence || ""}</div></div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
