// Sky Patrol — dodge enemy planes, shoot them down, grab stars.
(function () {
  // plane outline, pointing up, unit size (nose at y = -1)
  const PLANE = [
    [0, -1], [0.15, -0.62], [0.15, -0.18], [1, 0.18], [1, 0.36], [0.15, 0.3],
    [0.12, 0.66], [0.44, 0.84], [0.44, 0.98], [0, 0.9],
  ];
  const PLANE_PATH = PLANE.concat(PLANE.slice(1, -1).reverse().map(([x, y]) => [-x, y]));

  const TYPES = {
    basic: { color: '#ff5c7a', r: 1, hp: 1, pts: 10 },
    weave: { color: '#ff9f43', r: 1, hp: 1, pts: 15 },
    shooter: { color: '#c77dff', r: 1.05, hp: 2, pts: 25 },
    tank: { color: '#8fa3c7', r: 1.45, hp: 5, pts: 50 },
  };

  NP.register({
    id: 'sky-patrol',
    name: 'Sky Patrol',
    icon: '✈️',
    color: '#3ddc84',
    tagline: 'Dodge enemy planes, shoot them down, grab stars',
    how: [
      'Tilt your phone to steer (or drag your finger / use ← → keys).',
      'Your plane fires automatically. Shoot enemy planes for points.',
      'Grab ⭐ for bonus points and a triple shot. You have 3 lives.',
    ],
    controls: 'Tilt to steer',
    needsTilt: true,
    start(api) {
      api.el('style', null, null, `
        .sp-wrap { position: absolute; inset: 0; }
        .sp-wrap canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; }
        .sp-hint { position: absolute; left: 50%; bottom: 30%; transform: translateX(-50%); white-space: nowrap;
          background: rgba(20,13,40,.75); border: 1px solid rgba(255,255,255,.14); padding: 10px 16px; border-radius: 999px;
          font-size: 14px; color: #f2eeff; pointer-events: none; transition: opacity .6s; }
        .sp-hint.gone { opacity: 0; }
      `);

      const wrap = api.el('div', 'sp-wrap');
      const cv = api.el('canvas', null, wrap);
      const ctx = cv.getContext('2d');
      const tiltOn = api.tilt().available;
      const hint = api.el('div', 'sp-hint', wrap, tiltOn ? '📱 Tilt to steer' : '👆 Drag to steer · ← → keys');
      api.after(2800, () => hint.classList.add('gone'));

      let W = 0, H = 0, S = 30;
      const player = { x: 0, y: 0, vx: 0 };
      let lives = 3, inv = 0, t = 0, dead = false, kills = 0, starsGot = 0;
      let fireCd = 0.4, spawnT = 1.2, starT = 6, triple = 0;
      let bullets = [], enemies = [], eBullets = [], stars = [], parts = [], pops = [];
      const sky = [];
      for (let i = 0; i < 70; i++) sky.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7 });

      function fit() {
        const w = wrap.clientWidth, h = wrap.clientHeight;
        if (!w || !h || (w === W && h === H)) return;
        const first = !W;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (first) player.x = w / 2; else player.x *= w / W;
        W = w; H = h;
        S = Math.max(16, Math.min(W / 10, H / 14, 34));
        player.y = H - S * 2.4;
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
        enemies.push({
          type, d, size, hp: d.hp, hit: 0,
          x: size + Math.random() * (W - size * 2), y: -size * 1.5, x0: 0,
          vy: speed, phase: Math.random() * 6.28, amp: W * (0.12 + Math.random() * 0.12),
          fire: 0.8 + Math.random() * 1.2,
        });
        const e = enemies[enemies.length - 1];
        e.x0 = Math.max(e.amp + size, Math.min(W - e.amp - size, e.x));
      }

      function burst(x, y, color, n, speed) {
        for (let i = 0; i < n; i++) {
          const a = Math.random() * 6.28, v = speed * (0.3 + Math.random());
          parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, max: 0.9, color, r: 1.5 + Math.random() * 3 });
        }
      }
      function popText(x, y, text, color) { pops.push({ x, y, text, color, life: 0.9 }); }

      let lastStatus = '';
      function status() {
        const s = '❤️'.repeat(lives) + '🖤'.repeat(Math.max(0, 3 - lives)) + '  ·  Wave ' + (1 + Math.floor(t / 20)) + (triple > 0 ? '  ·  ⭐ Triple shot' : '');
        if (s !== lastStatus) { lastStatus = s; api.status(s); }
      }

      function hitPlayer() {
        if (inv > 0 || dead) return;
        lives--;
        inv = 2;
        api.sfx('boom');
        api.vibrate(160);
        api.flash(false);
        burst(player.x, player.y, '#4da3ff', 26, S * 6);
        eBullets = eBullets.filter((b) => Math.hypot(b.x - player.x, b.y - player.y) > S * 5);
        if (lives <= 0) {
          dead = true;
          burst(player.x, player.y, '#ffcc4d', 50, S * 9);
          api.after(1400, () => api.end('Survived ' + Math.floor(t) + 's · ' + kills + ' planes downed · ' + starsGot + ' stars'));
        }
        status();
      }

      /* ---------- update ---------- */
      function update(dt) {
        t += dt;
        if (inv > 0) inv -= dt;
        if (triple > 0) triple -= dt;

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

        spawnT -= dt;
        if (spawnT <= 0) {
          spawnEnemy();
          spawnT = Math.max(0.32, 1.25 - t * 0.012) * (0.7 + Math.random() * 0.6);
          if (t > 35 && Math.random() < Math.min(0.4, (t - 35) * 0.006)) spawnEnemy();
        }
        starT -= dt;
        if (starT <= 0) {
          starT = 6 + Math.random() * 4;
          stars.push({ x: S + Math.random() * (W - 2 * S), y: -S, x0: 0, vy: H * 0.14, ph: Math.random() * 6, rot: 0 });
          stars[stars.length - 1].x0 = stars[stars.length - 1].x;
        }

        bullets.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; });
        bullets = bullets.filter((b) => b.y > -20 && b.x > -20 && b.x < W + 20 && !b.dead);

        enemies.forEach((e) => {
          e.y += e.vy * dt;
          e.phase += dt * 2.2;
          if (e.type === 'weave') e.x = e.x0 + Math.sin(e.phase) * e.amp;
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
          // bullets → enemy
          for (const b of bullets) {
            if (b.dead) continue;
            if (Math.abs(b.x - e.x) < e.size * 0.95 && Math.abs(b.y - e.y) < e.size) {
              b.dead = true;
              e.hp--;
              e.hit = 0.08;
              if (e.hp <= 0) {
                e.dead = true;
                kills++;
                const pts = e.d.pts * (1 + Math.floor(t / 20));
                api.addScore(pts);
                popText(e.x, e.y, '+' + pts, '#ffcc4d');
                burst(e.x, e.y, e.d.color, 18, S * 5);
                api.sfx('boom');
                break;
              }
            }
          }
          // enemy → player
          if (!e.dead && !dead && Math.hypot(e.x - player.x, e.y - player.y) < (e.size + S) * 0.62) {
            if (inv <= 0) {
              e.dead = true;
              burst(e.x, e.y, e.d.color, 18, S * 5);
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
          s.y += s.vy * dt; s.ph += dt * 2; s.rot += dt * 2;
          s.x = s.x0 + Math.sin(s.ph) * S * 0.8;
          if (!dead && Math.hypot(s.x - player.x, s.y - player.y) < S * 1.2) {
            s.dead = true;
            starsGot++;
            triple = 6;
            api.addScore(100);
            popText(s.x, s.y, '+100 ⭐', '#ffe066');
            burst(s.x, s.y, '#ffe066', 16, S * 4);
            api.sfx('level');
          }
        });
        stars = stars.filter((s) => !s.dead && s.y < H + S * 2);

        parts.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; p.life -= dt; });
        parts = parts.filter((p) => p.life > 0);
        pops.forEach((p) => { p.y -= S * 1.5 * dt; p.life -= dt; });
        pops = pops.filter((p) => p.life > 0);
        status();
      }

      /* ---------- draw ---------- */
      function plane(x, y, s, color, down, glow) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, down ? -s : s);
        ctx.beginPath();
        PLANE_PATH.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.closePath();
        if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 14; }
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 0.07;
        ctx.strokeStyle = 'rgba(255,255,255,.55)';
        ctx.stroke();
        ctx.fillStyle = 'rgba(20,13,40,.8)';
        ctx.beginPath();
        ctx.ellipse(0, -0.45, 0.08, 0.18, 0, 0, 6.29);
        ctx.fill();
        ctx.restore();
      }

      function starShape(x, y, r, rot) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
          i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.shadowColor = '#ffe066';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#ffd93d';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff4b0';
        ctx.stroke();
        ctx.restore();
      }

      function draw(dt) {
        ctx.clearRect(0, 0, W, H);
        // parallax sky
        ctx.fillStyle = '#ffffff';
        sky.forEach((p) => {
          p.y += dt * 0.12 * p.z;
          if (p.y > 1) { p.y -= 1; p.x = Math.random(); }
          ctx.globalAlpha = 0.25 + p.z * 0.5;
          ctx.fillRect(p.x * W, p.y * H, p.z * 2, p.z * 2 + p.z * 4);
        });
        ctx.globalAlpha = 1;

        stars.forEach((s) => starShape(s.x, s.y, S * 0.7, s.rot));

        ctx.fillStyle = '#ffe066';
        bullets.forEach((b) => {
          ctx.beginPath();
          ctx.ellipse(b.x, b.y, S * 0.09, S * 0.3, Math.atan2(b.vx, -b.vy), 0, 6.29);
          ctx.fill();
        });

        enemies.forEach((e) => {
          plane(e.x, e.y, e.size, e.hit > 0 ? '#ffffff' : e.d.color, true, false);
          if (e.d.hp > 1 && e.hp < e.d.hp) {
            const w = e.size * 1.4;
            ctx.fillStyle = 'rgba(0,0,0,.5)';
            ctx.fillRect(e.x - w / 2, e.y - e.size * 1.25, w, 4);
            ctx.fillStyle = '#3ddc84';
            ctx.fillRect(e.x - w / 2, e.y - e.size * 1.25, (w * e.hp) / e.d.hp, 4);
          }
        });

        ctx.fillStyle = '#ff6bd6';
        eBullets.forEach((b) => {
          ctx.beginPath();
          ctx.arc(b.x, b.y, S * 0.17, 0, 6.29);
          ctx.fill();
        });

        if (!dead && !(inv > 0 && Math.floor(t * 12) % 2)) {
          // engine flame
          const fl = S * (0.5 + Math.random() * 0.35);
          ctx.fillStyle = 'rgba(255,170,60,.9)';
          ctx.beginPath();
          ctx.moveTo(player.x - S * 0.13, player.y + S * 0.85);
          ctx.lineTo(player.x + S * 0.13, player.y + S * 0.85);
          ctx.lineTo(player.x, player.y + S * 0.85 + fl);
          ctx.closePath();
          ctx.fill();
          plane(player.x, player.y, S, triple > 0 ? '#7fd7ff' : '#4da3ff', false, true);
        }

        parts.forEach((p) => {
          ctx.globalAlpha = Math.max(0, p.life / p.max);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.29);
          ctx.fill();
        });
        ctx.globalAlpha = 1;

        ctx.textAlign = 'center';
        ctx.font = '800 ' + Math.round(S * 0.55) + 'px -apple-system, system-ui, sans-serif';
        pops.forEach((p) => {
          ctx.globalAlpha = Math.min(1, p.life * 2);
          ctx.fillStyle = p.color;
          ctx.fillText(p.text, p.x, p.y);
        });
        ctx.globalAlpha = 1;
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
