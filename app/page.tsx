"use client";
import { useEffect, useState } from "react";

type Me = { logged: boolean; username?: string; code?: string };
type Scan = { id: string; username: string; sessionPin?: string; playerName?: string; date: number; summary: string; detections: number; warnings: number; data: any };
type Sess = { pin: string; owner: string; playerName: string; createdAt: number; expiresAt: number; used: boolean };

const SITE = "https://knightac.vercel.app";

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
    const t = setInterval(refresh, 8000); // live: code panaudotas / nebegalioja + logs
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
      else { setMsg({ t: "ok", s: "Account created — welcome to KnightAC." }); setPassword(""); setConfirm(""); await refresh(); }
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
        setMsg({ t: "ok", s: `PIN ${j.pin} ready. Send the link to the player.` });
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
    <div className="wrap">
      <div className="nav">
        <div className="brand"><div className="shield">🛡️</div> KNIGHTAC <small>screenshare</small></div>
        <div className="row">
          <span className="topbar-link">{SITE.replace("https://", "")}</span>
          {me.logged ? (<><span className="small">@{me.username}</span><button className="ghost" onClick={logout}>Logout</button></>) : (<span className="small">staff console</span>)}
        </div>
      </div>

      {!me.logged ? (
        <div className="hero">
          <div>
            <span className="badge"><span className="dot" /> gray console • animated • live</span>
            <h1>Detect cheaters <span className="grad">in 60 seconds.</span></h1>
            <p className="sub">
              Login as staff → <b>Generate PIN</b> → you get a link like <span className="kbd">{SITE}/p/AB12CD</span> →
              send it to the suspect. Player opens the link, downloads <b>KnightAC.exe</b>, code is
              pre-filled automatically. The site updates live: <b>active → used (panaudotas) → expired (nebegalioja)</b>,
              and flags appear in Logs like Root — detections, warnings, evidence.
            </p>
            <ol className="steps small">
              <li><b>1.</b> Register / Login (left sidebar after login)</li>
              <li><b>2.</b> Generate PIN → copy player link</li>
              <li><b>3.</b> Player scans → you review logs → /ban in Minecraft if red</li>
            </ol>
          </div>
          <div className="card">
            <div className="tabs">
              <button className={tab === "login" ? "" : "ghost"} onClick={() => setTab("login")}>Login</button>
              <button className={tab === "register" ? "" : "ghost"} onClick={() => setTab("register")}>Register</button>
            </div>
            <label className="small">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="staff name" />
            <label className="small">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
            {tab === "register" && (<><label className="small">Confirm password</label><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="repeat" /></>)}
            {msg && <div className={msg.t}>{msg.s}</div>}
            {tab === "register"
              ? <button style={{ width: "100%" }} disabled={loading} onClick={doRegister}>{loading ? "..." : "Create staff account"}</button>
              : <button style={{ width: "100%" }} disabled={loading} onClick={doLogin}>{loading ? "..." : "Login"}</button>}
          </div>
        </div>
      ) : (
        <div className="dash">
          <div className="side">
            <div className="small" style={{ opacity: .6, marginBottom: 6 }}>STAFF @{me.username}</div>
            <button className={`tab ${side === "generate" ? "on" : ""}`} onClick={() => setSide("generate")}>⚡ Generate PIN</button>
            <button className={`tab ${side === "pins" ? "on" : ""}`} onClick={() => setSide("pins")}>🎫 PINs <span className="count">{sessions.length} • active {active.length}</span></button>
            <button className={`tab ${side === "logs" ? "on" : ""}`} onClick={() => setSide("logs")}>🧾 Logs <span className="count">{results.length}</span></button>
            <hr style={{ opacity: .12 }} />
            <div className="small">Personal backup code:</div>
            <div className="kbd" style={{ marginTop: 4 }}>{me.code}</div>
            <div style={{ marginTop: 10 }}><a href="/api/download" style={{ textDecoration: "none" }}><button className="ghost" style={{ width: "100%" }}>⬇ Staff download</button></a></div>
          </div>

          <div>
            {msg && <div className={msg.t}>{msg.s}</div>}
            {side === "generate" && (
              <div className="card">
                <h3 style={{ margin: "0 0 8px" }}>⚡ Generate PIN + player link</h3>
                <p className="small">Enter suspect Minecraft nick. The site creates a PIN <b>and</b> a vercel link with the code inside. Player opens the link — code is auto-filled, no typing.</p>
                <label className="small">Player Minecraft nick:</label>
                <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="e.g. Steve123" />
                <button style={{ width: "100%" }} disabled={loading} onClick={genPin}>{loading ? "..." : "Generate PIN + link"}</button>
                {lastPin && lastLink && (
                  <>
                    <div className="small" style={{ marginTop: 12 }}>PIN for player:</div>
                    <div className="codebox">{lastPin}</div>
                    <div className="small">Player link (send in Discord / Minecraft chat):</div>
                    <div className="linkbox">{lastLink}</div>
                    <div className="row">
                      <button style={{ flex: 1 }} onClick={() => copy(lastPin!, "PIN copied.")}>Copy PIN</button>
                      <button className="ghost" style={{ flex: 2 }} onClick={() => copy(lastLink!, "Link copied — send it to the player.")}>Copy player link</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {side === "pins" && (
              <div className="card">
                <h3 style={{ margin: "0 0 8px" }}>🎫 PINs — active / used / expired</h3>
                <p className="small">Live updates every 8s. When player uses the code → <b>used (panaudotas)</b>. After scan or 30 min → <b>expired (nebegalioja)</b> + logs below.</p>
                {sessions.length === 0 ? <p className="small">No PINs yet. Go to Generate PIN.</p> : (
                  <>
                    <h4>🟢 Active ({active.length})</h4>
                    {active.length === 0 ? <p className="small">None.</p> : active.map((s) => (
                      <div key={s.pin} className="result">
                        <span className="badge"><span className="dot" /> ACTIVE</span> <b style={{ letterSpacing: 2, fontSize: 18 }}>{s.pin}</b>
                        <div className="small">player {s.playerName} • expires {new Date(s.expiresAt).toLocaleTimeString()}</div>
                        <div className="linkbox">{SITE}/p/{s.pin}</div>
                        <div className="row"><button className="ghost" onClick={() => copy(`${SITE}/p/${s.pin}`, "Link copied.")}>Copy link</button></div>
                      </div>
                    ))}
                    <h4>⚪ Used — panaudotas ({used.length})</h4>
                    {used.length === 0 ? <p className="small">None.</p> : used.map((s) => (
                      <div key={s.pin} className="result" style={{ opacity: .85 }}>
                        <span className="badge"><span className="dot used" /> USED — panaudotas</span> <b style={{ letterSpacing: 2 }}>{s.pin}</b>
                        <div className="small">player {s.playerName} • <a href="#logs">see logs ↓</a></div>
                      </div>
                    ))}
                    <h4>🔴 Expired — nebegalioja ({expired.length})</h4>
                    {expired.length === 0 ? <p className="small">None.</p> : expired.map((s) => (
                      <div key={s.pin} className="result" style={{ opacity: .7 }}>
                        <span className="badge"><span className="dot expired" /> EXPIRED — nebegalioja</span> <b style={{ letterSpacing: 2 }}>{s.pin}</b>
                        <div className="small">player {s.playerName}</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {side === "logs" && (
              <div className="card" id="logs">
                <h3 style={{ margin: "0 0 8px" }}>🧾 Logs — flags like Root ({results.length})</h3>
                {results.length === 0 ? <p className="small">No scans yet. Generate a PIN and let the player scan.</p> :
                  results.map((r) => {
                    const det = (r.data?.findings || []) as any[];
                    const warn = (r.data?.warnings || []) as any[];
                    return (
                      <div key={r.id} className="result" style={{ borderLeft: r.detections > 0 ? "4px solid #ff5470" : "4px solid #2effa3" }}>
                        <b>{r.playerName ? `${r.playerName} — ` : ""}{r.summary}</b>{" "}
                        <span className="badge">detections {r.detections}</span>{" "}
                        <span className="badge">warnings {r.warnings}</span>{" "}
                        {r.sessionPin && <span className="badge">PIN {r.sessionPin}</span>}
                        <div className="small">{new Date(r.date).toLocaleString()} • id {r.id}</div>
                        {r.detections > 0
                          ? <div className="small flag-red">⚠️ FLAG — review evidence, then /ban {r.playerName || "player"} in Minecraft if confirmed</div>
                          : <div className="small flag-green">✔ clean</div>}
                        <div className="row" style={{ marginTop: 8 }}>
                          <button className="ghost" onClick={() => setOpenId(openId === r.id ? null : r.id)}>{openId === r.id ? "Hide flags" : "View flags"}</button>
                        </div>
                        {openId === r.id && (
                          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, marginTop: 8 }}>
                            <div className="small">
                              <div><b>Detections</b> ({det.length})</div>
                              <div><b>Warnings</b> ({warn.length})</div>
                              <div><b>Suspicious</b></div>
                              <div><b>System</b></div>
                            </div>
                            <div>
                              {det.length === 0 && warn.length === 0 && <div className="small">No findings — clean scan.</div>}
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

      <p className="small" style={{ marginTop: 18, textAlign: "center", opacity: .6 }}>KnightAC © {SITE.replace("https://", "")} • read-only checks • staff makes the final ban decision in-game</p>
    </div>
  );
}
