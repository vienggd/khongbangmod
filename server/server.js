/* Klong Bang Mot village host.
 * - serves the game files (static, gzip, cached in memory)
 * - WebSocket /ws: player positions, chat, WebRTC voice signalling, relayed voice fallback, all-time leaderboard
 * Designed to be light: one process, no database, deltas only, everything capped. */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const PORT = +process.env.PORT || 8095;
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(__dirname, "data");
const BOARD_FILE = path.join(DATA, "board.json");
const MAX_PLAYERS = 40;
const TICK_MS = 100; // 10 position updates a second is plenty with client-side interpolation

// ---------- static files ----------
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".mp3": "audio/mpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };
const BLOCK = /^(server|\.git|\.claude|node_modules)(\/|$)|(^|\/)\./;
const cache = new Map(); // path -> { mtime, raw, gz, type }
function load(file) {
  const st = fs.statSync(file);
  const hit = cache.get(file);
  if (hit && hit.mtime === st.mtimeMs) return hit;
  const ext = path.extname(file).toLowerCase(), raw = fs.readFileSync(file), type = TYPES[ext];
  const text = /^text|javascript|svg|manifest/.test(type);
  const ent = { mtime: st.mtimeMs, raw, gz: text ? zlib.gzipSync(raw, { level: 9 }) : null, type, etag: '"' + st.size.toString(36) + "-" + Math.floor(st.mtimeMs).toString(36) + '"', text };
  cache.set(file, ent);
  return ent;
}
function serve(req, res) {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, ""); } catch { res.writeHead(400).end(); return; }
  if (rel === "" || rel.endsWith("/")) rel += "index.html";
  if (rel === "health") { res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ ok: 1, players: players.size })); return; }
  const file = path.resolve(ROOT, rel), relN = path.relative(ROOT, file).split(path.sep).join("/");
  if (!file.startsWith(ROOT + path.sep) || BLOCK.test(relN) || !TYPES[path.extname(file).toLowerCase()]) { res.writeHead(404).end("not found"); return; }
  let ent;
  try { ent = load(file); } catch { res.writeHead(404).end("not found"); return; }
  if (req.headers["if-none-match"] === ent.etag) { res.writeHead(304).end(); return; }
  const gz = ent.gz && /\bgzip\b/.test(req.headers["accept-encoding"] || "");
  res.writeHead(200, {
    "content-type": ent.type,
    "cache-control": ent.text ? "no-cache" : "public, max-age=86400",
    etag: ent.etag,
    ...(gz ? { "content-encoding": "gzip", vary: "accept-encoding" } : {}),
    "content-length": (gz ? ent.gz : ent.raw).length,
  });
  res.end(req.method === "HEAD" ? undefined : gz ? ent.gz : ent.raw);
}

// ---------- leaderboard (all-time best total per player) ----------
fs.mkdirSync(DATA, { recursive: true });
let board = {};
try { board = JSON.parse(fs.readFileSync(BOARD_FILE, "utf8")); } catch {}
let boardDirty = false;
setInterval(() => { if (!boardDirty) return; boardDirty = false; fs.writeFile(BOARD_FILE + ".tmp", JSON.stringify(board), (e) => { if (!e) fs.rename(BOARD_FILE + ".tmp", BOARD_FILE, () => {}); }); }, 5000).unref();
const top3 = () => Object.values(board).sort((a, b) => b.s - a.s || a.t - b.t).slice(0, 3).map(({ n, s, c }) => ({ n, s, c }));
let lastTop = "";
function record(p) {
  const prev = board[p.key];
  if (prev && prev.s >= p.score && prev.n === p.name) return;
  board[p.key] = { n: p.name, s: Math.max(p.score, prev ? prev.s : 0), c: p.char, t: prev ? prev.t : Date.now() };
  boardDirty = true;
  const b = top3(), s = JSON.stringify(b);
  if (s !== lastTop) { lastTop = s; broadcast({ t: "board", b }); }
}

// ---------- input cleaning ----------
const num = (v, lo, hi) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, Math.round(+v))) : lo);
const text = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g, "").trim().slice(0, max);
const COLOR = /^#[0-9a-f]{6}$/i;
function cleanChar(c) {
  if (!c || typeof c !== "object") return null;
  const out = {};
  for (const k of ["k", "n", "skin", "belly", "inner", "shoe", "face", "hair"]) {
    const v = c[k];
    if (k === "k") out.k = text(v, 12).replace(/[^a-z0-9_]/gi, "") || "bear";
    else if (k === "n") out.n = text(v, 20);
    else if (typeof v === "string" && COLOR.test(v)) out[k] = v;
  }
  return out;
}

// ---------- players ----------
const players = new Map(); // sid -> player
let nextSid = 1;
const freeSid = () => { for (let i = 0; i < 65535; i++) { const s = nextSid; nextSid = (nextSid % 65534) + 1; if (!players.has(s)) return s; } return 0; };
const pub = (p) => ({ i: p.sid, n: p.name, c: p.char, x: p.x, y: p.y, d: p.d, b: p.b, w: p.w, m: p.mic });
function send(p, obj) { if (p.ws.readyState === 1 && p.ws.bufferedAmount < 256 * 1024) p.ws.send(typeof obj === "string" ? obj : JSON.stringify(obj)); }
function broadcast(obj, except) { const s = JSON.stringify(obj); for (const p of players.values()) if (p !== except && p.joined) send(p, s); }

const server = http.createServer(serve);
const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 8 * 1024, perMessageDeflate: false });

wss.on("connection", (ws, req) => {
  if (players.size >= MAX_PLAYERS) { ws.send(JSON.stringify({ t: "full" })); ws.close(1013, "full"); return; }
  const sid = freeSid();
  const p = { sid, ws, joined: false, key: "", name: "", char: null, score: 0, x: 210, y: 640, d: 1, b: 0, w: 0, mic: 0, dirty: false, alive: true, tokens: 60, chatAt: 0, audioTokens: 60 };
  players.set(sid, p);
  ws.on("pong", () => (p.alive = true));
  ws.on("message", (data, isBinary) => {
    if (isBinary) return relayAudio(p, data);
    if (--p.tokens < 0) return; // flood guard (refilled every tick)
    let m;
    try { m = JSON.parse(data); } catch { return; }
    if (!m || typeof m.t !== "string") return;
    if (m.t === "hi" && !p.joined) {
      p.key = crypto.createHash("sha256").update(text(m.id, 64) || String(sid)).digest("base64url").slice(0, 22);
      p.name = text(m.n, 12) || "ผู้เล่น " + sid;
      p.char = cleanChar(m.c);
      p.score = num(m.s, 0, 999);
      p.x = num(m.x, -600, 1000); p.y = num(m.y, -320, 920);
      p.joined = true;
      send(p, { t: "welcome", you: sid, players: [...players.values()].filter((q) => q.joined && q !== p).map(pub), board: top3() });
      broadcast({ t: "join", p: pub(p) }, p);
      record(p);
      return;
    }
    if (!p.joined) return;
    switch (m.t) {
      case "p": {
        const x = num(m.x, -600, 1000), y = num(m.y, -320, 920), d = m.d < 0 ? -1 : 1, b = m.b ? 1 : 0, w = m.w ? 1 : 0;
        if (x !== p.x || y !== p.y || d !== p.d || b !== p.b || w !== p.w) { p.x = x; p.y = y; p.d = d; p.b = b; p.w = w; p.dirty = true; }
        break;
      }
      case "c": {
        const now = Date.now(), msg = text(m.m, 100);
        if (!msg || now - p.chatAt < 600) return;
        p.chatAt = now;
        broadcast({ t: "c", i: sid, m: msg });
        break;
      }
      case "mic": p.mic = m.on ? 1 : 0; broadcast({ t: "mic", i: sid, on: p.mic }, p); break;
      case "sig": { // WebRTC offer/answer/candidate, forwarded verbatim to one peer
        const q = players.get(num(m.to, 0, 65535));
        if (q && q.joined && JSON.stringify(m.d || "").length < 6000) send(q, { t: "sig", from: sid, d: m.d });
        break;
      }
      case "score": p.score = num(m.s, 0, 999); record(p); break;
      case "ping": send(p, { t: "pong", k: m.k }); break;
    }
  });
  ws.on("close", () => { players.delete(sid); if (p.joined) broadcast({ t: "leave", i: sid }); });
  ws.on("error", () => {});
});

// relayed voice for pairs whose direct (WebRTC) link failed.
// frame from client: [u8 n][u16 to]*n [audio...]; to each target: [u16 from][audio...]
function relayAudio(p, data) {
  if (!p.joined || --p.audioTokens < 0 || data.length < 3) return;
  const n = data[0], head = 1 + n * 2;
  if (n < 1 || n > 8 || data.length <= head) return;
  const out = Buffer.allocUnsafe(2 + data.length - head);
  out.writeUInt16LE(p.sid, 0);
  data.copy(out, 2, head);
  for (let k = 0; k < n; k++) {
    const q = players.get(data.readUInt16LE(1 + k * 2));
    if (q && q.joined && q.ws.readyState === 1 && q.ws.bufferedAmount < 64 * 1024) q.ws.send(out, { binary: true });
  }
}

// position deltas, 10x a second, one message for everyone
setInterval(() => {
  const ch = [];
  for (const p of players.values()) {
    p.tokens = Math.min(60, p.tokens + 8);
    p.audioTokens = Math.min(60, p.audioTokens + 6); // 50 voice frames/s needed, a little headroom
    if (p.dirty && p.joined) { ch.push([p.sid, p.x, p.y, p.d, p.b, p.w]); p.dirty = false; }
  }
  if (ch.length) broadcast({ t: "s", p: ch });
}, TICK_MS);

// drop dead connections (phones that went to sleep etc.)
setInterval(() => {
  for (const p of players.values()) {
    if (!p.alive) { p.ws.terminate(); continue; }
    p.alive = false;
    try { p.ws.ping(); } catch {}
  }
}, 15000);

server.listen(PORT, HOST, () => console.log(`village host on http://${HOST}:${PORT}  (game root: ${ROOT})`));
const bye = () => { if (boardDirty) try { fs.writeFileSync(BOARD_FILE, JSON.stringify(board)); } catch {} process.exit(0); };
process.on("SIGINT", bye);
process.on("SIGTERM", bye);
