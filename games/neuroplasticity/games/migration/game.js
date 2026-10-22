// Migration — which way is the middle bird flying? (Lost in Migration style)
(function () {
  const ANG = { right: 0, down: 90, left: 180, up: 270 };
  const VEC = { right: [1, 0], down: [0, 1], left: [-1, 0], up: [0, -1] };
  const DIRS = Object.keys(ANG);

  // Flat top-down bird facing +x: light body, darker wings that fold to flap, small tail, beak and eye.
  const WING_L = 'M8 -5 C4 -20 -6 -34 -22 -44 C-19 -32 -18 -18 -14 -5 Z';
  const WING_R = 'M8 5 C4 20 -6 34 -22 44 C-19 32 -18 18 -14 5 Z';
  const BIRD = '<svg viewBox="-50 -50 100 100" width="100%" height="100%" aria-hidden="true">' +
    '<path d="M-13 0 L-38 -11 L-33 0 L-38 11 Z" fill="#c9d0d8"/>' +
    '<g class="mi-wing mi-wl"><path d="' + WING_L + '" fill="url(#mi-g-wing)"/></g>' +
    '<g class="mi-wing mi-wr"><path d="' + WING_R + '" fill="url(#mi-g-wing)"/></g>' +
    '<ellipse cx="0" cy="0" rx="22" ry="9.5" fill="url(#mi-g-body)"/>' +
    '<circle cx="18" cy="0" r="8.5" fill="#f7f8f9"/>' +
    '<path d="M25.5 -3.4 L38 0 L25.5 3.4 Z" fill="#d9a441"/>' +
    '<circle cx="21" cy="-4.4" r="1.7" fill="#2d3644"/><circle cx="21" cy="4.4" r="1.7" fill="#2d3644"/>' +
    '</svg>';

  const DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<linearGradient id="mi-g-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe4ea"/></linearGradient>' +
    '<linearGradient id="mi-g-wing" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#6c7d92"/><stop offset="1" stop-color="#46556a"/></linearGradient>' +
    '</defs></svg>';

  const CLOUD = '<svg viewBox="0 0 200 80" width="100%" height="100%" aria-hidden="true"><g fill="#fff">' +
    '<circle cx="62" cy="50" r="24"/><circle cx="98" cy="38" r="30"/><circle cx="136" cy="50" r="22"/>' +
    '<rect x="38" y="48" width="122" height="26" rx="13"/></g></svg>';

  // Calm single-hue sky palettes; the sky eases between them as the game goes on.
  const SKIES = [
    ['#4f8f93', '#8fc0ba'], // dusty teal
    ['#5a7089', '#9db0c4'], // slate
    ['#b08f63', '#dcc59c'], // sand
    ['#6f8c74', '#adc4a6'], // sage
    ['#9b6f73', '#d2aea6'], // dusky rose
  ];

  const ART_BIRD = (tf, op) => '<g transform="' + tf + '" opacity="' + op + '">' +
    '<path d="M-13 0 L-38 -11 L-33 0 L-38 11 Z" fill="#d5dbe2"/>' +
    '<path d="' + WING_L + ' ' + WING_R + '" fill="#53657c" transform="scale(1 .62)"/>' +
    '<ellipse rx="22" ry="9.5" fill="#fff"/><circle cx="18" r="8.5" fill="#fff"/>' +
    '<path d="M25.5 -3.4 L38 0 L25.5 3.4 Z" fill="#d9a441"/></g>';
  const ART = '<svg viewBox="0 0 64 64" aria-hidden="true"><defs>' +
    '<linearGradient id="mi-art-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f8f93"/><stop offset="1" stop-color="#9cc8c1"/></linearGradient></defs>' +
    '<rect x="4" y="4" width="56" height="56" rx="14" fill="url(#mi-art-sky)"/>' +
    '<g fill="#fff" opacity=".3"><circle cx="16" cy="50" r="5"/><circle cx="23" cy="47" r="7"/><rect x="10" y="49" width="22" height="6" rx="3"/></g>' +
    ART_BIRD('translate(19 19) scale(.4)', .92) + ART_BIRD('translate(45 45) scale(.4)', .92) +
    ART_BIRD('translate(32 32) rotate(180) scale(.48)', 1) +
    '</svg>';

  const scatterPts = [[-1, -1], [1, -1], [-1, 1], [1, 1], [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -1], [2, 1], [-1, 2], [1, -2]];

  function formation(kind, shuffle) {
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
    art: ART,
    color: '#7ee0ff',
    bg: ['#3e6f78', '#4f8f93'],
    tagline: 'Which way is the middle bird flying?',
    how: [
      'A flock of 5 birds flies in.',
      'Swipe in the direction the MIDDLE bird is pointing — ignore the others.',
      'Arrow keys / WASD work on desktop. Flocks get faster later on.',
    ],
    controls: 'Swipe',
    start(api) {
      const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const field = api.el('div', 'mi-field');
      field.insertAdjacentHTML('beforeend', DEFS);
      // two sky layers that crossfade between palettes
      const skyA = api.el('div', 'mi-sky', field);
      const skyB = api.el('div', 'mi-sky', field);
      let skyI = 0, skyFront = skyA;
      const paint = (el, i) => { el.style.background = 'linear-gradient(180deg,' + SKIES[i][0] + ' 0%,' + SKIES[i][1] + ' 100%)'; };
      paint(skyA, 0); skyA.classList.add('on');
      const nextSky = () => {
        skyI = (skyI + 1) % SKIES.length;
        const back = skyFront === skyA ? skyB : skyA;
        paint(back, skyI);
        back.classList.add('on');
        skyFront.classList.remove('on');
        skyFront = back;
      };
      const farL = api.el('div', 'mi-clouds mi-far', field);
      const nearL = api.el('div', 'mi-clouds mi-near', field);
      const layer = api.el('div', 'mi-layer', field);
      api.el('div', 'mi-hint', field, 'Swipe the way the middle bird flies');

      let W = 0, H = 0, B = 48, SP = 56;
      const measure = () => {
        W = field.clientWidth; H = field.clientHeight;
        B = Math.max(38, Math.min(92, Math.min(W, H) / 5.8));
        SP = B * 1.1;
      };
      measure();

      // ---- parallax clouds ----
      const clouds = [];
      const addCloud = (parent, far, x) => {
        const el = api.el('div', 'mi-cloud', parent);
        el.innerHTML = CLOUD;
        const c = { el, far, x: 0, y: 0, w: 0, sp: 0 };
        const reset = (startX) => {
          c.w = (far ? 70 + Math.random() * 60 : 120 + Math.random() * 110) * Math.max(0.8, Math.min(1.5, W / 420));
          c.y = far ? H * (0.04 + Math.random() * 0.45) : H * (0.1 + Math.random() * 0.72);
          c.sp = (far ? 7 + Math.random() * 5 : 18 + Math.random() * 10) * (calm ? 0.3 : 1);
          c.x = startX != null ? startX : W + Math.random() * W * 0.4;
          el.style.width = c.w + 'px';
          el.style.height = c.w * 0.4 + 'px';
        };
        c.reset = reset;
        reset(x);
        clouds.push(c);
      };
      for (let i = 0; i < 4; i++) addCloud(farL, true, Math.random() * W);
      for (let i = 0; i < 3; i++) addCloud(nearL, false, (i / 3) * W + Math.random() * W * 0.2 - 40);

      let level = 0;
      let run = 0;
      let count = 0;
      let cur = null; // the flock currently being judged
      const flocks = [];

      const kinds = () => {
        const k = ['hline', 'vline'];
        if (level >= 1) k.push('plus');
        if (level >= 2) k.push('v');
        if (level >= 3) k.push('diag');
        if (level >= 5) k.push('scatter', 'scatter');
        return k;
      };

      const setAng = (b, a) => {
        b.ang = a;
        b.bd.style.transform = 'rotate(' + a + 'deg)';
        b.sh.style.transform = 'translate(' + (B * 0.12).toFixed(1) + 'px,' + (B * 0.34).toFixed(1) + 'px) rotate(' + a + 'deg) scale(.86)';
      };
      const turnTo = (b, a) => setAng(b, b.ang + ((((a - b.ang) % 360) + 540) % 360) - 180);

      function spawn() {
        measure();
        if (++count % 6 === 0) nextSky();
        const center = api.pick(DIRS);
        const pts = formation(api.pick(kinds()), api.shuffle);
        const extent = Math.max.apply(null, pts.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
        const incong = Math.random() < Math.min(0.75, 0.25 + level * 0.1);
        const flank = incong ? api.pick(DIRS.filter((d) => d !== center)) : center;

        const el = api.el('div', 'mi-flock', layer);
        const birds = pts.map(([x, y], i) => {
          let d = i === 0 ? center : flank;
          if (i > 0 && incong && level >= 7 && Math.random() < 0.35) d = api.pick(DIRS);
          const slot = api.el('div', 'mi-slot' + (i === 0 ? ' mi-center' : ''), el);
          slot.style.cssText = 'width:' + B + 'px;height:' + B + 'px;left:' + (x * SP - B / 2) + 'px;top:' + (y * SP - B / 2) +
            'px;--fd:' + (-Math.random() * 0.5).toFixed(2) + 's;--fs:' + (0.3 + Math.random() * 0.06).toFixed(2) + 's;--hd:' + (-Math.random() * 3).toFixed(2) + 's';
          const hov = api.el('div', 'mi-hov', slot);
          const sh = api.el('div', 'mi-shadow', hov);
          sh.innerHTML = BIRD;
          const bd = api.el('div', 'mi-bird', hov);
          bd.innerHTML = BIRD;
          const b = { slot, hov, sh, bd, ang: 0, x, y };
          setAng(b, ANG[d]);
          return b;
        });

        const m = extent * SP + B * 0.5;
        const mx = Math.max(0, W / 2 - m), my = Math.max(0, H / 2 - m);
        let tx = W / 2, ty = H / 2;
        let speed = 16;
        if (level >= 4) {
          tx = W / 2 + (Math.random() * 2 - 1) * mx * 0.6;
          ty = H / 2 + (Math.random() * 2 - 1) * my * 0.6;
          speed = Math.min(130, 30 + (level - 4) * 14);
        } else {
          tx += (Math.random() * 2 - 1) * Math.min(mx, 20);
          ty += (Math.random() * 2 - 1) * Math.min(my, 20);
        }
        const a = Math.random() * Math.PI * 2;
        const f = {
          el, birds, center, extent, m,
          mode: 'enter', t: 0, ph: Math.random() * 6,
          vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
          tx, ty, x: 0, y: 0, ax: 0, ay: 0,
        };
        // swoop in from off-screen, travelling along the glide heading
        const reach = Math.hypot(W, H) * 0.62 + m;
        f.sx = tx - Math.cos(a) * reach;
        f.sy = ty - Math.sin(a) * reach;
        f.x = f.sx; f.y = f.sy;
        flocks.push(f);
        place(f, 0);
        cur = f;
      }

      const place = (f, bob) => {
        f.el.style.transform = 'translate3d(' + f.x.toFixed(1) + 'px,' + (f.y + bob).toFixed(1) + 'px,0)';
      };

      const ENTER = 0.48;
      api.frame((dt, t) => {
        // clouds drift with the wind (parallax: far ones slower)
        for (const c of clouds) {
          c.x -= c.sp * dt;
          if (c.x < -c.w - 10) c.reset();
          c.el.style.transform = 'translate3d(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px,0)';
        }
        for (let i = flocks.length - 1; i >= 0; i--) {
          const f = flocks[i];
          f.t += dt;
          f.tx += f.vx * dt; f.ty += f.vy * dt;
          if (f.mode !== 'exit') {
            // bounce the glide target inside the sky
            if (f.tx < f.m) { f.tx = f.m; f.vx = Math.abs(f.vx); }
            if (f.tx > W - f.m) { f.tx = W - f.m; f.vx = -Math.abs(f.vx); }
            if (f.ty < f.m) { f.ty = f.m; f.vy = Math.abs(f.vy); }
            if (f.ty > H - f.m) { f.ty = H - f.m; f.vy = -Math.abs(f.vy); }
            if (W < 2 * f.m) f.tx = W / 2;
            if (H < 2 * f.m) f.ty = H / 2;
          }
          if (f.mode === 'enter') {
            const p = Math.min(1, f.t / ENTER);
            const e = 1 - Math.pow(1 - p, 3);
            f.x = f.sx + (f.tx - f.sx) * e;
            f.y = f.sy + (f.ty - f.sy) * e;
            if (p >= 1) f.mode = 'glide';
          } else if (f.mode === 'glide') {
            f.x = f.tx; f.y = f.ty;
          } else if (f.mode === 'exit') {
            f.vx += f.ax * dt; f.vy += f.ay * dt;
            f.x = f.tx; f.y = f.ty;
          }
          place(f, calm ? 0 : Math.sin(t / 1000 * 1.7 + f.ph) * 4);
          const gone = f.mode === 'exit' && (f.x < -f.m * 2 || f.x > W + f.m * 2 || f.y < -f.m * 2 || f.y > H + f.m * 2);
          if (gone || (f.dieAt && f.t > f.dieAt)) { f.el.remove(); flocks.splice(i, 1); }
        }
      });

      api.on(window, 'resize', measure);

      function flyOff(f, dir) {
        const [vx, vy] = VEC[dir];
        f.birds.forEach((b) => turnTo(b, ANG[dir]));
        f.el.classList.add('mi-fast');
        f.mode = 'exit';
        f.vx = vx * 160 + f.vx * 0.3; f.vy = vy * 160 + f.vy * 0.3;
        f.ax = vx * 2600; f.ay = vy * 2600;
        f.dieAt = f.t + 1.5;
      }

      function fluster(f) {
        f.el.classList.add('mi-flust');
        f.vx *= 0.2; f.vy *= 0.2;
        f.dieAt = f.t + 1.4;
        
        api.after(300, () => {
          f.el.classList.remove('mi-flust');
          f.el.classList.add('mi-scatter');
          f.birds.forEach((b, i) => {
            let a, dist;
            if (i === 0) { a = ANG[f.center] * Math.PI / 180; dist = Math.hypot(W, H); }
            else { a = Math.atan2(b.y || Math.random() - 0.5, b.x || Math.random() - 0.5) + (Math.random() - 0.5) * 0.9; dist = Math.max(W, H) * 0.8; }
            turnTo(b, a * 180 / Math.PI);
            const go = () => { b.slot.style.transform = 'translate(' + (Math.cos(a) * dist).toFixed(0) + 'px,' + (Math.sin(a) * dist).toFixed(0) + 'px)'; };
            if (i === 0) api.after(260, go); else go();
          });
        });
      }

      api.onSwipe((dir) => {
        const f = cur;
        if (!f) return;
        cur = null;
        const ok = dir === f.center;
        const at = { x: f.x, y: f.y };
        api.answer(ok, 50 + level * 5, at);
        if (ok) {
          run++;
          if (run >= 3) { run = 0; level = Math.min(10, level + 1); }
          flyOff(f, dir);
          api.after(230, spawn);
        } else {
          run = 0;
          level = Math.max(0, level - 1);
          fluster(f);
          api.after(820, spawn);
        }
        api.status('Level ' + (level + 1));
      });

      api.status('Level 1');
      api.after(30, () => { measure(); spawn(); api.timer(45); });
    },
  });
})();
