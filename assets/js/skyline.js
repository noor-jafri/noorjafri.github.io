/* ==========================================================================
   Nooremberg skyline — a procedurally drawn pixel-art sunset.
   Drawn at low resolution on a canvas and upscaled with integer scaling,
   so every "pixel" is a crisp block. Redraws on resize and theme switch.

   Layers (back → front):
     sky (Bayer-dithered bands) → sun, clouds, birds
     → hazy far ridge → hills + Kaiserburg on its rock + Burgviertel roofs
     → Altstadt: gabled houses, St. Sebald, Frauenkirche, St. Lorenz
     → the Pegnitz with reflections + Fleischbrücke
     → city wall with the fat round gate towers (and a tiny wizard)
   Roof edges facing the sun get a rim light; windows flicker now and then.
   ========================================================================== */

const PALETTES = {
  night: {
    sky: ["#0f0a18", "#1a1230", "#241843", "#2c1d4a", "#4a2552", "#7c3f58", "#b8496a", "#ff77a8", "#ff9e7a", "#ffce96"],
    sun: ["#fff4d3", "#ffe8a0", "#ffd966", "#ffb36b", "#ff8a6b"],
    cloud: "#6a3356",
    cloudLit: "#ff9eb8",
    cloudHot: "#ffce96",
    haze: "#9a4d6c",
    far: "#5a2d5a",
    mid: "#2c1a44",
    roof: "#3a2152",
    front: "#140e22",
    rimFar: "#d9707e",
    rimMid: "#9a4068",
    rimFront: "#4a2552",
    water: "#1a1230",
    smoke: "#6a3a5e",
    flag: "#ff4f78",
    windows: ["#ffd966", "#ffce96", "#ffb36b"],
    windowRate: 0.3,
  },
  day: {
    sky: ["#6fa6d4", "#8fb8d8", "#b4c8d6", "#dcd4c8", "#f6d2b0", "#ffce96", "#ffb27a", "#ff9466", "#ffb070", "#ffe0a0"],
    sun: ["#fffdf4", "#fffbe8", "#fff4d3", "#ffe08a", "#ffc070"],
    cloud: "#e8a090",
    cloudLit: "#fff4d3",
    cloudHot: "#fffbe8",
    haze: "#e3a493",
    far: "#c27d8c",
    mid: "#7c3f58",
    roof: "#8e4c66",
    front: "#4a2552",
    rimFar: "#f0b8a4",
    rimMid: "#c06a6e",
    rimFront: "#7c3f58",
    water: "#7c3f58",
    smoke: "#e9b8a8",
    flag: "#c0294f",
    windows: ["#ffd966", "#ffce96"],
    windowRate: 0.1,
  },
};

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16));

/* Small seeded RNG so the city looks the same on every visit. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Draws the whole scene; returns the lit windows so they can flicker. */
function draw(canvas, W, H, theme) {
  const P = PALETTES[theme];
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const rand = rng(1471);
  const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const lights = [];

  const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const rect = (x, y, w, h, c) => {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const dither = (k, x, y) => k > BAYER4[y & 3][x & 3];

  /* ---------- layout ---------- */
  const wallTop = H - 14;
  const bank = H - 32;           // where the Altstadt meets the Pegnitz
  const horizon = H - 76;        // base of the far hills
  const sunX = Math.round(W * 0.6);
  const sunY = horizon - 12;
  const sunR = Math.max(12, Math.min(30, Math.round(W * 0.065)));
  const facesSun = (x) => x < sunX; // true → lit on the right side

  /* ---------- shape helpers (rim = sun-facing edge highlight) ---------- */
  const gable = (x, baseY, w, h, c, rim) => {
    const right = facesSun(x + w / 2);
    for (let i = 0; i < h; i++) {
      const inset = Math.round((i / h) * (w / 2));
      const rw = Math.max(1, w - inset * 2);
      rect(x + inset, baseY - i - 1, rw, 1, c);
      if (rim) px(right ? x + inset + rw - 1 : x + inset, baseY - i - 1, rim);
    }
  };
  /* Stepped (Treppengiebel) gable — very Franconian. */
  const stepped = (x, baseY, w, h, c, rim) => {
    const right = facesSun(x + w / 2);
    const steps = Math.max(2, Math.floor(w / 3));
    const stepH = Math.max(1, Math.round(h / steps));
    for (let s = 0; s < steps; s++) {
      const inset = Math.round((s / steps) * (w / 2));
      const y = baseY - (s + 1) * stepH;
      rect(x + inset, y, w - inset * 2, stepH, c);
      if (rim) rect(right ? x + w - inset - 2 : x + inset, y, 2, 1, rim);
    }
  };
  /* Eaves-side roof seen from the street: a steep, slightly tapered slab. */
  const roofSlab = (x, baseY, w, h, c, rim) => {
    const right = facesSun(x + w / 2);
    for (let i = 0; i < h; i++) {
      const inset = Math.floor(i / 3);
      const rw = w - inset * 2;
      rect(x + inset, baseY - i - 1, rw, 1, c);
      if (rim) px(right ? x + inset + rw - 1 : x + inset, baseY - i - 1, rim);
    }
    if (rim) rect(x + Math.floor((h - 1) / 3), baseY - h, w - Math.floor((h - 1) / 3) * 2, 1, rim); // ridge catches the sun
  };
  const finial = (cx, topY, c, cross) => {
    rect(cx, topY - 3, 1, 3, c);
    if (cross) rect(cx - 1, topY - 2, 3, 1, c);
  };
  const spire = (cx, baseY, w, h, c, rim, cross) => {
    gable(cx - Math.floor(w / 2), baseY, w, h, c, rim);
    finial(cx, baseY - h, c, cross);
  };
  const roundTower = (cx, baseY, w, bodyH, roofH, c, opts = {}) => {
    const x = cx - Math.floor(w / 2);
    rect(x, baseY - bodyH, w, bodyH, c);
    if (opts.rim) rect(facesSun(cx) ? x + w - 1 : x, baseY - bodyH, 1, bodyH, opts.rim);
    rect(x - 1, baseY - bodyH - 1, w + 2, 1, c); // eave
    gable(x - 1, baseY - bodyH - 1, w + 2, roofH, c, opts.rim);
    const top = baseY - bodyH - roofH - 1;
    finial(cx, top, c);
    if (opts.flag) { rect(cx + 1, top - 3, 3, 1, opts.flag); rect(cx + 1, top - 2, 2, 1, opts.flag); }
    if (opts.windows) {
      for (let wy = baseY - bodyH + 3; wy < baseY - 3; wy += 5) {
        light(cx + ((wy >> 2) & 1 ? -2 : 1), wy, c, 0.75, 2);
      }
    }
  };
  const crenels = (x0, x1, y, c) => {
    for (let x = x0; x < x1; x += 3) rect(x, y - 1, 2, 1, c);
  };
  /* A window that may be lit; remembered so it can flicker later. */
  function light(x, y, base, rate = P.windowRate, h = 1) {
    if (rand() >= rate) return;
    const c = P.windows[ri(0, P.windows.length - 1)];
    rect(x, y, 1, h, c);
    lights.push({ x, y, h, c, base, on: true });
  }
  const smoke = (x, y) => {
    for (let k = 0; k < 12; k++) {
      const sx = x + Math.round(k * 0.7 + Math.sin(k * 0.9) * 1.2);
      if (dither(1 - k / 12, sx, y - k)) px(sx, y - k - 1, P.smoke);
    }
  };

  /* ---------- sky ---------- */
  const sky = P.sky;
  for (let y = 0; y < H; y++) {
    const t = Math.min(1, y / horizon) * (sky.length - 1);
    const base = Math.min(sky.length - 1, Math.floor(t));
    const next = Math.min(sky.length - 1, base + 1);
    // sharpen the blend so bands stay flat with a dithered seam
    const f = Math.max(0, Math.min(1, (t - base - 0.5) * 2.4 + 0.5));
    if (f <= 0.02 || base === next) { rect(0, y, W, 1, sky[base]); continue; }
    if (f >= 0.98) { rect(0, y, W, 1, sky[next]); continue; }
    for (let x = 0; x < W; x++) px(x, y, dither(f, x, y) ? sky[next] : sky[base]);
  }

  /* ---------- sun ---------- */
  for (let y = sunY - sunR - 10; y <= sunY + 4; y++) {
    for (let x = sunX - sunR - 10; x <= sunX + sunR + 10; x++) {
      const d = Math.hypot(x - sunX, y - sunY);
      if (d > sunR && d < sunR + 10 && dither((1 - (d - sunR) / 10) * 0.65, x, y)) px(x, y, sky[sky.length - 1]);
    }
  }
  for (let y = sunY - sunR; y <= sunY + sunR; y++) {
    const dy = y - sunY;
    // retro stripes cut through the lower part of the disc, widening downward
    const below = y - (sunY - sunR * 0.2);
    if (below > 0 && below % 4 < Math.min(3, Math.floor(below / 3) * 0.5)) continue;
    const half = Math.round(Math.sqrt(Math.max(0, sunR * sunR - dy * dy)));
    if (!half) continue;
    const band = Math.min(P.sun.length - 1, Math.floor(((dy + sunR) / (2 * sunR)) * P.sun.length));
    rect(sunX - half, y, half * 2 + 1, 1, P.sun[band]);
  }

  /* ---------- clouds ---------- */
  // long streaks, some sliced across the sun
  const streaks = [
    [sunX - sunR - 34, sunY - Math.round(sunR * 0.55), sunR * 2 + 50],
    [sunX - 14, sunY - Math.round(sunR * 0.95), sunR + 34],
    [W * 0.28, horizon * 0.74, 40],
    [W * 0.82, horizon * 0.8, 30],
  ];
  for (const [x, y, len] of streaks) {
    rect(x, y, len, 1, P.cloud);
    rect(x + 6, y - 1, len * 0.55, 1, P.cloud);
    rect(x + len * 0.3, y + 1, len * 0.6, 1, P.cloud);
    rect(x + len * 0.35, y + 2, len * 0.4, 1, P.cloudLit); // sun-lit underside
  }
  // puffy cumulus, underlit by the low sun
  const puff = (cx, cy, size) => {
    const blobs = [];
    for (let i = 0; i < 5; i++) {
      blobs.push([cx + (i - 2) * size * 0.9 + ri(-2, 2), cy + ri(-2, 1), size * (i === 2 ? 1.25 : 0.8 + rand() * 0.3)]);
    }
    let bottom = -Infinity;
    for (const [bx, by, r] of blobs) bottom = Math.max(bottom, by + r * 0.5);
    for (let y = Math.floor(cy - size * 1.6); y <= bottom; y++) {
      for (let x = Math.floor(cx - size * 3.4); x <= cx + size * 3.4; x++) {
        let inside = false, edgeLit = false;
        for (const [bx, by, r] of blobs) {
          const d = Math.hypot((x - bx) / 1.3, y - by);
          if (d <= r && y <= by + r * 0.5) {
            inside = true;
            if (y >= by + r * 0.5 - 2) edgeLit = true;
          }
        }
        if (!inside) continue;
        const lit = y >= bottom - 2 || edgeLit;
        px(x, y, lit ? (y >= bottom - 1 ? P.cloudHot : P.cloudLit) : P.cloud);
      }
    }
    // a flat, ragged base
    rect(cx - size * 3, bottom, size * 6, 1, P.cloudLit);
  };
  puff(Math.round(W * 0.14), Math.round(horizon * 0.42), 5);
  puff(Math.round(W * 0.84), Math.round(horizon * 0.3), 6);
  if (W > 260) puff(Math.round(W * 0.4), Math.round(horizon * 0.2), 4);

  /* ---------- birds ---------- */
  const birds = [[0.47, 0.52, 0], [0.5, 0.47, 1], [0.53, 0.55, 0], [0.56, 0.5, 1], [0.76, 0.64, 0], [0.24, 0.3, 1]];
  for (const [bx, by, flap] of birds) {
    const x = Math.round(W * bx), y = Math.round(horizon * by);
    px(x, y, P.mid);
    if (flap) { px(x - 1, y - 1, P.mid); px(x + 1, y - 1, P.mid); px(x - 2, y - 1, P.mid); px(x + 2, y - 1, P.mid); }
    else { px(x - 1, y - 1, P.mid); px(x + 1, y - 1, P.mid); px(x - 2, y, P.mid); px(x + 2, y, P.mid); }
  }

  /* ---------- haze ridge: the Franconian hills far away ---------- */
  for (let x = 0; x < W; x++) {
    const h = 9 + Math.sin(x * 0.02 + 0.5) * 4 + Math.sin(x * 0.067) * 2;
    rect(x, horizon - h, 1, H, P.haze);
  }

  /* ---------- far layer: hills + Kaiserburg ---------- */
  const castleX = Math.round(W * 0.2);
  const rockR = Math.min(46, Math.round(W * 0.21));
  const rockH = 26;
  for (let x = 0; x < W; x++) {
    let h = 4 + Math.sin(x * 0.045 + 1.3) * 3 + Math.sin(x * 0.013) * 3;
    const dx = (x - castleX) / rockR;
    if (Math.abs(dx) < 1) h = Math.max(h, rockH * (1 - dx * dx) ** 0.6);
    rect(x, horizon - h, 1, H, P.far);
    // sandstone ledges catch the light on the sun side of the rock
  }
  // Burgviertel: an irregular jumble of big roofs, trees and wall towers
  for (let x = -3; x < W; ) {
    if (Math.abs(x - castleX) < rockR * 0.8) { x += 4; continue; }
    const kind = rand();
    const baseY = horizon - 1;
    if (kind < 0.12) {
      // tree
      const r = ri(2, 3);
      for (let dy = -r; dy <= r; dy++) {
        const half = Math.round(Math.sqrt(r * r - dy * dy) * 1.3);
        rect(x + r - half, baseY - r - 1 + dy, half * 2 + 1, 1, P.far);
      }
      x += r * 2 + ri(0, 2);
    } else if (kind < 0.2) {
      // square wall tower with a pointy roof
      const h = ri(8, 12);
      rect(x, baseY - h, 4, h, P.far);
      gable(x - 1, baseY - h, 6, 5, P.far, P.rimFar);
      x += ri(5, 8);
    } else {
      // eaves-to-street house: a tall slab of roof, slightly tapered
      const w = ri(6, 15), wallH = ri(2, 5), roofH = ri(4, 7);
      rect(x, baseY - wallH, w, wallH, P.far);
      roofSlab(x, baseY - wallH, w, roofH, P.far, P.rimFar);
      if (w > 9 && rand() < 0.5) light(x + ri(2, w - 3), baseY - wallH - 2, P.far, 0.6);
      x += w - ri(0, 2);
    }
  }

  const rockTop = horizon - rockH;
  // curtain wall runs down the rock face so nothing floats
  rect(castleX - 30, rockTop - 6, 62, rockH + 6, P.far);
  crenels(castleX - 30, castleX + 32, rockTop - 6, P.far);
  // sandstone ledges catching the sun on the rock face
  for (let i = 0; i < 9; i++) {
    const lx = castleX + ri(4, rockR - 6);
    const ly = rockTop + ri(3, rockH - 3);
    rect(lx, ly, ri(2, 5), 1, P.rimFar);
  }
  // Palas — long hall with steep roof and dormers
  rect(castleX - 20, rockTop - 16, 26, 10, P.far);
  gable(castleX - 21, rockTop - 16, 28, 11, P.far, P.rimFar);
  for (const dx of [-15, -8, -1]) rect(castleX + dx, rockTop - 21, 2, 2, P.far);
  for (let wx = castleX - 18; wx < castleX + 5; wx += 3) light(wx, rockTop - 12, P.far, 0.5, 2);
  // Kaiserkapelle — small chapel with a pointed roof
  rect(castleX + 6, rockTop - 12, 6, 6, P.far);
  spire(castleX + 9, rockTop - 12, 5, 6, P.far, P.rimFar, true);
  // Sinwell tower — round, tall, flag on top
  roundTower(castleX + 18, rockTop - 6, 7, 26, 9, P.far, { rim: P.rimFar, flag: P.flag, windows: true });
  // Heathen tower — square with pyramid roof
  rect(castleX - 31, rockTop - 24, 8, 18, P.far);
  gable(castleX - 32, rockTop - 24, 10, 5, P.far, P.rimFar);
  light(castleX - 28, rockTop - 19, P.far, 0.7, 2);
  // Luginsland — square watch tower with a hip roof, east end
  rect(castleX + 30, rockTop - 18, 7, 18, P.far);
  rect(castleX + 29, rockTop - 19, 9, 1, P.far);
  gable(castleX + 29, rockTop - 19, 9, 6, P.far, P.rimFar);
  light(castleX + 33, rockTop - 14, P.far, 0.7, 2);
  // Kaiserstallung — long barn at the foot
  rect(castleX + 22, rockTop + 6, 24, rockH - 6, P.far);
  gable(castleX + 22, rockTop + 6, 24, 6, P.far, P.rimFar);

  /* ---------- mid layer: Altstadt houses ----------
     Nuremberg style: steep roofs, mostly eaves-to-street with tiers of
     little dormers, mixed with narrow gable-fronted houses that have
     clipped (Krüppelwalm) tips, hoist beams and the odd oriel window. */
  rect(0, bank - 2, W, H, P.mid);
  const dormer = (dx, dy) => {
    rect(dx, dy - 2, 3, 3, P.mid);
    px(dx + 1, dy - 3, P.mid);
    light(dx + 1, dy - 1, P.mid, P.windowRate * 1.6);
  };
  const chimney = (cx, cy) => {
    rect(cx, cy - 3, 2, 4, P.mid);
    if (rand() < 0.45) smoke(cx, cy - 3);
  };
  for (let x = -6; x < W; ) {
    const top = bank - ri(10, 17);
    const floors = (y0) => {
      for (let wy = y0 + 2; wy < bank - 3; wy += 4) {
        for (let wx = x + 1; wx < x + wSpan - 1; wx += 3) light(wx, wy, P.mid, P.windowRate, 2);
      }
    };
    let wSpan;
    if (rand() < 0.58) {
      // traufständig: long side to the street, big roof with dormer rows
      wSpan = ri(13, 22);
      const roofH = ri(10, 15);
      rect(x, top, wSpan, bank - top, P.mid);
      roofSlab(x, top, wSpan, roofH, P.roof, P.rimMid);
      rect(x - 1, top, wSpan + 2, 1, P.mid); // eaves
      for (let tier = 0; tier < 3; tier++) {
        const dy = top - 3 - tier * 4;
        if (dy < top - roofH + 3) break;
        const inset = 2 + tier;
        for (let dx = x + inset; dx < x + wSpan - inset - 3; dx += ri(4, 6)) {
          if (rand() < 0.7) dormer(dx, dy);
        }
      }
      // Zwerchhaus: a big street-facing gable cutting through the eaves
      if (rand() < 0.45) {
        const zw = ri(5, 7), zx = x + Math.floor((wSpan - zw) / 2);
        rect(zx, top - 4, zw, 4, P.mid);
        gable(zx, top - 4, zw, Math.ceil(zw * 0.9), P.mid, P.rimMid);
        light(zx + Math.floor(zw / 2), top - 3, P.mid, P.windowRate * 1.5, 2);
      }
      if (rand() < 0.6) chimney(x + ri(3, wSpan - 4), top - roofH + 1);
    } else {
      // giebelständig: narrow, very steep gable to the street
      wSpan = ri(8, 11);
      const roofH = Math.round(wSpan * (1.2 + rand() * 0.4));
      rect(x, top, wSpan, bank - top, P.mid);
      gable(x, top, wSpan, roofH, P.mid, P.rimMid);
      if (rand() < 0.5) rect(x + Math.floor(wSpan / 2) - 1, top - roofH, 3, 1, P.mid); // clipped tip
      // attic storage floors: small windows stacked up the gable
      for (let t = 0; t < 3; t++) {
        const wy = top - 3 - t * 4;
        if (wy < top - roofH + 3) break;
        light(x + Math.floor(wSpan / 2), wy, P.mid, P.windowRate * 1.4);
      }
      // hoist beam poking out near the top
      if (rand() < 0.5) px(x + Math.floor(wSpan / 2), top - roofH + 2, P.mid);
      // Chörlein: a little oriel on the facade
      if (rand() < 0.35) {
        const ox = x + Math.floor(wSpan / 2) - 1, oy = top + 4;
        rect(ox - 1, oy, 4, 5, P.mid);
        gable(ox - 1, oy, 4, 2, P.mid);
        rect(ox, oy + 1, 2, 2, P.windows[ri(0, P.windows.length - 1)]);
        lights.push({ x: ox, y: oy + 1, h: 2, c: P.windows[0], base: P.mid, on: true });
      }
      if (rand() < 0.3) chimney(x + (rand() < 0.5 ? 2 : wSpan - 4), top - Math.round(roofH * 0.45));
    }
    floors(top);
    x += wSpan - ri(0, 2);
  }

  /* ---------- churches ---------- */
  const pinnacles = (x0, x1, y, c) => {
    for (let x = x0; x <= x1; x += 4) rect(x, y - 2, 1, 2, c);
  };
  const tallWindows = (x0, x1, y, c) => {
    for (let x = x0; x <= x1; x += 4) light(x, y, c, 0.55, 4);
  };

  // St. Sebald — twin towers with sharp spires
  const sebX = Math.round(W * 0.36);
  rect(sebX - 14, bank - 22, 28, 22, P.mid);
  gable(sebX - 14, bank - 22, 28, 9, P.mid, P.rimMid);
  pinnacles(sebX - 13, sebX + 13, bank - 22, P.mid);
  tallWindows(sebX - 11, sebX + 11, bank - 17, P.mid);
  for (const off of [-4, 4]) {
    rect(sebX + off - 3, bank - 40, 6, 40, P.mid);
    rect(sebX + off - 3, bank - 40, 1, 40, off < 0 ? P.mid : P.mid);
    spire(sebX + off, bank - 40, 6, 13, P.mid, P.rimMid, true);
  }
  light(sebX - 4, bank - 32, P.mid, 0.9, 2);

  // Frauenkirche — the stepped show-gable on the Hauptmarkt
  const frX = Math.round(W * 0.465);
  rect(frX - 10, bank - 20, 20, 20, P.mid);
  stepped(frX - 10, bank - 20, 20, 14, P.mid, P.rimMid);
  rect(frX - 2, bank - 40, 4, 6, P.mid);
  spire(frX, bank - 40, 4, 6, P.mid, P.rimMid);
  light(frX, bank - 13, P.mid, 1, 3);
  px(frX, bank - 37, P.windows[0]); // the clock

  // St. Lorenz — the big one, twin towers right in front of the sun
  const lorX = Math.round(W * 0.57);
  rect(lorX - 6, bank - 26, 36, 26, P.mid);           // nave
  gable(lorX - 6, bank - 26, 36, 11, P.mid, P.rimMid);
  pinnacles(lorX - 4, lorX + 18, bank - 26, P.mid);
  rect(lorX + 18, bank - 31, 15, 31, P.mid);          // tall hall choir
  gable(lorX + 18, bank - 31, 15, 10, P.mid, P.rimMid);
  pinnacles(lorX + 19, lorX + 32, bank - 31, P.mid);
  tallWindows(lorX + 20, lorX + 31, bank - 24, P.mid);
  for (const off of [-6, 5]) {
    const tx = lorX + off;
    rect(tx - 4, bank - 50, 8, 50, P.mid);
    rect(tx - 3, bank - 55, 6, 5, P.mid);             // octagon stage
    pinnacles(tx - 4, tx + 4, bank - 50, P.mid);
    spire(tx, bank - 55, 6, 16, P.mid, P.rimMid, true);
    light(tx, bank - 44, P.mid, 0.8, 3);
  }
  rect(lorX - 6, bank - 36, 11, 3, P.mid);            // gallery between towers
  // rose window glow
  rect(lorX - 1, bank - 29, 2, 2, P.windows[0]);
  lights.push({ x: lorX - 1, y: bank - 29, h: 2, c: P.windows[0], base: P.mid, on: true });

  /* ---------- the Pegnitz ---------- */
  rect(0, bank - 2, W, 2, P.mid); // quay
  const waterTop = bank;
  const waterH = wallTop - waterTop;
  // mirror the town into the river, then tint it
  ctx.save();
  ctx.translate(0, waterTop * 2);
  ctx.scale(1, -1);
  ctx.drawImage(canvas, 0, waterTop - waterH, W, waterH, 0, waterTop - waterH, W, waterH);
  ctx.restore();
  ctx.globalAlpha = 0.55;
  rect(0, waterTop, W, waterH, P.water);
  ctx.globalAlpha = 1;
  // ripples: short sky-coloured dashes breaking up the reflection
  for (let y = waterTop + 2; y < wallTop; y += 3) {
    for (let x = ri(0, 20); x < W; x += ri(18, 34)) rect(x, y, ri(3, 7), 1, sky[sky.length - 5]);
  }
  // sun glitter column, wider toward the viewer
  for (let y = waterTop + 1; y < wallTop; y += 2) {
    const spread = Math.round(sunR * 0.35 + (y - waterTop) * 0.8);
    for (let i = 0; i < 2; i++) rect(sunX + ri(-spread, spread), y, ri(2, 5), 1, P.sun[ri(1, 3)]);
  }

  // Fleischbrücke — one wide stone arch
  const brX = Math.round(W * 0.43);
  const span = 30, archA = 11, archH = 9;
  const deck = waterTop + 1;
  for (let x = brX - span / 2; x < brX + span / 2; x++) {
    const dx = (x - brX) / archA;
    const open = Math.abs(dx) < 1 ? Math.round(archH * Math.sqrt(1 - dx * dx)) : 0;
    rect(x, deck, 1, wallTop - deck - open, P.mid);
  }
  rect(brX - span / 2 - 1, deck - 2, span + 2, 2, P.mid); // parapet
  for (const lx of [brX - span / 2 + 1, brX + span / 2 - 2]) {
    rect(lx, deck - 6, 1, 4, P.mid);
    px(lx, deck - 7, P.windows[0]);
  }

  /* ---------- front layer: city wall + round gate towers ---------- */
  rect(0, wallTop, W, H - wallTop, P.front);
  crenels(0, W, wallTop, P.front);
  // arrow slits along the wall
  for (let x = 5; x < W; x += 11) rect(x, wallTop + 3, 1, 2, P.mid);
  const towerXs = [0.07, 0.31, 0.83].map((f) => Math.round(W * f));
  if (W > 220) towerXs.push(Math.round(W * 0.97));
  // a few trees from the moat gardens, hugging the towers
  for (const tx of towerXs) {
    for (const side of [-1, 1]) {
      if (rand() < 0.4) continue;
      const cx = tx + side * ri(9, 13), r = ri(3, 5);
      for (let dy = -r; dy <= r; dy++) {
        const half = Math.round(Math.sqrt(r * r - dy * dy) * 1.2);
        rect(cx - half, wallTop - r + dy, half * 2 + 1, 1, P.front);
      }
    }
  }
  for (const tx of towerXs) {
    roundTower(tx, H - 2, 14, 26, 14, P.front, { rim: P.rimFront, windows: true, flag: rand() < 0.5 ? P.flag : null });
  }

  // a tiny wizard keeping watch on the wall, staff glowing
  const wz = towerXs[1] + 16;
  if (wz < W - 6) {
    const fy = wallTop - 1;
    rect(wz, fy - 5, 3, 5, P.front);            // robe
    rect(wz - 1, fy - 1, 5, 1, P.front);        // hem
    rect(wz + 1, fy - 7, 1, 2, P.front);        // head
    gable(wz - 1, fy - 7, 5, 4, P.front);       // pointy hat
    rect(wz + 4, fy - 9, 1, 9, P.front);        // staff
    px(wz + 4, fy - 10, "#5fcde4");
  }

  // keep only windows still visible (later buildings may have covered some)
  const img = ctx.getImageData(0, 0, W, H).data;
  const hex = (i) => "#" + [img[i], img[i + 1], img[i + 2]].map((v) => v.toString(16).padStart(2, "0")).join("");
  return lights.filter((l) => l.x >= 0 && l.x < W && hex((l.y * W + l.x) * 4) === l.c);
}

export function initSkyline() {
  const host = document.querySelector(".world-bg");
  if (!host) return;
  const canvas = document.createElement("canvas");
  canvas.className = "skyline";
  host.appendChild(canvas);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let lights = [];
  let queued = false;
  const render = () => {
    queued = false;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // aim for ~440 "art pixels" across a desktop, never smaller than 2× blocks
    const scale = Math.max(2, Math.min(5, Math.round(vw / 440)));
    const W = Math.ceil(vw / scale);
    const H = Math.ceil(vh / scale);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
    const theme = document.documentElement.dataset.theme === "day" ? "day" : "night";
    lights = draw(canvas, W, H, theme);
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  };

  render();
  // only redraw on width changes or big height jumps — mobile URL bars resize constantly
  let lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 120) return;
    lastW = window.innerWidth; lastH = window.innerHeight;
    schedule();
  });
  new MutationObserver(schedule).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // dim the art as you scroll from the hero into content
  let scrollQueued = false;
  const updateScrim = () => {
    scrollQueued = false;
    const k = Math.min(1, window.scrollY / (window.innerHeight * 0.6));
    host.style.setProperty("--scrim", (0.15 + k * 0.55).toFixed(3));
  };
  updateScrim();
  window.addEventListener("scroll", () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(updateScrim);
  }, { passive: true });

  // windows switch on and off now and then
  if (!reduceMotion) {
    const ctx = canvas.getContext("2d");
    setInterval(() => {
      if (document.hidden || !lights.length) return;
      for (let i = 0; i < 2; i++) {
        const l = lights[Math.floor(Math.random() * lights.length)];
        l.on = !l.on;
        ctx.fillStyle = l.on ? l.c : l.base;
        ctx.fillRect(l.x, l.y, 1, l.h);
      }
    }, 900);
  }
}
