// Sky Patrol — dodge enemy planes, shoot them down, grab stars.
// Flat, calm illustration: muted sky gradient, parallax flat clouds drifting down,
// flat top-down planes with soft ground shadows and engine flames, explosions with debris.
(function () {
  // ---- unit-size plane parts, nose up at y = -1 ----
  function pathFrom(pts) {
    const p = new Path2D();
    pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    p.closePath();
    return p;
  }
  const WING = pathFrom([[-0.13, -0.24], [0.13, -0.24], [1, 0.1], [1, 0.3], [0.12, 0.24], [-0.12, 0.24], [-1, 0.3], [-1, 0.1]]);
  const WING_BACK = pathFrom([[1, 0.2], [1, 0.3], [0.12, 0.24], [-0.12, 0.24], [-1, 0.3], [-1, 0.2], [-0.12, 0.12], [0.12, 0.12]]);
  const TAIL = pathFrom([[-0.09, 0.56], [0.09, 0.56], [0.42, 0.8], [0.42, 0.94], [-0.42, 0.94], [-0.42, 0.8]]);
  const BODY = (() => {
    const p = new Path2D();
    p.moveTo(0, -1);
    p.bezierCurveTo(0.12, -0.96, 0.15, -0.75, 0.15, -0.5);
    p.lineTo(0.12, 0.8);
    p.quadraticCurveTo(0.1, 0.96, 0, 0.98);
    p.quadraticCurveTo(-0.1, 0.96, -0.12, 0.8);
    p.lineTo(-0.15, -0.5);
    p.bezierCurveTo(-0.15, -0.75, -0.12, -0.96, 0, -1);
    p.closePath();
    return p;
  })();
  const STAR = (() => {
    const p = new Path2D();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.46 : 1;
      i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    p.closePath();
    return p;
  })();

  // muted, calm palette
  const SKY = ['#6f95bd', '#b8cddd'];
  const PLAYER = { body: '#f4f1ea', wing: '#5fb8b0', wing2: '#4ea39b', tail: '#4ea39b', glass: '#34425e' };
  const TYPES = {
    basic: { body: '#f0e9e1', wing: '#d9705f', wing2: '#c25f50', r: 1, hp: 1, pts: 10 },
    weave: { body: '#f0e9e1', wing: '#dcae55', wing2: '#c79a45', r: 1, hp: 1, pts: 15 },
    shooter: { body: '#ece6ee', wing: '#9a7cae', wing2: '#866a99', r: 1.05, hp: 2, pts: 25 },
    tank: { body: '#d9dee8', wing: '#64738d', wing2: '#56637b', r: 1.45, hp: 5, pts: 50 },
  };
  const SHADOW = 'rgba(38, 58, 92, 0.16)';

  const ART = '<svg viewBox="0 0 64 64">' +
    '<defs><linearGradient id="spi-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f95bd"/><stop offset="1" stop-color="#b8cddd"/></linearGradient></defs>' +
    '<rect x="2" y="2" width="60" height="60" rx="16" fill="url(#spi-sky)"/>' +
    '<g fill="#dfe8f0"><circle cx="13" cy="47" r="7"/><circle cx="21" cy="49" r="5.5"/><circle cx="7" cy="50" r="4.5"/></g>' +
    '<g fill="#f7f9fb"><circle cx="13" cy="45" r="7"/><circle cx="21" cy="47" r="5.5"/><circle cx="7" cy="48" r="4.5"/></g>' +
    '<g fill="#f7f9fb" opacity=".8"><circle cx="50" cy="14" r="4.5"/><circle cx="55" cy="16" r="3.5"/></g>' +
    '<g transform="translate(37 39) scale(12)" fill="rgba(38,58,92,.18)"><path d="M-.13-.24h.26L1 .1v.2L.12.24h-.24L-1 .3v-.2z"/><path d="M0-1C.12-.96.15-.75.15-.5L.12.8Q.1.96 0 .98-.1.96-.12.8L-.15-.5C-.15-.75-.12-.96 0-1z"/></g>' +
    '<g transform="translate(31 31) scale(14)">' +
    '<path d="M-.07.98L.07.98 0 1.35z" fill="#e8a25c"/>' +
    '<path d="M-.13-.24h.26L1 .1v.2L.12.24h-.24L-1 .3v-.2z" fill="#5fb8b0"/>' +
    '<path d="M-.09.56h.18L.42.8v.14h-.84V.8z" fill="#4ea39b"/>' +
    '<path d="M0-1C.12-.96.15-.75.15-.5L.12.8Q.1.96 0 .98-.1.96-.12.8L-.15-.5C-.15-.75-.12-.96 0-1z" fill="#f4f1ea"/>' +
    '<ellipse cx="0" cy="-.45" rx=".07" ry=".16" fill="#34425e"/></g>' +
    '</svg>';

  NP.register({
    id: 'sky-patrol',
    name: 'Sky Patrol',
    icon: '✈️',
    art: ART,
    color: '#6f95bd',
    bg: SKY,
    tagline: 'Dodge enemy planes, shoot them down, grab stars',
    how: [
      'Tilt your phone to steer (or drag your finger / use ← → keys).',
      'Your plane fires automatically. Shoot enemy planes for points.',
      'Grab stars for bonus points and a triple shot. You have 3 lives.',
    ],
    controls: 'Tilt to steer',
    needsTilt: true,
    start(api) {
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const wrap = api.el('div', 'sp-wrap');
      const cv = api.el('canvas', null, wrap);
      const ctx = cv.getContext('2d');
      // layout guard: the canvas must never size its own container (even if game.css is stale/missing)
      wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden';
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
      const tiltOn = api.tilt().available;
      const hint = api.el('div', 'sp-hint', wrap, tiltOn ? 'Tilt to steer' : 'Drag to steer  ·  ← → keys');
      api.after(2800, () => hint.classList.add('gone'));

      let W = 0, H = 0, S = 30, dpr = 1;
      const player = { x: 0, y: 0, vx: 0, bank: 0 };
      let lives = 3, inv = 0, t = 0, dead = false, kills = 0, starsGot = 0, shake = 0;
      let fireCd = 0.4, spawnT = 1.2, starT = 6, triple = 0;
      let bullets = [], enemies = [], eBullets = [], stars = [];
      let booms = [], debris = [], smoke = [], sparks = [], trail = [];

      /* ---------- clouds (pre-rendered flat sprites) ---------- */
      const sprites = [];
      function makeCloud(w) {
        const h = w * 0.62;
        const c = document.createElement('canvas');
        c.width = Math.ceil(w * dpr);
        c.height = Math.ceil((h + w * 0.08) * dpr);
        const g = c.getContext('2d');
        g.scale(dpr, dpr);
        const blobs = [];
        const n = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n;
          const r = w * (0.13 + Math.sin(u * Math.PI) * 0.12) * (0.85 + Math.random() * 0.3);
          blobs.push([w * (0.12 + u * 0.76), h - r * 0.75 - Math.random() * h * 0.08, r]);
        }
        const draw = (dy, color) => {
          g.fillStyle = color;
          g.beginPath();
          blobs.forEach(([x, y, r]) => { g.moveTo(x + r, y + dy); g.arc(x, y + dy, r, 0, 6.29); });
          g.rect(w * 0.12, h * 0.62 + dy, w * 0.76, h * 0.2);
          g.fill();
        };
        draw(w * 0.05, '#d6e1eb');
        draw(0, '#f6f8fa');
        return c;
      }
      function buildSprites() {
        sprites.length = 0;
        for (let i = 0; i < 6; i++) sprites.push(makeCloud(150 + i * 26));
      }
      const clouds = [];
      function seedClouds() {
        clouds.length = 0;
        // depth z: 0.35 (far, small, slow) … 1 (near)
        for (let i = 0; i < 9; i++) {
          const z = i < 5 ? 0.35 + Math.random() * 0.2 : 0.8 + Math.random() * 0.25;
          clouds.push({ x: Math.random(), y: Math.random() * 1.3 - 0.15, z, s: sprites[i % sprites.length] });
        }
        clouds.sort((a, b) => a.z - b.z);
      }
      const wisps = [];
      for (let i = 0; i < 3; i++) wisps.push({ x: Math.random(), y: Math.random(), w: 0.4 + Math.random() * 0.4 });

      function fit() {
        const w = wrap.clientWidth, h = wrap.clientHeight;
        if (!w || !h || (w === W && h === H)) return;
        const first = !W;
        dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (first) { player.x = w / 2; buildSprites(); seedClouds(); } else player.x *= w / W;
        W = w; H = h;
        S = Math.max(16, Math.min(W / 10, H / 14, 34));
        player.y = H - S * 2.6;
      }

      /* ---------- input ---------- */
      let targetX = null, pressed = false;
      const keys = { left: false, right: false };
      const localX = (e) => e.clientX - cv.getBoundingClientRect().left;
      api.on(cv, 'pointerdown', (e) => { e.preventDefault(); pressed = true; targetX = localX(e); });
      api.on(cv, 'pointermove', (e) => { if (pressed || e.pointerType === 'mouse') targetX = localX(e); });
      const release = (e) => { pressed = false; if (e.pointerType !== 'mouse') targetX = null; };
      api.on(cv, 'pointerup', release);
      api.on(cv, 'pointercancel', release);
      api.on(cv, 'pointerleave', (e) => { if (e.pointerType === 'mouse') targetX = null; });
      api.on(cv, 'touchmove', (e) => e.preventDefault(), { passive: false });
      const keyName = (e) => ({ ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' })[e.key];
      api.on(window, 'keydown', (e) => { const k = keyName(e); if (k) { e.preventDefault(); keys[k] = true; targetX = null; } });
      api.on(window, 'keyup', (e) => { const k = keyName(e); if (k) keys[k] = false; });

      /* ---------- spawning ---------- */
      function spawnEnemy() {
        const r = Math.random();
        let type = 'basic';
        if (t > 50 && r < 0.14) type = 'tank';
        else if (t > 22 && r < 0.38) type = 'shooter';
        else if (t > 8 && r < 0.62) type = 'weave';
        const d = TYPES[type];
        const size = S * d.r;
        const speed = H * (0.16 + Math.min(0.24, t * 0.0028)) * (0.8 + Math.random() * 0.4) * (type === 'tank' ? 0.6 : 1);
        const e = {
          type, d, size, hp: d.hp, hit: 0, bank: 0,
          x: size + Math.random() * (W - size * 2), y: -size * 1.5, x0: 0,
          vy: speed, phase: Math.random() * 6.28, amp: W * (0.12 + Math.random() * 0.12),
          fire: 0.8 + Math.random() * 1.2,
        };
        e.x0 = Math.max(e.amp + size, Math.min(W - e.amp - size, e.x));
        enemies.push(e);
      }

      function explode(x, y, d, size, big) {
        booms.push({ x, y, r: size * (big ? 2.4 : 1.7), t: 0, dur: big ? 0.7 : 0.5 });
        const nd = big ? 14 : 8;
        for (let i = 0; i < nd; i++) {
          const a = Math.random() * 6.28, v = S * (2 + Math.random() * 4);
          debris.push({
            x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - S, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 12,
            s: size * (0.14 + Math.random() * 0.2), color: i % 3 ? d.wing : d.body, life: 0.8 + Math.random() * 0.5, max: 1.3,
          });
        }
        for (let i = 0; i < (big ? 7 : 4); i++) {
          smoke.push({ x: x + (Math.random() - 0.5) * size, y: y + (Math.random() - 0.5) * size, r: size * (0.35 + Math.random() * 0.3), life: 0.9 + Math.random() * 0.5, max: 1.4 });
        }
        if (!reduce) shake = Math.max(shake, big ? 0.35 : 0.08);
      }
      function sparkle(x, y, n, color) {
        for (let i = 0; i < n; i++) {
          const a = Math.random() * 6.28, v = S * (1 + Math.random() * 3);
          sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.4 + Math.random() * 0.4, max: 0.8, color });
        }
      }

      let lastStatus = '';
      function status() {
        const s = 'Wave ' + (1 + Math.floor(t / 20)) + (triple > 0 ? '  ·  Triple shot' : '');
        if (s !== lastStatus) { lastStatus = s; api.status(s); }
      }

      function hitPlayer() {
        if (inv > 0 || dead) return;
        lives--;
        inv = 2;
        api.sfx('boom');
        api.vibrate(160);
        api.flash(false);
        explode(player.x, player.y, PLAYER, S, false);
        shake = reduce ? 0 : 0.3;
        eBullets = eBullets.filter((b) => Math.hypot(b.x - player.x, b.y - player.y) > S * 5);
        if (lives <= 0) {
          dead = true;
          explode(player.x, player.y, PLAYER, S * 1.3, true);
          api.after(1400, () => api.end('Survived ' + Math.floor(t) + 's · ' + kills + ' planes downed · ' + starsGot + ' stars'));
        }
        status();
      }

      /* ---------- update ---------- */
      function update(dt) {
        t += dt;
        if (inv > 0) inv -= dt;
        if (triple > 0) triple -= dt;
        if (shake > 0) shake -= dt;

        if (!dead) {
          const maxV = W * 1.3;
          const tilt = api.tilt();
          let want;
          if (keys.left || keys.right) want = ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * maxV;
          else if (targetX != null) want = Math.max(-maxV, Math.min(maxV, (targetX - player.x) * 9));
          else if (tilt.available) want = (Math.abs(tilt.x) < 0.06 ? 0 : tilt.x) * maxV;
          else want = 0;
          player.vx += (want - player.vx) * Math.min(1, dt * 14);
          player.x = Math.max(S, Math.min(W - S, player.x + player.vx * dt));
          const wantBank = Math.max(-1, Math.min(1, player.vx / (W * 0.9)));
          player.bank += (wantBank - player.bank) * Math.min(1, dt * 8);

          fireCd -= dt;
          if (fireCd <= 0) {
            fireCd = Math.max(0.15, 0.24 - t * 0.0006);
            const bv = H * 1.15;
            bullets.push({ x: player.x, y: player.y - S, vx: 0, vy: -bv });
            if (triple > 0) {
              bullets.push({ x: player.x - S * 0.5, y: player.y - S * 0.5, vx: -bv * 0.18, vy: -bv });
              bullets.push({ x: player.x + S * 0.5, y: player.y - S * 0.5, vx: bv * 0.18, vy: -bv });
            }
            api.sfx('shoot');
          }
        }

        // contrails from the wingtips, carried down with the scrolling sky
        const scroll = H * 0.22;
        trail.forEach((p) => { p.y += scroll * dt; p.life -= dt; });
        trail = trail.filter((p) => p.life > 0);
        if (!dead) trail.push({ x: player.x, y: player.y + S * 0.25, span: S * (1 - Math.abs(player.bank) * 0.25), life: 0.5 });

        spawnT -= dt;
        if (spawnT <= 0) {
          spawnEnemy();
          spawnT = Math.max(0.32, 1.25 - t * 0.012) * (0.7 + Math.random() * 0.6);
          if (t > 35 && Math.random() < Math.min(0.4, (t - 35) * 0.006)) spawnEnemy();
        }
        starT -= dt;
        if (starT <= 0) {
          starT = 6 + Math.random() * 4;
          const x = S + Math.random() * (W - 2 * S);
          stars.push({ x, x0: x, y: -S, vy: H * 0.14, ph: Math.random() * 6, rot: 0 });
        }

        bullets.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; });
        bullets = bullets.filter((b) => b.y > -20 && b.x > -20 && b.x < W + 20 && !b.dead);

        enemies.forEach((e) => {
          e.y += e.vy * dt;
          e.phase += dt * 2.2;
          if (e.type === 'weave') {
            e.x = e.x0 + Math.sin(e.phase) * e.amp;
            e.bank = -Math.cos(e.phase) * 0.8; // drawn flipped, so invert
          }
          if (e.hit > 0) e.hit -= dt;
          if (e.type === 'shooter' && !dead && e.y > 0 && e.y < H * 0.6) {
            e.fire -= dt;
            if (e.fire <= 0) {
              e.fire = Math.max(1.1, 2.2 - t * 0.01) + Math.random() * 0.6;
              const dx = player.x - e.x, dy = player.y - e.y, d = Math.hypot(dx, dy) || 1;
              const v = H * (0.42 + Math.min(0.2, t * 0.002));
              eBullets.push({ x: e.x, y: e.y + e.size * 0.8, vx: (dx / d) * v, vy: (dy / d) * v });
            }
          }
          for (const b of bullets) {
            if (b.dead) continue;
            if (Math.abs(b.x - e.x) < e.size * 0.95 && Math.abs(b.y - e.y) < e.size) {
              b.dead = true;
              e.hp--;
              e.hit = 0.08;
              sparkle(b.x, b.y, 3, '#fbe7b0');
              if (e.hp <= 0) {
                e.dead = true;
                kills++;
                const pts = e.d.pts * (1 + Math.floor(t / 20));
                api.addScore(pts);
                api.fx.popup('+' + pts, e.x, e.y, '#fff6dc');
                explode(e.x, e.y, e.d, e.size, e.type === 'tank');
                api.sfx('boom');
                break;
              }
            }
          }
          if (!e.dead && !dead && Math.hypot(e.x - player.x, e.y - player.y) < (e.size + S) * 0.62) {
            if (inv <= 0) {
              e.dead = true;
              explode(e.x, e.y, e.d, e.size, false);
              hitPlayer();
            }
          }
        });
        enemies = enemies.filter((e) => !e.dead && e.y < H + e.size * 2);

        eBullets.forEach((b) => {
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (!dead && Math.hypot(b.x - player.x, b.y - player.y) < S * 0.55) { b.dead = true; hitPlayer(); }
        });
        eBullets = eBullets.filter((b) => !b.dead && b.y < H + 10 && b.y > -10 && b.x > -10 && b.x < W + 10);

        stars.forEach((s) => {
          s.y += s.vy * dt; s.ph += dt * 2; s.rot += dt * 0.9;
          s.x = s.x0 + Math.sin(s.ph) * S * 0.8;
          if (!dead && Math.hypot(s.x - player.x, s.y - player.y) < S * 1.2) {
            s.dead = true;
            starsGot++;
            triple = 6;
            api.addScore(100);
            api.fx.popup('+100', s.x, s.y, '#f3d27a');
            api.fx.burst(s.x, s.y, '#ecc66e', 10);
            booms.push({ x: s.x, y: s.y, r: S * 1.6, t: 0, dur: 0.45, ring: true });
            api.sfx('level');
          }
        });
        stars = stars.filter((s) => !s.dead && s.y < H + S * 2);

        booms.forEach((b) => { b.t += dt; });
        booms = booms.filter((b) => b.t < b.dur);
        debris.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += S * 9 * dt; p.vx *= 0.98; p.rot += p.vr * dt; p.life -= dt; });
        debris = debris.filter((p) => p.life > 0);
        smoke.forEach((p) => { p.y += scroll * 0.6 * dt; p.r += S * 0.6 * dt; p.life -= dt; });
        smoke = smoke.filter((p) => p.life > 0);
        sparks.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt; });
        sparks = sparks.filter((p) => p.life > 0);
        status();
      }

      /* ---------- draw ---------- */
      function plane(x, y, s, c, down, bank, hit) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, down ? -s : s);
        // engine flame (behind the tail)
        const fl = 0.28 + Math.random() * 0.16;
        ctx.fillStyle = '#e8a25c';
        ctx.beginPath(); ctx.moveTo(-0.08, 0.94); ctx.lineTo(0.08, 0.94); ctx.lineTo(0, 0.94 + fl); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#f7dc9a';
        ctx.beginPath(); ctx.moveTo(-0.04, 0.94); ctx.lineTo(0.04, 0.94); ctx.lineTo(0, 0.94 + fl * 0.55); ctx.closePath(); ctx.fill();
        // wings bank: narrower and shifted
        ctx.save();
        ctx.translate(bank * 0.08, 0);
        ctx.scale(1 - Math.abs(bank) * 0.22, 1);
        ctx.fillStyle = hit ? '#ffffff' : c.wing;
        ctx.fill(WING);
        ctx.fillStyle = hit ? '#f2f2f2' : c.wing2;
        ctx.fill(WING_BACK);
        ctx.restore();
        ctx.fillStyle = hit ? '#ffffff' : (c.tail || c.wing2);
        ctx.fill(TAIL);
        ctx.fillStyle = hit ? '#ffffff' : c.body;
        ctx.fill(BODY);
        ctx.fillStyle = c.glass || '#3a4560';
        ctx.beginPath();
        ctx.ellipse(0, -0.46, 0.07, 0.16, 0, 0, 6.29);
        ctx.fill();
        ctx.restore();
      }
      function shadow(x, y, s, down, bank) {
        ctx.save();
        ctx.translate(x + s * 0.55, y + s * 1.05);
        ctx.scale(s * 0.78, down ? -s * 0.78 : s * 0.78);
        ctx.fillStyle = SHADOW;
        ctx.save();
        ctx.scale(1 - Math.abs(bank) * 0.22, 1);
        ctx.fill(WING);
        ctx.restore();
        ctx.fill(TAIL);
        ctx.fill(BODY);
        ctx.restore();
      }

      function drawClouds(dt, near) {
        clouds.forEach((c) => {
          if ((c.z > 0.7) !== near) return;
          c.y += dt * 0.11 * c.z;
          const w = c.s.width / dpr * (0.55 + c.z * 0.6), h = c.s.height / dpr * (0.55 + c.z * 0.6);
          if (c.y * H > H + 10) { c.y = -h / H - Math.random() * 0.2; c.x = Math.random(); }
          ctx.globalAlpha = near ? 0.92 : 0.55;
          ctx.drawImage(c.s, c.x * (W + w) - w, c.y * H, w, h);
        });
        ctx.globalAlpha = 1;
      }

      function draw(dt) {
        ctx.clearRect(0, 0, W, H);
        ctx.save();
        if (shake > 0) ctx.translate((Math.random() - 0.5) * 8 * shake / 0.3, (Math.random() - 0.5) * 8 * shake / 0.3);

        drawClouds(dt, false);

        // shadows on the ground far below
        enemies.forEach((e) => shadow(e.x, e.y, e.size, true, e.bank));
        if (!dead) shadow(player.x, player.y, S, false, player.bank);
        stars.forEach((s) => {
          ctx.save(); ctx.translate(s.x + S * 0.4, s.y + S * 0.7); ctx.rotate(s.rot); ctx.scale(S * 0.5, S * 0.5);
          ctx.fillStyle = SHADOW; ctx.fill(STAR); ctx.restore();
        });

        drawClouds(dt, true);

        // smoke
        smoke.forEach((p) => {
          ctx.globalAlpha = Math.max(0, p.life / p.max) * 0.5;
          ctx.fillStyle = '#e6e9ee';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill();
        });
        ctx.globalAlpha = 1;

        // contrails
        if (trail.length > 1) {
          ctx.lineWidth = Math.max(1.2, S * 0.06);
          ctx.lineCap = 'round';
          [-1, 1].forEach((side) => {
            for (let i = 1; i < trail.length; i++) {
              const a = trail[i - 1], b = trail[i];
              ctx.strokeStyle = 'rgba(255,255,255,' + (b.life * 0.7).toFixed(3) + ')';
              ctx.beginPath();
              ctx.moveTo(a.x + side * a.span * 0.95, a.y);
              ctx.lineTo(b.x + side * b.span * 0.95, b.y);
              ctx.stroke();
            }
          });
        }

        // stars: flat mustard star with a soft breathing halo and two small glints
        stars.forEach((s) => {
          const pulse = 0.5 + 0.5 * Math.sin(s.ph * 2);
          ctx.fillStyle = 'rgba(255, 244, 214,' + (0.22 + pulse * 0.12).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(s.x, s.y, S * (1 + pulse * 0.15), 0, 6.29); ctx.fill();
          ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.scale(S * 0.62, S * 0.62);
          ctx.fillStyle = '#ecc66e'; ctx.fill(STAR);
          ctx.scale(0.55, 0.55); ctx.fillStyle = '#f5da95'; ctx.fill(STAR);
          ctx.restore();
          for (let k = 0; k < 2; k++) {
            const a = s.ph * 0.7 + k * Math.PI, g = (0.5 + 0.5 * Math.sin(s.ph * 3 + k * 2)) * S * 0.22;
            const gx = s.x + Math.cos(a) * S * 0.95, gy = s.y + Math.sin(a) * S * 0.95;
            ctx.fillStyle = 'rgba(255, 250, 235, .9)';
            ctx.beginPath();
            ctx.moveTo(gx, gy - g); ctx.lineTo(gx + g * 0.25, gy); ctx.lineTo(gx, gy + g); ctx.lineTo(gx - g * 0.25, gy); ctx.closePath();
            ctx.moveTo(gx - g, gy); ctx.lineTo(gx, gy + g * 0.25); ctx.lineTo(gx + g, gy); ctx.lineTo(gx, gy - g * 0.25); ctx.closePath();
            ctx.fill();
          }
        });

        // player bullets: pale capsules
        ctx.fillStyle = '#fbefc8';
        bullets.forEach((b) => {
          ctx.beginPath();
          ctx.ellipse(b.x, b.y, S * 0.08, S * 0.26, Math.atan2(b.vx, -b.vy), 0, 6.29);
          ctx.fill();
        });

        enemies.forEach((e) => {
          plane(e.x, e.y, e.size, e.d, true, e.bank, e.hit > 0);
          if (e.d.hp > 1 && e.hp < e.d.hp) {
            const w = e.size * 1.4, y = e.y - e.size * 1.35;
            ctx.fillStyle = 'rgba(30,40,60,.25)';
            ctx.beginPath(); ctx.roundRect(e.x - w / 2, y, w, 4, 2); ctx.fill();
            ctx.fillStyle = '#f4f1ea';
            ctx.beginPath(); ctx.roundRect(e.x - w / 2, y, (w * e.hp) / e.d.hp, 4, 2); ctx.fill();
          }
        });

        // enemy bullets: coral dots with a soft halo
        eBullets.forEach((b) => {
          ctx.fillStyle = 'rgba(217, 112, 95, .28)';
          ctx.beginPath(); ctx.arc(b.x, b.y, S * 0.3, 0, 6.29); ctx.fill();
          ctx.fillStyle = '#d9705f';
          ctx.beginPath(); ctx.arc(b.x, b.y, S * 0.15, 0, 6.29); ctx.fill();
        });

        if (!dead && !(inv > 0 && Math.floor(t * 10) % 2)) {
          plane(player.x, player.y, S, triple > 0 ? Object.assign({}, PLAYER, { wing: '#e3b55e', wing2: '#cfa04d', tail: '#cfa04d' }) : PLAYER, false, player.bank, false);
        }

        // explosions: flat fireball rings that expand and fade
        booms.forEach((b) => {
          const k = b.t / b.dur, e = 1 - Math.pow(1 - k, 3);
          if (b.ring) {
            ctx.strokeStyle = 'rgba(243, 210, 122,' + (1 - k).toFixed(3) + ')';
            ctx.lineWidth = S * 0.12 * (1 - k) + 1;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r * e, 0, 6.29); ctx.stroke();
            return;
          }
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = '#e8a25c';
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r * (0.35 + e * 0.65), 0, 6.29); ctx.fill();
          ctx.fillStyle = '#f3c77c';
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r * (0.25 + e * 0.4), 0, 6.29); ctx.fill();
          ctx.fillStyle = '#fbefd0';
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.3 * (1 - k), 0, 6.29); ctx.fill();
          ctx.globalAlpha = (1 - k) * 0.7;
          ctx.strokeStyle = '#fbefd0';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r * (0.4 + e * 0.9), 0, 6.29); ctx.stroke();
          ctx.globalAlpha = 1;
        });

        // debris: tumbling flat fragments
        debris.forEach((p) => {
          ctx.globalAlpha = Math.min(1, p.life / p.max * 1.6);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.moveTo(-p.s, -p.s * 0.5); ctx.lineTo(p.s, -p.s * 0.2); ctx.lineTo(-p.s * 0.2, p.s * 0.6); ctx.closePath(); ctx.fill();
          ctx.restore();
        });
        ctx.globalAlpha = 1;

        sparks.forEach((p) => {
          ctx.globalAlpha = Math.max(0, p.life / p.max);
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, S * 0.06), 0, 6.29); ctx.fill();
        });
        ctx.globalAlpha = 1;

        // high wisps above everything for depth
        ctx.fillStyle = 'rgba(255,255,255,.1)';
        wisps.forEach((w) => {
          if (!reduce) w.y += dt * 0.2;
          if (w.y > 1.2) { w.y = -0.2; w.x = Math.random(); }
          ctx.beginPath(); ctx.ellipse(w.x * W, w.y * H, W * w.w * 0.5, S * 0.35, 0, 0, 6.29); ctx.fill();
        });

        ctx.restore();

        // lives: flat hearts, top-left
        for (let i = 0; i < 3; i++) {
          const hx = 18 + i * 24, hy = 18, r = 6.5;
          ctx.fillStyle = i < lives ? '#e07a6a' : 'rgba(30, 42, 66, .22)';
          ctx.beginPath();
          ctx.moveTo(hx, hy + r * 1.1);
          ctx.bezierCurveTo(hx - r * 1.6, hy, hx - r * 1.1, hy - r * 1.2, hx, hy - r * 0.35);
          ctx.bezierCurveTo(hx + r * 1.1, hy - r * 1.2, hx + r * 1.6, hy, hx, hy + r * 1.1);
          ctx.fill();
        }
      }

      fit();
      status();
      api.frame((dt) => {
        fit();
        if (!W) return;
        update(dt);
        draw(dt);
      });
    },
  });
})();
