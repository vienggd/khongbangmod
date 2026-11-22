/* storybook map for the hub, drawn on canvas in the same outlined cartoon style as the noodle-boat game */
function buildMap(roadD, riverD, stops) {
  const W = 420,
    H = 630,
    SC = 2;
  const road = new Path2D(roadD),
    river = new Path2D(riverD);
  const mk = (d) => {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "path");
    s.setAttribute("d", d);
    return s;
  };
  const rp = mk(roadD),
    vp = mk(riverD),
    RL = rp.getTotalLength(),
    VL = vp.getTotalLength();
  const rs = [],
    vs = [];
  for (let i = 0; i <= 260; i++) (rs.push(rp.getPointAtLength((i / 260) * RL)), vs.push(vp.getPointAtLength((i / 260) * VL)));
  const dmin = (x, y, arr) => arr.reduce((m, p) => Math.min(m, Math.hypot(p.x - x, p.y - y)), 1e9);
  let seed = 11;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

  /* ---------- static layer ---------- */
  const st = document.createElement("canvas");
  st.width = W * SC;
  st.height = H * SC;
  const g = st.getContext("2d");
  g.scale(SC, SC);
  g.lineJoin = "round";
  g.lineCap = "round";
  // ground
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#b9ea8e");
  gr.addColorStop(1, "#8fd46a");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = i % 2 ? "#ffffff18" : "#4fa84a14";
    g.beginPath();
    g.ellipse(rnd() * W, 20 + rnd() * 600, 30 + rnd() * 40, 10 + rnd() * 14, 0, 0, 7);
    g.fill();
  }
  // river (outline, water, inner light, foam)
  const rv = (w, col) => ((g.lineWidth = w), (g.strokeStyle = col), g.stroke(river));
  rv(104, "#7cc85e"); // shaded grass edge
  rv(94, "#6aa94c");
  rv(84, "#b88f5a"); // mud bank
  rv(76, "#d9b97c");
  rv(70, "#ffffffd0"); // wet foam edge
  rv(66, "#3fb0e2");
  rv(54, "#55c0ec");
  rv(40, "#72d0f4");
  rv(26, "#98e0f8");
  rv(12, "#bdf0fc");
  // soft light streaks
  g.setLineDash([26, 40]);
  g.lineDashOffset = 0;
  g.save();
  g.translate(-9, -3);
  rv(4, "#ffffffb0");
  g.restore();
  g.setLineDash([14, 52]);
  g.lineDashOffset = -30;
  g.save();
  g.translate(10, 4);
  rv(3, "#ffffff88");
  g.restore();
  g.setLineDash([]);
  // lily pads + flowers on the river
  [[0.08, 1], [0.22, -1], [0.4, 1], [0.55, -1], [0.7, 1], [0.86, -1]].forEach(([f, sd]) => {
    const p = vp.getPointAtLength(f * VL);
    g.beginPath();
    g.ellipse(p.x + sd * 16, p.y + 4, 12, 5, 0, 0, 7);
    artOutlineFill(g, "#5cc04e", 2);
    if (f > 0.3) {
      g.beginPath();
      g.arc(p.x + sd * 16, p.y - 2, 4, 0, 7);
      artOutlineFill(g, "#ff9ec4", 1.6);
    }
  });
  // boardwalk road
  g.setLineDash([]);
  g.lineWidth = 30;
  g.strokeStyle = "#ffffffcc";
  g.stroke(road);
  g.lineWidth = 25;
  g.strokeStyle = ART_OUT;
  g.stroke(road);
  g.lineWidth = 18;
  g.strokeStyle = "#f3d59d";
  g.stroke(road);
  g.setLineDash([3, 9]);
  g.lineWidth = 18;
  g.strokeStyle = "#cf9650";
  g.stroke(road);
  g.setLineDash([]);
  // scenery objects, sorted by depth
  const items = [];
  const clear = (x, y, rr) => dmin(x, y, rs) > rr && dmin(x, y, vs) > rr + 18 && stops.every((s) => Math.hypot(s.x - x, s.y - y) > 62) && y > 20 && x > 12 && x < W - 12;
  const place = (n, rr, fn) => {
    let c = 0,
      tries = 0;
    while (c < n && tries++ < 900) {
      const x = rnd() * W,
        y = 30 + rnd() * 590;
      if (clear(x, y, rr)) (items.push({ y, fn: (g2) => fn(g2, x, y) }), c++);
    }
  };
  place(9, 34, (g2, x, y) => artTree(g2, x, y, 0.45 + (y / H) * 0.25, 0, rnd() < 0.5));
  place(4, 28, (g2, x, y) => artPalm(g2, x, y, 0.5 + (y / H) * 0.25));
  place(9, 18, (g2, x, y) => artBush(g2, x, y, 0.55 + rnd() * 0.3));
  place(3, 40, (g2, x, y) => artHouse(g2, x, y, 0.5 + (y / H) * 0.2));
  place(26, 12, (g2, x, y) => artFlower(g2, x, y, 1.1, ["#ff7ab0", "#ffd23f", "#ffffff", "#c49ae8"][(rnd() * 4) | 0], 0));
  // reeds and rocks on the river banks
  for (let i = 0; i < 22; i++) {
    const f = (i + 0.5) / 22,
      p = vp.getPointAtLength(f * VL),
      q = vp.getPointAtLength(Math.min(VL, f * VL + 4)),
      nx = -(q.y - p.y),
      ny = q.x - p.x,
      L = Math.hypot(nx, ny) || 1,
      sd = i % 2 ? 1 : -1,
      rx = p.x + (nx / L) * 46 * sd,
      ry = p.y + (ny / L) * 46 * sd;
    if (ry < 20 || rx < 6 || rx > W - 6 || dmin(rx, ry, rs) < 20) continue;
    items.push({
      y: ry,
      fn: (g2) => {
        if (i % 3 === 0) {
          g2.beginPath();
          g2.ellipse(rx, ry - 4, 9, 6, 0, 0, 7);
          artOutlineFill(g2, "#c9cfd4", 2.2);
          g2.fillStyle = "#e6eaed";
          g2.beginPath();
          g2.ellipse(rx - 2, ry - 6, 4, 2.5, 0, 0, 7);
          g2.fill();
        } else
          [-6, 0, 6].forEach((dx, j) => {
            g2.strokeStyle = ART_OUT;
            g2.lineWidth = 4.4;
            g2.beginPath();
            g2.moveTo(rx + dx, ry);
            g2.quadraticCurveTo(rx + dx + 2, ry - 12, rx + dx + (j - 1) * 3, ry - 22 - j * 2);
            g2.stroke();
            g2.strokeStyle = "#5cb04a";
            g2.lineWidth = 2;
            g2.stroke();
            g2.beginPath();
            g2.ellipse(rx + dx + (j - 1) * 3, ry - 26 - j * 2, 2.8, 6, 0, 0, 7);
            artOutlineFill(g2, "#8a5a2e", 1.4);
          });
      },
    });
  }
  // lanterns on posts along the road
  [0.08, 0.2, 0.34, 0.47, 0.6, 0.72, 0.84].forEach((f, i) => {
    const p = rp.getPointAtLength(f * RL),
      q = rp.getPointAtLength(Math.min(RL, f * RL + 4)),
      nx = -(q.y - p.y),
      ny = q.x - p.x,
      L = Math.hypot(nx, ny) || 1,
      sd = i % 2 ? 1 : -1,
      lx = p.x + (nx / L) * 20 * sd,
      ly = p.y + (ny / L) * 20 * sd;
    items.push({
      y: ly,
      fn: (g2) => {
        g2.strokeStyle = ART_OUT;
        g2.lineWidth = 5;
        g2.beginPath();
        g2.moveTo(lx, ly);
        g2.lineTo(lx, ly - 22);
        g2.stroke();
        g2.strokeStyle = "#a8703a";
        g2.lineWidth = 2.5;
        g2.stroke();
        g2.beginPath();
        g2.ellipse(lx, ly - 27, 6, 7.5, 0, 0, 7);
        artOutlineFill(g2, i % 2 ? "#ffd23f" : "#ff6b6b", 2.2);
      },
    });
  });
  // landmark props next to each stop (big, with a wooden plaza underneath)
  stops.forEach((s) => {
    items.push({
      y: s.y - 20,
      fn: (g2) => {
        const C = { fish: ["#9b5de5", "#e6d6ff"], fruit: ["#ff9a2e", "#ffe0ae"], noodle: ["#ff5a4a", "#ffd0c8"] }[s.k];
        // big soft glow + bold coloured plaza
        const gl = g2.createRadialGradient(s.x, s.y + 6, 20, s.x, s.y + 6, 100);
        gl.addColorStop(0, C[0] + "99");
        gl.addColorStop(1, C[0] + "00");
        g2.fillStyle = gl;
        g2.beginPath();
        g2.ellipse(s.x, s.y + 6, 100, 66, 0, 0, 7);
        g2.fill();
        g2.beginPath();
        g2.ellipse(s.x, s.y + 6, 70, 34, 0, 0, 7);
        artOutlineFill(g2, C[1], 4);
        g2.beginPath();
        g2.ellipse(s.x, s.y + 6, 60, 28, 0, 0, 7);
        g2.strokeStyle = C[0];
        g2.lineWidth = 6;
        g2.stroke();
        g2.setLineDash([2, 9]);
        g2.strokeStyle = "#ffffff";
        g2.lineWidth = 2.4;
        g2.stroke();
        g2.setLineDash([]);
      },
    });
    items.push({
      y: s.y + 30,
      fn: (g2) => {
        const sc = (x, y, k, f) => (g2.save(), g2.translate(x, y), g2.scale(k, k), f(), g2.restore());
        if (s.k === "fish") sc(s.x - 112, s.y + 18, 1.3, () => artDock(g2, 0, 0));
        if (s.k === "fruit") {
          artTree(g2, s.x - 66, s.y + 26, 1.0, 0, true);
          artTree(g2, s.x + 70, s.y + 30, 0.9, 0, true);
          [[-30, 38], [-18, 44], [-38, 46]].forEach(([dx, dy]) => {
            g2.beginPath();
            g2.arc(s.x + dx, s.y + dy, 6, 0, 7);
            artOutlineFill(g2, "#ff9a2e", 2);
          });
        }
        if (s.k === "noodle") sc(s.x + 6, s.y + 42, 1.15, () => artShopBoat(g2, 0, 0, 0, 1));
      },
    });
  });
  // upgrade decorations (bunting, lanterns, gold stars) at each landmark
  stops.forEach((q) => {
    const lv = q.lv || 0;
    if (!lv) return;
    items.push({
      y: q.y + 80,
      fn: (g2) => {
        const x0 = q.x - 66, x1 = q.x + 66, yy = q.y - 4;
        g2.strokeStyle = ART_OUT;
        g2.lineWidth = 2;
        g2.beginPath();
        g2.moveTo(x0, yy - 10);
        g2.quadraticCurveTo(q.x, yy + 14, x1, yy - 10);
        g2.stroke();
        const n = 3 + lv * 2;
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n, px = x0 + (x1 - x0) * u, py = (1 - u) * (1 - u) * (yy - 10) + 2 * u * (1 - u) * (yy + 14) + u * u * (yy - 10);
          g2.beginPath();
          g2.moveTo(px - 5, py);
          g2.lineTo(px + 5, py);
          g2.lineTo(px, py + 11);
          g2.closePath();
          artOutlineFill(g2, ["#ff6b6b", "#ffd23f", "#4aa3df", "#6ed05a"][i % 4], 1.6);
        }
        if (lv >= 2)
          [x0, x1].forEach((px) => {
            g2.strokeStyle = ART_OUT;
            g2.lineWidth = 4;
            g2.beginPath();
            g2.moveTo(px, yy + 30);
            g2.lineTo(px, yy - 14);
            g2.stroke();
            g2.beginPath();
            g2.ellipse(px, yy - 20, 6, 8, 0, 0, 7);
            artOutlineFill(g2, "#ff5a5a", 2);
          });
        if (lv >= 3) {
          g2.beginPath();
          for (let k = 0; k < 10; k++) g2.lineTo(q.x + Math.cos((k * Math.PI) / 5 - 1.57) * (k % 2 ? 6 : 14), yy + 38 + Math.sin((k * Math.PI) / 5 - 1.57) * (k % 2 ? 6 : 14));
          artOutlineFill(g2, "#ffd23f", 2.4);
        }
      },
    });
  });
  // community life: temple, mosque, vegetable plots, canoes, laundry, villagers
  const byk = Object.fromEntries(stops.map((q) => [q.k, q]));
  items.push({ y: 158, fn: (g2) => artTemple(g2, 58, 158, 0.8) });
  items.push({ y: 104, fn: (g2) => artMosque(g2, 356, 104, 0.72) });
  [[330, 290, 0.9], [60, 470, 0.9]].forEach(([vx, vy, vs]) => items.push({ y: vy, fn: (g2) => artVegPlot(g2, vx, vy, vs) }));
  const cp = vp.getPointAtLength(0.55 * VL);
  items.push({ y: cp.y + 20, fn: (g2) => artCanoe(g2, cp.x, cp.y + 4, 1.0, "uncle") });
  const cp2 = vp.getPointAtLength(0.18 * VL);
  items.push({ y: 300, fn: (g2) => artLaundry(g2, 332, 330, 56) });
  items.push({ y: cp2.y + 20, fn: (g2) => artCanoe(g2, cp2.x + 6, cp2.y + 6, 0.7, null) });
  if (byk.fruit) items.push({ y: byk.fruit.y + 60, fn: (g2) => artVillager(g2, byk.fruit.x + 34, byk.fruit.y + 40, 1.15, "aunty") });
  if (byk.fish) items.push({ y: byk.fish.y + 60, fn: (g2) => artVillager(g2, byk.fish.x - 62, byk.fish.y + 40, 1.15, "kid") });
  if (byk.noodle) items.push({ y: byk.noodle.y + 90, fn: (g2) => artVillager(g2, byk.noodle.x + 14, byk.noodle.y + 50, 1.0, "vendor") });
  items.sort((a, b) => a.y - b.y).forEach((it) => it.fn(g));
  // start gate
  const s0 = rs[0];
  artGate(g, s0.x + 2, s0.y);

  /* ---------- animated ---------- */
  const jumps = [];
  let nextJump = 1;
  function draw(ctx, t, k) {
    ctx.save();
    ctx.scale(k, k);
    ctx.drawImage(st, 0, 0, W, H);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    // river shimmer
    ctx.setLineDash([8, 30]);
    ctx.lineDashOffset = -t * 18;
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.stroke(river);
    ctx.lineDashOffset = t * 12 + 14;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.save();
    ctx.translate(0, 9);
    ctx.stroke(river);
    ctx.restore();
    ctx.setLineDash([]);
    // jumping fish
    nextJump -= 1 / 60;
    if (nextJump <= 0) {
      nextJump = 1.6 + Math.random() * 2.4;
      const p = vp.getPointAtLength((0.1 + Math.random() * 0.8) * VL);
      jumps.push({ x: p.x, y: p.y, t: 0, ci: (Math.random() * 4) | 0 });
    }
    for (const j of jumps) {
      j.t += 1 / 60 / 0.9;
      const u = Math.min(1, j.t),
        h = Math.sin(u * Math.PI) * 30;
      ctx.strokeStyle = "#ffffffcc";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(j.x, j.y + 2, 8 + u * 14, 3 + u * 5, 0, 0, 7);
      ctx.stroke();
      artFish(ctx, j.x + u * 18 - 9, j.y - h, 22, Math.cos(u * Math.PI) * -0.9, 1, j.ci, t);
    }
    for (let i = jumps.length - 1; i >= 0; i--) if (jumps[i].t >= 1) jumps.splice(i, 1);
    ctx.restore();
  }
  draw.people = [];
  if (byk.fruit) draw.people.push({ id: "aunty", x: byk.fruit.x + 34, y: byk.fruit.y + 4 });
  if (byk.fish) draw.people.push({ id: "kid", x: byk.fish.x - 62, y: byk.fish.y + 8 });
  if (byk.noodle) draw.people.push({ id: "vendor", x: byk.noodle.x + 14, y: byk.noodle.y + 34 });
  draw.people.push({ id: "uncle", x: cp.x - 4, y: cp.y - 28 });
  return draw;
}

function artPalm(g, x, y, s) {
  g.strokeStyle = ART_OUT;
  g.lineWidth = 11 * s;
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x + 8 * s, y - 38 * s, x + 2 * s, y - 70 * s);
  g.stroke();
  g.strokeStyle = "#b9803c";
  g.lineWidth = 6 * s;
  g.stroke();
  const tx = x + 2 * s,
    ty = y - 70 * s;
  [[-1, -0.3], [-0.6, -0.9], [0, -1.1], [0.6, -0.9], [1, -0.3]].forEach(([dx, dy]) => {
    g.beginPath();
    g.moveTo(tx, ty);
    g.quadraticCurveTo(tx + dx * 20 * s, ty + dy * 26 * s - 8 * s, tx + dx * 34 * s, ty + dy * 6 * s + 12 * s);
    g.quadraticCurveTo(tx + dx * 20 * s, ty + dy * 14 * s + 2 * s, tx, ty);
    artOutlineFill(g, "#4fb85a", 2.2);
  });
  [[-4, 4], [5, 6]].forEach(([dx, dy]) => {
    g.beginPath();
    g.arc(tx + dx * s, ty + dy * s, 4.5 * s, 0, 7);
    artOutlineFill(g, "#a8703a", 1.8);
  });
}
function artBush(g, x, y, s) {
  artBlob(g, [[x - 10 * s, y - 8 * s, 10 * s], [x + 2 * s, y - 14 * s, 12 * s], [x + 13 * s, y - 7 * s, 9 * s]], "#5cc04e", 2.6);
  g.fillStyle = "#86dc72";
  g.beginPath();
  g.arc(x - 2 * s, y - 18 * s, 5 * s, 0, 7);
  g.fill();
}
function artHouse(g, x, y, s) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  [-22, 0, 22].forEach((px) => {
    g.beginPath();
    g.roundRect(px - 3, -16, 6, 18, 2);
    artOutlineFill(g, "#8a5a2e", 2);
  });
  g.beginPath();
  g.roundRect(-30, -52, 60, 38, 4);
  artOutlineFill(g, "#f0cf94", 3);
  g.strokeStyle = "#cf9650";
  g.lineWidth = 1.6;
  for (let i = -18; i < 30; i += 12) (g.beginPath(), g.moveTo(i, -52), g.lineTo(i, -14), g.stroke());
  g.beginPath();
  g.roundRect(-8, -42, 16, 28, 3);
  artOutlineFill(g, "#a8703a", 2);
  g.beginPath();
  g.roundRect(14, -44, 12, 12, 2);
  artOutlineFill(g, "#bfe8ff", 2);
  g.beginPath();
  g.moveTo(-40, -50);
  g.lineTo(0, -82);
  g.lineTo(40, -50);
  g.closePath();
  artOutlineFill(g, "#e8553a", 3);
  g.restore();
}
function artDock(g, x, y) {
  const px = x + 46,
    py = y + 12;
  [0, 1, 2].forEach((i) => {
    g.beginPath();
    g.roundRect(px + i * 16 - 3, py, 6, 24, 2);
    artOutlineFill(g, "#8a5a2e", 2);
  });
  g.beginPath();
  g.roundRect(px - 10, py - 5, 52, 12, 4);
  artOutlineFill(g, "#d9a15a", 2.6);
  // rod
  g.strokeStyle = ART_OUT;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(px + 30, py - 5);
  g.lineTo(px + 52, py - 36);
  g.stroke();
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(px + 52, py - 36);
  g.lineTo(px + 52, py + 8);
  g.stroke();
  g.beginPath();
  g.arc(px + 52, py + 10, 2.5, 0, 7);
  g.stroke();
}
function artShopBoat(g, x, y, t, s, rot = 0) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.rotate(rot);
  // ripple
  g.strokeStyle = "#ffffffcc";
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(0, 8, 40, 9, 0, 0, 7);
  g.stroke();
  // hull
  g.beginPath();
  g.moveTo(-38, -4);
  g.quadraticCurveTo(-30, 12, -16, 12);
  g.lineTo(16, 12);
  g.quadraticCurveTo(30, 12, 38, -4);
  g.quadraticCurveTo(0, 4, -38, -4);
  artOutlineFill(g, "#c98a55", 3);
  g.beginPath();
  g.moveTo(-34, 2);
  g.quadraticCurveTo(0, 8, 34, 2);
  g.lineTo(31, 6);
  g.quadraticCurveTo(0, 12, -31, 6);
  g.closePath();
  g.fillStyle = "#e8553a";
  g.fill();
  // awning
  g.beginPath();
  g.moveTo(-26, -28);
  g.lineTo(26, -28);
  g.lineTo(32, -12);
  g.lineTo(-32, -12);
  g.closePath();
  artOutlineFill(g, "#ffd23f", 2.6);
  g.fillStyle = "#e8553a";
  for (let i = 0; i < 4; i++) (g.beginPath(), g.moveTo(-26 + i * 13 + 6, -28), g.lineTo(-26 + i * 13 + 13, -28), g.lineTo(-32 + i * 16 + 16, -12), g.lineTo(-32 + i * 16 + 8, -12), g.fill());
  g.strokeStyle = ART_OUT;
  g.lineWidth = 2.6;
  [-24, 24].forEach((px) => (g.beginPath(), g.moveTo(px, -12), g.lineTo(px, -2), g.stroke()));
  // pot + steam
  g.beginPath();
  g.roundRect(-10, -14, 20, 12, 3);
  artOutlineFill(g, "#b8bec6", 2);
  for (let k = 0; k < 3; k++) {
    const q = (t * 0.6 + k / 3) % 1;
    g.fillStyle = `rgba(255,255,255,${0.7 * (1 - q)})`;
    g.beginPath();
    g.arc(Math.sin(q * 6 + k) * 4, -20 - q * 18, 3 + q * 4, 0, 7);
    g.fill();
  }
  g.restore();
}
function artGate(g, x, y, label = "เริ่มต้น") {
  [-22, 22].forEach((dx) => {
    g.beginPath();
    g.roundRect(x + dx - 4, y - 46, 8, 50, 3);
    artOutlineFill(g, "#a8703a", 2.4);
  });
  g.beginPath();
  g.roundRect(x - 32, y - 58, 64, 20, 8);
  artOutlineFill(g, "#e8553a", 3);
  g.fillStyle = "#fff";
  g.font = "bold 14px Athiti, system-ui";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(label, x, y - 48);
}

function artVillager(g, x, y, s, kind) {
  const O = ART_OUT;
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = "rgba(40,60,30,0.25)";
  g.beginPath();
  g.ellipse(0, 1, 13, 4, 0, 0, 7);
  g.fill();
  const body = { aunty: "#e8739a", uncle: "#4a8fc4", kid: "#ffd23f", vendor: "#fff3d6" }[kind],
    skin = kind === "kid" ? "#f3c59c" : kind === "uncle" ? "#d9a070" : "#e4b088";
  // legs
  g.strokeStyle = O;
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(-4, -10);
  g.lineTo(-4, -1);
  g.moveTo(4, -10);
  g.lineTo(4, -1);
  g.stroke();
  g.strokeStyle = kind === "kid" ? "#4a6fc4" : skin;
  g.lineWidth = 2.6;
  g.stroke();
  // body
  g.beginPath();
  if (kind === "aunty" || kind === "vendor") (g.moveTo(-8, -26), g.lineTo(8, -26), g.lineTo(11, -6), g.lineTo(-11, -6));
  else g.roundRect(-8, -27, 16, 20, 5);
  g.closePath();
  artOutlineFill(g, body, 2.4);
  if (kind === "vendor") {
    g.fillStyle = "#e8553a";
    g.fillRect(-7, -18, 14, 10);
  }
  if (kind === "aunty") {
    g.fillStyle = "#ffffff99";
    [[-4, -18], [3, -13], [-1, -9]].forEach(([a, b]) => (g.beginPath(), g.arc(a, b, 1.6, 0, 7), g.fill()));
  }
  // arms
  g.strokeStyle = O;
  g.lineWidth = 4.6;
  g.beginPath();
  g.moveTo(-8, -23);
  g.lineTo(-13, -14);
  g.moveTo(8, -23);
  g.lineTo(13, -14);
  g.stroke();
  g.strokeStyle = skin;
  g.lineWidth = 2.4;
  g.stroke();
  // head
  g.beginPath();
  g.arc(0, -35, 10, 0, 7);
  artOutlineFill(g, skin, 2.4);
  // hair / hats
  if (kind === "uncle") {
    g.beginPath();
    g.ellipse(0, -41, 17, 5, 0, 0, 7);
    artOutlineFill(g, "#e8c66a", 2.4);
    g.beginPath();
    g.arc(0, -43, 9, Math.PI, 0);
    artOutlineFill(g, "#f3d97e", 2.4);
  } else if (kind === "aunty") {
    g.beginPath();
    g.arc(0, -37, 10.4, Math.PI * 1.02, Math.PI * 1.98);
    artOutlineFill(g, "#2a1d1d", 2);
    g.beginPath();
    g.arc(0, -47, 5, 0, 7);
    artOutlineFill(g, "#2a1d1d", 2);
  } else if (kind === "vendor") {
    g.beginPath();
    g.arc(0, -37, 10.6, Math.PI * 1.0, Math.PI * 2);
    g.lineTo(10, -33);
    g.lineTo(-10, -33);
    artOutlineFill(g, "#e8553a", 2.2);
  } else {
    g.beginPath();
    g.arc(0, -37, 10.4, Math.PI * 1.02, Math.PI * 1.98);
    artOutlineFill(g, "#3a2418", 2);
    [-1, 1].forEach((sd) => (g.beginPath(), g.arc(sd * 11, -33, 4, 0, 7), artOutlineFill(g, "#3a2418", 2)));
  }
  // face
  g.fillStyle = "#2a1a14";
  [-3.6, 3.6].forEach((dx) => (g.beginPath(), g.arc(dx, -34, 1.5, 0, 7), g.fill()));
  g.strokeStyle = "#2a1a14";
  g.lineWidth = 1.4;
  g.beginPath();
  g.arc(0, -32, 3, 0.2, Math.PI - 0.2);
  g.stroke();
  g.fillStyle = "#ff8aa088";
  [-6.5, 6.5].forEach((dx) => (g.beginPath(), g.arc(dx, -31, 2, 0, 7), g.fill()));
  // props
  if (kind === "aunty") {
    g.beginPath();
    g.moveTo(10, -14);
    g.lineTo(26, -14);
    g.lineTo(23, 0);
    g.lineTo(13, 0);
    g.closePath();
    artOutlineFill(g, "#c98a4a", 2.2);
    [[14, -17], [20, -18], [25, -16]].forEach(([a, b]) => (g.beginPath(), g.arc(a, b, 4.5, 0, 7), artOutlineFill(g, "#ff9a2e", 1.8)));
  }
  if (kind === "kid") {
    g.strokeStyle = O;
    g.lineWidth = 3.4;
    g.beginPath();
    g.moveTo(11, -14);
    g.lineTo(32, -40);
    g.stroke();
    g.strokeStyle = "#a8703a";
    g.lineWidth = 1.6;
    g.stroke();
    g.strokeStyle = O;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(32, -40);
    g.lineTo(34, -12);
    g.stroke();
  }
  if (kind === "vendor") {
    g.strokeStyle = O;
    g.lineWidth = 3.4;
    g.beginPath();
    g.moveTo(13, -14);
    g.lineTo(26, -26);
    g.stroke();
    g.beginPath();
    g.arc(27, -28, 4.5, 0, 7);
    artOutlineFill(g, "#cfd6db", 2);
  }
  g.restore();
}
function artCanoe(g, x, y, s, who) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.beginPath();
  g.moveTo(-34, -8);
  g.quadraticCurveTo(0, 6, 34, -8);
  g.lineTo(28, 2);
  g.quadraticCurveTo(0, 12, -28, 2);
  g.closePath();
  artOutlineFill(g, "#b87a3e", 3);
  g.strokeStyle = "#ffffffcc";
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(0, 6, 40, 6, 0, 0, 7);
  g.stroke();
  if (who) artVillager(g, -4, -4, 1, who);
  g.strokeStyle = ART_OUT;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(14, -34);
  g.lineTo(32, 6);
  g.stroke();
  g.strokeStyle = "#d9a85a";
  g.lineWidth = 2;
  g.stroke();
  g.restore();
}
function artTemple(g, x, y, s) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.beginPath();
  g.roundRect(-34, -34, 68, 34, 3);
  artOutlineFill(g, "#fff3d6", 3);
  g.beginPath();
  g.roundRect(-9, -26, 18, 26, [9, 9, 0, 0]);
  artOutlineFill(g, "#a8703a", 2.4);
  [-24, 24].forEach((dx) => (g.beginPath(), g.roundRect(dx - 5, -24, 10, 14, 5), artOutlineFill(g, "#bfe8ff", 2)));
  [[-42, -34, 42, -34, 34, -52, -34, -52, "#e8553a"], [-34, -52, 34, -52, 22, -68, -22, -68, "#ffb030"], [-22, -68, 22, -68, 0, -96, 0, -96, "#e8553a"]].forEach((q) => {
    g.beginPath();
    g.moveTo(q[0], q[1]);
    g.lineTo(q[2], q[3]);
    g.lineTo(q[4], q[5]);
    g.lineTo(q[6], q[7]);
    g.closePath();
    artOutlineFill(g, q[8], 3);
  });
  g.strokeStyle = ART_OUT;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, -96);
  g.lineTo(0, -108);
  g.stroke();
  g.restore();
}
function artMosque(g, x, y, s) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.beginPath();
  g.roundRect(-30, -34, 60, 34, 3);
  artOutlineFill(g, "#fffaf0", 3);
  g.beginPath();
  g.arc(0, -34, 22, Math.PI, 0);
  artOutlineFill(g, "#4fb8a0", 3);
  g.strokeStyle = ART_OUT;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, -56);
  g.lineTo(0, -66);
  g.stroke();
  g.fillStyle = "#ffd23f";
  g.beginPath();
  g.arc(4, -68, 4, 0, 7);
  g.fill();
  g.beginPath();
  g.arc(6, -69, 3.4, 0, 7);
  g.fillStyle = "#fffaf0";
  g.fill();
  g.beginPath();
  g.roundRect(34, -64, 11, 64, 3);
  artOutlineFill(g, "#fffaf0", 3);
  g.beginPath();
  g.moveTo(32, -64);
  g.lineTo(47, -64);
  g.lineTo(39.5, -80);
  g.closePath();
  artOutlineFill(g, "#4fb8a0", 2.6);
  [-12, 12].forEach((dx) => (g.beginPath(), g.roundRect(dx - 5, -26, 10, 20, [5, 5, 0, 0]), artOutlineFill(g, "#4fb8a0", 2)));
  g.restore();
}
function artVegPlot(g, x, y, s) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.beginPath();
  g.moveTo(-34, -14);
  g.lineTo(34, -14);
  g.lineTo(40, 8);
  g.lineTo(-40, 8);
  g.closePath();
  artOutlineFill(g, "#9a6a3c", 3);
  for (let r = 0; r < 3; r++)
    for (let i = 0; i < 6; i++) {
      const px = -26 + i * 10.5 + (r - 1) * -1,
        py = -8 + r * 6;
      g.beginPath();
      g.moveTo(px, py);
      g.quadraticCurveTo(px - 5, py - 8, px - 6, py - 12);
      g.quadraticCurveTo(px, py - 8, px, py);
      g.fillStyle = r === 1 ? "#6ed05a" : "#4fb85a";
      g.fill();
      g.beginPath();
      g.moveTo(px, py);
      g.quadraticCurveTo(px + 5, py - 9, px + 7, py - 13);
      g.quadraticCurveTo(px, py - 8, px, py);
      g.fill();
    }
  g.strokeStyle = ART_OUT;
  g.lineWidth = 2;
  for (let i = -36; i <= 36; i += 12) (g.beginPath(), g.moveTo(i, 8), g.lineTo(i, 16), g.stroke());
  g.beginPath();
  g.moveTo(-40, 12);
  g.lineTo(40, 12);
  g.stroke();
  g.restore();
}
function artLaundry(g, x, y, w) {
  g.strokeStyle = ART_OUT;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x + w / 2, y + 6, x + w, y);
  g.stroke();
  ["#ff7ab0", "#4aa3df", "#ffd23f", "#ffffff"].forEach((c, i) => {
    const px = x + (w / 5) * (i + 1);
    g.beginPath();
    g.roundRect(px - 4, y + 2, 8, 12, 1.5);
    artOutlineFill(g, c, 1.6);
  });
}
