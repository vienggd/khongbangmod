/* cartoon scenery in the same style as the noodle-boat game: soft colours, thick brown outlines, round shapes */
const ART_OUT = "#4a3322";
function artOutlineFill(g, fillCol, lw = 3) {
  g.fillStyle = fillCol;
  g.fill();
  g.strokeStyle = ART_OUT;
  g.lineWidth = lw;
  g.lineJoin = "round";
  g.stroke();
}
// several overlapping circles drawn as ONE outlined blob
function artBlob(g, circles, fillCol, lw = 3.5) {
  g.strokeStyle = ART_OUT;
  g.lineWidth = lw * 2;
  g.fillStyle = ART_OUT;
  g.beginPath();
  circles.forEach(([x, y, r]) => (g.moveTo(x + r, y), g.arc(x, y, r, 0, 7)));
  g.fill();
  g.stroke();
  g.fillStyle = fillCol;
  g.beginPath();
  circles.forEach(([x, y, r]) => (g.moveTo(x + r, y), g.arc(x, y, r, 0, 7)));
  g.fill();
}
function artCloud(g, x, y, s, a = 1) {
  g.save();
  g.globalAlpha = a;
  artBlob(g, [[x, y, 18 * s], [x + 20 * s, y - 10 * s, 22 * s], [x + 44 * s, y, 18 * s], [x + 22 * s, y + 6 * s, 20 * s]], "#ffffff", 2.5);
  g.restore();
}
function artSun(g, x, y, r, t) {
  const gr = g.createRadialGradient(x, y, r * 0.5, x, y, r * 2.6);
  gr.addColorStop(0, "rgba(255,240,170,0.8)");
  gr.addColorStop(1, "rgba(255,240,170,0)");
  g.fillStyle = gr;
  g.beginPath();
  g.arc(x, y, r * 2.6, 0, 7);
  g.fill();
  g.beginPath();
  g.arc(x, y, r, 0, 7);
  artOutlineFill(g, "#ffe27a", 3);
}
function artSky(g, W, h, t) {
  const sk = g.createLinearGradient(0, 0, 0, h);
  sk.addColorStop(0, "#86d2f5");
  sk.addColorStop(1, "#e4f7ff");
  g.fillStyle = sk;
  g.fillRect(0, 0, W, h);
  artSun(g, W - 80, 62, 26, t);
  artCloud(g, ((t * 6 + 20) % (W + 140)) - 70, 54, 1, 0.95);
  artCloud(g, ((t * 4 + 230) % (W + 140)) - 70, 104, 0.8, 0.9);
}
function artHills(g, W, y) {
  g.beginPath();
  g.moveTo(0, y + 60);
  g.quadraticCurveTo(80, y - 30, 190, y + 20);
  g.quadraticCurveTo(300, y - 40, W, y + 10);
  g.lineTo(W, y + 80);
  g.lineTo(0, y + 80);
  artOutlineFill(g, "#9ed96b", 3);
  g.beginPath();
  g.moveTo(0, y + 80);
  g.quadraticCurveTo(120, y + 20, 250, y + 56);
  g.quadraticCurveTo(340, y + 30, W, y + 50);
  g.lineTo(W, y + 100);
  g.lineTo(0, y + 100);
  artOutlineFill(g, "#7fc95a", 3);
}
function artTree(g, x, y, s, t, fruit) {
  // y = ground
  const sw = Math.sin(t * 1.4 + x * 0.05) * 2 * s;
  g.beginPath();
  g.roundRect(x - 6 * s, y - 34 * s, 12 * s, 36 * s, 4 * s);
  artOutlineFill(g, "#a8703a", 2.5);
  const cs = [[x + sw, y - 62 * s, 30 * s], [x - 22 * s + sw, y - 44 * s, 22 * s], [x + 22 * s + sw, y - 44 * s, 22 * s], [x + sw, y - 40 * s, 24 * s]];
  artBlob(g, cs, "#55b84e", 3);
  g.fillStyle = "#79d268";
  g.beginPath();
  g.arc(x - 10 * s + sw, y - 72 * s, 12 * s, 0, 7);
  g.fill();
  if (fruit) {
    [[-14, -56], [12, -66], [18, -44], [-20, -40], [2, -48]].forEach(([dx, dy], i) => {
      g.beginPath();
      g.arc(x + dx * s + sw, y + dy * s, 5 * s, 0, 7);
      artOutlineFill(g, "#ff9a2e", 1.8);
    });
  }
}
function artFlower(g, x, y, s, col, t) {
  g.strokeStyle = "#3f9a45";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + Math.sin(t * 2 + x) * 1.5, y - 9 * s);
  g.stroke();
  g.fillStyle = col;
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.arc(x + Math.sin(t * 2 + x) * 1.5 + Math.cos(i * 1.256) * 3.2 * s, y - 10 * s + Math.sin(i * 1.256) * 3.2 * s, 2.6 * s, 0, 7);
    g.fill();
  }
  g.fillStyle = "#ffe27a";
  g.beginPath();
  g.arc(x + Math.sin(t * 2 + x) * 1.5, y - 10 * s, 2.2 * s, 0, 7);
  g.fill();
}
/* ---- orange game ---- */
function artOrchard(g, W, H, t) {
  artSky(g, W, 250, t);
  artHills(g, W, 200);
  // far row of trees
  for (let i = 0; i < 6; i++) artTree(g, i * 80 + 20, 190, 0.8, t, true);
  // grass
  const gr = g.createLinearGradient(0, 190, 0, H);
  gr.addColorStop(0, "#8fd96a");
  gr.addColorStop(1, "#6fc255");
  g.fillStyle = gr;
  g.fillRect(0, 190, W, H - 190);
  g.strokeStyle = ART_OUT;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, 190);
  g.lineTo(W, 190);
  g.stroke();
  // mowed stripes
  g.fillStyle = "#ffffff10";
  for (let i = 0; i < 7; i++) g.fillRect(0, 230 + i * 55, W, 26);
  // near row of big trees (frame the top, fruit falls from them)
  for (let i = 0; i < 5; i++) {
    const bx = i * 100 + 10;
    g.fillStyle = "rgba(40,90,40,0.28)";
    g.beginPath();
    g.ellipse(bx, 236, 46, 11, 0, 0, 7);
    g.fill();
    artTree(g, bx, 232, 1.5, t, true);
  }
  // path + fence at the bottom
  g.fillStyle = "#f0d9a0";
  g.fillRect(0, H - 100, W, 100);
  g.strokeStyle = ART_OUT;
  g.lineWidth = 3;
  g.strokeRect(-3, H - 100, W + 6, 110);
  for (let i = 0; i < 14; i++) artFlower(g, (i * 67) % W + 12, 260 + ((i * 97) % 280), 1, ["#ff7ab0", "#ffd23f", "#ffffff"][i % 3], t);
}
function artOrange(g, x, y, r, rot) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.beginPath();
  g.arc(0, 0, r, 0, 7);
  const gr = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  gr.addColorStop(0, "#ffc062");
  gr.addColorStop(0.6, "#ff9a2e");
  gr.addColorStop(1, "#e67a14");
  artOutlineFill(g, gr, 3);
  g.fillStyle = "#ffffff99";
  g.beginPath();
  g.ellipse(-r * 0.38, -r * 0.42, r * 0.2, r * 0.12, -0.6, 0, 7);
  g.fill();
  // leaf
  g.beginPath();
  g.ellipse(r * 0.28, -r * 0.95, r * 0.34, r * 0.16, -0.5, 0, 7);
  artOutlineFill(g, "#5cc04e", 2);
  g.restore();
}
function artAnt(g, x, y, s, t) {
  g.save();
  g.translate(x, y);
  g.scale(s / 34, s / 34);
  // legs
  g.strokeStyle = ART_OUT;
  g.lineWidth = 2.5;
  g.lineCap = "round";
  for (let i = -1; i <= 1; i++) {
    const w = Math.sin(t * 14 + i * 2) * 4;
    [-1, 1].forEach((sd) => {
      g.beginPath();
      g.moveTo(sd * 6, i * 9);
      g.lineTo(sd * 17, i * 9 + w - 4);
      g.stroke();
    });
  }
  // body segments
  [[0, 18, 10, 12], [0, 3, 9, 9]].forEach(([bx, by, rx, ry]) => {
    g.beginPath();
    g.ellipse(bx, by, rx, ry, 0, 0, 7);
    artOutlineFill(g, "#5a3a3a", 2.5);
  });
  // head
  g.beginPath();
  g.ellipse(0, -13, 12, 11, 0, 0, 7);
  artOutlineFill(g, "#7a4a4a", 2.5);
  // antennae
  g.beginPath();
  g.moveTo(-5, -22);
  g.quadraticCurveTo(-12, -32, -16, -28);
  g.moveTo(5, -22);
  g.quadraticCurveTo(12, -32, 16, -28);
  g.stroke();
  // angry cute face
  g.fillStyle = "#fff";
  [-5, 5].forEach((ex) => {
    g.beginPath();
    g.arc(ex, -14, 3.6, 0, 7);
    g.fill();
    g.stroke();
  });
  g.fillStyle = "#222";
  [-4.5, 5.5].forEach((ex) => {
    g.beginPath();
    g.arc(ex, -13.5, 1.6, 0, 7);
    g.fill();
  });
  g.strokeStyle = "#2a1a1a";
  g.lineWidth = 1.8;
  g.beginPath();
  g.moveTo(-9, -20);
  g.lineTo(-3, -17);
  g.moveTo(9, -20);
  g.lineTo(3, -17);
  g.stroke();
  g.beginPath();
  g.arc(0, -7, 3.4, Math.PI * 1.15, Math.PI * 1.85);
  g.stroke();
  g.restore();
}
let ART_LV = 0;
function artBasket(g, x, y, w, tilt, sq) {
  const lv = ART_LV;
  w *= 1 + lv * 0.06;
  g.save();
  g.translate(x, y);
  g.rotate(tilt);
  g.scale(1 + sq * 0.2, 1 - sq * 0.2);
  const hw = w / 2;
  // handle (behind)
  g.strokeStyle = ART_OUT;
  g.lineWidth = 9;
  g.beginPath();
  g.arc(0, -4, hw * 0.78, Math.PI * 1.05, Math.PI * 1.95);
  g.stroke();
  g.strokeStyle = "#d9a15a";
  g.lineWidth = 5;
  g.stroke();
  // body
  g.beginPath();
  g.moveTo(-hw, -12);
  g.lineTo(hw, -12);
  g.quadraticCurveTo(hw * 0.9, 30, hw * 0.55, 32);
  g.lineTo(-hw * 0.55, 32);
  g.quadraticCurveTo(-hw * 0.9, 30, -hw, -12);
  g.closePath();
  artOutlineFill(g, ["#e8b872", "#f2a65a", "#7fd0e8", "#ffd23f"][lv], 3.5);
  g.save();
  g.clip();
  g.strokeStyle = "#b9803c";
  g.lineWidth = 2;
  for (let i = -6; i <= 6; i++) {
    g.beginPath();
    g.moveTo(i * 12 - 16, -14);
    g.lineTo(i * 12 + 16, 34);
    g.moveTo(i * 12 + 16, -14);
    g.lineTo(i * 12 - 16, 34);
    g.stroke();
  }
  g.restore();
  // rim
  g.beginPath();
  g.roundRect(-hw - 4, -20, w + 8, 14, 7);
  artOutlineFill(g, ["#f4cf8a", "#ff6b6b", "#ffffff", "#fff1a0"][lv], 3.5);
  if (lv >= 1) {
    // ribbon bow
    [-1, 1].forEach((sd) => {
      g.beginPath();
      g.moveTo(0, -13);
      g.quadraticCurveTo(sd * 20, -30, sd * 24, -10);
      g.quadraticCurveTo(sd * 12, -10, 0, -13);
      artOutlineFill(g, lv >= 3 ? "#ff5a8a" : "#4aa3df", 2.4);
    });
    g.beginPath();
    g.arc(0, -13, 5, 0, 7);
    artOutlineFill(g, "#ffd23f", 2);
  }
  if (lv >= 2) for (let i = -2; i <= 2; i++) (g.beginPath(), g.arc(i * 14, 14, 3.4, 0, 7), artOutlineFill(g, ["#ff7ab0", "#ffd23f", "#fff", "#ff7ab0", "#ffd23f"][i + 2], 1.4));
  if (lv >= 3) {
    const tt = performance.now() / 300;
    [[-hw - 6, -24], [hw + 8, -18], [0, -38]].forEach(([a, b], i) => {
      g.save();
      g.translate(a, b);
      g.rotate(tt + i);
      g.scale(0.6 + 0.4 * Math.abs(Math.sin(tt * 1.3 + i)), 0.6 + 0.4 * Math.abs(Math.sin(tt * 1.3 + i)));
      g.fillStyle = "#fff6a8";
      g.strokeStyle = "#e0a21a";
      g.lineWidth = 1.5;
      g.beginPath();
      for (let k = 0; k < 8; k++) g.lineTo(Math.cos((k * Math.PI) / 4) * (k % 2 ? 3 : 8), Math.sin((k * Math.PI) / 4) * (k % 2 ? 3 : 8));
      g.closePath();
      g.fill();
      g.stroke();
      g.restore();
    });
  }
  g.restore();
}
/* ---- fishing game ---- */
const ART_FISH = [["#ff8a4a", "#ffd0a8"], ["#4aa8ff", "#cfe9ff"], ["#ffcf3a", "#fff1b3"], ["#e86aa8", "#ffd0e6"], ["#ffc400", "#fff6a8"]];
function artFish(g, x, y, size, rot, flip, ci, t) {
  const [c1, c2] = ART_FISH[(ci || 0) % ART_FISH.length];
  const k = size / 30;
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(flip * k, k);
  const wag = Math.sin((t || 0) * 9 + x * 0.05) * 3;
  g.beginPath();
  g.moveTo(-15, 0);
  g.quadraticCurveTo(-27, -11 + wag, -31, -13 + wag);
  g.quadraticCurveTo(-26, wag * 0.3, -31, 13 + wag);
  g.quadraticCurveTo(-27, 11 + wag, -15, 0);
  artOutlineFill(g, c1, 2.4);
  g.beginPath();
  g.ellipse(0, 0, 19, 12, 0, 0, 7);
  artOutlineFill(g, c1, 2.6);
  g.fillStyle = c2;
  g.beginPath();
  g.ellipse(2, 5, 12, 5.5, 0, 0, Math.PI);
  g.fill();
  g.beginPath();
  g.moveTo(-4, -10);
  g.quadraticCurveTo(2, -21, 10, -10);
  g.closePath();
  artOutlineFill(g, c1, 2);
  g.beginPath();
  g.arc(10, -3, 4.2, 0, 7);
  artOutlineFill(g, "#fff", 1.8);
  g.fillStyle = "#2b1d12";
  g.beginPath();
  g.arc(11.2, -2.6, 2.2, 0, 7);
  g.fill();
  g.fillStyle = "rgba(255,110,140,0.55)";
  g.beginPath();
  g.arc(12, 4, 2.8, 0, 7);
  g.fill();
  g.restore();
}
function artPondBg(g, W, H, t) {
  artSky(g, W, 232, t);
  artHills(g, W, 140);
  for (let i = 0; i < 4; i++) artTree(g, i * 118 + 30, 196, 0.8, t, false);
  // water
  const wat = g.createLinearGradient(0, 230, 0, H);
  wat.addColorStop(0, "#7fd6f0");
  wat.addColorStop(1, "#3a97cf");
  g.fillStyle = wat;
  g.beginPath();
  g.moveTo(0, 232);
  for (let x = 0; x <= W; x += 10) g.lineTo(x, 232 + Math.sin(x / 30 + t * 2) * 3);
  g.lineTo(W, H);
  g.lineTo(0, H);
  g.closePath();
  g.fill();
  g.strokeStyle = ART_OUT;
  g.lineWidth = 3;
  g.beginPath();
  for (let x = 0; x <= W; x += 10) g.lineTo(x, 232 + Math.sin(x / 30 + t * 2) * 3);
  g.stroke();
  // soft light rays + shimmer
  g.fillStyle = "#ffffff12";
  for (let i = 0; i < 4; i++) {
    const x = ((i * 130 + t * 10) % (W + 100)) - 50;
    g.beginPath();
    g.moveTo(x, 235);
    g.lineTo(x + 40, 235);
    g.lineTo(x + 90, H);
    g.lineTo(x + 20, H);
    g.fill();
  }
  g.strokeStyle = "#ffffff77";
  g.lineWidth = 2.5;
  g.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    const x = (i * 71 + 20) % W,
      y = 268 + ((i * 53) % 330);
    g.beginPath();
    g.moveTo(x - 10, y);
    g.quadraticCurveTo(x, y - 5 + Math.sin(t * 2 + i) * 2, x + 10, y);
    g.stroke();
  }
  g.fillStyle = "#ffffff66";
  for (let i = 0; i < 8; i++) {
    const y = H - ((t * 40 + i * 90) % (H - 240));
    g.beginPath();
    g.arc(((i * 53) % W) + Math.sin(t + i) * 6, y, 3.5, 0, 7);
    g.fill();
    g.strokeStyle = "#ffffffaa";
    g.lineWidth = 1.2;
    g.stroke();
  }
  // lily pads on the surface
  [[40, 244], [372, 246]].forEach(([lx, ly], i) => {
    g.beginPath();
    g.ellipse(lx, ly, 26, 8, 0, 0, 7);
    artOutlineFill(g, "#5cc04e", 2.5);
    if (i === 0) {
      g.beginPath();
      g.arc(lx + 6, ly - 8, 7, 0, 7);
      artOutlineFill(g, "#ff9ec4", 2);
    }
  });
}
function artPier(g, W, y, t) {
  // wooden pier the fisher sits on
  const x0 = W / 2 - 110,
    x1 = W / 2 + 110;
  [x0 + 12, W / 2, x1 - 12].forEach((px) => {
    g.beginPath();
    g.roundRect(px - 7, y, 14, 70, 4);
    artOutlineFill(g, "#8a5a2e", 2.5);
  });
  g.beginPath();
  g.roundRect(x0, y - 4, x1 - x0, 20, 6);
  artOutlineFill(g, "#d9a15a", 3);
  g.strokeStyle = "#a8703a";
  g.lineWidth = 2;
  for (let x = x0 + 36; x < x1; x += 36) {
    g.beginPath();
    g.moveTo(x, y - 2);
    g.lineTo(x, y + 14);
    g.stroke();
  }
  // ripples around posts
  g.strokeStyle = "#ffffffaa";
  g.lineWidth = 2;
  [x0 + 12, W / 2, x1 - 12].forEach((px, i) => {
    g.beginPath();
    g.ellipse(px, y + 28 + 2, 14 + Math.sin(t * 2 + i) * 2, 4, 0, 0, 7);
    g.stroke();
  });
}
