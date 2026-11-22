/* voice.js — proximity voice for the village.
 * Each phone links directly (WebRTC, peer to peer) to at most 6 nearby players, so the host PC carries no audio.
 * Volume fades with distance. If a direct link can't be made (strict mobile NAT), that pair falls back to a
 * small 16 kHz ADPCM stream relayed through the host, sent only while someone is actually speaking. */
function makeVoice(o) {
  // o: send(obj), sendBin(Uint8Array), myId(), me() -> {x,y}, players() -> Map(sid -> {x,y,m})
  const ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
  const R_ON = 340, R_OFF = 430, NEAR = 70, MAX = 6, CONNECT_MS = 9000;
  const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let ctx = null, stream = null, track = null, on = false, myAn = null, myLevel = 0;
  const peers = new Map(); // sid -> { pc, tr, el, an, level, relay, t0, cands, vol }
  const buf = new Uint8Array(256);

  const audio = () => {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) try { ctx = new AC(); } catch {} }
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  };
  const rms = (an) => {
    if (!an) return 0;
    an.getByteTimeDomainData(buf);
    let s = 0;
    for (let i = 0; i < an.fftSize && i < buf.length; i++) { const v = (buf[i] - 128) / 128; s += v * v; }
    return Math.sqrt(s / Math.min(an.fftSize, buf.length));
  };
  const volFor = (d) => (d <= NEAR ? 1 : Math.max(0, 1 - (d - NEAR) / (R_OFF - NEAR)) ** 1.5);

  // ---------- mic ----------
  async function setMic(want) {
    if (want && !track) {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
      track = stream.getAudioTracks()[0];
      const c = audio();
      if (c) { myAn = c.createAnalyser(); myAn.fftSize = 256; c.createMediaStreamSource(stream).connect(myAn); }
    }
    if (!want && track) { // really release the microphone (the browser's mic indicator goes away)
      stream.getTracks().forEach((t) => t.stop());
      stream = track = myAn = null;
      stopCapture();
    }
    on = !!want;
    for (const p of peers.values()) if (p.tr) p.tr.sender.replaceTrack(on ? track : null).catch(() => {});
    o.send({ t: "mic", on: on ? 1 : 0 });
    syncCapture();
    return on;
  }

  // ---------- direct (WebRTC) links ----------
  function mk(i) {
    const pc = new RTCPeerConnection({ iceServers: ICE });
    const p = { pc, tr: null, el: null, an: null, level: 0, relay: false, t0: performance.now(), cands: [], vol: 1 };
    pc.onicecandidate = (e) => { if (e.candidate) o.send({ t: "sig", to: i, d: { c: e.candidate } }); };
    pc.ontrack = (e) => attach(p, e.streams[0] || new MediaStream([e.track]));
    pc.onconnectionstatechange = () => { if (pc.connectionState === "failed") toRelay(i, true); };
    peers.set(i, p);
    return p;
  }
  function attach(p, ms) {
    if (!p.el) { p.el = new Audio(); p.el.autoplay = true; p.el.playsInline = true; }
    p.el.srcObject = ms;
    p.el.volume = IOS ? 1 : p.vol; // iOS ignores element volume; the distance cut-off still applies there
    p.el.play().catch(() => {});
    const c = audio();
    if (c) try { p.an = c.createAnalyser(); p.an.fftSize = 256; c.createMediaStreamSource(ms).connect(p.an); } catch {}
  }
  async function call(i) {
    const p = mk(i);
    try {
      p.tr = p.pc.addTransceiver("audio", { direction: "sendrecv" });
      if (on && track) await p.tr.sender.replaceTrack(track);
      await p.pc.setLocalDescription(await p.pc.createOffer());
      o.send({ t: "sig", to: i, d: { sdp: p.pc.localDescription } });
    } catch { close(i, true); }
  }
  async function onSig(from, d) {
    if (!d) return;
    let p = peers.get(from);
    try {
      if (d.bye) return close(from, false);
      if (d.relay) { if (!p) p = mk(from); return toRelay(from, false); }
      if (d.sdp && d.sdp.type === "offer") {
        if (p) close(from, false);
        if (peers.size >= MAX + 2 || !near(from, R_OFF)) return o.send({ t: "sig", to: from, d: { bye: 1 } });
        p = mk(from);
        await p.pc.setRemoteDescription(d.sdp);
        p.tr = p.pc.getTransceivers()[0];
        if (p.tr) { p.tr.direction = "sendrecv"; if (on && track) await p.tr.sender.replaceTrack(track); }
        await p.pc.setLocalDescription(await p.pc.createAnswer());
        o.send({ t: "sig", to: from, d: { sdp: p.pc.localDescription } });
        for (const c of p.cands.splice(0)) await p.pc.addIceCandidate(c).catch(() => {});
      } else if (d.sdp && p && p.pc) {
        await p.pc.setRemoteDescription(d.sdp);
        for (const c of p.cands.splice(0)) await p.pc.addIceCandidate(c).catch(() => {});
      } else if (d.c && p && p.pc) {
        if (p.pc.remoteDescription) await p.pc.addIceCandidate(d.c).catch(() => {});
        else p.cands.push(d.c);
      }
    } catch { close(from, true); }
  }
  function close(i, tell) {
    const p = peers.get(i);
    if (!p) return;
    peers.delete(i);
    if (p.pc) try { p.pc.close(); } catch {}
    if (p.el) { p.el.srcObject = null; p.el = null; }
    if (tell) o.send({ t: "sig", to: i, d: { bye: 1 } });
    if (play) play.port.postMessage({ i, drop: 1 });
    syncCapture();
  }
  // direct link failed: keep the pair, but send audio through the host instead
  function toRelay(i, tell) {
    const p = peers.get(i);
    if (!p || p.relay) return;
    if (p.pc) try { p.pc.close(); } catch {}
    p.pc = p.tr = null; p.relay = true;
    if (p.el) { p.el.srcObject = null; p.el = null; }
    if (tell) o.send({ t: "sig", to: i, d: { relay: 1 } });
    startPlayback();
    syncCapture();
  }
  const dist = (i) => { const me = o.me(), q = o.players().get(i); return me && q && q.x != null ? Math.hypot(q.x - me.x, q.y - me.y) : 1e9; };
  const near = (i, r) => dist(i) < r;

  // every 400 ms: who should I be linked with, and how loud are they
  function tick() {
    const me = o.me(), id = o.myId();
    if (!me || !id) return;
    const want = new Set(), list = [];
    for (const [i, q] of o.players()) if (q.x != null) list.push([i, q, Math.hypot(q.x - me.x, q.y - me.y)]);
    list.sort((a, b) => a[2] - b[2]);
    for (const [i, q, d] of list) {
      if (want.size >= MAX) break;
      if ((on || q.m) && d < (peers.has(i) ? R_OFF : R_ON)) want.add(i);
    }
    for (const i of [...peers.keys()]) if (!want.has(i)) close(i, true);
    for (const i of want) if (!peers.has(i) && id < i) call(i); // the lower id starts the call
    const now = performance.now();
    for (const [i, p] of peers) {
      p.vol = volFor(dist(i));
      if (p.el && !IOS) p.el.volume = p.vol;
      if (p.relay && play) play.port.postMessage({ i, g: p.vol });
      if (p.pc && p.pc.connectionState !== "connected" && now - p.t0 > CONNECT_MS) toRelay(i, true);
    }
  }
  setInterval(() => {
    myLevel = on ? rms(myAn) : 0;
    for (const p of peers.values()) if (p.an) p.level = rms(p.an) * (p.vol > 0.05 ? 1 : 0);
    for (const p of peers.values()) if (p.relay && p.relayT && performance.now() - p.relayT > 300) p.level = 0;
  }, 150);

  // ---------- relay fallback: tiny ADPCM codec + AudioWorklets ----------
  const STEP = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767];
  const IDX = [-1, -1, -1, -1, 2, 4, 6, 8];
  function encode(f) { // 320 float samples -> 164 bytes
    const out = new Uint8Array(4 + f.length / 2);
    let pred = Math.max(-32768, Math.min(32767, Math.round(f[0] * 32767))), idx = 0;
    out[0] = pred & 255; out[1] = (pred >> 8) & 255; out[2] = idx;
    for (let n = 0; n < f.length; n++) {
      const s = Math.max(-32768, Math.min(32767, Math.round(f[n] * 32767)));
      let step = STEP[idx], diff = s - pred, code = 0;
      if (diff < 0) { code = 8; diff = -diff; }
      let dq = step >> 3;
      if (diff >= step) { code |= 4; diff -= step; dq += step; }
      if (diff >= step >> 1) { code |= 2; diff -= step >> 1; dq += step >> 1; }
      if (diff >= step >> 2) { code |= 1; dq += step >> 2; }
      pred = Math.max(-32768, Math.min(32767, pred + (code & 8 ? -dq : dq)));
      idx = Math.max(0, Math.min(88, idx + IDX[code & 7]));
      if (n & 1) out[4 + (n >> 1)] |= code << 4; else out[4 + (n >> 1)] = code;
    }
    return out;
  }
  function decode(b, off) {
    const n = (b.length - off - 4) * 2, f = new Float32Array(n);
    let pred = (b[off] | (b[off + 1] << 8)) << 16 >> 16, idx = Math.min(88, b[off + 2]);
    for (let k = 0; k < n; k++) {
      const code = (b[off + 4 + (k >> 1)] >> ((k & 1) * 4)) & 15, step = STEP[idx];
      let dq = step >> 3;
      if (code & 4) dq += step; if (code & 2) dq += step >> 1; if (code & 1) dq += step >> 2;
      pred = Math.max(-32768, Math.min(32767, pred + (code & 8 ? -dq : dq)));
      idx = Math.max(0, Math.min(88, idx + IDX[code & 7]));
      f[k] = pred / 32768;
    }
    return f;
  }
  const WORKLET = `
class Cap extends AudioWorkletProcessor {
  constructor(){ super(); this.r = sampleRate / 16000; this.acc = 0; this.sum = 0; this.cnt = 0; this.buf = new Float32Array(320); this.n = 0; }
  process(ins){ const x = ins[0] && ins[0][0]; if (!x) return true;
    for (let i = 0; i < x.length; i++) { this.sum += x[i]; this.cnt++; this.acc += 1;
      if (this.acc >= this.r) { this.acc -= this.r; this.buf[this.n++] = this.sum / this.cnt; this.sum = 0; this.cnt = 0;
        if (this.n === 320) { this.port.postMessage(this.buf.slice(0)); this.n = 0; } } }
    return true; } }
class Play extends AudioWorkletProcessor {
  constructor(){ super(); this.q = new Map(); this.r = 16000 / sampleRate;
    this.port.onmessage = (e) => { const m = e.data; let s = this.q.get(m.i);
      if (m.drop) { this.q.delete(m.i); return; }
      if (!s) { s = { b: [], pos: 0, g: 1, on: false, len: 0 }; this.q.set(m.i, s); }
      if (m.g != null) s.g = m.g;
      if (m.pcm) { s.b.push(m.pcm); s.len += m.pcm.length; while (s.len > 9600) { s.len -= s.b[0].length; s.b.shift(); s.pos = 0; } } }; }
  process(_, outs){ const o = outs[0][0]; o.fill(0);
    for (const s of this.q.values()) {
      if (!s.on) { if (s.len < 1600) continue; s.on = true; }
      for (let k = 0; k < o.length; k++) { const c = s.b[0]; if (!c) { s.on = false; break; }
        const p = s.pos | 0, f = s.pos - p, a = c[p], b = p + 1 < c.length ? c[p + 1] : s.b[1] ? s.b[1][0] : a;
        o[k] += (a + (b - a) * f) * s.g; s.pos += this.r;
        if (s.pos >= c.length) { s.pos -= c.length; s.len -= c.length; s.b.shift(); } } }
    return true; } }
registerProcessor("kbm-cap", Cap); registerProcessor("kbm-play", Play);`;
  let modP = null, play = null, cap = null, capSrc = null, hang = 0;
  const mod = () => {
    const c = audio();
    if (!c || !c.audioWorklet) return Promise.reject(new Error("no worklet"));
    return (modP = modP || c.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET], { type: "text/javascript" }))));
  };
  function startPlayback() {
    if (play) return;
    mod().then(() => { if (play) return; play = new AudioWorkletNode(ctx, "kbm-play", { numberOfInputs: 0, outputChannelCount: [1] }); play.connect(ctx.destination); }).catch(() => {});
  }
  const relayTargets = () => [...peers].filter(([, p]) => p.relay).map(([i]) => i).slice(0, 8);
  function syncCapture() {
    const need = on && track && relayTargets().length > 0;
    if (need && !cap) {
      mod().then(() => {
        if (cap || !on || !stream) return;
        cap = new AudioWorkletNode(ctx, "kbm-cap", { numberOfOutputs: 0 });
        capSrc = ctx.createMediaStreamSource(stream);
        capSrc.connect(cap);
        cap.port.onmessage = (e) => {
          const f = e.data;
          let s = 0;
          for (let i = 0; i < f.length; i++) s += f[i] * f[i];
          hang = Math.sqrt(s / f.length) > 0.01 ? 15 : hang - 1; // only send while speaking (+300 ms tail)
          if (hang <= 0) return;
          const ids = relayTargets();
          if (!ids.length) return;
          const a = encode(f), out = new Uint8Array(1 + ids.length * 2 + a.length);
          out[0] = ids.length;
          ids.forEach((id, k) => { out[1 + k * 2] = id & 255; out[2 + k * 2] = id >> 8; });
          out.set(a, 1 + ids.length * 2);
          o.sendBin(out);
        };
      }).catch(() => {});
    } else if (!need) stopCapture();
  }
  function stopCapture() {
    if (capSrc) try { capSrc.disconnect(); } catch {}
    if (cap) { cap.port.onmessage = null; try { cap.disconnect(); } catch {} }
    cap = capSrc = null;
  }
  function onBinary(ab) {
    const b = new Uint8Array(ab);
    if (b.length < 8) return;
    const i = b[0] | (b[1] << 8), p = peers.get(i);
    if (!p || !p.relay || !play) return;
    const f = decode(b, 2);
    let s = 0;
    for (let k = 0; k < f.length; k += 4) s += f[k] * f[k];
    p.level = Math.sqrt(s / (f.length / 4)) * (p.vol > 0.05 ? 1 : 0);
    p.relayT = performance.now();
    play.port.postMessage({ i, pcm: f, g: p.vol }, [f.buffer]);
  }

  return {
    setMic,
    micOn: () => on,
    onSig,
    onBinary,
    tick,
    remove: (i) => close(i, false),
    reset() { for (const i of [...peers.keys()]) close(i, false); },
    talking: (i) => { const p = peers.get(i); return !!(p && p.level > 0.02); },
    myTalking: () => on && myLevel > 0.02,
    unlock() { audio(); for (const p of peers.values()) if (p.el) p.el.play().catch(() => {}); },
  };
}
