// Trains — flip switches to send each train to the station of its own color (Train of Thought).
(function () {
  const COLORS = ['#ff5c6c', '#4da3ff', '#3ddc84', '#ffd23f', '#c77dff', '#ff9f43'];
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

  NP.register({
    id: 'trains',
    name: 'Trains',
    icon: '🚂',
    color: '#3ddc84',
    tagline: 'Flip switches to send each train to its matching station',
    how: [
      'Colored trains roll out of the tunnel one after another.',
      'Tap a switch (the gold circles) to flip it — the arrow and bright rails show where it sends trains.',
      'Get every train to the station of its own color.',
      'More stations, faster trains as you improve.',
    ],
    controls: 'Tap switches',
    start(api) {
      api.el('style', null, null, `
        .tr-wrap { position: absolute; inset: 2px 4px 4px; }
        .tr-wrap canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
      `);
      const wrap = api.el('div', 'tr-wrap');
      const cv = api.el('canvas', null, wrap);
      const ctx = cv.getContext('2d');

      let W = 0, H = 0, dpr = 1, S = 1;
      let nodes = [], leaves = [], switches = [], root = null, shape = null;
      const tunnel = { x: 0, y: 0 };
      let trackTop = 0, trackBot = 0;
      let trains = [], pops = [];
      let level = 0, prog = 0, missRow = 0, pending = false, holdT = 0, spawnAcc = 0;
      let recent = [];
      let started = false;

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

      function setShape(n) {
        let sh = api.pick(SHAPES[n]);
        if (Math.random() < 0.5) sh = mirror(sh);
        shape = sh;
        nodes = []; leaves = []; switches = [];
        const walk = (sv, depth, parent) => {
          const nd = { id: nodes.length, depth, parent, leaf: sv === null, pulse: 0 };
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
        pops = [];
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
        const bw = Math.min(W - 2 * (R + 10), H * 0.95, 580);
        const left = (W - bw) / 2;
        trackTop = 40 * S;
        trackBot = H - R * 1.55 - 6;
        const rowH = (trackBot - trackTop) / maxD;
        const place = (nd) => {
          nd.y = trackTop + nd.depth * rowH;
          if (nd.leaf) nd.x = left + (n > 1 ? (nd.col / (n - 1)) * bw : bw / 2);
          else { place(nd.kids[0]); place(nd.kids[1]); nd.x = (nd.kids[0].x + nd.kids[1].x) / 2; }
        };
        place(root);
        tunnel.x = root.x; tunnel.y = trackTop;
        nodes.forEach((nd) => {
          const p = nd.parent || tunnel;
          nd.edge = makeEdge(p.x, p.y, nd.x, nd.y);
        });
        switches.forEach((sw) => { sw.ang = targetAng(sw); });
      }

      function targetAng(sw) {
        const e = sw.kids[sw.active].edge;
        const p = posAt(e, e.len * 0.5);
        return Math.atan2(p.y - sw.y, p.x - sw.x);
      }

      /* ---------- trains ---------- */
      const ENG = () => 26 * S, CAR = () => 19 * S, GAP = () => 4 * S, WID = () => 14 * S;
      const CARS = 2;
      const trainLen = () => ENG() + CARS * (CAR() + GAP());
      const speedPx = () => ((trackBot - trackTop) / 6.5) * LEVELS[level].sp;

      function canSpawn() {
        const last = trains[trains.length - 1];
        return !last || last.route.length > 1 || last.d > trainLen() + 40 * S;
      }

      function spawn() {
        const pool = leaves.map((l) => l.color);
        let c = api.pick(pool);
        // avoid long runs of the same color
        if (recent.length >= 2 && recent[0] === c && recent[1] === c) c = api.pick(pool.filter((x) => x !== c));
        recent.unshift(c); recent.length = Math.min(recent.length, 2);
        trains.push({ color: c, route: [root.id], d: 0, done: false, gone: false });
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
        api.answer(ok, 50 + 10 * level);
        pops.push({ x: st.x, y: st.y - 30 * S, ok, t: 0 });
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
        });
        trains = trains.filter((t) => !t.gone);

        switches.forEach((sw) => {
          const ta = targetAng(sw);
          if (sw.ang == null) sw.ang = ta;
          let diff = ta - sw.ang;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          sw.ang += diff * Math.min(1, dt * 16);
        });
        leaves.forEach((l) => { if (l.pulse > 0) l.pulse = Math.max(0, l.pulse - dt * 1.6); });
        pops.forEach((p) => (p.t += dt));
        pops = pops.filter((p) => p.t < 1);
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

      function drawEdge(e, active) {
        ctx.globalAlpha = active ? 1 : 0.32;
        ctx.lineCap = 'butt';
        ctx.setLineDash([3 * S, 6 * S]);
        ctx.lineWidth = 15 * S;
        ctx.strokeStyle = '#6b5a8e';
        poly(e.xs, e.ys); ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineCap = 'round';
        ctx.lineWidth = 2.6 * S;
        ctx.strokeStyle = active ? '#e9e4ff' : '#a99fd0';
        poly(e.lx, e.ly); ctx.stroke();
        poly(e.rx, e.ry); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      function drawPart(p, len, color, engine) {
        const w = WID();
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.fillStyle = 'rgba(0,0,0,.28)';
        rrect(-len / 2 + 1.5 * S, -w / 2 + 2.5 * S, len, w, 4 * S); ctx.fill();
        ctx.fillStyle = color;
        rrect(-len / 2, -w / 2, len, w, 4 * S); ctx.fill();
        ctx.lineWidth = 1.5 * S;
        ctx.strokeStyle = 'rgba(0,0,0,.4)';
        ctx.stroke();
        if (engine) {
          ctx.fillStyle = 'rgba(255,255,255,.85)';
          rrect(len / 2 - 9 * S, -w / 2 + 2.5 * S, 6 * S, w - 5 * S, 2 * S); ctx.fill();
          ctx.fillStyle = '#fff6b0';
          ctx.beginPath(); ctx.arc(len / 2 - 0.5 * S, 0, 2.2 * S, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,.35)';
          ctx.beginPath(); ctx.arc(-len / 2 + 7 * S, 0, 3 * S, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(255,255,255,.35)';
          rrect(-len / 2 + 3 * S, -w / 2 + 3 * S, len - 6 * S, w - 6 * S, 2 * S); ctx.fill();
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

      function drawStation(st) {
        const R = 19 * S;
        const x = st.x, y = st.y + R * 0.35;
        if (st.pulse > 0) {
          ctx.strokeStyle = st.pulseOk ? 'rgba(61,220,132,' + st.pulse + ')' : 'rgba(255,92,122,' + st.pulse + ')';
          ctx.lineWidth = 4 * S;
          ctx.beginPath(); ctx.arc(x, y, R * (1.2 + (1 - st.pulse) * 0.9), 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(0,0,0,.3)';
        rrect(x - R + 2 * S, y - R * 0.4 + 3 * S, 2 * R, R * 1.4, 5 * S); ctx.fill();
        // body
        ctx.fillStyle = st.color;
        rrect(x - R, y - R * 0.4, 2 * R, R * 1.4, 5 * S); ctx.fill();
        ctx.lineWidth = 2.5 * S; ctx.strokeStyle = '#fff'; ctx.stroke();
        // roof
        ctx.beginPath();
        ctx.moveTo(x - R * 1.2, y - R * 0.35);
        ctx.lineTo(x, y - R * 1.25);
        ctx.lineTo(x + R * 1.2, y - R * 0.35);
        ctx.closePath();
        ctx.fillStyle = st.color; ctx.fill();
        ctx.lineJoin = 'round'; ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fill();
        // door
        ctx.fillStyle = 'rgba(26,18,48,.75)';
        rrect(x - R * 0.32, y + R * 0.25, R * 0.64, R * 0.75, 3 * S); ctx.fill();
      }

      function drawSwitch(sw) {
        const r = 15 * S;
        ctx.fillStyle = 'rgba(255,204,77,.16)';
        ctx.beginPath(); ctx.arc(sw.x, sw.y, r * 1.75, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffcc4d';
        ctx.beginPath(); ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 2.5 * S; ctx.strokeStyle = '#fff3c4'; ctx.stroke();
        ctx.save();
        ctx.translate(sw.x, sw.y);
        ctx.rotate(sw.ang);
        ctx.fillStyle = ctx.strokeStyle = '#3a2400';
        ctx.lineWidth = r * 0.32;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-r * 0.55, 0); ctx.lineTo(r * 0.1, 0); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r * 0.8, 0);
        ctx.lineTo(r * 0.05, -r * 0.5);
        ctx.lineTo(r * 0.05, r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      function drawTunnel() {
        const x = tunnel.x, y = tunnel.y, r = 24 * S;
        ctx.fillStyle = '#4a3b72';
        ctx.beginPath(); ctx.ellipse(x, y - 4 * S, r * 1.5, r, 0, Math.PI, 0); ctx.lineTo(x + r * 1.5, y + 2 * S); ctx.lineTo(x - r * 1.5, y + 2 * S); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5d4b8c';
        ctx.beginPath(); ctx.ellipse(x, y - 4 * S, r * 1.2, r * 0.8, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#0d0820';
        ctx.beginPath(); ctx.ellipse(x, y + 2 * S, r * 0.62, r * 0.7, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
      }

      function draw() {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        // ground
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#2a2050'); g.addColorStop(1, '#1f3b3a');
        ctx.fillStyle = g;
        rrect(0, 0, W, H, 22); ctx.fill();
        if (!root) return;
        // tracks — the branch a switch is NOT pointing at is dimmed
        nodes.forEach((nd) => {
          const active = !nd.parent || nd.parent.kids[nd.parent.active] === nd;
          drawEdge(nd.edge, active);
        });
        trains.forEach(drawTrain);
        leaves.forEach(drawStation);
        drawTunnel();
        switches.forEach(drawSwitch);
        // ✓ / ✗ pops
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        pops.forEach((p) => {
          ctx.globalAlpha = 1 - p.t;
          ctx.font = '900 ' + Math.round(26 * S) + 'px -apple-system, system-ui, sans-serif';
          ctx.fillStyle = p.ok ? '#3ddc84' : '#ff5c7a';
          ctx.fillText(p.ok ? '✓' : '✗', p.x, p.y - p.t * 30 * S);
        });
        ctx.globalAlpha = 1;
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
          api.sfx('tap');
          api.vibrate(8);
        }
      });

      api.on(window, 'resize', () => {
        // keep trains at the same fraction of their current edge
        const fr = trains.map((t) => { const e = nodes[t.route[t.route.length - 1]].edge; return t.d / e.len; });
        geometry();
        trains.forEach((t, i) => { t.d = fr[i] * nodes[t.route[t.route.length - 1]].edge.len; });
      });

      setShape(LEVELS[0].st);
      spawnAcc = LEVELS[0].gap - 0.6;
      api.status('Tap a gold switch to flip it');
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
