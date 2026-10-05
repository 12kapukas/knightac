// Storage: Vercel KV (Upstash) if env set, otherwise memory.
// For PROD set KV_REST_API_URL + KV_REST_API_TOKEN or accounts/sessions wipe on redeploy.

export type User = {
  username: string;
  passhash: string;
  code: string; // personal permanent code
  createdAt: number;
};

export type Session = {
  pin: string; // e.g. 6-char session code for a player
  owner: string; // staff username who created it
  playerName: string; // minecraft nick of suspect
  createdAt: number;
  expiresAt: number;
  used: boolean;
};

export type ScanResult = {
  id: string;
  username: string; // owner (staff) who sees it
  sessionPin?: string;
  playerName?: string;
  date: number;
  summary: string;
  detections: number;
  warnings: number;
  data: any;
};

function hasKV(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kv(cmd: any[]): Promise<any> {
  const res = await fetch(process.env.KV_REST_API_URL as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(cmd)
  });
  const j = await res.json();
  return j.result;
}

// ---- memory fallback (dev / test) ----
const mem = (globalThis as any).__knight_mem || ((globalThis as any).__knight_mem = {
  users: new Map<string, User>(),
  codes: new Map<string, string>(),
  sessions: new Map<string, Session>(),
  results: [] as ScanResult[]
});

export async function getUser(username: string): Promise<User | null> {
  username = username.toLowerCase();
  if (hasKV()) {
    const j = await kv(["HGET", "knight:users", username]);
    return j ? JSON.parse(j) : null;
  }
  return mem.users.get(username) || null;
}

export async function saveUser(u: User): Promise<void> {
  const key = u.username.toLowerCase();
  if (hasKV()) {
    await kv(["HSET", "knight:users", key, JSON.stringify(u)]);
    await kv(["HSET", "knight:codes", u.code, key]);
    return;
  }
  mem.users.set(key, u);
  mem.codes.set(u.code, key);
}

export async function getUserByCode(code: string): Promise<User | null> {
  code = (code || "").trim().toUpperCase();
  if (hasKV()) {
    const uname = await kv(["HGET", "knight:codes", code]);
    if (!uname) return null;
    const j = await kv(["HGET", "knight:users", uname]);
    return j ? JSON.parse(j) : null;
  }
  const uname = mem.codes.get(code);
  if (!uname) return null;
  return mem.users.get(uname) || null;
}

// ---- sessions (staff PINs like anticheat.ac) ----
export function makePin(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function createSession(owner: string, playerName: string): Promise<Session> {
  const pin = makePin();
  const now = Date.now();
  const s: Session = {
    pin,
    owner: owner.toLowerCase(),
    playerName: (playerName || "unknown").slice(0, 32),
    createdAt: now,
    expiresAt: now + 30 * 60 * 1000, // 30 min
    used: false
  };
  if (hasKV()) {
    await kv(["HSET", "knight:sessions", pin, JSON.stringify(s)]);
    await kv(["EXPIRE", "knight:sessions", "3600"]);
  } else {
    mem.sessions.set(pin, s);
  }
  return s;
}

export async function getSession(pin: string): Promise<Session | null> {
  pin = (pin || "").trim().toUpperCase();
  if (hasKV()) {
    const j = await kv(["HGET", "knight:sessions", pin]);
    return j ? JSON.parse(j) : null;
  }
  return mem.sessions.get(pin) || null;
}

export async function markSessionUsed(pin: string): Promise<void> {
  pin = pin.trim().toUpperCase();
  if (hasKV()) {
    const j = await kv(["HGET", "knight:sessions", pin]);
    if (j) {
      const s = JSON.parse(j);
      s.used = true;
      await kv(["HSET", "knight:sessions", pin, JSON.stringify(s)]);
    }
    return;
  }
  const s = mem.sessions.get(pin);
  if (s) { s.used = true; mem.sessions.set(pin, s); }
}

export async function getSessionsFor(owner: string): Promise<Session[]> {
  owner = owner.toLowerCase();
  if (hasKV()) {
    const all = await kv(["HGETALL", "knight:sessions"]);
    // upstash HGETALL returns array [k,v,k,v...] or object
    const list: Session[] = [];
    if (Array.isArray(all)) {
      for (let i = 1; i < all.length; i += 2) {
        try { const s = JSON.parse(all[i]); if (s.owner === owner) list.push(s); } catch {}
      }
    } else if (all && typeof all === "object") {
      for (const v of Object.values(all as any)) {
        try { const s = JSON.parse(v as string); if (s.owner === owner) list.push(s); } catch {}
      }
    }
    return list.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
  }
  return [...mem.sessions.values()].filter((s: Session) => s.owner === owner).sort((a: Session, b: Session) => b.createdAt - a.createdAt).slice(0, 50);
}

export async function pushResult(r: ScanResult): Promise<void> {
  if (hasKV()) {
    await kv(["LPUSH", "knight:results", JSON.stringify(r)]);
    await kv(["LTRIM", "knight:results", "0", "499"]);
    return;
  }
  mem.results.unshift(r);
  if (mem.results.length > 500) mem.results.length = 500;
}

export async function getResultsFor(username: string): Promise<ScanResult[]> {
  username = username.toLowerCase();
  if (hasKV()) {
    const arr: string[] = (await kv(["LRANGE", "knight:results", "0", "199"])) || [];
    return arr.map((s) => JSON.parse(s)).filter((x) => x.username === username);
  }
  return mem.results.filter((x: ScanResult) => x.username === username);
}
