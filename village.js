/* village.js — free-roam "community quarter": the second map, opened after the three stops */
const VSAY = {
  v_uncle: ["ลุงฟ้า", ["อ้าว มาไกลถึงนี่เลยเหรอ เก่งจริง!", "ที่นี่คือย่านตลาดกับวัดริมคลอง ลองเดินดูรอบๆ ได้เลยนะ", "จะกลับไปปั่นต่อก็แตะประตูข้างล่างได้เลย"]],
  v_aunty: ["ป้าแม่ค้า", ["ตลาดริมคลองมีทั้งผัก ผลไม้ ขนมไทย คนในย่านมาซื้อของกันตอนเช้า", "ของที่ปลูกในสวนก็เอามาขายที่นี่ ใกล้ ไม่ต้องไปไกล"]],
  v_vendor: ["ป้าสวนผัก", ["ผักพวกนี้ปลูกเองเลยจ้ะ", "ผักสวนครัวริมคลอง ปลูกกินเองก่อน เหลือค่อยแบ่งเพื่อนบ้านหรือเอาไปขาย"]],
  v_kid: ["น้องตัวเล็ก", ["พี่ๆ! เมื่อกี้เห็นปลากระโดดในคลองด้วยนะ", "เลิกเรียนแล้วหนูชอบมาวิ่งเล่นแถวสะพานกับเพื่อนๆ"]],
  v_temple: ["วัดริมคลอง", ["วัดเป็นศูนย์กลางของชุมชนมานาน ทั้งงานบุญ งานประเพณี และเป็นที่พบปะของคนในย่าน"]],
  v_mosque: ["มัสยิด", ["ย่านริมคลองหลายแห่งมีทั้งวัดและมัสยิดอยู่ใกล้กัน คนต่างศาสนาอยู่ร่วมกันและช่วยกันในงานต่างๆ"]],
  v_market: ["ร้านในตลาด", ["แผงเล็กๆ ริมทางเดิน ขายของสดและของกินเล่นให้คนในชุมชน", "ซื้อขายกันแบบรู้จักหน้ากันหมดเลย"]],
  v_boat: ["ป้าก๋วยเตี๋ยวเรือ", ["ก๋วยเตี๋ยวเรือร้อนๆ จ้า ขายบนเรือริมคลองกันมานานแล้ว", "ถ้าอยากช่วยป้าเสิร์ฟ กลับไปเล่นที่ตลาดเรือได้นะ"]],
  v_house: ["บ้านริมคลอง", ["บ้านใต้ถุนสูง กันน้ำขึ้นได้ และใช้ใต้ถุนเป็นที่นั่งเล่น ทำงานจักสาน หรือเก็บของ"]],
};
function makeVillage(cb) {
  // world is big enough for 20-30 players at once: x -560..980, y -300..900
  const W = 1540, H = 1200, SC = 2, XMIN = -560, YMIN = -300;
  const cy = (x) => 350 + 12 * Math.sin(x / 70);
  const BRIDGES = [-290, 210, 690];
  const PLAZAS = [{ x: 210, y: -60, rx: 240, ry: 100 }, { x: 210, y: 690, rx: 240, ry: 100 }];
  const Y = (y) => y;
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const st = document.createElement("canvas");
  st.width = W * SC; st.height = H * SC;
  const g = st.getContext("2d");
  g.scale(SC, SC); g.translate(-XMIN, -YMIN); g.lineJoin = "round"; g.lineCap = "round";
  const gr = g.createLinearGradient(0, YMIN, 0, YMIN + H);
  gr.addColorStop(0, "#b9ea8e"); gr.addColorStop(1, "#8fd46a");
  g.fillStyle = gr; g.fillRect(XMIN - 5, YMIN - 5, W + 10, H + 10);
  for (let i = 0; i < 180; i++) { g.fillStyle = i % 2 ? "#ffffff18" : "#4fa84a14"; g.beginPath(); g.ellipse(XMIN + rnd() * W, YMIN + rnd() * H, 30 + rnd() * 40, 10 + rnd() * 14, 0, 0, 7); g.fill(); }
  // canal
  const canal = new Path2D();
  for (let x = XMIN - 30; x <= XMIN + W + 30; x += 10) x === XMIN - 30 ? canal.moveTo(x, cy(x)) : canal.lineTo(x, cy(x));
  [[140, "#5fa044"], [130, "#b88f5a"], [120, "#d9b97c"], [112, "#ffffffd0"], [106, "#3fb0e2"], [84, "#55c0ec"], [58, "#72d0f4"], [34, "#98e0f8"], [14, "#bdf0fc"]].forEach(([w, c]) => { g.lineWidth = w; g.strokeStyle = c; g.stroke(canal); });
  [[0.06, 1], [0.2, -1], [0.34, 1], [0.5, -1], [0.62, 1], [0.78, -1], [0.9, 1]].forEach(([f, sd]) => { const x = XMIN + f * W, y = cy(x) + sd * 22; g.beginPath(); g.ellipse(x, y, 12, 5, 0, 0, 7); artOutlineFill(g, "#5cc04e", 2); });
  // paths
  const pathD = (pts) => { const p = new Path2D(); pts.forEach(([x, y0], i) => { const y = Y(y0); i ? p.lineTo(x, y) : p.moveTo(x, y); }); return p; };
  const roadX = (y) => { const a = []; for (let x = XMIN + 20; x <= XMIN + W - 20; x += 90) a.push([x, y + (a.length % 2 ? -3 : 0)]); return a; };
  const paths = [
    [[210, 440], [210, 600]],
    [[210, 780], [210, 860]],
    roadX(262),
    roadX(494),
    ...BRIDGES.filter((b) => b !== 210).flatMap((b) => [[[b, 262], [b, 290]], [[b, 410], [b, 494]]]),
    [[-290, 262], [-290, -200]],
    [[690, 262], [690, -200]],
    [[-290, -200], [690, -200]],
    [[210, -200], [210, -150]],
  ].map(pathD);
  [[30, "#ffffffcc"], [25, ART_OUT], [18, "#d9a35a"]].forEach(([w, c]) => paths.forEach((p) => { g.lineWidth = w; g.strokeStyle = c; g.stroke(p); }));
  g.setLineDash([2, 8]); g.lineWidth = 18; g.strokeStyle = "#a8702f"; paths.forEach((p) => g.stroke(p)); g.setLineDash([]);
  // open plazas: no obstacles, room for a crowd
  PLAZAS.forEach((p) => {
    g.beginPath(); g.ellipse(p.x, p.y, p.rx + 6, p.ry + 6, 0, 0, 7); g.fillStyle = "#ffffffaa"; g.fill();
    g.beginPath(); g.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 7); artOutlineFill(g, "#ecd096", 3.5);
    g.setLineDash([3, 12]); g.lineWidth = 4; g.strokeStyle = "#c9a464";
    [0.72, 0.4].forEach((f) => { g.beginPath(); g.ellipse(p.x, p.y, p.rx * f, p.ry * f, 0, 0, 7); g.stroke(); });
    g.setLineDash([]);
  });
  // bridges (wide so they are easy to cross)
  BRIDGES.forEach((bx) => {
    const by0 = cy(bx);
    g.beginPath(); g.roundRect(bx - 30, by0 - 70, 60, 140, 6); artOutlineFill(g, "#c98f4e", 3.5);
    g.strokeStyle = "#8a5a2c"; g.lineWidth = 2;
    for (let y = by0 - 62; y < by0 + 68; y += 9) { g.beginPath(); g.moveTo(bx - 28, y); g.lineTo(bx + 28, y); g.stroke(); }
    [bx - 34, bx + 34].forEach((x) => { g.strokeStyle = ART_OUT; g.lineWidth = 8; g.beginPath(); g.moveTo(x, by0 - 70); g.lineTo(x, by0 + 70); g.stroke(); g.strokeStyle = "#e8c07a"; g.lineWidth = 4; g.stroke(); [-70, -35, 0, 35, 70].forEach((dy) => { g.beginPath(); g.arc(x, by0 + dy, 5, 0, 7); artOutlineFill(g, "#a8703a", 2.4); }); });
  });
  const nearBridge = (x, m) => BRIDGES.some((b) => Math.abs(x - b) < m);
  const inPlaza = (x, y, m = 0) => PLAZAS.some((p) => ((x - p.x) / (p.rx + m)) ** 2 + ((y - p.y) / (p.ry + m)) ** 2 < 1);
  // reeds along both banks
  for (let x = XMIN + 20; x < XMIN + W - 10; x += 80) [-1, 1].forEach((sd) => { if (nearBridge(x, 50)) return; const rx = x + (sd > 0 ? 14 : 0), ry = cy(rx) + sd * 63; for (let i = 0; i < 3; i++) { const dx = (i - 1) * 6; g.strokeStyle = ART_OUT; g.lineWidth = 5; g.beginPath(); g.moveTo(rx + dx, ry); g.quadraticCurveTo(rx + dx + (i - 1) * 4, ry - 14, rx + dx + (i - 1) * 7, ry - 26); g.stroke(); g.strokeStyle = "#7ccf5a"; g.lineWidth = 2.6; g.stroke(); g.fillStyle = "#8a5a2c"; g.beginPath(); g.ellipse(rx + dx + (i - 1) * 7, ry - 29, 2.6, 6, 0, 0, 7); g.fill(); } });
  // flowers
  for (let i = 0; i < 60; i++) { const x = XMIN + 14 + rnd() * (W - 28), y = YMIN + 20 + rnd() * (H - 40); if (Math.abs(y - cy(x)) < 80 || inPlaza(x, y, 10)) continue; artFlower(g, x, y, 1.1, ["#ff7ab0", "#ffd23f", "#ffffff", "#c49ae8"][(rnd() * 4) | 0], 0); }
  // sprites
  const items = [], obs = [], ents = [];
  const sprite = (fn, hw, up, dn = 24) => { const c = document.createElement("canvas"); c.width = 2 * hw * SC; c.height = (up + dn) * SC; const q = c.getContext("2d"); q.scale(SC, SC); q.lineJoin = "round"; q.lineCap = "round"; fn(q, hw, up); return { c, hw, up, dn }; };
  const add = (x, y0, fn, hw, up, ob, dn) => { const y = y0 < 330 && y0 > 280 ? y0 : Y(y0); items.push({ x, y, sp: sprite(fn, hw, up, dn) }); if (ob) obs.push({ x: ob[0], y: Y(ob[1]), rx: ob[2], ry: ob[3] }); };
  // only buildings block movement, and with small footprints; trees, plots, stalls and people are walk-through
  add(66, 236, (q, a, b) => artTemple(q, a, b, 1.1), 170, 260, [66, 212, 48, 26]);
  add(354, 222, (q, a, b) => artMosque(q, a, b, 0.95), 170, 260, [354, 200, 42, 24]);
  obs.push({ x: 210, y: 232, rx: 88, ry: 14 });
  const house = ([x, y]) => add(x, y, (q, a, b) => artHouse(q, a, b, 0.95), 100, 130, [x, y - 4, 30, 10]);
  [[-95, 236], [470, 236], [545, 246], [-190, 240], [-420, 236], [-510, 248], [600, 240], [790, 236], [900, 246]].forEach(house);
  [[350, 536], [-110, 545], [545, 548], [-230, 548], [-440, 552], [740, 546], [890, 552]].forEach(house);
  const tree = ([x, y, s]) => add(x, y, (q, a, b) => artTree(q, a, b, s, 0, true), 70, 130, null);
  [[-150, 215, 0.85], [430, 208, 0.85], [-120, 70, 0.8], [520, 70, 0.8], [-100, 610, 0.8], [500, 640, 0.8], [570, 520, 0.8]].forEach(tree);
  [[-470, -250, 0.75], [-80, -250, 0.7], [500, -250, 0.75], [860, -250, 0.8], [-480, -100, 0.8], [-420, 80, 0.8], [-170, -90, 0.75], [870, -70, 0.8], [800, 110, 0.75], [560, -90, 0.8], [-350, -40, 0.7], [760, -130, 0.7]].forEach(tree);
  [[-320, 740, 0.8], [-490, 660, 0.8], [-420, 840, 0.75], [-120, 840, 0.7], [600, 790, 0.75], [770, 670, 0.8], [910, 780, 0.8], [520, 860, 0.7]].forEach(tree);
  [[-30, 238], [-330, 620], [840, 700], [-360, 150]].forEach(([x, y]) => add(x, y, (q, a, b) => artVegPlot(q, a, b, 0.85), 80, 70, null));
  [[-40, 150], [450, 140], [-60, 650], [460, 760], [-200, 880], [640, 880]].forEach(([x, y]) => add(x, y, (q, a, b) => artBush(q, a, b, 0.8), 40, 40, null, 8));
  const stall = (q, a, b, col) => {
    q.save(); q.translate(a, b);
    q.beginPath(); q.roundRect(-24, -20, 48, 20, 4); artOutlineFill(q, "#c98f4e", 3);
    for (let i = 0; i < 3; i++) { q.beginPath(); q.arc(-14 + i * 14, -22, 7, Math.PI, 0); artOutlineFill(q, ["#ff7a5a", "#ffd23f", "#7ccf5a"][(i + col) % 3], 2.2); }
    [-22, 22].forEach((px) => { q.beginPath(); q.roundRect(px - 2, -56, 4, 38, 2); artOutlineFill(q, "#a8703a", 2.2); });
    q.beginPath(); q.moveTo(-32, -50); q.lineTo(32, -50); q.lineTo(26, -36); q.lineTo(-26, -36); q.closePath(); artOutlineFill(q, ["#e8553a", "#3fa0d8", "#f0a020", "#9b5de5"][col], 3);
    for (let i = 0; i < 4; i++) { q.beginPath(); q.arc(-24 + i * 16, -36, 8, 0, Math.PI); artOutlineFill(q, i % 2 ? "#fff" : ["#e8553a", "#3fa0d8", "#f0a020", "#9b5de5"][col], 2.2); }
    q.restore();
  };
  [[75, 482], [140, 482], [-50, 482], [430, 482], [495, 482], [-200, 482], [-400, 482], [-470, 482], [580, 482], [800, 482], [870, 482]].forEach(([x, y], i) => { add(x, y, (q, a, b) => stall(q, a, b, i % 4), 50, 80, null); ents.push({ id: "v_market", hx: x, hy: y - 30, r: 30, sx: x + 30, sy: y + 28 }); });
  const gate = { x: 210, y: 860 };
  add(gate.x, gate.y, (q, a, b) => artGate(q, a, b, "ทางกลับ"), 60, 70, null);
  // canal canoes
  add(120, cy(120) + 6, (q, a, b) => artShopBoat(q, a, b, 0, 0.8), 100, 100, null, 30);
  ents.push({ id: "v_boat", hx: 120, hy: cy(120) - 22, r: 40, sx: 120, sy: cy(120) - 80, talk: 1 });
  add(330, cy(330) + 6, (q, a, b) => artCanoe(q, a, b, 0.95, "uncle"), 70, 90, null, 20);
  // villagers
  const people = [["v_aunty", 108, 520, "aunty"], ["v_kid", 262, 470, "kid"]];
  people.forEach(([id, x, y, k]) => { add(x, y, (q, a, b) => artVillager(q, a, b, 1.15, k), 40, 90, null, 10); ents.push({ id, hx: x, hy: Y(y) - 28, r: 28, sx: x, sy: Y(y) + 26, talk: 1 }); });
  ents.push({ id: "v_uncle", hx: 330, hy: cy(330) - 20, r: 36, sx: 330, sy: cy(330) - 80, talk: 1 });
  ents.push({ id: "v_temple", hx: 66, hy: 190, r: 62, sx: 70, sy: 266 });
  ents.push({ id: "v_mosque", hx: 354, hy: 175, r: 56, sx: 354, sy: 266 });
  ents.push({ id: "podium", hx: 210, hy: 190, r: 70, sx: 210, sy: 270 });
    ents.push({ id: "v_house", hx: 350, hy: 495, r: 44, sx: 350, sy: 556 });
  ents.push({ id: "exit", hx: gate.x, hy: Y(gate.y) - 26, r: 44, sx: gate.x, sy: Y(gate.y) - 14 });
  // player
  const canoeSp = sprite((q, a, b) => artCanoe(q, a, b, 1.15, null), 60, 60, 24);
  const START = { x: 210, y: 640 };
  const P = { x: START.x, y: START.y, path: [], walking: 0, ph: 0, pend: null, blocked: 0, dir: 1, boat: 0 };
  const cam = { x: 210, y: 315, z: 1.1 }, VP = { h: 630 };
  const WATER = 56;
  // bridge deck, flaring wider near each bank so the ends never pinch
  const onBridge = (x, y) => { const d = Math.abs(y - cy(x)); return d < 76 && nearBridge(x, 28 + Math.max(0, d - 44) * 2); };
  const inWater = (x, y) => Math.abs(y - cy(x)) < 62 && !onBridge(x, y);
  const inBounds = (x, y) => x > XMIN + 12 && x < XMIN + W - 12 && y > YMIN + 24 && y < YMIN + H - 24;
  const okLand = (x, y, m = 0) => inBounds(x, y) && !inWater(x, y) && !obs.some((o) => ((x - o.x) / (o.rx + m)) ** 2 + ((y - o.y) / (o.ry + m)) ** 2 < 1);
  // routes are planned with a margin around buildings so the walker never grazes an outline and stalls
  const planLand = (x, y) => okLand(x, y, 6);
  const okBoat = (x, y) => inBounds(x, y) && Math.abs(y - cy(x)) < WATER;
  const ok = (x, y) => (P.boat ? okBoat(x, y) : okLand(x, y));
  const nearestLand = (x, y) => { if (okLand(x, y)) return [x, y]; for (let r = 8; r < 140; r += 8) for (let a = 0; a < 16; a++) { const nx = x + Math.cos((a * Math.PI) / 8) * r, ny = y + Math.sin((a * Math.PI) / 8) * r; if (okLand(nx, ny)) return [nx, ny]; } return [P.x, P.y]; };
  const side = (x, y) => (y < cy(x) ? -1 : 1);
  const CS = 8, GW = Math.ceil(W / CS), GH = Math.ceil(H / CS);
  function findPath(x0, y0, x1, y1, okf) {
    const cell = (x, y) => [Math.max(0, Math.min(GW - 1, Math.floor((x - XMIN) / CS))), Math.max(0, Math.min(GH - 1, Math.floor((y - YMIN) / CS)))];
    const cx = (i) => XMIN + i * CS + CS / 2, cyy = (j) => YMIN + j * CS + CS / 2;
    const [sx, sy] = cell(x0, y0), [tx, ty] = cell(x1, y1);
    const idx = (i, j) => j * GW + i, gS = new Float32Array(GW * GH).fill(1e9), from = new Int32Array(GW * GH).fill(-1), done = new Uint8Array(GW * GH);
    const heap = [];
    const push = (f, id) => { heap.push([f, id]); let k = heap.length - 1; while (k > 0) { const p2 = (k - 1) >> 1; if (heap[p2][0] <= heap[k][0]) break; [heap[p2], heap[k]] = [heap[k], heap[p2]]; k = p2; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { let l = 2 * k + 1, r = l + 1, m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    gS[idx(sx, sy)] = 0; push(0, idx(sx, sy));
    let found = false;
    while (heap.length) {
      const [, id] = pop(); if (done[id]) continue; done[id] = 1;
      const i = id % GW, j = (id / GW) | 0;
      if (i === tx && j === ty) { found = true; break; }
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
        if (!di && !dj) continue;
        const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= GW || nj >= GH) continue;
        const nid = idx(ni, nj); if (done[nid] || (!(ni === tx && nj === ty) && !okf(cx(ni), cyy(nj)))) continue;
        const ng = gS[id] + (di && dj ? 1.414 : 1);
        if (ng < gS[nid]) { gS[nid] = ng; from[nid] = id; push(ng + Math.hypot(tx - ni, ty - nj), nid); }
      }
    }
    if (!found) return [{ x: x1, y: y1 }];
    const pts = []; for (let id = idx(tx, ty); id !== -1; id = from[id]) pts.push({ x: cx(id % GW), y: cyy((id / GW) | 0) });
    pts.reverse(); pts[0] = { x: x0, y: y0 }; pts[pts.length - 1] = { x: x1, y: y1 };
    const clear = (a2, b2) => { const n = Math.ceil(Math.hypot(b2.x - a2.x, b2.y - a2.y) / 5); for (let k = 1; k < n; k++) if (!okf(a2.x + ((b2.x - a2.x) * k) / n, a2.y + ((b2.y - a2.y) * k) / n)) return false; return true; };
    const out = []; let cur = 0;
    while (cur < pts.length - 1) { let nx = cur + 1; for (let k = pts.length - 1; k > cur + 1; k--) if (clear(pts[cur], pts[k])) { nx = k; break; } out.push(pts[nx]); cur = nx; }
    return out;
  }
  function goTo(x, y, pend) {
    P.path = []; P.pend = pend || null; P.blocked = 0; P.retried = 0;
    const waterTap = !pend && Math.abs(y - cy(x)) < WATER - 4 && !onBridge(x, y);
    const clampX = (v) => Math.max(XMIN + 30, Math.min(XMIN + W - 30, v));
    let px = P.x, py = P.y;
    if (waterTap) {
      if (!P.boat) {
        const sd = side(P.x, P.y), bx = clampX(x), [lx, ly] = nearestLand(bx, cy(bx) + sd * 70);
        const leg = findPath(px, py, lx, ly, planLand); leg[leg.length - 1].act = "board"; P.path.push(...leg);
        px = lx; py = cy(lx) + sd * (WATER - 6);
      }
      P.path.push(...findPath(px, py, x, y, okBoat));
      return;
    }
    if (P.boat) {
      const ts = side(x, y), sx = clampX(P.x), sy = cy(sx) + ts * (WATER - 6);
      const leg = findPath(px, py, sx, sy, okBoat); leg[leg.length - 1].act = "land"; leg[leg.length - 1].ts = ts; P.path.push(...leg);
      [px, py] = nearestLand(sx, cy(sx) + ts * 70);
    }
    const [tx, ty] = nearestLand(x, y);
    P.path.push(...findPath(px, py, tx, ty, planLand));
  }
  function arrive() { const id = P.pend; P.pend = null; if (!id) return; if (id === "exit") cb.onExit(); else cb.onTalk(id); }
  const clampCam = () => {
    const vw = 420 / cam.z, vh = VP.h / cam.z;
    cam.x = vw >= W ? XMIN + W / 2 : Math.max(XMIN + vw / 2, Math.min(XMIN + W - vw / 2, cam.x));
    cam.y = vh >= H ? YMIN + H / 2 : Math.max(YMIN + vh / 2, Math.min(YMIN + H - vh / 2, cam.y));
  };
  const api = {
    enter() { P.x = START.x; P.y = START.y; P.path = []; P.pend = null; P.boat = 0; cam.x = P.x; cam.y = P.y; cam.z = 1.1; },
    zoomBy(f) { cam.z = Math.max(0.45, Math.min(2.4, cam.z * f)); },
    tap(sx, sy) {
      const x = cam.x + (sx - 210) / cam.z, y = cam.y + (sy - VP.h / 2) / cam.z;
      const e = ents.filter((q) => Math.hypot(x - q.hx, y - q.hy) < q.r).sort((a, b) => Math.hypot(x - a.hx, y - a.hy) - Math.hypot(x - b.hx, y - b.hy))[0];
      if (e) goTo(e.sx, e.sy, e.id); else goTo(x, y, null);
    },
    update(dt) {
      if (P.path.length) {
        const T = P.path[0], dx = T.x - P.x, dy = T.y - P.y, d = Math.hypot(dx, dy);
        if (d < 4) {
          P.path.shift();
          if (T.act === "board") { P.boat = 1; P.y = cy(P.x) + side(P.x, P.y) * (WATER - 6); }
          if (T.act === "land") { P.boat = 0; const [lx, ly] = nearestLand(P.x, cy(P.x) + T.ts * 70); P.x = lx; P.y = ly; }
          if (!P.path.length) arrive();
        } else {
          const spd = P.boat ? 88 : 105, step = Math.min(d, spd * dt), nx = P.x + (dx / d) * step, ny = P.y + (dy / d) * step;
          if (ok(nx, ny)) { P.x = nx; P.y = ny; P.blocked = 0; } else if (ok(nx, P.y)) P.x = nx; else if (ok(P.x, ny)) P.y = ny; else if (++P.blocked > 8) {
            // stuck: re-plan to the same target once, then give up
            const end = P.path[P.path.length - 1], pend = P.pend;
            if (!P.retried && !P.boat && !P.path.some((q) => q.act)) { P.retried = 1; P.path = findPath(P.x, P.y, end.x, end.y, planLand); P.blocked = 0; P.pend = pend; }
            else { P.path = []; P.retried = 0; arrive(); }
          }
          P.walking = 1; P.ph += dt * (P.boat ? 6 : 12); if (Math.abs(dx) > 1) P.dir = dx > 0 ? 1 : -1;
        }
      } else P.walking = 0;
      cam.x += (P.x - cam.x) * Math.min(1, dt * 4); cam.y += (P.y - 20 - cam.y) * Math.min(1, dt * 4);
      clampCam();
    },
    draw(c, t, k, ch, name) {
      VP.h = c.canvas.height / k;
      c.save(); c.scale(k, k); c.translate(210, VP.h / 2); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
      c.lineJoin = "round"; c.lineCap = "round";
      c.fillStyle = "#a9e07f"; c.fillRect(XMIN - 600, YMIN - 900, W + 1200, H + 1800);
      c.drawImage(st, XMIN, YMIN, W, H);
      c.setLineDash([8, 30]); c.lineDashOffset = -t * 18; c.lineWidth = 4; c.strokeStyle = "rgba(255,255,255,0.75)"; c.stroke(canal);
      c.lineDashOffset = t * 12 + 14; c.lineWidth = 3; c.strokeStyle = "rgba(255,255,255,0.5)"; c.save(); c.translate(0, 8); c.stroke(canal); c.restore(); c.setLineDash([]);
      const list = items.map((i) => ({ y: i.y, fn: () => c.drawImage(i.sp.c, i.x - i.sp.hw, i.y - i.sp.up, 2 * i.sp.hw, i.sp.up + i.sp.dn) }));
      list.push({ y: 246, fn: () => {
        const pd = cb.podium(), B = 246, H2 = [100, 66, 44], WD = [78, 60, 54], U = [21, 14.5, 11.5], XS = [210, 143, 275], CC = [["#ffe27a", "#e0a800"], ["#e3e8ee", "#9aa5b1"], ["#f0b27a", "#b97532"]];
        c.fillStyle = "#7a5230"; c.beginPath(); c.roundRect(100, B - 2, 220, 7, 3.5); c.fill();
        [1, 2, 0].forEach((i) => {
          const e = pd[i], x = XS[i], h = H2[i], w = WD[i], gdt = c.createLinearGradient(0, B - h, 0, B);
          gdt.addColorStop(0, CC[i][0]); gdt.addColorStop(1, CC[i][1]);
          c.fillStyle = gdt; c.strokeStyle = "#4a3322"; c.lineWidth = 3;
          c.beginPath(); c.roundRect(x - w / 2, B - h, w, h, [7, 7, 0, 0]); c.fill(); c.stroke();
          c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#4a3322";
          c.font = "800 " + (i === 0 ? 40 : i === 1 ? 28 : 22) + "px Athiti, system-ui"; c.fillText(String(i + 1), x, B - h + (i === 0 ? 26 : 18));
          c.font = "800 " + (i === 0 ? 24 : i === 1 ? 17 : 14) + "px Athiti, system-ui"; c.fillText(String(e.score), x, B - (i === 0 ? 22 : 13));
          drawChibi(c, x, B - h, U[i], e.char, { t, lw: 1, lift: i === 0 ? Math.abs(Math.sin(t * 3)) * 0.15 : 0 });
          const ny = B - h - U[i] * 4.2 - 6, nm = e.name;
          c.font = "800 " + (i === 0 ? 19 : i === 1 ? 15 : 13) + "px Athiti, system-ui";
          const tw = c.measureText(nm).width + 16;
          c.fillStyle = e.me ? "#fff3dc" : "#fffdf3"; c.strokeStyle = "#4a3322"; c.lineWidth = 2.5;
          c.beginPath(); c.roundRect(x - tw / 2, ny - 11, tw, 22, 11); c.fill(); c.stroke();
          c.fillStyle = e.me ? "#c2521a" : "#4a3322"; c.fillText(nm, x, ny + 1);
          c.textBaseline = "alphabetic";
        });
      } });
      list.push({ y: P.y, fn: () => {
        if (P.boat) {
          const bob = Math.sin(t * 2.4) * 1.5, d = P.dir || 1, X = P.x, Yb = P.y + bob;
          c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 2.5; c.beginPath(); c.ellipse(X, P.y + 8, 46 + Math.sin(t * 3) * 3, 9, 0, 0, 7); c.stroke();
          if (P.walking) for (let k2 = 1; k2 <= 3; k2++) { c.globalAlpha = 0.5 - k2 * 0.12; c.beginPath(); c.ellipse(X - d * (34 + k2 * 12), P.y + 8, 8 + k2 * 3, 3 + k2, 0, 0, 7); c.stroke(); }
          c.globalAlpha = 1;
          const OUTC = "#4a3322", Y1 = "#ffd84a", Y2 = "#ffb92e";
          const outl = (col, lw) => { c.fillStyle = col; c.strokeStyle = OUTC; c.lineWidth = lw; c.fill(); c.stroke(); };
          // tail
          c.beginPath(); c.moveTo(X - d * 30, Yb - 8); c.quadraticCurveTo(X - d * 46, Yb - 20, X - d * 44, Yb - 28); c.quadraticCurveTo(X - d * 34, Yb - 20, X - d * 22, Yb - 16); c.closePath(); outl(Y1, 3);
          // body back
          c.beginPath(); c.ellipse(X, Yb - 4, 36, 18, 0, 0, 7); outl(Y1, 3.5);
          drawChibi(c, X, Yb + 1, 12, ch, { t, lw: 1, noLegs: 1 });
          // body front rim over the rider
          c.beginPath(); c.ellipse(X, Yb - 4, 36, 18, 0, 0.02 * Math.PI, 0.98 * Math.PI); c.closePath(); outl(Y2, 3.5);
          c.beginPath(); c.ellipse(X, Yb - 1, 26, 9, 0, 0.1 * Math.PI, 0.9 * Math.PI); c.strokeStyle = "#fff5b8"; c.lineWidth = 3; c.stroke();
          // wing
          c.beginPath(); c.ellipse(X - d * 4, Yb + 2 + Math.sin(t * 6) * (P.walking ? 1.5 : 0.5), 11, 6, d * 0.3, 0, 7); outl("#ffc93a", 2.5);
          // head
          const hx = X + d * 34, hy = Yb - 20 + Math.sin(t * 2.4 + 1) * 1;
          c.beginPath(); c.moveTo(X + d * 22, Yb - 8); c.quadraticCurveTo(X + d * 30, Yb - 10, hx, hy + 6); c.lineTo(hx - d * 8, hy + 8); c.quadraticCurveTo(X + d * 22, Yb - 2, X + d * 22, Yb - 8); outl(Y1, 3);
          c.beginPath(); c.arc(hx, hy, 12, 0, 7); outl(Y1, 3.5);
          c.beginPath(); c.moveTo(hx + d * 9, hy + 1); c.quadraticCurveTo(hx + d * 21, hy - 1, hx + d * 20, hy + 5); c.quadraticCurveTo(hx + d * 14, hy + 8, hx + d * 8, hy + 6); c.closePath(); outl("#ff8a3a", 2.5);
          c.fillStyle = OUTC; c.beginPath(); c.arc(hx + d * 3, hy - 3, 2.2, 0, 7); c.fill();
          c.fillStyle = "#fff"; c.beginPath(); c.arc(hx + d * 3.7, hy - 3.8, 0.8, 0, 7); c.fill();
          c.fillStyle = "#ff8fa8aa"; c.beginPath(); c.ellipse(hx - d * 3, hy + 4, 3.2, 2, 0, 0, 7); c.fill();
        } else {
          c.fillStyle = "rgba(60,40,20,0.22)"; c.beginPath(); c.ellipse(P.x, P.y + 1, 18, 6, 0, 0, 7); c.fill();
          drawChibi(c, P.x, P.y, 15, ch, { t, lift: P.walking ? Math.abs(Math.sin(P.ph)) * 0.2 : 0 });
        }
        if (name) { c.font = "bold 14px Athiti, system-ui"; c.textAlign = "center"; const tw = c.measureText(name).width + 18, ty = P.y - 76; c.fillStyle = "#fffdf3"; c.strokeStyle = "#4a3322"; c.lineWidth = 3; c.beginPath(); c.roundRect(P.x - tw / 2, ty - 12, tw, 24, 12); c.fill(); c.stroke(); c.fillStyle = "#c2521a"; c.textBaseline = "middle"; c.fillText(name, P.x, ty + 1); c.textBaseline = "alphabetic"; }
      } });
      list.sort((a, b) => a.y - b.y).forEach((o) => o.fn());
      ents.filter((e) => e.talk || /temple|mosque/.test(e.id)).forEach((e, i) => drawIco(c, "chat", e.hx, e.hy - (e.talk ? 34 : 70) + Math.sin(t * 3 + i) * 2.5, 26));
      c.restore();
    },
  };
  return api;
}
