/* shared mascot (plush-toy style) renderer — hub map, character picker, rider, fishing game */
const CH_OUT = "#4a3322";
function chShade(hex, m) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, (v * m) | 0));
  return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("");
}
const CH_PRESETS = [
  { k: "bear", n: "ชุดหมี", skin: "#c98a5a", belly: "#f3d3a8", inner: "#f0a98a", shoe: "#a8693e", face: "#f9d6b5", hair: "#3a2418" },
  { k: "cat", n: "ชุดแมว", skin: "#ffb45e", belly: "#fff1d6", inner: "#ff9aa8", shoe: "#e8903a", face: "#f3c59c", hair: "#2a1d1d" },
  { k: "bunny", n: "ชุดกระต่าย", skin: "#ffffff", belly: "#ffe9ef", inner: "#ffb3c6", shoe: "#f3d6de", face: "#f9d6b5", hair: "#5a3a22" },
  { k: "frog", n: "ชุดกบ", skin: "#7fd66a", belly: "#eefbc0", inner: "#ffb3c6", shoe: "#5fb84e", face: "#e4ad80", hair: "#1f1f2a" },
  { k: "pig", n: "ชุดหมู", skin: "#ffb3c8", belly: "#ffe0ea", inner: "#f58fae", shoe: "#f58fae", face: "#f3c59c", hair: "#a8643a" },
  { k: "panda", n: "ชุดแพนด้า", skin: "#ffffff", belly: "#ffffff", inner: "#2f2f36", shoe: "#2f2f36", face: "#d39a6c", hair: "#1f1f2a" },
];
/* g: ctx, cx/baseY: feet centre in px, u: px per unit, o: mascot
   opt: { t, lift, mood, blink, noLegs, hands:{1:[x,y],-1:[x,y]}, clipY } */
function drawChibi(g, cx, baseY, u, o, opt = {}) {
  const lift = opt.lift || 0,
    mood = opt.mood || 0,
    t = opt.t || 0,
    k = o.k,
    Y = (h) => baseY - (h + lift) * u,
    LW = opt.lw || Math.max(2, u * 0.035),
    dark = "#2f2f36",
    limb = k === "panda" ? dark : o.skin,
    pawC = k === "panda" ? dark : o.shoe;
  g.save();
  if (opt.clipY != null) {
    g.beginPath();
    g.rect(cx - 6 * u, baseY - 8 * u, 12 * u, 8 * u + opt.clipY);
    g.clip();
  }
  g.lineJoin = "round";
  g.lineCap = "round";
  const fillP = (col) => {
    g.fillStyle = col;
    g.fill();
    g.strokeStyle = CH_OUT;
    g.lineWidth = LW;
    g.stroke();
  };
  const ell = (px, py, rx, ry, col, rot = 0) => {
    g.beginPath();
    g.ellipse(px, py, rx, ry, rot, 0, 7);
    fillP(col);
  };
  const tube = (x1, y1, x2, y2, w, col) => {
    g.strokeStyle = CH_OUT;
    g.lineWidth = w + LW * 2;
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
    g.strokeStyle = col;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
  };
  const rad = 0.9 * u,
    px = cx,
    py = Y(1.1) - rad * 0.95;
  // tail
  if (k === "bunny") ell(cx + 0.36 * u, Y(0.5), 0.15 * u, 0.15 * u, "#fff");
  if (k === "cat") {
    g.strokeStyle = CH_OUT;
    g.lineWidth = 0.2 * u + LW * 2;
    g.beginPath();
    g.moveTo(cx + 0.35 * u, Y(0.45));
    g.bezierCurveTo(cx + 0.85 * u, Y(0.4), cx + 0.8 * u, Y(1.0), cx + 0.62 * u, Y(1.0));
    g.stroke();
    g.strokeStyle = o.skin;
    g.lineWidth = 0.2 * u;
    g.stroke();
  }
  if (k === "bear" || k === "pig" || k === "panda") ell(cx + 0.3 * u, Y(0.42), 0.11 * u, 0.11 * u, k === "pig" ? o.shoe : limb);
  // legs
  if (!opt.noLegs)
    [-1, 1].forEach((sd) => {
      tube(cx + sd * 0.2 * u, Y(0.45), cx + sd * 0.2 * u, Y(0.16), 0.24 * u, limb);
      ell(cx + sd * 0.21 * u, Y(0.1), 0.21 * u, 0.13 * u, pawC);
    });
  // arms
  const wave = mood === 1 ? Math.sin(t * 14) * 0.08 : 0;
  [-1, 1].forEach((sd) => {
    const sx = cx + sd * 0.36 * u,
      sy = Y(0.9);
    let hx2 = cx + sd * 0.7 * u,
      hy2 = Y(0.6);
    if (opt.hands && opt.hands[sd]) [hx2, hy2] = opt.hands[sd];
    else if (mood === 1 && sd === 1) (hx2 = cx + 0.76 * u), (hy2 = Y(1.3 + wave));
    tube(sx, sy, hx2, hy2, 0.22 * u, limb);
    ell(hx2, hy2, 0.12 * u, 0.12 * u, pawC);
  });
  // body + belly
  ell(cx, Y(0.74), 0.45 * u, 0.42 * u, o.skin);
  if (k !== "panda") {
    g.fillStyle = o.belly;
    g.beginPath();
    g.ellipse(cx, Y(0.72), 0.27 * u, 0.26 * u, 0, 0, 7);
    g.fill();
  }
  // zipper + collar of the onesie
  g.strokeStyle = "rgba(74,51,34,0.55)";
  g.lineWidth = LW * 1.2;
  g.beginPath();
  g.moveTo(cx, Y(0.98));
  g.lineTo(cx, Y(0.45));
  g.stroke();
  g.fillStyle = "#ffd23f";
  g.beginPath();
  g.arc(cx, Y(0.95), 0.04 * u, 0, 7);
  g.fill();
  // ears (behind head)
  const sway = Math.sin(t * 2.4) * 0.05;
  if (k === "bear" || k === "panda")
    [-1, 1].forEach((sd) => {
      ell(px + sd * rad * 0.7, py - rad * 0.72, rad * 0.3, rad * 0.3, k === "panda" ? dark : o.skin);
      if (k === "bear") ell(px + sd * rad * 0.7, py - rad * 0.72, rad * 0.15, rad * 0.15, o.inner);
    });
  if (k === "cat")
    [-1, 1].forEach((sd) => {
      g.beginPath();
      g.moveTo(px + sd * rad * 0.98, py - rad * 0.25);
      g.lineTo(px + sd * rad * 0.82, py - rad * 1.1);
      g.lineTo(px + sd * rad * 0.28, py - rad * 0.86);
      g.closePath();
      fillP(o.skin);
      g.beginPath();
      g.moveTo(px + sd * rad * 0.82, py - rad * 0.55);
      g.lineTo(px + sd * rad * 0.76, py - rad * 0.92);
      g.lineTo(px + sd * rad * 0.46, py - rad * 0.8);
      g.closePath();
      g.fillStyle = o.inner;
      g.fill();
    });
  if (k === "bunny")
    [-1, 1].forEach((sd) => {
      g.save();
      g.translate(px + sd * rad * 0.42, py - rad * 0.8);
      g.rotate(sd * 0.18 + sway * sd);
      ell(0, -rad * 0.55, rad * 0.23, rad * 0.62, o.skin);
      ell(0, -rad * 0.55, rad * 0.11, rad * 0.45, o.inner);
      g.restore();
    });
  if (k === "pig")
    [-1, 1].forEach((sd) => {
      g.beginPath();
      g.moveTo(px + sd * rad * 0.45, py - rad * 0.85);
      g.lineTo(px + sd * rad * 0.95, py - rad * 0.95);
      g.lineTo(px + sd * rad * 0.85, py - rad * 0.4);
      g.closePath();
      fillP(o.skin);
    });
  // head
  g.beginPath();
  g.ellipse(px, py, rad * 1.02, rad * 0.93, 0, 0, 7);
  fillP(o.skin);
  g.fillStyle = "rgba(255,255,255,0.28)";
  g.beginPath();
  g.ellipse(px - rad * 0.42, py - rad * 0.55, rad * 0.22, rad * 0.12, -0.5, 0, 7);
  g.fill();
  if (k === "cat") {
    g.strokeStyle = chShade(o.skin, 0.78);
    g.lineWidth = LW * 1.3;
    [-0.2, 0, 0.2].forEach((dx) => (g.beginPath(), g.moveTo(px + dx * rad, py - rad * 0.92), g.lineTo(px + dx * rad * 0.9, py - rad * 0.7), g.stroke()));
  }
  // human face peeking out of the hood
  const fy = py + rad * 0.14;
  g.beginPath();
  g.ellipse(px, fy, rad * 0.78, rad * 0.72, 0, 0, 7);
  fillP(o.face);
  // fringe
  g.save();
  g.beginPath();
  g.ellipse(px, fy, rad * 0.78, rad * 0.72, 0, 0, 7);
  g.clip();
  g.beginPath();
  g.moveTo(px - rad * 0.9, fy - rad * 0.8);
  g.lineTo(px + rad * 0.9, fy - rad * 0.8);
  g.lineTo(px + rad * 0.9, fy - rad * 0.4);
  g.quadraticCurveTo(px + rad * 0.55, fy - rad * 0.6, px + rad * 0.2, fy - rad * 0.42);
  g.quadraticCurveTo(px - rad * 0.05, fy - rad * 0.62, px - rad * 0.3, fy - rad * 0.42);
  g.quadraticCurveTo(px - rad * 0.6, fy - rad * 0.6, px - rad * 0.9, fy - rad * 0.4);
  g.closePath();
  g.fillStyle = o.hair;
  g.fill();
  g.restore();
  g.beginPath();
  g.ellipse(px, fy, rad * 0.78, rad * 0.72, 0, 0, 7);
  g.strokeStyle = CH_OUT;
  g.lineWidth = LW;
  g.stroke();
  // eyes
  const ey = py + rad * 0.27,
    bl = opt.blink || 0;
  const drawEye = (ex, ey2) => {
    if (mood === 1 || bl > 0.6) {
      g.strokeStyle = "#2a1a14";
      g.lineWidth = LW * 1.8;
      g.beginPath();
      if (mood === 1) g.arc(ex, ey2 + rad * 0.06, rad * 0.1, Math.PI * 1.05, Math.PI * 1.95);
      else (g.moveTo(ex - rad * 0.09, ey2), g.lineTo(ex + rad * 0.09, ey2));
      g.stroke();
    } else {
      g.beginPath();
      g.ellipse(ex, ey2, rad * 0.115, rad * 0.15, 0, 0, 7);
      g.fillStyle = "#2a1a14";
      g.fill();
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(ex - rad * 0.04, ey2 - rad * 0.06, rad * 0.055, 0, 7);
      g.fill();
      g.beginPath();
      g.arc(ex + rad * 0.045, ey2 + rad * 0.06, rad * 0.028, 0, 7);
      g.fill();
    }
  };
  if (k === "frog")
    [-1, 1].forEach((sd) => {
      ell(px + sd * rad * 0.5, py - rad * 0.78, rad * 0.3, rad * 0.3, o.skin);
      ell(px + sd * rad * 0.5, py - rad * 0.78, rad * 0.2, rad * 0.2, "#fff");
      g.fillStyle = "#2a1a14";
      g.beginPath();
      g.arc(px + sd * rad * 0.5, py - rad * 0.76, rad * 0.09, 0, 7);
      g.fill();
    });
  [-1, 1].forEach((sd) => drawEye(px + sd * rad * 0.36, ey));
  // blush
  [-1, 1].forEach((sd) => {
    const bx = px + sd * rad * 0.55,
      by2 = py + rad * 0.5;
    const gr = g.createRadialGradient(bx, by2, 0, bx, by2, rad * 0.22);
    gr.addColorStop(0, "rgba(255,90,115,0.6)");
    gr.addColorStop(1, "rgba(255,90,115,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(bx, by2, rad * 0.24, rad * 0.16, 0, 0, 7);
    g.fill();
  });
  // mouth
  g.strokeStyle = "#3a2418";
  g.lineWidth = LW * 1.3;
  const my = py + rad * 0.52;
  if (mood === 1) {
    g.beginPath();
    g.moveTo(px - rad * 0.17, my - rad * 0.02);
    g.quadraticCurveTo(px, my + rad * 0.32, px + rad * 0.17, my - rad * 0.02);
    g.closePath();
    g.fillStyle = "#c2433a";
    g.fill();
    g.stroke();
  } else {
    g.lineCap = "round";
    g.beginPath();
    g.arc(px, my - rad * 0.12, rad * 0.13, Math.PI * 0.12, Math.PI * 0.88);
    g.stroke();
  }
  g.restore();
  return { x: px, y: py, r: rad, hipY: Y(0.55) };
}

/* side-view bicycle with the chibi pedalling. dir = +1 / -1 (travel direction), ph = pedal phase */
function drawRider(g, cx, baseY, u, o, t, ph, dir, moving) {
  const S = dir;
  const wr = 0.5 * u,
    wy = baseY - wr,
    rear = cx - S * 0.7 * u,
    front = cx + S * 0.7 * u;
  const stroke = (w, col) => ((g.lineWidth = w), (g.strokeStyle = col), (g.lineCap = "round"), (g.lineJoin = "round"));
  const wheel = (x) => {
    // soft ground contact shadow
    g.fillStyle = "rgba(40,30,20,0.18)";
    g.beginPath();
    g.ellipse(x, baseY + 0.02 * u, wr * 0.9, wr * 0.16, 0, 0, 7);
    g.fill();
    // tyre (thick, dark) + rim (metal gradient)
    stroke(u * 0.17, CH_OUT);
    g.beginPath();
    g.arc(x, wy, wr, 0, 7);
    g.stroke();
    stroke(u * 0.12, "#4a3d4d");
    g.beginPath();
    g.arc(x, wy, wr, 0, 7);
    g.stroke();
    stroke(u * 0.03, "#ffffff55");
    g.beginPath();
    g.arc(x, wy, wr + u * 0.03, Math.PI * 1.1, Math.PI * 1.6);
    g.stroke();
    const rg2 = g.createLinearGradient(x - wr, wy - wr, x + wr, wy + wr);
    rg2.addColorStop(0, "#ffffff");
    rg2.addColorStop(0.5, "#cfd8de");
    rg2.addColorStop(1, "#8e9aa4");
    stroke(u * 0.05, rg2);
    g.beginPath();
    g.arc(x, wy, wr - u * 0.08, 0, 7);
    g.stroke();
    stroke(Math.max(1, u * 0.022), "#8e9aa4");
    for (let k = 0; k < 10; k++) {
      const a = ph * 1.5 + (k * Math.PI) / 5;
      g.beginPath();
      g.moveTo(x, wy);
      g.lineTo(x + Math.cos(a) * (wr - u * 0.08), wy + Math.sin(a) * (wr - u * 0.08));
      g.stroke();
    }
    g.beginPath();
    g.arc(x, wy, u * 0.07, 0, 7);
    g.fillStyle = "#e8eef2";
    g.fill();
    g.strokeStyle = CH_OUT;
    g.lineWidth = u * 0.03;
    g.stroke();
  };
  wheel(rear);
  wheel(front);
  // frame
  const seatX = cx - S * 0.25 * u,
    seatY = wy - 0.62 * u,
    barX = cx + S * 0.62 * u,
    barY = wy - 0.72 * u,
    crankX = cx,
    crankY = wy + 0.02 * u;
  const bar = (x1, y1, x2, y2) => {
    stroke(u * 0.12, CH_OUT);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
    const bc = (typeof BIKE_COL !== "undefined" && BIKE_COL) || "#ff7a5a";
    stroke(u * 0.085, chShade(bc, 0.82));
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
    stroke(u * 0.055, bc);
    g.beginPath();
    g.moveTo(x1, y1 - u * 0.012);
    g.lineTo(x2, y2 - u * 0.012);
    g.stroke();
    stroke(u * 0.016, "#ffffffaa");
    g.beginPath();
    g.moveTo(x1, y1 - u * 0.03);
    g.lineTo(x2, y2 - u * 0.03);
    g.stroke();
  };
  bar(rear, wy, crankX, crankY);
  bar(crankX, crankY, seatX, seatY);
  bar(seatX, seatY, barX, barY);
  bar(crankX, crankY, barX, barY);
  bar(barX, barY, front, wy);
  stroke(u * 0.1, CH_OUT);
  g.beginPath();
  g.moveTo(barX, barY);
  g.lineTo(barX + S * 0.15 * u, barY - 0.1 * u);
  g.stroke();
  // cute extras: wicker basket with flowers, bell, streamers
  {
    const bx0 = barX + S * 0.2 * u,
      by0 = barY + 0.02 * u;
    g.beginPath();
    g.moveTo(bx0 - 0.2 * u, by0 - 0.1 * u);
    g.lineTo(bx0 + 0.2 * u, by0 - 0.1 * u);
    g.lineTo(bx0 + 0.15 * u, by0 + 0.16 * u);
    g.lineTo(bx0 - 0.15 * u, by0 + 0.16 * u);
    g.closePath();
    g.fillStyle = "#e8b872";
    g.fill();
    g.strokeStyle = CH_OUT;
    g.lineWidth = u * 0.05;
    g.stroke();
    g.strokeStyle = "#b9803c";
    g.lineWidth = Math.max(1, u * 0.02);
    for (let i = -1; i <= 1; i++) (g.beginPath(), g.moveTo(bx0 + i * 0.1 * u, by0 - 0.08 * u), g.lineTo(bx0 + i * 0.08 * u, by0 + 0.14 * u), g.stroke());
    ["#ff7ab0", "#ffd23f", "#ffffff"].forEach((c, i) => {
      const fx = bx0 + (i - 1) * 0.12 * u,
        fy = by0 - 0.16 * u - (i === 1 ? 0.05 * u : 0) + Math.sin(t * 3 + i) * 0.01 * u;
      g.fillStyle = "#4fb85a";
      g.fillRect(fx - 0.01 * u, fy, 0.02 * u, 0.1 * u);
      g.fillStyle = c;
      g.strokeStyle = CH_OUT;
      g.lineWidth = u * 0.03;
      g.beginPath();
      g.arc(fx, fy, 0.075 * u, 0, 7);
      g.fill();
      g.stroke();
      g.fillStyle = "#ff9a2e";
      g.beginPath();
      g.arc(fx, fy, 0.025 * u, 0, 7);
      g.fill();
    });
    // streamers from the handle
    ["#ff7ab0", "#4aa3df"].forEach((c, i) => {
      g.strokeStyle = c;
      g.lineWidth = u * 0.05;
      g.beginPath();
      const hx = barX + S * 0.14 * u,
        hy = barY - 0.1 * u,
        w = Math.sin(t * 6 + i * 1.7 + (moving ? ph : 0)) * 0.05 * u;
      g.moveTo(hx, hy);
      g.quadraticCurveTo(hx + S * (0.12 + i * 0.05) * u, hy + 0.06 * u + w, hx + S * (0.22 + i * 0.07) * u, hy + 0.14 * u - w);
      g.stroke();
    });
    // bell
    g.beginPath();
    g.arc(barX - S * 0.04 * u, barY - 0.12 * u, 0.06 * u, 0, 7);
    g.fillStyle = "#ffd23f";
    g.fill();
    g.strokeStyle = CH_OUT;
    g.lineWidth = u * 0.03;
    g.stroke();
  }
  // saddle
  stroke(u * 0.13, CH_OUT);
  g.beginPath();
  g.moveTo(seatX - 0.15 * u, seatY - 0.04 * u);
  g.lineTo(seatX + 0.12 * u, seatY - 0.04 * u);
  g.stroke();
  // legs (pedal circles)
  const hipX = seatX,
    hipY = seatY - 0.08 * u;
  [0, Math.PI].forEach((o2, i) => {
    const a = ph + o2,
      px = crankX + Math.cos(a) * 0.22 * u,
      py = crankY + Math.sin(a) * 0.22 * u;
    // knee via simple two-bone IK
    const L1 = 0.4 * u,
      L2 = 0.42 * u,
      dx = px - hipX,
      dy = py - hipY,
      d = Math.min(L1 + L2 - 1, Math.hypot(dx, dy)),
      ang = Math.atan2(dy, dx),
      aa = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)),
      kx = hipX + Math.cos(ang - S * aa) * L1,
      ky = hipY + Math.sin(ang - S * aa) * L1;
    g.strokeStyle = CH_OUT;
    g.lineWidth = u * 0.2;
    g.beginPath();
    g.moveTo(hipX, hipY);
    g.lineTo(kx, ky);
    g.lineTo(px, py);
    g.stroke();
    g.strokeStyle = o.skin;
    g.lineWidth = u * 0.14;
    g.beginPath();
    g.moveTo(hipX, hipY);
    g.lineTo(kx, ky);
    g.lineTo(px, py);
    g.stroke();
    g.fillStyle = o.shoe;
    g.strokeStyle = CH_OUT;
    g.lineWidth = u * 0.04;
    g.beginPath();
    g.ellipse(px + S * 0.06 * u, py, 0.15 * u, 0.08 * u, 0, 0, 7);
    g.fill();
    g.stroke();
  });
  // body (seated, small bob)
  const bob = moving ? Math.abs(Math.sin(ph)) * 0.04 : Math.sin(t * 2) * 0.015;
  const r = drawChibi(g, seatX, seatY + 0.55 * u, u * 0.82, o, { t, noLegs: true, mood: moving ? 1 : 0, lift: bob, blink: Math.sin(t * 1.3) > 0.97 ? 1 : 0, hands: { [S]: [barX + S * 0.1 * u, barY - 0.05 * u], [-S]: [barX - S * 0.02 * u, barY + 0.02 * u] } });
  return r;
}
