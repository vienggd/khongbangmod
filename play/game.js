const QP = new URLSearchParams(location.search),
  EMBED = QP.get("g"),
  UP = +QP.get("up") || 0;
const CHAR = (() => {
  try {
    return JSON.parse(QP.get("c"));
  } catch (e) {
    return null;
  }
})();
const toHub = (m) => parent.postMessage(m, "*");
const cv = document.getElementById("c"),
  g = cv.getContext("2d"),
  W = 420,
  H = 630;
// sharp on retina
const DPR = Math.min(2, devicePixelRatio || 1);
cv.width = W * DPR;
cv.height = H * DPR;
g.scale(DPR, DPR);
const $ = (id) => document.getElementById(id);
const lerp = (a, b, k) => a + (b - a) * k,
  damp = (a, b, s, dt) => lerp(a, b, 1 - Math.exp(-s * dt));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
let scene = "title",
  time = 0,
  scroll = 0,
  camX = 0,
  bikeV = 0,
  npc = null,
  keys = {},
  score1 = 0,
  score2 = 0,
  shake = 0;
const S = { fish: {}, fruit: {} },
  fx = [];

/* ---------- UI helpers ---------- */
function ov(html, soft) {
  const o = $("ov");
  o.innerHTML = soft ? html : '<div class="card">' + html + "</div>";
  o.classList.toggle("soft", !!soft);
  o.classList.add("off");
  requestAnimationFrame(() => requestAnimationFrame(() => o.classList.remove("off")));
}
function hideOv() {
  $("ov").classList.add("off");
}
function fadeTo(fn) {
  const f = $("fade");
  f.style.opacity = 1;
  setTimeout(() => {
    fn();
    f.style.opacity = 0;
  }, 380);
}
function typeText(el, html, done) {
  // typewriter effect
  const plain = html.replace(/<[^>]+>/g, "");
  let i = 0;
  el.innerHTML = "";
  clearInterval(el._t);
  el._t = setInterval(() => {
    i++;
    el.textContent = plain.slice(0, i);
    if (i >= plain.length) {
      clearInterval(el._t);
      el.innerHTML = html;
      done && done();
    }
  }, 22);
  el._skip = () => {
    clearInterval(el._t);
    el.innerHTML = html;
    el._t = null;
  };
}
function talk(lines, done) {
  let i = 0;
  const box = $("box"),
    txt = $("txt");
  box.classList.remove("off");
  const show = () => typeText(txt, lines[i], () => (txt._t = null));
  setTimeout(show, 250);
  $("next").onclick = () => {
    if (txt._t) {
      txt._skip();
      return;
    }
    i++;
    if (i < lines.length) show();
    else {
      box.classList.add("off");
      setTimeout(done, 350);
    }
  };
}
function pop(id) {
  const e = $(id);
  e.classList.add("pop");
  setTimeout(() => e.classList.remove("pop"), 150);
}
const _hc = {};
function hud(id, h) { if (_hc[id] !== h) { _hc[id] = h; $(id).innerHTML = h; } }
function floatText(x, y, s, c) {
  fx.push({ x, y, s, c, life: 1, ico: s === "💔" ? "heart" : null });
}
function burst(x, y, c) {
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * 6.28,
      v = 60 + Math.random() * 120;
    fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, c, life: 0.7, dot: 1 });
  }
}
function drawFx(dt) {
  for (const f of fx) {
    f.life -= dt;
    if (f.dot) {
      f.vy += 300 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      g.globalAlpha = Math.max(0, f.life / 0.7);
      g.fillStyle = f.c;
      g.beginPath();
      g.arc(f.x, f.y, 4, 0, 7);
      g.fill();
    } else {
      f.y -= 50 * dt;
      g.globalAlpha = Math.max(0, f.life);
      g.font = "bold 26px Athiti, system-ui";
      g.fillStyle = f.c;
      g.strokeStyle = "#fff";
      g.lineWidth = 4;
      if (f.ico) drawIco(g, f.ico, f.x, f.y - 8, 34, Math.max(0, f.life));
      else (g.strokeText(f.s, f.x, f.y), g.fillText(f.s, f.x, f.y));
    }
  }
  g.globalAlpha = 1;
  for (let i = fx.length - 1; i >= 0; i--) if (fx[i].life <= 0) fx.splice(i, 1);
}
const IMG = {};
const SRC = {
  boy_bike: "assets/game/boy_bike.png",
  otree: "assets/game/otree.png",
  sun: "assets/game/sun.png",
  tree: "assets/game/tree.png",
  fish: "assets/game/fish.png",
  orange: "assets/game/orange.png",
  ant: "assets/game/ant.png",
  basket: "assets/game/basket.png",
};
Object.keys(SRC).forEach((n) => {
  IMG[n] = new Image();
  IMG[n].src = SRC[n];
});
function pic(n, x, y, h, rot = 0, sx = 1, sy = 1) {
  const im = IMG[n];
  if (!im.complete || !im.naturalWidth) return;
  const w = (h * im.naturalWidth) / im.naturalHeight;
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(sx, sy);
  g.drawImage(im, -w / 2, -h / 2, w, h);
  g.restore();
}
const EMO_MAP = { "☁️": "cloud", "🏠": "house", "🍜": "bowl", "🐟": "fish", "🍊": "orange", "💔": "heart", "🌶️": "chili", "🌿": "leaf", "🥩": "pork", "🛶": "fish", "❤️": "heart", "🤍": "heartE" };
function emoji(e, x, y, size, rot = 0, sx = 1, sy = 1) {
  if (EMO_MAP[e] && typeof drawIco === "function") {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.scale(sx, sy);
    drawIco(g, EMO_MAP[e], 0, 0, size * 1.15);
    g.restore();
    return;
  }
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(sx, sy);
  g.font = size + "px serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(e, 0, 0);
  g.restore();
}

/* ---------- title ---------- */
// โลโก้หน้าแรก (เปลี่ยนเป็น '' เพื่อแสดงชื่อเกมเป็นข้อความแทน)
const LOGO = "assets/game/logo.png";
function showTitle() {
  scene = "title";
  music.setMode("music");
  ov(
    `${LOGO ? `<img class="logo" src="${LOGO}" alt="Klong Bang Mot">` : "<h1>Bike Tour at<br>Klong Bang Mot</h1>"}<p>กิจกรรมปั่นจักรยานทัวร์ชุมชน<br>คลองบางมด<br>ทำกิจกรรมกับชาวบ้านในชุมชน</p><div class="row"><button id="go">เริ่มปั่น</button><button id="rl" class="alt">กติกา</button></div>`,
  );
  $("go").onclick = () => {
    music.start();
    hideOv();
    fadeTo(() => startRide("fisher"));
  };
  $("rl").onclick = () => {
    music.start();
    showRules();
  };
}
function showRules() {
  ov(`<h1>กติกา</h1><ul class="rules">
<li>ปั่นจักรยานเลียบคลองไปพบผู้คนในชุมชน กด <b>ทักทาย</b> เพื่อคุยด้วย</li>
<li><b>เกมตกปลา</b> แตะหรือคลิกในน้ำเพื่อหย่อนเบ็ด ถ้าเบ็ดโดนปลาจะดึงขึ้นมาให้เอง มีเวลา 30 วินาที</li>
<li><b>เกมเก็บส้ม</b> กดลูกศรซ้าย–ขวาเพื่อเลื่อนตะกร้า เก็บแค่ส้ม ถ้าเก็บมดจะเสียหัวใจ 1 ดวง มีเวลา 30 วินาที เกมจบเมื่อหมดเวลาหรือหัวใจหมด 3 ดวง เก็บได้ 10 ลูกขึ้นไปของจะร่วงเร็วขึ้นทีละนิด</li>
<li>ระหว่างเล่นเกม กดปุ่มหยุดด้านบนเพื่อพักหรือออกไปหน้าแรกได้</li></ul>
<button id="bk">เข้าใจแล้ว</button>`);
  $("bk").onclick = showTitle;
}
function howTo(title, text, start) {
  ov(`<h1>${title}</h1><p>${text}</p><button id="st">เริ่มเกม</button>`);
  $("st").onclick = () => {
    hideOv();
    setTimeout(start, 250);
  };
}

/* ---------- world ---------- */
const STOP = 420; // distance bike rides before meeting npc
function startRide(who) {
  music.setMode("ride");
  scene = "ride";
  npc = who;
  scroll = 0;
  bikeV = 0;
  S.prompt = 0;
}
function drawWorld(kind, s) {
  const sky = g.createLinearGradient(0, 0, 0, 330);
  sky.addColorStop(0, "#8fd3ff");
  sky.addColorStop(1, "#d8f1ff");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  pic("sun", W - 85, 100 + Math.sin(time * 0.8) * 3, 78, Math.sin(time * 0.5) * 0.08);
  [
    [40, 80, 0.15],
    [320, 60, 0.1],
    [180, 150, 0.2],
  ].forEach(([x, y, p]) => {
    const xx = ((((x - s * p - time * 8) % (W + 120)) + W + 120) % (W + 120)) - 60;
    emoji("☁️", xx, y, 42);
  });
  const gy = 330;
  // far hills
  g.fillStyle = "#a7dc8a";
  g.beginPath();
  g.moveTo(0, gy);
  for (let x = 0; x <= W; x += 10) g.lineTo(x, gy - 18 - Math.sin((x + s * 0.3) / 60) * 12);
  g.lineTo(W, gy);
  g.fill();
  g.fillStyle = "#8fd16a";
  g.fillRect(0, gy, W, 40);
  for (let i = 0; i < 9; i++) {
    const x = ((((i * 60 - s * 0.6) % 540) + 540) % 540) - 60,
      sway = Math.sin(time * 1.5 + i) * 0.04;
    pic(kind === "orchard" ? "otree" : "tree", x + 20, gy - 26, kind === "orchard" ? 74 : 64, sway);
  }
  if (kind !== "orchard") emoji("🏠", ((((220 - s * 0.6) % 540) + 540) % 540) - 40, gy - 10, 38);
  // bridge
  g.fillStyle = "#d9b27c";
  g.fillRect(0, gy + 40, W, 10);
  g.fillStyle = "#b98c55";
  g.fillRect(0, gy + 130, W, 14);
  for (let i = 0; i < 12; i++) g.fillRect(((((i * 40 - s) % 480) + 480) % 480) - 40, gy + 50, 6, 80);
  // water
  const wat = g.createLinearGradient(0, gy + 144, 0, H);
  wat.addColorStop(0, "#6cc0ee");
  wat.addColorStop(1, "#3a8fc8");
  g.fillStyle = wat;
  g.fillRect(0, gy + 144, W, H - gy - 144);
  g.strokeStyle = "#ffffff88";
  g.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const x = ((((i * 55 - s * 0.3 - time * 12) % 660) + 660) % 660) - 60,
      y = gy + 170 + (i % 4) * 30 + Math.sin(time * 2 + i) * 2;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + 12, y - 6, x + 24, y);
    g.stroke();
  }
}
function drawRide(dt) {
  const kind = npc === "aunt" ? "orchard" : "river";
  // smooth accelerate then brake to a stop
  const remain = STOP - scroll;
  const target = scene === "ride" ? Math.min(170, Math.max(0, remain * 1.6)) : 0;
  bikeV = damp(bikeV, target, 3, dt);
  music.update(dt, bikeV > 40);
  scroll += bikeV * dt;
  if (remain < 0.5) scroll = STOP;
  drawWorld(kind, scroll);
  const by = 420,
    nx = W - 90 + (STOP - scroll);
  if (nx < W + 80) {
    if (npc === "vendor") {
      drawPerson(nx, by + 30 + Math.sin(time * 3) * 1.5, VENDOR, 0.85);
      emoji("🍜", nx + 46, by + 16, 30);
      emoji("🛶", nx, by + 58 + Math.sin(time * 2) * 2, 48);
    } else if (npc === "fisher") {
      const bob = Math.sin(time * 2) * 3;
      emoji("🧑", nx, by, 54);
      g.strokeStyle = "#333";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(nx + 18, by - 10);
      g.lineTo(nx + 55, by - 70);
      g.quadraticCurveTo(nx + 64, by, nx + 60, by + 70 + bob);
      g.stroke();
      pic("fish", nx + 66, by + 90 + bob, 18, 1.2);
    } else {
      emoji("👩‍🌾", nx, by + Math.sin(time * 3) * 1.5, 54);
      pic("basket", nx + 46, by + 16, 32);
    }
  }
  // bike: bounce proportional to speed
  const sp = bikeV / 170,
    bounce = Math.abs(Math.sin(time * 12)) * 3 * sp;
  pic("boy_bike", 80, by - 6 - bounce, 78, -0.04 * sp);
  if (sp > 0.3 && Math.random() < sp * 0.4)
    fx.push({ x: 58, y: by + 24, vx: -40 - Math.random() * 30, vy: -20, c: "#c9a46f", life: 0.4, dot: 1 });
  if (scene === "ride" && remain < 1 && !S.prompt) {
    S.prompt = 1;
    const name =
      npc === "fisher" ? "พี่ชายที่กำลังตกปลา" : npc === "aunt" ? "คุณน้าเจ้าของสวนส้ม" : "ป้าแม่ค้าก๋วยเตี๋ยวเรือ";
    ov(`<p>คุณปั่นมาเจอ <b>${name}</b></p><button id="it">ทักทาย</button>`, true);
    $("it").onclick = () => {
      hideOv();
      scene = "talk";
      if (npc === "fisher")
        talk(
          [
            "<b>พี่ชาย:</b> สวัสดีครับ! มาปั่นจักรยานเที่ยวเหรอ",
            "<b>พี่ชาย:</b> พี่ตกปลาตรงนี้ทุกเย็นเลยนะ ได้นั่งเงียบ ๆ ริมน้ำ มันทำให้ใจสงบดี",
            "<b>พี่ชาย:</b> ลองตกด้วยกันไหม? มีเวลา 30 วินาที ดูซิว่าจะได้กี่ตัว",
          ],
          () =>
            fadeTo(() => {
              scene = "fish0";
              howTo(
                "เกมตกปลา",
                "แตะหรือคลิกในน้ำเพื่อหย่อนเบ็ด<br>ถ้าโดนปลา เบ็ดจะดึงขึ้นมาเอง<br>มีเวลา 30 วินาที",
                startFish,
              );
            }),
        );
      else if (npc === "aunt")
        talk(
          [
            "<b>คุณน้า:</b> อ้าว หนูมาจากไหนจ๊ะ แวะมาสวนน้าพอดีเลย",
            "<b>คุณน้า:</b> ส้มที่นี่น้าปลูกเองทุกต้น ดูแลมาเป็นสิบปีแล้ว เห็นมันออกลูกทีไรก็ชื่นใจ",
            "<b>คุณน้า:</b> ช่วยน้าเก็บส้มหน่อยนะ เก็บแค่ <b>ส้ม</b> นะจ๊ะ ระวัง<b>มด</b>ด้วย! มีหัวใจ 3 ดวง",
          ],
          () =>
            fadeTo(() => {
              scene = "fruit0";
              howTo(
                "เกมเก็บส้ม",
                "กดลูกศรซ้าย–ขวาเพื่อเลื่อนตะกร้า<br>เก็บแค่ส้ม ระวังมด!<br>เก็บมดจะเสียหัวใจ 1 ดวง<br>มีเวลา 30 วินาที",
                startFruit,
              );
            }),
        );
      else
        talk(
          [
            "<b>ป้า:</b> มาพอดีเลยลูก วันนี้ลูกค้ามายืนรอที่ท่าน้ำเต็มเลย",
            "<b>ป้า:</b> ป้าพายเรือขายก๋วยเตี๋ยวเรือในคลองนี้มาหลายสิบปี ลูกค้าประจำแต่ละคนชอบรสไม่เหมือนกัน ป้าจำได้หมดเลย",
            "<b>ป้า:</b> ช่วยป้าเสิร์ฟหน่อยนะ ดูป้ายสั่งเหนือหัวลูกค้า แล้วแตะส่งชามให้<b>ถูกคน</b> มีหัวใจ 3 ดวง",
          ],
          () =>
            fadeTo(() => {
              scene = "noodle0";
              howTo(
                "เกมเสิร์ฟก๋วยเตี๋ยวเรือ",
                "ชามก๋วยเตี๋ยวเรือเลื่อนมาตามเรือของป้า<br>ดูป้ายสั่งเหนือหัวลูกค้าที่ท่าน้ำ<br>แล้วแตะลูกค้าที่สั่งชามนั้น<br>เสิร์ฟผิดหรือปล่อยชามหลุดจะเสียหัวใจ 1 ดวง<br>มีเวลา 30 วินาที",
                startNoodle,
              );
            }),
        );
    };
  }
}

/* ---------- fishing ---------- */
const RX = W / 2 + 70,
  RY = 200;
function startFish() {
  music.setMode("music");
  scene = "fish";
  S.fish = {
    time: 30 + 5 * UP,
    fish: [],
    hook: { x: RX, y: RY, tx: RX, ty: RY, caught: null, state: "rest", wait: 0 },
  };
  score1 = 0;
  $("hud").classList.remove("hidden");
  $("pbtn").classList.remove("gone");
  for (let i = 0; i < 5; i++) spawnFish(true);
}
const FISH_T = [
  { sz: 24, pts: 1, sp: 1.35, ci: 1, w: 34 },
  { sz: 29, pts: 2, sp: 1, ci: 0, w: 30 },
  { sz: 35, pts: 3, sp: 0.75, ci: 3, w: 20 },
  { sz: 43, pts: 5, sp: 0.5, ci: 2, w: 10 },
  { sz: 33, pts: 10, sp: 1.9, ci: 4, w: 6 },
];
function spawnFish(anywhere) {
  const d = Math.random() < 0.5 ? 1 : -1;
  let r = Math.random() * FISH_T.reduce((a, t) => a + t.w, 0),
    T = FISH_T[0];
  for (const t of FISH_T) if ((r -= t.w) < 0) { T = t; break; }
  S.fish.fish.push({
    sz: T.sz,
    pts: T.pts,
    gold: T.ci === 4,
    x: anywhere ? Math.random() * W : d > 0 ? -30 : W + 30,
    y: 270 + Math.random() * 320,
    v: (50 + Math.random() * 80) * d * T.sp,
    ph: Math.random() * 6,
    turn: 0,
    ci: T.ci,
  });
}
function drawFish(dt) {
  const F = S.fish;
  artPondBg(g, W, H, time);
  if (CHAR) {
    const cu = 50;
    drawChibi(g, W / 2, 226 + 0.5 * cu, cu, CHAR, { t: time, clipY: -0.5 * cu, blink: Math.sin(time * 1.3) > 0.97 ? 1 : 0, hands: { 1: [W / 2 + 22, 182] } });
  } else emoji("🧑", W / 2, 195, 60);
  artPier(g, W, 226, time);
  const h = F.hook,
    py = h.y;
  h.x = damp(h.x, h.tx, 6, dt);
  h.y = damp(h.y, h.ty, 6, dt);
  if (py < 234 && h.y >= 234) {
    music.splash();
    burst(h.x, 236, "#e8f7ff");
  } else if (py >= 234 && h.y < 234 && !h.caught) music.plop();
  const tipX = W / 2 + 70,
    tipY = 110;
  const ROD = ["#5b3a1e", "#c8a24a", "#3aa0e0", "#ffc400"][UP];
  if (UP >= 3) {
    g.save();
    g.shadowColor = "#ffe27a";
    g.shadowBlur = 14 + Math.sin(time * 5) * 4;
  }
  g.strokeStyle = ART_OUT;
  g.lineWidth = 7 + UP;
  g.beginPath();
  g.moveTo(W / 2 + 20, 180);
  g.lineTo(tipX, tipY);
  g.stroke();
  g.strokeStyle = ROD;
  g.lineWidth = 4 + UP * 0.6;
  g.stroke();
  if (UP >= 1) {
    g.strokeStyle = ART_OUT;
    g.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      const q = i / 5, px = W / 2 + 20 + (tipX - W / 2 - 20) * q, py = 180 + (tipY - 180) * q;
      g.beginPath();
      g.moveTo(px - 3, py - 3);
      g.lineTo(px + 3, py + 3);
      g.stroke();
    }
  }
  if (UP >= 2) {
    g.beginPath();
    g.arc(W / 2 + 36, 158, 7, 0, 7);
    artOutlineFill(g, "#cfd6db", 2.4);
  }
  if (UP >= 3) g.restore();
  g.strokeStyle = "#333";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(tipX, tipY);
  g.quadraticCurveTo((tipX + h.x) / 2 + 10, (tipY + h.y) / 2 + 30, h.x, h.y);
  g.stroke();
  g.beginPath();
  g.arc(h.x, h.y + 6, 6, 0, Math.PI);
  g.stroke();
  if (UP >= 1 && h.y > 240) {
    g.beginPath();
    g.arc(h.x, h.y - 18, 6, 0, 7);
    artOutlineFill(g, "#ff5a5a", 2);
    g.fillStyle = "#fff";
    g.fillRect(h.x - 5, h.y - 20, 10, 3);
  }
  // fish swim with wiggle
  for (const f of F.fish) {
    f.ph += dt * 8;
    f.x += f.v * dt;
    f.y += Math.sin(f.ph * 0.3) * 12 * dt;
    const flip = f.v > 0 ? 1 : -1;
    artFish(g, f.x, f.y, f.sz, Math.sin(f.ph) * 0.12 * flip, flip, f.ci, time);
    if (f.gold) drawIco(g, "star", f.x, f.y - f.sz * 0.7 + Math.sin(time * 6) * 2, 16);
    if (h.state === "cast" && h.y > 240 && Math.hypot(f.x - h.x, f.y - h.y) < Math.max(28, f.sz * 0.7)) {
      h.caught = f;
      f.got = 1;
      burst(h.x, h.y, "#fff");
      music.catchFish();
      h.state = "reel";
      h.tx = RX;
      h.ty = RY;
    }
  }
  // hook waits briefly at the spot, then reels back up empty
  if (h.state === "cast" && Math.hypot(h.x - h.tx, h.y - h.ty) < 6) {
    h.wait -= dt;
    if (h.wait <= 0) {
      h.state = "reel";
      h.tx = RX;
      h.ty = RY;
    }
  }
  if (h.state === "reel" && Math.hypot(h.x - RX, h.y - RY) < 12) {
    h.state = "rest";
    if (h.caught) {
      score1 += h.caught.pts;
      music.got();
      pop("hr");
      floatText(h.x - 20, h.y + 10, "+" + h.caught.pts, h.caught.pts >= 5 ? "#e8321a" : "#ff8a00");
      burst(h.x, h.y + 20, "#ffd34d");
      h.caught = null;
    }
  }
  F.fish = F.fish.filter((f) => !f.got && f.x > -60 && f.x < W + 60);
  if (h.caught) artFish(g, h.x, h.y + 10 + h.caught.sz * 0.6, h.caught.sz, Math.PI / 2 + Math.sin(time * 25) * 0.4, 1, h.caught.ci, time);
  while (F.fish.length < 5) spawnFish();
  drawFx(dt);
  F.time -= dt;
  hud("hl", "เหลือ " + Math.max(0, Math.ceil(F.time)) + " วิ");
  hud("hr", ICO.html("fish", 24) + " " + score1 + " คะแนน");
  if (F.time <= 0 && scene === "fish") {
    scene = "end1";
    $("hud").classList.add("hidden");
    $("pbtn").classList.add("gone");
    ov(
      `<h1>หมดเวลา!</h1><p>ตกปลาได้ <b>${score1}</b> คะแนน</p><p style="font-size:15px">ปลาตัวใหญ่ได้คะแนนเยอะ ปลาทองได้ 10!</p><p>"ความสุขไม่ต้องยิ่งใหญ่หรอก<br>แค่ได้นั่งริมน้ำ ใจก็สงบแล้ว"</p><button id="c1">${EMBED ? "กลับแผนที่" : "ปั่นต่อ"}</button>`,
    );
    $("c1").onclick = () => {
      if (EMBED) return toHub({ type: "done", game: "fish", score: score1 });
      hideOv();
      fadeTo(() => startRide("aunt"));
    };
  }
}
cv.addEventListener("pointerdown", (e) => {
  if (scene !== "fish" || paused) return;
  const r = cv.getBoundingClientRect();
  const x = ((e.clientX - r.left) * W) / r.width,
    y = ((e.clientY - r.top) * H) / r.height;
  const h = S.fish.hook;
  if (h.state !== "reel") {
    h.state = "cast";
    h.wait = 0.9;
    h.tx = x;
    h.ty = Math.max(250, y);
    fx.push({ x, y: Math.max(250, y), vx: 0, vy: 0, c: "#ffffff", life: 0.3, dot: 1 });
  }
});

/* ---------- fruit ---------- */

function startFruit() {
  music.setMode("music");
  scene = "fruit";
  S.fruit = { x: W / 2, vx: 0, squash: 0, items: [], hearts: 3, next: 0.6, tx: null, time: 30 + 5 * UP };
  score2 = 0;
  $("hud").classList.remove("hidden");
  $("arrows").classList.remove("hidden");
  $("pbtn").classList.remove("gone");
}
function drawFruit(dt) {
  const F = S.fruit;
  artOrchard(g, W, H, time);
  // smooth basket movement: acceleration + friction
  let ax = 0;
  if (keys.l) ax -= 2600;
  if (keys.r) ax += 2600;
  if (F.tx != null && !keys.l && !keys.r) ax = (F.tx - F.x) * 60 - F.vx * 10;
  F.vx += ax * dt;
  F.vx *= Math.pow(0.0005, dt);
  F.vx = Math.max(-520, Math.min(520, F.vx));
  F.x += F.vx * dt;
  if (F.x < 40) {
    F.x = 40;
    F.vx = 0;
  }
  if (F.x > W - 40) {
    F.x = W - 40;
    F.vx = 0;
  }
  F.squash = damp(F.squash, 0, 10, dt);
  const lvl = 1 + score2 / 15;
  F.next -= dt;
  if (F.next <= 0) {
    const extra = Math.max(0, score2 - 9); // starts after 10 oranges, then grows a little each orange
    F.items.push({
      x: 30 + Math.random() * (W - 60),
      y: 40,
      vy: 95 + Math.random() * 35 + Math.min(80, extra * 3),
      o: Math.random() < 0.65,
      rot: 0,
      vr: (Math.random() - 0.5) * 2,
    });
    F.next = Math.max(0.75, 1.1 - extra * 0.012);
  }
  const by = H - 150;
  for (const it of F.items) {
    it.y += it.vy * dt;
    it.rot += it.vr * dt;
    if (it.o) artOrange(g, it.x, it.y, 19, it.rot);
    else artAnt(g, it.x, it.y, 36, time);
    if (it.y > by - 20 && it.y < by + 20 && Math.abs(it.x - F.x) < 45) {
      it.done = 1;
      F.squash = 1;
      if (it.o) {
        score2++;
        music.orange();
        pop("hr");
        floatText(it.x - 14, it.y - 10, "+1", "#ff8a00");
        burst(it.x, it.y, "#ff9a2e");
      } else {
        F.hearts--;
        music.ant();
        pop("hl");
        shake = 0.35;
        floatText(it.x - 14, it.y - 10, "💔", "#e33");
        burst(it.x, it.y, "#e33");
      }
    }
    if (it.y > H + 30) it.done = 1;
  }
  F.items = F.items.filter((i) => !i.done);
  const tilt = (F.vx / 520) * 0.25;
  ART_LV = UP;
  artBasket(g, F.x, by + 8, 78, tilt, F.squash);
  drawFx(dt);
  hud("hl", ICO.html("heart", 24).repeat(Math.max(0, F.hearts)) + ICO.html("heartE", 24).repeat(3 - Math.max(0, F.hearts)) + " &nbsp;" + Math.max(0, Math.ceil(F.time)) + " วิ");
  hud("hr", ICO.html("orange", 24) + " " + score2);
  if (scene === "fruit") F.time -= dt;
  if ((F.hearts <= 0 || F.time <= 0) && scene === "fruit") {
    scene = "end2";
    const why = F.hearts <= 0 ? "หัวใจหมดแล้ว!" : "หมดเวลา!";
    $("hud").classList.add("hidden");
    $("arrows").classList.add("hidden");
    $("pbtn").classList.add("gone");
    ov(
      `<h1>${why}</h1><p>คุณเก็บส้มได้ <b>${score2}</b> ลูก</p><p>"ทุกลูกที่ออกมา คือผลของความตั้งใจ<br>ที่น้าดูแลมันทุกวัน"</p><button id="c2">${EMBED ? "กลับแผนที่" : "ปั่นต่อ"}</button>`,
    );
    $("c2").onclick = () => {
      if (EMBED) return toHub({ type: "done", game: "fruit", score: score2 });
      hideOv();
      fadeTo(() => startRide("vendor"));
    };
  }
}

/* ---------- noodle shop ---------- */
let score3 = 0;
const MENU = [
  { n: "ต้มยำ", c: "#e8553a", e: "🌶️" },
  { n: "น้ำใส", c: "#f6e7b0", e: "🌿" },
  { n: "น้ำตก", c: "#7a3b22", e: "🥩" },
];
const CUST = [
  { x: 75, look: { skin: "#f6d0a6", hair: "#3a2a1a", shirt: "#4aa3df", cap: "#e8553a" } },
  { x: 210, look: { skin: "#e9b98a", hair: "#1b1b1b", shirt: "#b07cd8", bun: 1 } },
  { x: 345, look: { skin: "#d9a272", hair: "#222", shirt: "#f2b134" } },
];
const VENDOR = { skin: "#f2c9a0", hair: "#2a2a2a", shirt: "#e8553a", apron: 1, hat: 1, bun: 1 };
const BELT_Y = 478,
  CUST_Y = 330;
// little hand-drawn style person; (x, y) = feet
function drawPerson(x, y, o, sc = 1, sad = false) {
  g.save();
  g.translate(x, y);
  g.scale(sc, sc);
  g.strokeStyle = "#5b4630";
  g.lineWidth = 2;
  if (o.bun) {
    g.fillStyle = o.hair;
    g.beginPath();
    g.arc(0, -76, 9, 0, 7);
    g.fill();
    g.stroke();
  }
  g.fillStyle = o.shirt;
  g.beginPath();
  g.roundRect(-19, -36, 38, 36, 12);
  g.fill();
  g.stroke();
  if (o.apron) {
    g.fillStyle = "#fff";
    g.beginPath();
    g.roundRect(-12, -30, 24, 30, 8);
    g.fill();
    g.stroke();
  }
  g.fillStyle = o.skin;
  [-22, 22].forEach((hx) => {
    g.beginPath();
    g.arc(hx, -16, 6, 0, 7);
    g.fill();
    g.stroke();
  });
  g.beginPath();
  g.arc(0, -52, 21, 0, 7);
  g.fill();
  g.stroke();
  g.fillStyle = o.hair;
  g.beginPath();
  g.arc(0, -54, 21, Math.PI, 0);
  g.closePath();
  g.fill();
  g.stroke();
  if (o.cap) {
    g.fillStyle = o.cap;
    g.beginPath();
    g.arc(0, -57, 21, Math.PI, 0);
    g.closePath();
    g.fill();
    g.stroke();
    g.beginPath();
    g.ellipse(14, -56, 14, 4, 0, 0, 7);
    g.fill();
    g.stroke();
  }
  g.fillStyle = "#3a2a1a";
  g.beginPath();
  g.arc(-8, -50, 2.4, 0, 7);
  g.arc(8, -50, 2.4, 0, 7);
  g.fill();
  g.fillStyle = "#ff9a9a88";
  g.beginPath();
  g.arc(-13, -44, 4, 0, 7);
  g.arc(13, -44, 4, 0, 7);
  g.fill();
  g.strokeStyle = "#7a3b22";
  g.beginPath();
  if (sad) g.arc(0, -39, 6, Math.PI * 1.15, Math.PI * 1.85);
  else g.arc(0, -46, 6, Math.PI * 0.15, Math.PI * 0.85);
  g.stroke();
  if (o.hat) {
    // conical straw hat
    g.fillStyle = "#e8c36a";
    g.strokeStyle = "#5b4630";
    g.beginPath();
    g.moveTo(-34, -62);
    g.lineTo(0, -92);
    g.lineTo(34, -62);
    g.quadraticCurveTo(0, -56, -34, -62);
    g.closePath();
    g.fill();
    g.stroke();
  }
  g.restore();
}
function startNoodle() {
  music.setMode("music");
  scene = "noodle";
  S.noodle = {
    time: 30,
    hearts: 3,
    bowls: [],
    fly: [],
    next: 0.5,
    cust: CUST.map((_, i) => ({ want: i % 3, hop: 0, shake: 0 })),
  };
  score3 = 0;
  $("hud").classList.remove("hidden");
  $("pbtn").classList.remove("gone");
}
function drawBowl(x, y, m, s = 1) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.strokeStyle = "#ffffffcc";
  g.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    g.beginPath();
    g.moveTo(i * 12, -12);
    g.quadraticCurveTo(i * 12 + 5 * Math.sin(time * 3 + i), -22, i * 12, -32);
    g.stroke();
  }
  g.fillStyle = "#fff";
  g.strokeStyle = "#5b4630";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-30, 0);
  g.quadraticCurveTo(-26, 30, 0, 30);
  g.quadraticCurveTo(26, 30, 30, 0);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = MENU[m].c;
  g.beginPath();
  g.ellipse(0, 0, 28, 8, 0, 0, 7);
  g.fill();
  g.stroke();
  g.strokeStyle = "#fff3c4";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-14, 0);
  g.quadraticCurveTo(-7, -5, 0, 0);
  g.quadraticCurveTo(7, 5, 14, 0);
  g.stroke();
  emoji(MENU[m].e, 0, -4, 16);
  g.restore();
}
function serveNoodle(i) {
  const F = S.noodle;
  if (scene !== "noodle" || paused || !F.bowls.length) return;
  const b = F.bowls.reduce((a, c) => (c.x < a.x ? c : a));
  const c = F.cust[i],
    cx = CUST[i].x;
  F.bowls.splice(F.bowls.indexOf(b), 1);
  F.fly.push({ x: b.x, y: BELT_Y, tx: cx, ty: CUST_Y - 20, t: 0, m: b.t });
  if (b.t === c.want) {
    score3++;
    music.got();
    pop("hr");
    floatText(cx - 14, CUST_Y - 70, "+1", "#ff8a00");
    burst(cx, CUST_Y - 30, "#ffd34d");
    c.hop = 1;
    c.want = (c.want + 1 + ((Math.random() * 2) | 0)) % 3;
  } else {
    F.hearts--;
    music.ant();
    pop("hl");
    shake = 0.3;
    c.shake = 1;
    floatText(cx - 14, CUST_Y - 70, "💔", "#e33");
    burst(cx, CUST_Y - 30, "#e33");
  }
}
function drawNoodle(dt) {
  const F = S.noodle,
    live = scene === "noodle",
    py = CUST_Y + 24; // pier surface
  const sky = g.createLinearGradient(0, 0, 0, 200);
  sky.addColorStop(0, "#9bd8ff");
  sky.addColorStop(1, "#e4f5ff");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) pic("tree", i * 80 + 30, 160, 70, Math.sin(time * 1.5 + i) * 0.04);
  emoji("🏠", 125, 180, 40);
  emoji("🏠", 305, 180, 40);
  // canal bank where customers stand
  g.fillStyle = "#8fd16a";
  g.fillRect(0, 200, W, py - 200);
  g.fillStyle = "#7cc45a";
  g.fillRect(0, 200, W, 10);
  // water + ripples
  const wat = g.createLinearGradient(0, py, 0, H);
  wat.addColorStop(0, "#6cc0ee");
  wat.addColorStop(1, "#3a8fc8");
  g.fillStyle = wat;
  g.fillRect(0, py, W, H - py);
  g.strokeStyle = "#ffffff88";
  g.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    const x = ((((i * 47 - time * 14) % 520) + 520) % 520) - 50,
      y = py + 60 + (i % 5) * 38 + Math.sin(time * 2 + i) * 2;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + 12, y - 6, x + 24, y);
    g.stroke();
  }
  // pier
  g.fillStyle = "#8c6a3f";
  for (let i = 0; i < 7; i++) g.fillRect(i * 70 + 20, py + 20, 8, 40);
  g.fillStyle = "#d9b27c";
  g.fillRect(0, py, W, 14);
  g.fillStyle = "#b98c55";
  g.fillRect(0, py + 14, W, 10);
  // vendor boat: deck, hull, sign
  g.fillStyle = "#d9b27c";
  g.fillRect(0, BELT_Y + 14, W, 16);
  g.fillStyle = "#b98c55";
  g.strokeStyle = "#5b4630";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-10, BELT_Y + 30);
  g.lineTo(W + 10, BELT_Y + 30);
  g.lineTo(W - 26, BELT_Y + 76);
  g.lineTo(26, BELT_Y + 76);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = "#a07844";
  for (let i = 0; i < 14; i++) g.fillRect((((i * 40 - time * 70) % 560) + 560) % 560 - 40, BELT_Y + 20, 14, 4);
  g.fillStyle = "#7a3b22";
  g.beginPath();
  g.roundRect(W / 2 - 85, BELT_Y + 40, 170, 30, 8);
  g.fill();
  g.fillStyle = "#fff";
  g.font = "bold 20px Athiti, system-ui";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("ก๋วยเตี๋ยวเรือป้า", W / 2, BELT_Y + 55);
  drawPerson(W - 50, BELT_Y + 14, VENDOR, 1.05);
  if (live) {
    const v = 70 + Math.min(60, score3 * 3);
    F.next -= dt;
    if (F.next <= 0 && !F.bowls.some((b) => b.x > W - 90)) {
      const t = Math.random() < 0.75 ? F.cust[(Math.random() * 3) | 0].want : (Math.random() * 3) | 0;
      F.bowls.push({ x: W + 30, t });
      F.next = Math.max(0.9, 1.7 - score3 * 0.03);
    }
    for (const b of F.bowls) {
      b.x -= v * dt;
      if (b.x < -30) {
        b.gone = 1;
        F.hearts--;
        music.ant();
        pop("hl");
        floatText(26, BELT_Y - 20, "💔", "#e33");
      }
    }
    F.bowls = F.bowls.filter((b) => !b.gone);
  }
  let lead = null;
  for (const b of F.bowls) if (!lead || b.x < lead.x) lead = b;
  for (const b of F.bowls) drawBowl(b.x, BELT_Y, b.t);
  if (lead && live) {
    g.strokeStyle = "#ff9a2e";
    g.lineWidth = 3;
    g.beginPath();
    g.ellipse(lead.x, BELT_Y + 8, 42, 36, 0, 0, 7);
    g.stroke();
  }
  for (const f of F.fly) {
    f.t += dt / 0.3;
    const k = easeOut(Math.min(1, f.t));
    drawBowl(lerp(f.x, f.tx, k), lerp(f.y, f.ty, k) - Math.sin(k * Math.PI) * 60, f.m, 0.9);
  }
  F.fly = F.fly.filter((f) => f.t < 1);
  // customers on the pier + order bubbles
  g.textAlign = "center";
  g.textBaseline = "middle";
  F.cust.forEach((c, i) => {
    const cx = CUST[i].x;
    c.hop = damp(c.hop, 0, 8, dt);
    c.shake = damp(c.shake, 0, 8, dt);
    const m = MENU[c.want];
    drawPerson(cx + Math.sin(time * 40) * 5 * c.shake, py - Math.sin(c.hop * Math.PI) * 16, CUST[i].look, 1, c.shake > 0.15);
    g.fillStyle = "#fff";
    g.strokeStyle = "#5b4630";
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(cx - 52, py - 138, 104, 44, 14);
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(cx - 8, py - 94);
    g.lineTo(cx, py - 84);
    g.lineTo(cx + 8, py - 94);
    g.fill();
    g.fillStyle = m.c;
    g.beginPath();
    g.arc(cx - 32, py - 116, 13, 0, 7);
    g.fill();
    g.stroke();
    emoji(m.e, cx - 32, py - 116, 16);
    g.fillStyle = "#5b4630";
    g.font = "bold 18px Athiti, system-ui";
    g.fillText(m.n, cx + 16, py - 115);
  });
  g.font = "bold 17px Athiti, system-ui";
  g.strokeStyle = "#2f7fb8";
  g.lineWidth = 4;
  g.strokeText("แตะลูกค้าที่สั่งชามนี้", W / 2 - 20, BELT_Y - 62);
  g.fillStyle = "#fff";
  g.fillText("แตะลูกค้าที่สั่งชามนี้", W / 2 - 20, BELT_Y - 62);
  drawFx(dt);
  hud("hl", ICO.html("heart", 24).repeat(Math.max(0, F.hearts)) + ICO.html("heartE", 24).repeat(3 - Math.max(0, F.hearts)) + " &nbsp;" + Math.max(0, Math.ceil(F.time)) + " วิ");
  hud("hr", ICO.html("bowl", 24) + " " + score3);
  if (live) F.time -= dt;
  if ((F.hearts <= 0 || F.time <= 0) && live) {
    scene = "end3";
    const why = F.hearts <= 0 ? "หัวใจหมดแล้ว!" : "หมดเวลา!";
    $("hud").classList.add("hidden");
    $("pbtn").classList.add("gone");
    ov(
      `<h1>${why}</h1><p>คุณเสิร์ฟก๋วยเตี๋ยวเรือได้ <b>${score3}</b> ชาม</p><p>"ชีวิตริมคลองไม่ต้องรีบร้อน<br>แต่ทุกชามที่ส่งถึงมือ มาจากใจที่จำได้ว่าลูกค้าชอบแบบไหน"</p><button id="c3">ปั่นเข้าเส้นชัย</button>`,
    );
    $("c3").onclick = () => {
      hideOv();
      setTimeout(finale, 400);
    };
  }
}
cv.addEventListener("pointerdown", (e) => {
  if (scene !== "noodle" || paused) return;
  const r = cv.getBoundingClientRect();
  const x = ((e.clientX - r.left) * W) / r.width,
    y = ((e.clientY - r.top) * H) / r.height;
  if (y < 190) return;
  const i = CUST.findIndex((c) => Math.abs(x - c.x) < 62);
  if (i >= 0) serveNoodle(i);
});
addEventListener("keydown", (e) => {
  if (e.key >= "1" && e.key <= "3") serveNoodle(+e.key - 1);
});

function finale() {
  scene = "done";
  ov(`<h1>ถึงเส้นชัยแล้ว!</h1>
<p style="font-size:18px">คุณสนุกกับการปั่นจักรยาน<br>เที่ยวคลองบางมดไหม?</p>
<p>ตกปลาได้ <b>${score1}</b> ตัว · เก็บส้มได้ <b>${score2}</b> ลูก · เสิร์ฟก๋วยเตี๋ยวเรือได้ <b>${score3}</b> ชาม</p>
<p>ความงามของชีวิตไม่ได้อยู่ที่ไหนไกล<br>มันอยู่ในความสงบริมน้ำ<br>และในความใส่ใจที่คนหนึ่งมอบให้กับสวนของเขา</p>
<p><b>ขอบคุณที่มาร่วมกิจกรรมกับพวกเรา<br>ขอให้คุณโชคดีนะ</b></p>
<button id="again">เล่นอีกครั้ง</button>`);
  $("again").onclick = () => {
    hideOv();
    fadeTo(showTitle);
  };
}

/* controls */
const hold = (id, k) => {
  const b = $(id);
  b.onpointerdown = (e) => {
    e.preventDefault();
    keys[k] = 1;
  };
  b.onpointerup = b.onpointerleave = b.onpointercancel = () => (keys[k] = 0);
};
hold("bl", "l");
hold("br", "r");
addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") keys.l = 1;
  if (e.key === "ArrowRight") keys.r = 1;
});
addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") keys.l = 0;
  if (e.key === "ArrowRight") keys.r = 0;
});

/* pause / resume / exit */
let paused = false;
const inGame = () => scene === "fish" || scene === "fruit" || scene === "noodle";
function setPause(p) {
  const g = inGame();
  paused = p && g;
  $("pm").classList.toggle("off", !p);
  if (p) keys = {};
  $("pmt").textContent = g ? "หยุดชั่วคราว" : "ตั้งค่า";
  $("resume").textContent = g ? "เล่นต่อ" : "ปิด";
  $("exit").style.display = g ? "" : "none";
}
$("gear").onclick = () => setPause(true);
$("resume").onclick = () => setPause(false);
$("exit").onclick = () => {
  if (EMBED) return toHub({ type: "exit" });
  setPause(false);
  scene = "title";
  ["hud", "arrows"].forEach((i) => $(i).classList.add("hidden"));
  $("pbtn").classList.add("gone");
  $("box").classList.add("off");
  hideOv();
  fx.length = 0;
  fadeTo(showTitle);
};
addEventListener("contextmenu", (e) => e.preventDefault());
addEventListener("keydown", (e) => {
  if ((e.key === "Escape" || e.key === "p") && inGame()) setPause(!paused);
});

/* sound: background tune, riding ambience (wind + bell) and sound effects — all made with Web Audio, no files */
const BGM = "assets/game/bgm.mp3";
const SND = { bell: "assets/game/bell.mp3", wind: "assets/game/wind.mp3" };
const music = (() => {
  let BUF = {};
  let ac,
    master,
    tune,
    amb,
    on = true,
    started = false,
    step = 0,
    nextT = 0,
    mode = "music",
    bellT = 1.5,
    noiseBuf;
  const mel = [
    0,
    2,
    4,
    7,
    4,
    2,
    4,
    7,
    9,
    7,
    4,
    2,
    0,
    2,
    4,
    2,
    0,
    2,
    4,
    7,
    9,
    12,
    9,
    7,
    4,
    7,
    4,
    2,
    0,
    null,
    0,
    null,
  ];
  const bass = [0, 0, 5, 5, 7, 7, 5, 5];
  const base = 261.63,
    f = (n) => base * Math.pow(2, n / 12),
    beat = 60 / 92 / 2;
  function env(gn, t, a, vol, d) {
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.linearRampToValueAtTime(vol, t + a);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
  }
  function osc(type, fr, t, d, vol, dest, fr2) {
    dest = dest || master;
    const o = ac.createOscillator(),
      gn = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(fr, t);
    if (fr2) o.frequency.exponentialRampToValueAtTime(fr2, t + d);
    env(gn, t, 0.01, vol, d);
    o.connect(gn);
    gn.connect(dest);
    o.start(t);
    o.stop(t + d + 0.05);
    return o;
  }
  function noise(t, d, vol, f1, f2) {
    const s = ac.createBufferSource();
    s.buffer = noiseBuf;
    const fl = ac.createBiquadFilter();
    fl.type = "lowpass";
    fl.frequency.setValueAtTime(f1, t);
    fl.frequency.exponentialRampToValueAtTime(f2, t + d);
    const gn = ac.createGain();
    env(gn, t, 0.01, vol, d);
    s.connect(fl);
    fl.connect(gn);
    gn.connect(master);
    s.start(t, Math.random() * 1.5);
    s.stop(t + d + 0.05);
  }
  function tick() {
    while (nextT < ac.currentTime + 0.3) {
      const m = mel[step % mel.length];
      if (m != null) osc("triangle", f(m), nextT, beat * 1.6, 0.12, tune);
      if (step % 4 === 0)
        osc("sine", f(bass[((step / 4) | 0) % bass.length] - 12), nextT, beat * 3.5, 0.08, tune);
      nextT += beat;
      step++;
    }
  }
  function load(name, cb) {
    fetch(SND[name])
      .then((r) => r.arrayBuffer())
      .then((d) => ac.decodeAudioData(d))
      .then((b) => {
        BUF[name] = b;
        cb && cb();
      })
      .catch(() => {
        if (name === "wind") buildWind();
      });
  }
  function play(name, vol, dest) {
    const s = ac.createBufferSource(),
      gn = ac.createGain();
    s.buffer = BUF[name];
    gn.gain.value = vol;
    s.connect(gn);
    gn.connect(dest || master);
    s.start();
    return s;
  }
  function buildWind() {
    if (BUF.wind) {
      const s = play("wind", 0.22, amb);
      s.loop = true;
      return;
    }
    const s = ac.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 500;
    bp.Q.value = 0.7;
    const lfo = ac.createOscillator(),
      lg = ac.createGain();
    lfo.frequency.value = 0.15;
    lg.gain.value = 250;
    lfo.connect(lg);
    lg.connect(bp.frequency);
    const g2 = ac.createGain();
    g2.gain.value = 0.18;
    const lfo2 = ac.createOscillator(),
      lg2 = ac.createGain();
    lfo2.frequency.value = 0.23;
    lg2.gain.value = 0.08;
    lfo2.connect(lg2);
    lg2.connect(g2.gain);
    s.connect(bp);
    bp.connect(g2);
    g2.connect(amb);
    s.start();
    lfo.start();
    lfo2.start();
  }
  function icon() {
    $("sndt").textContent = on ? "เสียง: เปิด" : "เสียง: ปิด";
    $("sndi").innerHTML = on
      ? '<path d="M3 9v6h4l5 4V5L7 9H3z"/><path d="M16 8.5a5 5 0 0 1 0 7" stroke="#5b4630" stroke-width="2" fill="none"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12" stroke="#5b4630" stroke-width="2" fill="none"/>'
      : '<path d="M3 9v6h4l5 4V5L7 9H3z"/><path d="M16 9l5 6M21 9l-5 6" stroke="#5b4630" stroke-width="2"/>';
  }
  icon();
  const api = {
    start() {
      if (started) return;
      started = true;
      try {
        ac = new AudioContext();
        master = ac.createGain();
        master.gain.value = on ? 0.6 : 0;
        master.connect(ac.destination);
        tune = ac.createGain();
        tune.gain.value = 1;
        tune.connect(master);
        amb = ac.createGain();
        amb.gain.value = 0;
        amb.connect(master);
        noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        load("bell");
        load("wind", buildWind);
        nextT = ac.currentTime + 0.1;
        (() => {
          const a = new Audio(BGM);
          a.loop = true;
          a.crossOrigin = "anonymous";
          try {
            const src = ac.createMediaElementSource(a);
            const bg = ac.createGain();
            bg.gain.value = 0.45;
            src.connect(bg);
            bg.connect(tune);
          } catch (e) {
            a.volume = 0.3;
          }
          a.play().catch(() => {});
          api._bgm = a;
        })();
        api.setMode(mode);
      } catch (e) {}
    },
    toggle() {
      on = !on;
      icon();
      if (master) master.gain.setTargetAtTime(on ? 0.6 : 0, ac.currentTime, 0.1);
      else api.start();
    },
    setMode(m) {
      mode = m;
      if (!ac) return;
      const t = ac.currentTime;
      tune.gain.setTargetAtTime(m === "music" ? 1 : 0, t, 0.4);
      amb.gain.setTargetAtTime(m === "ride" ? 1 : 0, t, 0.6);
    },
    update(dt, moving) {
      if (!ac || mode !== "ride" || !moving) return;
      bellT -= dt;
      if (bellT <= 0) {
        api.bell();
        bellT = 2.5 + Math.random() * 1.5;
      }
    },
    bell() {
      if (!ac) return;
      if (BUF.bell) {
        play("bell", 0.25);
        return;
      }
      const t = ac.currentTime;
      [0, 0.16].forEach((o) => {
        osc("sine", 2350, t + o, 0.9, 0.05);
        osc("sine", 2980, t + o, 0.6, 0.025);
        osc("sine", 4700, t + o, 0.25, 0.012);
      });
    },
    splash() {
      if (!ac) return;
      const t = ac.currentTime;
      osc("sine", 220, t, 0.12, 0.1, null, 950);
      osc("sine", 480, t + 0.05, 0.1, 0.04, null, 1300);
      noise(t, 0.3, 0.03, 700, 150);
    },
    plop() {
      if (!ac) return;
      const t = ac.currentTime;
      osc("sine", 300, t, 0.1, 0.05, null, 800);
    },
    catchFish() {
      if (!ac) return;
      const t = ac.currentTime;
      osc("sine", 200, t, 0.13, 0.1, null, 900);
      osc("sine", 260, t + 0.12, 0.12, 0.08, null, 1100);
      noise(t, 0.35, 0.03, 800, 150);
    },
    got() {
      if (!ac) return;
      const t = ac.currentTime;
      [0, 4, 7, 12].forEach((n, i) => osc("triangle", f(n + 12), t + i * 0.06, 0.25, 0.12));
    },
    orange() {
      if (!ac) return;
      const t = ac.currentTime;
      osc("sine", f(19), t, 0.12, 0.16);
      osc("sine", f(24), t + 0.07, 0.22, 0.16);
      osc("triangle", f(31), t + 0.12, 0.18, 0.05);
    },
    ant() {
      if (!ac) return;
      const t = ac.currentTime;
      const o = osc("sine", 420, t, 0.45, 0.22, null, 110);
      const v = ac.createOscillator(),
        vg = ac.createGain();
      v.frequency.value = 18;
      vg.gain.value = 40;
      v.connect(vg);
      vg.connect(o.frequency);
      v.start(t);
      v.stop(t + 0.5);
      osc("square", 160, t, 0.18, 0.04, null, 90);
    },
  };
  return api;
})();
$("snd").onclick = () => music.toggle();

/* main loop: time-based so speed is the same on 60Hz and 120Hz screens */
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (paused) {
    requestAnimationFrame(loop);
    return;
  }
  time += dt;
  g.save();
  if (shake > 0) {
    shake -= dt;
    const m = shake * 20;
    g.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }
  if (scene === "noodle" || scene === "end3") drawNoodle(dt);
  else if (scene === "title" || scene === "done" || scene === "end2" || scene === "fruit0" || scene === "noodle0") {
    scroll += 40 * dt;
    drawWorld(scene === "title" || scene === "noodle0" ? "river" : "orchard", scroll);
  } else if (scene === "ride" || scene === "talk") {
    drawRide(dt);
    drawFx(dt);
  } else if (scene === "fish" || scene === "end1") drawFish(dt);
  else if (scene === "fish0") {
    scroll += 40 * dt;
    drawWorld("river", scroll);
  } else if (scene === "fruit") drawFruit(dt);
  g.restore();
  requestAnimationFrame(loop);
}
if (EMBED) {
  requestAnimationFrame(loop);
  const T = {
    fish: ["เกมตกปลา", "แตะหรือคลิกในน้ำเพื่อหย่อนเบ็ด ปลาตัวใหญ่ได้คะแนนเยอะ ปลาทองหายากได้ 10 คะแนน!", startFish, "fish0"],
    fruit: ["เกมเก็บส้ม", "กดลูกศรซ้าย–ขวาเพื่อเลื่อนตะกร้า เก็บแค่ส้ม ถ้าเก็บมดจะเสียหัวใจ 1 ดวง", startFruit, "fruit0"],
  }[EMBED];
  scene = T[3];
  howTo(T[0], T[1], () => {
    music.start();
    T[2]();
  });
} else {
  showTitle();
  requestAnimationFrame(loop);
}
