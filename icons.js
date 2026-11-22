/* hand-drawn cartoon icons (replace system emoji) */
const ICO = (() => {
  const O = "#4a3322", sw = `stroke="${O}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"`;
  const I = {
    coin: `<circle cx="32" cy="32" r="25" fill="#ffcf3a" ${sw}/><circle cx="32" cy="32" r="16" fill="#ffe27a" stroke="#d99a14" stroke-width="2.6"/><path d="M32 22v20M27 27h8a4 4 0 010 8h-8" fill="none" stroke="#d99a14" stroke-width="3" stroke-linecap="round"/><path d="M16 22a18 18 0 0110-8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
    star: `<path d="M32 6l7.5 16.5 18 2-13.4 12.2 3.8 17.8L32 45.2 16.1 54.5l3.8-17.8L6.5 24.5l18-2z" fill="#ffd23f" ${sw}/><path d="M25 22l7-10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
    heart: `<path d="M32 55C8 39 5 23 15 15c8-6 15-1 17 5 2-6 9-11 17-5 10 8 7 24-17 40z" fill="#ff5a6a" ${sw}/><path d="M17 22c1-4 5-6 9-4" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>`,
    heartE: `<path d="M32 55C8 39 5 23 15 15c8-6 15-1 17 5 2-6 9-11 17-5 10 8 7 24-17 40z" fill="#e6dfd2" ${sw}/>`,
    fish: `<path d="M8 32c8-14 26-16 38-4l10-9v26l-10-9C34 48 16 46 8 32z" fill="#ff8a3d" ${sw}/><path d="M22 20c4 3 6 8 6 12s-2 9-6 12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><circle cx="18" cy="29" r="3.6" fill="#fff" stroke="${O}" stroke-width="2"/><circle cx="17.4" cy="29.4" r="1.6" fill="${O}"/>`,
    orange: `<circle cx="32" cy="36" r="21" fill="#ff9a2e" ${sw}/><path d="M32 15c2-6 8-9 14-8-1 6-6 10-14 8z" fill="#4fb85a" ${sw}/><path d="M19 30a14 14 0 018-9" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".7"/>`,
    bowl: `<path d="M14 20c4-8 8 0 12-6s8 2 12-4 8 4 12 2" fill="none" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/><path d="M8 30h48c0 14-9 24-24 24S8 44 8 30z" fill="#fff" ${sw}/><path d="M9 36h46" stroke="#e8553a" stroke-width="5"/><path d="M40 6l14 22M46 6l12 20" stroke="#a8703a" stroke-width="3.4" stroke-linecap="round"/><path d="M8 30h48" stroke="${O}" stroke-width="3.2"/>`,
    rod: `<path d="M10 56L44 8" stroke="#a8703a" stroke-width="5" stroke-linecap="round"/><path d="M10 56L44 8" stroke="${O}" stroke-width="1.6" opacity=".4"/><path d="M44 8c8 4 12 16 8 28" fill="none" stroke="${O}" stroke-width="2"/><path d="M44 42c4-4 10-4 14 0-3 6-10 8-14 0z" fill="#ff8a3d" ${sw.replace("3.2","2.6")}/><circle cx="53" cy="41" r="1.4" fill="${O}"/>`,
    basket: `<circle cx="24" cy="22" r="10" fill="#ff9a2e" ${sw}/><circle cx="40" cy="20" r="10" fill="#ff9a2e" ${sw}/><path d="M6 28h52l-6 26H12z" fill="#c98a4a" ${sw}/><path d="M10 38h44M12 46h40M24 28l-2 26M40 28l2 26" stroke="${O}" stroke-width="2" opacity=".55" fill="none"/>`,
    pot: `<path d="M22 14c-4-5 4-6 0-11M32 14c-4-5 4-6 0-11M42 14c-4-5 4-6 0-11" fill="none" stroke="#9ad0ee" stroke-width="3.4" stroke-linecap="round"/><path d="M8 26h48v8c0 12-8 22-24 22S8 46 8 34z" fill="#e8553a" ${sw}/><rect x="4" y="22" width="56" height="8" rx="4" fill="#ffb15e" ${sw}/><path d="M16 38c0 6 3 10 7 12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
    shop: `<path d="M8 26h48v28H8z" fill="#fff3d6" ${sw}/><path d="M6 12h52l4 14H2z" fill="#ff7a5a" ${sw}/><path d="M17 12l-3 14M28 12l-1 14M38 12l1 14M49 12l3 14" stroke="#fff" stroke-width="4"/><rect x="26" y="34" width="14" height="20" rx="2" fill="#a8703a" ${sw.replace("3.2","2.6")}/><rect x="11" y="34" width="11" height="9" rx="2" fill="#bfe8ff" stroke="${O}" stroke-width="2.4"/>`,
    bear: `<circle cx="14" cy="16" r="9" fill="#c98a5a" ${sw}/><circle cx="50" cy="16" r="9" fill="#c98a5a" ${sw}/><circle cx="14" cy="16" r="4" fill="#f0a98a"/><circle cx="50" cy="16" r="4" fill="#f0a98a"/><circle cx="32" cy="34" r="23" fill="#c98a5a" ${sw}/><ellipse cx="32" cy="38" rx="15" ry="14" fill="#f9d6b5" stroke="${O}" stroke-width="2.6"/><circle cx="25" cy="36" r="2.6" fill="${O}"/><circle cx="39" cy="36" r="2.6" fill="${O}"/><path d="M27 44q5 5 10 0" fill="none" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/><circle cx="21" cy="42" r="3" fill="#ff9aa8" opacity=".7"/><circle cx="43" cy="42" r="3" fill="#ff9aa8" opacity=".7"/>`,
    check: `<path d="M12 34l14 14L53 18" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
    party: `<path d="M8 56L22 20l22 22z" fill="#ff7a5a" ${sw}/><path d="M16 38l14 14M20 28l18 18" stroke="#ffd23f" stroke-width="3.4"/><circle cx="46" cy="14" r="4" fill="#4aa3df"/><circle cx="54" cy="30" r="3.4" fill="#ff5a6a"/><circle cx="34" cy="8" r="3.4" fill="#4cc35a"/>`,
    trophy: `<path d="M18 8h28v16c0 10-6 16-14 16S18 34 18 24z" fill="#ffd23f" ${sw}/><path d="M18 14H8c0 10 4 16 12 16M46 14h10c0 10-4 16-12 16" fill="none" stroke="${O}" stroke-width="3.2"/><rect x="28" y="40" width="8" height="8" fill="#e0a21a" stroke="${O}" stroke-width="2.6"/><rect x="18" y="48" width="28" height="8" rx="3" fill="#a8703a" ${sw}/>`,
    sound: `<path d="M8 24h10l12-10v36L18 40H8z" fill="#4aa3df" ${sw}/><path d="M38 22c5 5 5 15 0 20M45 15c9 9 9 25 0 34" fill="none" stroke="${O}" stroke-width="3.4" stroke-linecap="round"/>`,
    mute: `<path d="M8 24h10l12-10v36L18 40H8z" fill="#aab4bd" ${sw}/><path d="M40 24l16 16M56 24L40 40" stroke="#e8553a" stroke-width="4.4" stroke-linecap="round"/>`,
    egg: `<ellipse cx="32" cy="34" rx="22" ry="19" fill="#fff" ${sw}/><circle cx="32" cy="34" r="9" fill="#ffb81f" stroke="#d99a14" stroke-width="2.4"/>`,
    pork: `<path d="M8 30c0-14 14-20 28-18 14 2 22 12 20 24-2 12-16 18-30 14C14 48 8 40 8 30z" fill="#e0584a" ${sw}/><path d="M12 40c8 10 26 12 38 0" fill="none" stroke="#fff3e0" stroke-width="5" stroke-linecap="round"/>`,
    chili: `<path d="M12 18c8-8 24-6 36 4s12 26 8 34c-6-6-12-12-24-16S8 30 12 18z" fill="#e8421f" ${sw}/><path d="M12 18c-2-6 2-10 8-10" fill="none" stroke="#4fb85a" stroke-width="5" stroke-linecap="round"/>`,
    leaf: `<path d="M10 54C6 30 22 8 54 8c2 30-14 48-38 44z" fill="#6fcf5a" ${sw}/><path d="M12 52C26 38 36 28 46 16" fill="none" stroke="#2f8a3a" stroke-width="3"/>`,
    veg: `<path d="M32 24c-8-2-14-8-14-16 8 0 14 6 14 16zM32 24c8-2 14-8 14-16-8 0-14 6-14 16z" fill="#5cc04e" ${sw}/><path d="M18 30h28c0 14-6 26-14 26S18 44 18 30z" fill="#ff8a3d" ${sw}/><path d="M24 36l6 2M36 44l6 2M26 48l5 1" stroke="${O}" stroke-width="2.2" stroke-linecap="round"/>`,
    book: `<path d="M8 12h22c2 0 2 2 2 4v38c0-2-2-4-4-4H8z" fill="#3fa7d6" ${sw}/><path d="M56 12H34c-2 0-2 2-2 4v38c0-2 2-4 4-4h20z" fill="#5fc0ea" ${sw}/><circle cx="20" cy="28" r="7" fill="#ffd23f" stroke="${O}" stroke-width="2.6"/><path d="M42 24h8M42 32h8M40 40h10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
    chat: `<path d="M10 12h44a4 4 0 014 4v26a4 4 0 01-4 4H30l-12 10V46h-8a4 4 0 01-4-4V16a4 4 0 014-4z" fill="#fff" ${sw}/><circle cx="22" cy="29" r="3.4" fill="${O}"/><circle cx="32" cy="29" r="3.4" fill="${O}"/><circle cx="42" cy="29" r="3.4" fill="${O}"/>`,
    cloud: `<path d="M16 48a12 12 0 010-24 16 16 0 0130-4 13 13 0 013 28z" fill="#fff" ${sw}/>`,
    house: `<rect x="12" y="30" width="40" height="24" fill="#f0cf94" ${sw}/><path d="M6 32L32 8l26 24z" fill="#e8553a" ${sw}/><rect x="26" y="38" width="12" height="16" fill="#a8703a" stroke="${O}" stroke-width="2.4"/>`,
  };
  const url = {}, imgs = {};
  const api = { svg: I };
  api.url = (n) => url[n] || (url[n] = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${I[n]}</svg>`));
  api.html = (n, px) => `<img src="${api.url(n)}" alt="" style="width:${px || 22}px;height:${px || 22}px;vertical-align:-0.2em;display:inline-block">`;
  api.img = (n) => {
    if (!imgs[n]) { const im = new Image(); im.src = api.url(n); imgs[n] = im; }
    return imgs[n];
  };
  Object.keys(I).forEach(api.img);
  return api;
})();
function drawIco(g, n, x, y, s, a) {
  const im = ICO.img(n);
  if (!im.complete || !im.naturalWidth) return;
  if (a != null) g.globalAlpha = a;
  g.drawImage(im, x - s / 2, y - s / 2, s, s);
  g.globalAlpha = 1;
}
