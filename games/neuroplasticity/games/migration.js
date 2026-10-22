// Migration — which way is the middle bird flying? (Lost in Migration style)
(function () {
  const ANG = { right: 0, down: 90, left: 180, up: 270 };
  const VEC = { right: [1, 0], down: [0, 1], left: [-1, 0], up: [0, -1] };
  const DIRS = Object.keys(ANG);

  const BIRD = '<svg viewBox="-50 -50 100 100" width="100%" height="100%" aria-hidden="true">' +
    '<path d="M46 0 L-32 -36 Q-16 -12 -24 0 Q-16 12 -32 36 Z" fill="#7ee0ff" stroke="#14324a" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M46 0 L4 -8 L4 8 Z" fill="#ffcc4d"/>' +
    '<circle cx="18" cy="-4" r="4.5" fill="#14324a"/></svg>';

  const scatterPts = [[-1, -1], [1, -1], [-1, 1], [1, 1], [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -1], [2, 1], [-1, 2], [1, -2]];

  function formation(kind, pick, shuffle) {
    const flip = () => (Math.random() < 0.5 ? 1 : -1);
    switch (kind) {
      case 'hline': return [[0, 0], [-2, 0], [-1, 0], [1, 0], [2, 0]];
      case 'vline': return [[0, 0], [0, -2], [0, -1], [0, 1], [0, 2]];
      case 'plus': return [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];
      case 'v': {
        const s = flip();
        const pts = [[0, 0], [-1, s], [-2, 2 * s], [1, s], [2, 2 * s]];
        return Math.random() < 0.5 ? pts : pts.map(([x, y]) => [y, x]);
      }
      case 'diag': { const s = flip(); return [[0, 0], [-1, -s], [-2, -2 * s], [1, s], [2, 2 * s]]; }
      default: {
        const pts = shuffle(scatterPts).slice(0, 4).map(([x, y]) => [x + (Math.random() - 0.5) * 0.35, y + (Math.random() - 0.5) * 0.35]);
        return [[0, 0]].concat(pts);
      }
    }
  }

  NP.register({
    id: 'migration',
    name: 'Migration',
    icon: '🐦',
    color: '#7ee0ff',
    tagline: 'Which way is the middle bird flying?',
    how: [
      'A flock of 5 birds appears.',
      'Swipe in the direction the MIDDLE bird is pointing — ignore the others.',
      'Arrow keys / WASD work on desktop. Flocks start moving later on.',
    ],
    controls: 'Swipe',
    start(api) {
      api.el('style', null, null, `
        .mi-field { position: absolute; inset: 0; overflow: hidden; touch-action: none; }
        .mi-flock { position: absolute; left: 0; top: 0; width: 0; height: 0; }
        .mi-inner { position: absolute; left: 0; top: 0; transition: transform .26s ease-in, opacity .26s ease-in; }
        .mi-inner.pop { animation: mi-pop .22s ease-out both; }
        @keyframes mi-pop { from { transform: scale(.5); opacity: 0; } to { transform: none; opacity: 1; } }
        .mi-inner.shake { animation: mi-shake .28s ease; }
        @keyframes mi-shake { 0%,100% { transform: none; } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
        .mi-bird { position: absolute; filter: drop-shadow(0 4px 6px rgba(0,0,0,.35)); }
        .mi-hint { position: absolute; left: 0; right: 0; bottom: 10px; text-align: center; color: #a99fd0; font-size: 13px; pointer-events: none; }
      `);

      const field = api.el('div', 'mi-field');
      const flock = api.el('div', 'mi-flock', field);
      api.el('div', 'mi-hint', field, 'Swipe the way the middle bird flies');

      let level = 0;
      let run = 0;
      let center = 'right';
      let ready = false;
      let inner = null;
      let extent = 2; // max |offset| in grid units
      const pos = { x: 0, y: 0, vx: 0, vy: 0 };
      let W = 0, H = 0, B = 48, SP = 56;

      const measure = () => {
        W = field.clientWidth; H = field.clientHeight;
        B = Math.max(34, Math.min(84, Math.min(W, H) / 6.6));
        SP = B * 1.18;
      };
      api.on(window, 'resize', () => { measure(); clamp(); place(); });

      const clamp = () => {
        const m = extent * SP + B * 0.6;
        pos.x = Math.max(m, Math.min(W - m, pos.x));
        pos.y = Math.max(m, Math.min(H - m, pos.y));
        if (W < 2 * m) pos.x = W / 2;
        if (H < 2 * m) pos.y = H / 2;
      };
      const place = () => { flock.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)'; };

      const kinds = () => {
        const k = ['hline', 'vline'];
        if (level >= 1) k.push('plus');
        if (level >= 2) k.push('v');
        if (level >= 3) k.push('diag');
        if (level >= 5) k.push('scatter', 'scatter');
        return k;
      };

      function spawn() {
        measure();
        center = api.pick(DIRS);
        const pts = formation(api.pick(kinds()), api.pick, api.shuffle);
        extent = Math.max.apply(null, pts.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
        const incong = Math.random() < Math.min(0.75, 0.25 + level * 0.1);
        const flank = incong ? api.pick(DIRS.filter((d) => d !== center)) : center;

        inner = api.el('div', 'mi-inner pop', null);
        flock.innerHTML = '';
        flock.appendChild(inner);
        pts.forEach(([x, y], i) => {
          let d = i === 0 ? center : flank;
          if (i > 0 && incong && level >= 7 && Math.random() < 0.35) d = api.pick(DIRS);
          const b = api.el('div', 'mi-bird', inner);
          b.innerHTML = BIRD;
          b.style.width = b.style.height = B + 'px';
          b.style.left = (x * SP - B / 2) + 'px';
          b.style.top = (y * SP - B / 2) + 'px';
          b.style.transform = 'rotate(' + ANG[d] + 'deg)';
        });

        // position + drift
        if (level >= 4) {
          pos.x = W * (0.3 + Math.random() * 0.4);
          pos.y = H * (0.3 + Math.random() * 0.4);
          const sp = Math.min(130, 28 + (level - 4) * 14);
          const a = Math.random() * Math.PI * 2;
          pos.vx = Math.cos(a) * sp; pos.vy = Math.sin(a) * sp;
        } else {
          pos.x = W / 2; pos.y = H / 2; pos.vx = pos.vy = 0;
        }
        clamp();
        place();
        ready = true;
      }

      api.frame((dt) => {
        if (!pos.vx && !pos.vy) return;
        const m = extent * SP + B * 0.6;
        pos.x += pos.vx * dt; pos.y += pos.vy * dt;
        if (pos.x < m) { pos.x = m; pos.vx = Math.abs(pos.vx); }
        if (pos.x > W - m) { pos.x = W - m; pos.vx = -Math.abs(pos.vx); }
        if (pos.y < m) { pos.y = m; pos.vy = Math.abs(pos.vy); }
        if (pos.y > H - m) { pos.y = H - m; pos.vy = -Math.abs(pos.vy); }
        place();
      });

      api.onSwipe((dir) => {
        if (!ready) return;
        ready = false;
        const ok = dir === center;
        api.answer(ok, 50 + level * 5);
        if (ok) {
          run++;
          if (run >= 3) { run = 0; level = Math.min(10, level + 1); }
          const [vx, vy] = VEC[center];
          inner.classList.remove('pop');
          void inner.offsetWidth;
          inner.style.transform = 'translate(' + vx * W * 0.7 + 'px,' + vy * H * 0.7 + 'px)';
          inner.style.opacity = '0';
          api.after(240, spawn);
        } else {
          run = 0;
          level = Math.max(0, level - 1);
          inner.classList.remove('pop');
          void inner.offsetWidth;
          inner.classList.add('shake');
          api.after(320, spawn);
        }
        api.status('Level ' + (level + 1));
      });

      api.status('Level 1');
      api.after(30, () => { spawn(); api.timer(45); });
    },
  });
})();
