/* net.js — village multiplayer client.
 * Talks to server/server.js over one WebSocket: positions (smoothly interpolated), chat, all-time board,
 * and carries the signalling for proximity voice (voice.js). Only used while you are in the village. */
function makeNet(opt) {
  // opt: getMe() -> {x,y,d,b,w}; onStatus(state, onlineCount); onChat(name, text, mine); onBoard(top3)
  const DELAY = 140; // ms of interpolation delay: hides network jitter, still feels live
  const BUBBLE = 6000;
  let ws = null, me = 0, want = false, retry = 0, retryT = 0, hello = null, board = null, lastPos = "", mySay = null, full = false;
  const others = new Map(); // sid -> {i,n,c,m,buf:[[time,x,y,d,b,w]...], say, sayT}
  const url = () => (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws";
  const raw = (s) => { if (ws && ws.readyState === 1 && ws.bufferedAmount < 128 * 1024) ws.send(s); };
  const send = (o) => raw(JSON.stringify(o));
  const status = () => opt.onStatus(!want ? "off" : full ? "full" : me ? "online" : "connecting", me ? others.size + 1 : 0);

  const voice = makeVoice({
    send,
    sendBin: (b) => raw(b),
    myId: () => me,
    me: () => opt.getMe(),
    players: () => others,
  });

  function open() {
    if (!want || ws) return;
    let s;
    try { s = new WebSocket(url()); } catch { return schedule(); }
    ws = s;
    s.binaryType = "arraybuffer";
    status();
    s.onopen = () => { retry = 0; full = false; const p = opt.getMe(); s.send(JSON.stringify(Object.assign({ t: "hi" }, hello, { x: p.x, y: p.y }))); };
    s.onmessage = (e) => {
      if (typeof e.data !== "string") return voice.onBinary(e.data);
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      onMsg(m);
    };
    s.onclose = () => {
      if (ws !== s) return;
      ws = null; me = 0; others.clear(); voice.reset(); lastPos = "";
      status();
      schedule();
    };
    s.onerror = () => {};
  }
  function schedule() { if (!want) return; clearTimeout(retryT); retryT = setTimeout(open, Math.min(10000, 800 * 2 ** retry++)); }

  function addPlayer(p, now) {
    others.set(p.i, { i: p.i, n: p.n || "?", c: p.c, m: p.m, buf: [[now, p.x, p.y, p.d, p.b, p.w]], say: null, sayT: 0 });
  }
  function onMsg(m) {
    const now = performance.now();
    switch (m.t) {
      case "welcome":
        me = m.you; others.clear();
        (m.players || []).forEach((p) => addPlayer(p, now));
        board = m.board; opt.onBoard(board);
        status();
        break;
      case "join": addPlayer(m.p, now); status(); break;
      case "leave": others.delete(m.i); voice.remove(m.i); status(); break;
      case "s":
        for (const [i, x, y, d, b, w] of m.p) {
          const o = others.get(i);
          if (!o) continue;
          o.buf.push([now, x, y, d, b, w]);
          if (o.buf.length > 12) o.buf.splice(0, o.buf.length - 12);
        }
        break;
      case "c": {
        const mine = m.i === me, o = others.get(m.i);
        if (mine) mySay = { text: m.m, t: now };
        else if (o) { o.say = m.m; o.sayT = now; }
        opt.onChat(mine ? hello.n || "ฉัน" : o ? o.n : "?", m.m, mine);
        break;
      }
      case "mic": { const o = others.get(m.i); if (o) o.m = m.on; break; }
      case "board": board = m.b; opt.onBoard(board); break;
      case "sig": voice.onSig(m.from, m.d); break;
      case "full": full = true; want = true; status(); break;
    }
  }

  // send my position 10x/s, only when it changed
  setInterval(() => {
    if (!me) return;
    const p = opt.getMe(), s = [Math.round(p.x), Math.round(p.y), p.d < 0 ? -1 : 1, p.b ? 1 : 0, p.w ? 1 : 0].join();
    if (s === lastPos) return;
    lastPos = s;
    const [x, y, d, b, w] = s.split(",").map(Number);
    send({ t: "p", x, y, d, b, w });
  }, 100);
  setInterval(() => { if (me) voice.tick(); }, 400);

  // interpolated view of everyone else, for drawing
  function view(t) {
    const now = performance.now(), rt = now - DELAY, out = [];
    for (const o of others.values()) {
      const B = o.buf;
      let k = B.length - 1;
      while (k > 0 && B[k - 1][0] > rt) k--;
      let x, y, d, b, w;
      const A = B[k - 1], C = B[k];
      if (A && C[0] > A[0] && rt >= A[0]) {
        const f = Math.min(1, (rt - A[0]) / (C[0] - A[0])), jump = Math.hypot(C[1] - A[1], C[2] - A[2]) > 160;
        x = jump ? C[1] : A[1] + (C[1] - A[1]) * f;
        y = jump ? C[2] : A[2] + (C[2] - A[2]) * f;
        [d, b, w] = f < 0.5 ? [A[3], A[4], A[5]] : [C[3], C[4], C[5]];
      } else [, x, y, d, b, w] = C;
      // stop the walk cycle if no update arrived for a while
      if (now - B[B.length - 1][0] > 600 && w) w = 0;
      o.x = x; o.y = y;
      if (o.say && now - o.sayT > BUBBLE) o.say = null;
      out.push({ i: o.i, x, y, d, b, w, ph: t * 12 + o.i, c: o.c, n: o.n, say: o.say, talk: voice.talking(o.i) });
    }
    return out;
  }

  return {
    connect(h) { hello = h; want = true; open(); },
    disconnect() {
      want = false; full = false; clearTimeout(retryT);
      if (ws) { const s = ws; ws = null; s.close(); }
      me = 0; others.clear(); voice.reset(); voice.setMic(false).catch(() => {});
      status();
    },
    view,
    mine() {
      if (mySay && performance.now() - mySay.t > BUBBLE) mySay = null;
      return { say: mySay && mySay.text, talk: voice.myTalking() };
    },
    chat(text) { text = String(text || "").trim().slice(0, 100); if (text && me) send({ t: "c", m: text }); },
    score(s) { if (hello) hello.s = s; if (me) send({ t: "score", s }); },
    board: () => board,
    online: () => !!me,
    count: () => (me ? others.size + 1 : 0),
    mic: (on) => voice.setMic(on),
    micOn: () => voice.micOn(),
    unlock: () => voice.unlock(),
  };
}
