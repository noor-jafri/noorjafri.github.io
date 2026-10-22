// Trains — flip switches to send each train to the station of its own color (Train of Thought).
(function () {
  // muted, clearly distinct station / train colors
  const COLORS = ['#d9776a', '#5f86b3', '#e0b04f', '#9a7bb0', '#4f9c94', '#e8e2d4'];
  const N = null;
  // binary track trees: null = station, [a, b] = switch with two branches (left, right)
  const SHAPES = {
    3: [[[N, N], N]],
    4: [[[N, N], [N, N]], [[[N, N], N], N], [[N, [N, N]], N]],
    5: [[[[N, N], N], [N, N]], [[N, [N, N]], [N, N]], [[[N, N], [N, N]], N]],
    6: [[[[N, N], N], [N, [N, N]]], [[N, [N, N]], [[N, N], N]], [[[N, N], [N, N]], [N, N]]],
  };
  // st = stations, sp = speed factor, gap = seconds between trains
  const LEVELS = [
    { st: 3, sp: 1.0, gap: 3.8 },
    { st: 3, sp: 1.15, gap: 3.2 },
    { st: 4, sp: 1.1, gap: 3.3 },
    { st: 4, sp: 1.25, gap: 2.9 },
    { st: 5, sp: 1.2, gap: 3.0 },
    { st: 5, sp: 1.35, gap: 2.6 },
    { st: 6, sp: 1.3, gap: 2.7 },
    { st: 6, sp: 1.45, gap: 2.3 },
    { st: 6, sp: 1.6, gap: 2.0 },
    { st: 6, sp: 1.75, gap: 1.8 },
  ];
  const mirror = (s) => (s === null ? null : [mirror(s[1]), mirror(s[0])]);

  // mix a #rrggbb color toward white (t > 0) or black (t < 0)
  const shade = (hex, t) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => Math.round(t > 0 ? c + (255 - c) * t : c * (1 + t));
    return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')';
  };
  const rng = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const ART = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="trArtG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8db07a"/><stop offset="1" stop-color="#76a066"/></linearGradient></defs>' +
    '<rect x="4" y="4" width="56" height="56" rx="14" fill="url(#trArtG)"/>' +
    '<circle cx="50" cy="16" r="6" fill="#5e8a55"/><circle cx="13" cy="44" r="5" fill="#5e8a55"/>' +
    '<g fill="none" stroke-linecap="round"><path d="M32 4 V26 Q32 34 20 40 V50" stroke="#c9bfa8" stroke-width="7"/>' +
    '<path d="M32 26 Q32 34 44 40 V50" stroke="#c9bfa8" stroke-width="7" opacity=".55"/>' +
    '<path d="M29.5 4 V26 Q29.5 33 17.5 39 V50 M34.5 4 V26 Q34.5 35 22.5 41 V50" stroke="#5c6670" stroke-width="1.4"/></g>' +
    '<rect x="13" y="47" width="14" height="11" rx="2" fill="#d9776a"/><rect x="13" y="47" width="14" height="5.5" rx="2" fill="#e49b90"/>' +
    '<rect x="37" y="47" width="14" height="11" rx="2" fill="#5f86b3"/><rect x="37" y="47" width="14" height="5.5" rx="2" fill="#86a6c9"/>' +
    '<rect x="27.5" y="8" width="9" height="15" rx="3" fill="#e0b04f"/><rect x="28.5" y="9" width="7" height="5" rx="1.5" fill="#a9822f"/>' +
    '<circle cx="32" cy="26" r="7" fill="#f7f5ef"/><path d="M32 26 L27.5 30.5" stroke="#4c5d70" stroke-width="2.6" stroke-linecap="round"/>' +
    '</svg>';

  NP.register({
    id: 'trains',
    name: 'Trains',
    icon: '🚂',
    art: ART,
    color: '#7fa36a',
    bg: ['#5d7f52', '#3a5a3a'],
    tagline: 'Flip switches to send each train to its matching station',
    how: [
      'Colored trains roll out of the tunnel one after another.',
      'Tap a switch (the white circles) to flip it — the arrow and solid rails show where it sends trains.',
      'Get every train to the station of its own color.',
      'More stations, faster trains as you improve.',
    ],
    controls: 'Tap switches',
    start(api) {
      const wrap = api.el('div', 'tr-wrap');
      const cv = api.el('canvas', null, wrap);
      const ctx = cv.getContext('2d');
      const bgCv = document.createElement('canvas');
      const bctx = bgCv.getContext('2d');
      const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      let W = 0, H = 0, dpr = 1, S = 1;
      let nodes = [], leaves = [], switches = [], root = null, shape = null;
      const tunnel = { x: 0, y: 0 };
      let trackTop = 0, trackBot = 0;
      let trains = [], puffs = [];
      let level = 0, prog = 0, missRow = 0, pending = false, holdT = 0, spawnAcc = 0;
      let recent = [];
      let started = false;
      let clock = 0;
      const clouds = [0, 1, 2].map((i) => ({ x: i / 3, y: 0.2 + i * 0.3, s: 0.8 + (i % 2) * 0.5 }));

      /* ---------- geometry ---------- */
      function makeEdge(x0, y0, x3, y3) {
        const dy = y3 - y0;
        const p1x = x0, p1y = y0 + dy * 0.5, p2x = x3, p2y = y3 - dy * 0.5;
        const steps = Math.max(12, Math.ceil((Math.abs(dy) + Math.abs(x3 - x0)) / 3));
        const xs = [], ys = [], cum = [0];
        for (let i = 0; i <= steps; i++) {
          const t = i / steps, u = 1 - t;
          const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
          xs.push(a * x0 + b * p1x + c * p2x + d * x3);
          ys.push(a * y0 + b * p1y + c * p2y + d * y3);
          if (i) cum.push(cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]));
        }
        // offset rails
        const g = 4.2 * S;
        const lx = [], ly = [], rx = [], ry = [];
        for (let i = 0; i <= steps; i++) {
          const j0 = Math.max(0, i - 1), j1 = Math.min(steps, i + 1);
          const ang = Math.atan2(ys[j1] - ys[j0], xs[j1] - xs[j0]);
          const nx = -Math.sin(ang), ny = Math.cos(ang);
          lx.push(xs[i] + nx * g); ly.push(ys[i] + ny * g);
          rx.push(xs[i] - nx * g); ry.push(ys[i] - ny * g);
        }
        return { xs, ys, cum, len: cum[steps], lx, ly, rx, ry };
      }

      function posAt(e, d) {
        d = Math.max(0, Math.min(e.len, d));
        const c = e.cum;
        let lo = 0, hi = c.length - 1;
        while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= d) lo = m; else hi = m; }
        const seg = c[hi] - c[lo] || 1;
        const f = (d - c[lo]) / seg;
        return {
          x: e.xs[lo] + (e.xs[hi] - e.xs[lo]) * f,
          y: e.ys[lo] + (e.ys[hi] - e.ys[lo]) * f,
          a: Math.atan2(e.ys[hi] - e.ys[lo], e.xs[hi] - e.xs[lo]),
        };
      }

      let seed = 1;
      function setShape(n) {
        let sh = api.pick(SHAPES[n]);
        if (Math.random() < 0.5) sh = mirror(sh);
        shape = sh;
        seed = 1 + api.rand(1e6);
        nodes = []; leaves = []; switches = [];
        const walk = (sv, depth, parent) => {
          const nd = { id: nodes.length, depth, parent, leaf: sv === null, pulse: 0, flash: 0 };
          nodes.push(nd);
          if (nd.leaf) { nd.col = leaves.length; leaves.push(nd); }
          else {
            nd.kids = [walk(sv[0], depth + 1, nd), walk(sv[1], depth + 1, nd)];
            nd.active = api.rand(2);
            nd.ang = null;
            switches.push(nd);
          }
          return nd;
        };
        root = walk(sh, 1, null);
        const cols = api.shuffle(COLORS).slice(0, leaves.length);
        leaves.forEach((l, i) => (l.color = cols[i]));
        puffs = [];
        geometry();
      }

      function geometry() {
        const r = wrap.getBoundingClientRect();
        W = Math.max(1, r.width); H = Math.max(1, r.height);
        dpr = Math.min(2.5, window.devicePixelRatio || 1);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        if (!root) return;
        const n = leaves.length;
        const maxD = Math.max.apply(null, leaves.map((l) => l.depth));
        S = Math.max(0.72, Math.min(1.35, Math.min(W / (n * 58), H / 540)));
        const R = 19 * S;
        const bw = Math.min(W - 2 * (R + 12), H * 0.95, 580);
        const left = (W - bw) / 2;
        trackTop = 50 * S;
        trackBot = H - R * 1.9 - 8;
        const rowH = (trackBot - trackTop) / maxD;
        const place = (nd) => {
          nd.y = trackTop + nd.depth * rowH;
          if (nd.leaf) nd.x = left + (n > 1 ? (nd.col / (n - 1)) * bw : bw / 2);
          else { place(nd.kids[0]); place(nd.kids[1]); nd.x = (nd.kids[0].x + nd.kids[1].x) / 2; }
        };
        place(root);
        // the line starts hidden inside the hill; the portal sits at trackTop
        tunnel.x = root.x; tunnel.y = trackTop - 36 * S;
        nodes.forEach((nd) => {
          const p = nd.parent || tunnel;
          nd.edge = makeEdge(p.x, p.y, nd.x, nd.y);
        });
        switches.forEach((sw) => { sw.ang = targetAng(sw); });
        paintBackground();
      }

      function targetAng(sw) {
        const e = sw.kids[sw.active].edge;
        const p = posAt(e, e.len * 0.5);
        return Math.atan2(p.y - sw.y, p.x - sw.x);
      }

      /* ---------- static landscape (cached) ---------- */
      function paintBackground() {
        bgCv.width = cv.width; bgCv.height = cv.height;
        const c = bctx;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        const rnd = rng(seed);
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#87ab74'); g.addColorStop(1, '#769d65');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
        // soft meadow patches
        for (let i = 0; i < 6; i++) {
          const px = rnd() * W, py = rnd() * H, pr = (70 + rnd() * 90) * S;
          const rg = c.createRadialGradient(px, py, 0, px, py, pr);
          rg.addColorStop(0, rnd() < 0.5 ? 'rgba(255,255,230,.07)' : 'rgba(40,70,30,.07)');
          rg.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = rg;
          c.fillRect(px - pr, py - pr, pr * 2, pr * 2);
        }
        // fine grass texture
        for (let i = 0; i < (W * H) / 260; i++) {
          c.fillStyle = rnd() < 0.5 ? 'rgba(50,80,40,.10)' : 'rgba(255,255,220,.08)';
          c.fillRect(rnd() * W, rnd() * H, 1.5, 1.5);
        }
        // ballast beds and sleepers (independent of switch state)
        nodes.forEach((nd) => {
          const e = nd.edge;
          c.lineCap = 'round'; c.lineJoin = 'round';
          c.strokeStyle = 'rgba(214,204,182,.75)';
          c.lineWidth = 17 * S;
          c.beginPath(); c.moveTo(e.xs[0], e.ys[0]);
          for (let i = 1; i < e.xs.length; i++) c.lineTo(e.xs[i], e.ys[i]);
          c.stroke();
        });
        c.strokeStyle = '#a3917a';
        c.lineWidth = 2.6 * S;
        c.lineCap = 'butt';
        nodes.forEach((nd) => {
          const e = nd.edge;
          for (let d = 4 * S; d < e.len; d += 8.5 * S) {
            const p = posAt(e, d);
            const nx = -Math.sin(p.a) * 6.8 * S, ny = Math.cos(p.a) * 6.8 * S;
            c.beginPath(); c.moveTo(p.x - nx, p.y - ny); c.lineTo(p.x + nx, p.y + ny); c.stroke();
          }
        });
        // trees, kept clear of track, stations, switches and the hill
        const samples = [];
        nodes.forEach((nd) => { const e = nd.edge; for (let i = 0; i < e.xs.length; i += 2) samples.push(e.xs[i], e.ys[i]); });
        const trees = [];
        const tries = Math.round((W * H) / (900 * S * S));
        for (let k = 0; k < tries && trees.length < 40; k++) {
          const x = rnd() * W, y = rnd() * H, r = (6 + rnd() * 7) * S;
          let ok = Math.hypot(x - tunnel.x, (y - trackTop) * 1.6) > 95 * S;
          for (let i = 0; ok && i < samples.length; i += 2) if (Math.hypot(samples[i] - x, samples[i + 1] - y) < 15 * S + r) ok = false;
          leaves.forEach((l) => { if (ok && Math.hypot(l.x - x, l.y + 12 * S - y) < 36 * S + r) ok = false; });
          switches.forEach((s) => { if (ok && Math.hypot(s.x - x, s.y - y) < 30 * S + r) ok = false; });
          trees.forEach((t) => { if (ok && Math.hypot(t.x - x, t.y - y) < (t.r + r) * 0.9) ok = false; });
          if (ok) trees.push({ x, y, r, tone: rnd() });
        }
        trees.sort((a, b) => a.y - b.y);
        trees.forEach((t) => {
          c.fillStyle = 'rgba(40,64,30,.22)';
          c.beginPath(); c.arc(t.x + t.r * 0.35, t.y + t.r * 0.45, t.r, 0, Math.PI * 2); c.fill();
          c.fillStyle = t.tone < 0.33 ? '#5a8450' : t.tone < 0.66 ? '#64905a' : '#6e9a62';
          c.beginPath(); c.arc(t.x, t.y, t.r, 0, Math.PI * 2); c.fill();
          c.fillStyle = 'rgba(255,255,230,.10)';
          c.beginPath(); c.arc(t.x - t.r * 0.28, t.y - t.r * 0.28, t.r * 0.55, 0, Math.PI * 2); c.fill();
        });
      }

      /* ---------- trains ---------- */
      const ENG = () => 28 * S, CAR = () => 21 * S, GAP = () => 3.5 * S, WID = () => 14 * S;
      const CARS = 2;
      const trainLen = () => ENG() + CARS * (CAR() + GAP());
      const speedPx = () => ((trackBot - trackTop) / 6.5) * LEVELS[level].sp;

      function canSpawn() {
        const last = trains[trains.length - 1];
        return !last || last.route.length > 1 || last.d > trainLen() + 70 * S;
      }

      function spawn() {
        const pool = leaves.map((l) => l.color);
        let c = api.pick(pool);
        // avoid long runs of the same color
        if (recent.length >= 2 && recent[0] === c && recent[1] === c) c = api.pick(pool.filter((x) => x !== c));
        recent.unshift(c); recent.length = Math.min(recent.length, 2);
        trains.push({ color: c, route: [root.id], d: 0, done: false, gone: false, smoke: 0 });
      }

      // point `back` px behind the head of train t, following its route backwards
      function pointBack(t, back) {
        let i = t.route.length - 1;
        let dd = t.d - back;
        let e = nodes[t.route[i]].edge;
        if (dd > e.len) return null;       // already inside the station
        while (dd < 0 && i > 0) { i--; e = nodes[t.route[i]].edge; dd += e.len; }
        if (dd < 0) return null;            // still in the tunnel
        return posAt(e, dd);
      }

      function setLevel(l) {
        if (l === level) return;
        const up = l > level;
        const changes = LEVELS[l].st !== leaves.length;
        level = l;
        if (up) api.sfx('level');
        if (changes) pending = true;
        showStatus();
      }

      function showStatus() {
        api.status(pending ? 'Clearing the line — new layout coming…'
          : 'Level ' + (level + 1) + ' · ' + leaves.length + ' stations');
      }

      function arrive(t, st) {
        t.done = true;
        const ok = st.color === t.color;
        api.answer(ok, 50 + 10 * level, { x: st.x + wrap.offsetLeft, y: st.y + wrap.offsetTop });
        st.pulse = 1;
        st.pulseOk = ok;
        if (ok) {
          missRow = 0;
          prog++;
          if (prog >= 3 && level < LEVELS.length - 1) { prog = 0; setLevel(level + 1); }
        } else {
          prog = 0;
          missRow++;
          if (missRow >= 2 && level > 0) { missRow = 0; setLevel(level - 1); }
        }
      }

      function update(dt) {
        clock += dt;
        if (pending) {
          if (!trains.length) {
            holdT += dt;
            if (holdT > 0.7) {
              holdT = 0; pending = false;
              setShape(LEVELS[level].st);
              spawnAcc = LEVELS[level].gap - 1.0;
              showStatus();
            }
          }
        } else {
          spawnAcc += dt;
          if (spawnAcc >= LEVELS[level].gap && canSpawn()) { spawn(); spawnAcc = 0; }
        }

        const v = speedPx() * dt;
        trains.forEach((t) => {
          t.d += v;
          let nd = nodes[t.route[t.route.length - 1]];
          while (!t.done && t.d >= nd.edge.len) {
            if (nd.leaf) { arrive(t, nd); break; }
            t.d -= nd.edge.len;
            nd = nd.kids[nd.active];
            t.route.push(nd.id);
          }
          if (t.route.length > 6) {
            // keep the tail short; cars never reach further back than one or two edges
            t.route.splice(0, t.route.length - 6);
          }
          if (t.done && t.d - trainLen() > nd.edge.len) t.gone = true;
          // smoke from the chimney
          t.smoke += dt;
          if (!t.done && t.smoke > 0.16 && puffs.length < 70) {
            t.smoke = 0;
            const p = pointBack(t, -ENG() * 0.3);
            if (p && p.y > trackTop + 4 * S) {
              puffs.push({ x: p.x, y: p.y, vx: (Math.random() - 0.3) * 6 * S, vy: -4 * S, life: 0, max: 0.9 + Math.random() * 0.4 });
            }
          }
        });
        trains = trains.filter((t) => !t.gone);

        puffs.forEach((p) => { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; });
        puffs = puffs.filter((p) => p.life < p.max);

        switches.forEach((sw) => {
          const ta = targetAng(sw);
          if (sw.ang == null) sw.ang = ta;
          let diff = ta - sw.ang;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          sw.ang += diff * Math.min(1, dt * 13);
          if (sw.flash > 0) sw.flash = Math.max(0, sw.flash - dt * 2.6);
        });
        leaves.forEach((l) => { if (l.pulse > 0) l.pulse = Math.max(0, l.pulse - dt * 1.4); });
        if (!calm) clouds.forEach((cl) => { cl.x += dt * 0.012; if (cl.x > 1.35) cl.x = -0.35; });
      }

      /* ---------- drawing ---------- */
      function rrect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      }
      function poly(xs, ys) {
        ctx.beginPath();
        ctx.moveTo(xs[0], ys[0]);
        for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i]);
      }

      function drawRails(e, active) {
        ctx.globalAlpha = active ? 1 : 0.32;
        ctx.lineCap = 'round';
        ctx.lineWidth = 2.2 * S;
        ctx.strokeStyle = '#59636b';
        poly(e.lx, e.ly); ctx.stroke();
        poly(e.rx, e.ry); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      function drawPart(p, len, color, engine) {
        const w = WID();
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.fillStyle = 'rgba(30,50,25,.25)';
        rrect(-len / 2 + 1.5 * S, -w / 2 + 2.5 * S, len, w, 3.5 * S); ctx.fill();
        ctx.fillStyle = color;
        rrect(-len / 2, -w / 2, len, w, 3.5 * S); ctx.fill();
        if (engine) {
          // cab at the back, boiler bands, chimney and lamp at the front
          ctx.fillStyle = shade(color, -0.28);
          rrect(-len / 2, -w / 2, len * 0.36, w, 3.5 * S); ctx.fill();
          ctx.fillStyle = shade(color, 0.22);
          ctx.fillRect(-len * 0.02, -w / 2 + 1.5 * S, 1.6 * S, w - 3 * S);
          ctx.fillRect(len * 0.16, -w / 2 + 1.5 * S, 1.6 * S, w - 3 * S);
          ctx.fillStyle = '#3f464c';
          ctx.beginPath(); ctx.arc(len * 0.32, 0, 2.6 * S, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#f4ecd2';
          ctx.beginPath(); ctx.arc(len / 2 - 1.2 * S, 0, 1.6 * S, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = shade(color, 0.25);
          rrect(-len / 2 + 2.5 * S, -w / 2 + 2.5 * S, len - 5 * S, w - 5 * S, 2 * S); ctx.fill();
        }
        ctx.restore();
      }

      function drawTrain(t) {
        const parts = [{ back: 0, len: ENG(), eng: true }];
        let off = ENG() / 2;
        for (let i = 0; i < CARS; i++) {
          parts.push({ back: off + GAP() + CAR() / 2, len: CAR(), eng: false });
          off += GAP() + CAR();
        }
        for (let i = parts.length - 1; i >= 0; i--) {
          const pt = parts[i];
          const p = pointBack(t, pt.back);
          if (p) drawPart(p, pt.len, t.color, pt.eng);
        }
      }

      function drawPuffs() {
        puffs.forEach((p) => {
          const f = p.life / p.max;
          ctx.fillStyle = 'rgba(250,249,244,' + (0.45 * (1 - f)).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(p.x, p.y, (3 + f * 8) * S, 0, Math.PI * 2); ctx.fill();
        });
      }

      // top-down house block: platform where the line ends, roof in the station color
      function drawStation(st) {
        const R = 19 * S;
        let x = st.x;
        const y = st.y;
        if (st.pulse > 0 && !st.pulseOk) x += Math.sin(st.pulse * 30) * 3 * S * st.pulse;
        if (st.pulse > 0) {
          ctx.fillStyle = st.pulseOk ? 'rgba(255,255,240,' + (0.35 * st.pulse).toFixed(3) + ')'
            : 'rgba(214,112,104,' + (0.35 * st.pulse).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(x, y + R * 0.5, R * (1.5 + (1 - st.pulse) * 0.5), 0, Math.PI * 2); ctx.fill();
        }
        // platform
        ctx.fillStyle = 'rgba(30,50,25,.18)';
        rrect(x - R * 1.1 + 2 * S, y - R * 0.35 + 3 * S, R * 2.2, R * 0.6, 3 * S); ctx.fill();
        ctx.fillStyle = '#e4dccb';
        rrect(x - R * 1.1, y - R * 0.35, R * 2.2, R * 0.6, 3 * S); ctx.fill();
        // buffer stop
        ctx.fillStyle = '#8c7a66';
        ctx.fillRect(x - 6 * S, y - R * 0.05, 12 * S, 2.5 * S);
        // house
        const hx = x - R, hy = y + R * 0.22, hw = R * 2, hh = R * 1.45;
        ctx.fillStyle = 'rgba(30,50,25,.25)';
        rrect(hx + 3 * S, hy + 4 * S, hw, hh, 3 * S); ctx.fill();
        ctx.fillStyle = shade(st.color, 0.18);
        rrect(hx, hy, hw, hh, 3 * S); ctx.fill();
        ctx.fillStyle = shade(st.color, -0.12);
        rrect(hx, hy + hh / 2, hw, hh / 2, 3 * S); ctx.fill();
        ctx.fillRect(hx, hy + hh / 2, hw, 3 * S);
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        ctx.fillRect(hx + 3 * S, hy + hh / 2 - 0.7 * S, hw - 6 * S, 1.4 * S);
        // chimney
        ctx.fillStyle = shade(st.color, -0.35);
        ctx.fillRect(hx + hw * 0.68, hy + hh * 0.14, 5 * S, 5 * S);
      }

      function drawSwitch(sw) {
        const r = 14 * S;
        if (sw.flash > 0) {
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 * sw.flash).toFixed(3) + ')';
          ctx.lineWidth = 2 * S;
          ctx.beginPath(); ctx.arc(sw.x, sw.y, r * (1.1 + (1 - sw.flash) * 0.7), 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(30,50,25,.25)';
        ctx.beginPath(); ctx.arc(sw.x + 1.5 * S, sw.y + 2.5 * S, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f7f5ef';
        ctx.beginPath(); ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(76,93,112,.12)';
        ctx.beginPath(); ctx.arc(sw.x, sw.y, r * 0.78, 0, Math.PI * 2); ctx.fill();
        // lever arm + arrow head, rotating toward the live branch
        ctx.save();
        ctx.translate(sw.x, sw.y);
        ctx.rotate(sw.ang);
        ctx.strokeStyle = ctx.fillStyle = '#4c5d70';
        ctx.lineWidth = r * 0.24;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-r * 0.15, 0); ctx.lineTo(r * 0.3, 0); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r * 0.68, 0);
        ctx.lineTo(r * 0.16, -r * 0.4);
        ctx.lineTo(r * 0.16, r * 0.4);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#d9776a';
        ctx.beginPath(); ctx.arc(-r * 0.22, 0, r * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // hill with the tunnel portal — drawn over the start of the line
      function drawHill() {
        const x = tunnel.x, y = trackTop;
        ctx.fillStyle = 'rgba(30,50,25,.2)';
        ctx.beginPath(); ctx.ellipse(x + 4 * S, y - 26 * S, 84 * S, 34 * S, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5f8752';
        ctx.beginPath(); ctx.ellipse(x, y - 30 * S, 82 * S, 33 * S, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6a9460';
        ctx.beginPath(); ctx.ellipse(x - 10 * S, y - 36 * S, 58 * S, 22 * S, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#76a06a';
        ctx.beginPath(); ctx.ellipse(x - 16 * S, y - 40 * S, 30 * S, 12 * S, 0, 0, Math.PI * 2); ctx.fill();
        // portal
        ctx.fillStyle = '#a9a396';
        rrect(x - 15 * S, y - 13 * S, 30 * S, 15 * S, 4 * S); ctx.fill();
        const g = ctx.createLinearGradient(0, y - 12 * S, 0, y + 1 * S);
        g.addColorStop(0, '#1f2522'); g.addColorStop(1, '#3a423c');
        ctx.fillStyle = g;
        rrect(x - 10 * S, y - 12 * S, 20 * S, 13 * S, 3 * S); ctx.fill();
      }

      function drawClouds() {
        if (calm) return;
        ctx.fillStyle = 'rgba(30,50,40,.06)';
        clouds.forEach((cl) => {
          const cx = cl.x * W, cy = cl.y * H, s = cl.s * 30 * S;
          ctx.beginPath();
          ctx.ellipse(cx, cy, s * 1.6, s * 0.8, 0, 0, Math.PI * 2);
          ctx.ellipse(cx + s * 1.1, cy - s * 0.3, s, s * 0.7, 0, 0, Math.PI * 2);
          ctx.ellipse(cx - s * 1.0, cy + s * 0.2, s * 0.9, s * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      function draw() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        rrect(0, 0, W, H, 20); ctx.clip();
        if (bgCv.width) ctx.drawImage(bgCv, 0, 0, W, H);
        if (!root) { ctx.restore(); return; }
        // rails — the branch a switch is NOT pointing at is faded
        nodes.forEach((nd) => {
          const active = !nd.parent || nd.parent.kids[nd.parent.active] === nd;
          if (!active) drawRails(nd.edge, false);
        });
        nodes.forEach((nd) => {
          const active = !nd.parent || nd.parent.kids[nd.parent.active] === nd;
          if (active) drawRails(nd.edge, true);
        });
        trains.forEach(drawTrain);
        leaves.forEach(drawStation);
        drawPuffs();
        drawHill();
        drawClouds();
        switches.forEach(drawSwitch);
        ctx.restore();
      }

      /* ---------- input ---------- */
      api.on(cv, 'pointerdown', (e) => {
        e.preventDefault();
        if (!root) return;
        const r = cv.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        let best = null, bd = Infinity;
        switches.forEach((sw) => {
          const d = Math.hypot(sw.x - x, sw.y - y);
          if (d < bd) { bd = d; best = sw; }
        });
        if (best && bd <= Math.max(34, 32 * S)) {
          best.active ^= 1;
          best.flash = 1;
          api.sfx('tap');
          api.vibrate(8);
        }
      });

      api.on(window, 'resize', () => {
        // keep trains at the same fraction of their current edge
        const fr = trains.map((t) => { const e = nodes[t.route[t.route.length - 1]].edge; return t.d / e.len; });
        geometry();
        trains.forEach((t, i) => { t.d = fr[i] * nodes[t.route[t.route.length - 1]].edge.len; });
        puffs = [];
      });

      setShape(LEVELS[0].st);
      spawnAcc = LEVELS[0].gap - 0.6;
      api.status('Tap a switch to flip it');
      api.frame((dt) => {
        if (!W || W < 2) geometry();
        if (!started) { started = true; api.timer(60); api.after(2200, showStatus); }
        update(dt);
        draw();
      });
      return () => { trains = []; };
    },
  });
})();
