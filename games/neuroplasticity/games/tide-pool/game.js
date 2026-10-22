// Tide Pool — pick each treasure exactly once while the tide shuffles them (Tidal Treasures).
(function () {
  const ROUNDS = 12;
  const LIVES = 3;

  /* ---------- flat vector treasures (viewBox 0 0 40 40, main color c, accent a) ---------- */
  const SHAPES = {
    scallop: (c, a) =>
      `<path d="M20 34 L6 15 Q20 2 34 15 Z" fill="${c}"/>` +
      `<path d="M20 34 L11 11 M20 34 L16 8 M20 34 L20 7 M20 34 L24 8 M20 34 L29 11" stroke="${a}" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>` +
      `<path d="M15 33 h10 l-2 4 h-6 z" fill="${c}"/>`,
    star: (c, a) =>
      `<path d="M20 4 L24.2 15 L36 15.6 L26.8 23 L30 34.5 L20 28 L10 34.5 L13.2 23 L4 15.6 L15.8 15 Z" fill="${c}" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>` +
      `<g fill="${a}" opacity=".55"><circle cx="20" cy="12" r="1.3"/><circle cx="20" cy="19" r="1.6"/><circle cx="27" cy="18" r="1.1"/><circle cx="13" cy="18" r="1.1"/><circle cx="24" cy="26" r="1.1"/><circle cx="16" cy="26" r="1.1"/></g>`,
    glass: (c, a) =>
      `<path d="M9 14 Q11 7 20 7 Q31 8 33 16 Q35 26 26 32 Q15 35 9 28 Q5 21 9 14 Z" fill="${c}" opacity=".88"/>` +
      `<path d="M13 15 Q15 11 21 11" stroke="${a}" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".7"/>`,
    pebble: (c, a) =>
      `<ellipse cx="20" cy="21" rx="14" ry="10.5" fill="${c}"/>` +
      `<path d="M7.5 18 Q20 25 32.8 17" stroke="${a}" stroke-width="2.2" fill="none" opacity=".75"/>`,
    crab: (c, a) =>
      `<g stroke="${c}" stroke-width="2.2" stroke-linecap="round" fill="none">` +
      `<path d="M10 22 L4 25 M10 26 L5 30 M30 22 L36 25 M30 26 L35 30"/>` +
      `<path d="M13 17 L10 10 M27 17 L30 10"/></g>` +
      `<circle cx="9" cy="8.5" r="4" fill="${c}"/><circle cx="31" cy="8.5" r="4" fill="${c}"/>` +
      `<path d="M7 7 L11 9 M33 7 L29 9" stroke="${a}" stroke-width="1.4" opacity=".6"/>` +
      `<ellipse cx="20" cy="22" rx="11" ry="8" fill="${c}"/>` +
      `<circle cx="16.5" cy="17" r="1.6" fill="${a}"/><circle cx="23.5" cy="17" r="1.6" fill="${a}"/>`,
    coral: (c) =>
      `<g stroke="${c}" stroke-width="3.6" stroke-linecap="round" fill="none">` +
      `<path d="M20 35 L20 20 L13 12 L12 5 M13 12 L7 10 M20 20 L27 13 L27 6 M27 13 L33 11 M20 26 L28 23"/></g>`,
    dollar: (c, a) =>
      `<circle cx="20" cy="20" r="14" fill="${c}"/>` +
      `<g fill="${a}" opacity=".55"><ellipse cx="20" cy="13" rx="1.6" ry="4"/>` +
      `<ellipse cx="20" cy="13" rx="1.6" ry="4" transform="rotate(72 20 20)"/>` +
      `<ellipse cx="20" cy="13" rx="1.6" ry="4" transform="rotate(144 20 20)"/>` +
      `<ellipse cx="20" cy="13" rx="1.6" ry="4" transform="rotate(216 20 20)"/>` +
      `<ellipse cx="20" cy="13" rx="1.6" ry="4" transform="rotate(288 20 20)"/></g>`,
    whelk: (c, a) =>
      `<path d="M8 30 Q6 17 16 10 Q24 5 31 9 Q35 14 30 21 Q24 30 8 30 Z" fill="${c}"/>` +
      `<path d="M27 11 Q31 14 28 18 Q24 21 21 17 Q19 13 23 12" stroke="${a}" stroke-width="1.8" fill="none" opacity=".6"/>` +
      `<path d="M11 27 Q15 20 22 18" stroke="${a}" stroke-width="1.6" fill="none" opacity=".45"/>`,
    mussel: (c, a) =>
      `<path d="M9 31 Q5 22 14 12 Q22 4 31 7 Q34 12 28 21 Q20 32 9 31 Z" fill="${c}"/>` +
      `<path d="M11 28 Q18 18 29 9" stroke="${a}" stroke-width="1.6" fill="none" opacity=".5"/>`,
    urchin: (c, a) => {
      let s = '';
      for (let i = 0; i < 16; i++) {
        const t = (i / 16) * Math.PI * 2;
        s += `<line x1="20" y1="20" x2="${(20 + Math.cos(t) * 16).toFixed(1)}" y2="${(20 + Math.sin(t) * 16).toFixed(1)}"/>`;
      }
      return `<g stroke="${c}" stroke-width="1.8" stroke-linecap="round">${s}</g><circle cx="20" cy="20" r="9" fill="${c}"/><circle cx="20" cy="20" r="3" fill="${a}" opacity=".5"/>`;
    },
    clam: (c, a) =>
      `<path d="M6 21 Q20 34 34 21 Z" fill="${c}"/>` +
      `<path d="M6 19 Q20 3 34 19 Z" fill="${c}" opacity=".8"/>` +
      `<circle cx="20" cy="21" r="4.5" fill="#f6f1e6"/><circle cx="18.6" cy="19.7" r="1.3" fill="#fff"/>` +
      `<path d="M13 26 Q20 30 27 26" stroke="${a}" stroke-width="1.4" fill="none" opacity=".5"/>`,
  };
  // distinct shape/color combinations, all in one muted family
  const POOL = [
    ['scallop', '#e3a588', '#b3694f'], ['star', '#dd8a72', '#9e4e3a'], ['glass', '#7fb7ae', '#d8eeea'],
    ['pebble', '#7f8b99', '#c9d0d8'], ['crab', '#cf7a62', '#4a2f2a'], ['coral', '#d98f84', null],
    ['dollar', '#e8dcc2', '#b39e78'], ['whelk', '#d6b98e', '#8e6f48'], ['mussel', '#5d6f8a', '#a9b6c9'],
    ['urchin', '#7a6385', '#e4d6ea'], ['clam', '#c9a2a8', '#8a5a62'], ['star', '#d9a84e', '#8e6620'],
    ['glass', '#8fa8c9', '#e3ebf6'], ['pebble', '#b49a7c', '#e3d5c2'], ['scallop', '#a9c3a4', '#5f7e5a'],
    ['crab', '#c9984e', '#4a3520'], ['coral', '#c58ab0', null], ['urchin', '#4f6d74', '#cfe1e3'],
  ];
  const treasureSVG = (p) => '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">' + SHAPES[p[0]](p[1], p[2]) + '</svg>';

  const ART = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="tpArtSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ecd9b4"/><stop offset="1" stop-color="#dcc296"/></linearGradient>' +
    '<linearGradient id="tpArtSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f8f9c"/><stop offset="1" stop-color="#7fb7b6"/></linearGradient></defs>' +
    '<rect x="4" y="4" width="56" height="56" rx="14" fill="url(#tpArtSand)"/>' +
    '<path d="M4 18 V14 Q4 4 14 4 H50 Q60 4 60 14 V22 Q52 26 44 22 T28 22 T12 23 T4 22 Z" fill="url(#tpArtSea)"/>' +
    '<path d="M4 22 Q12 26 20 22 T36 22 T52 22 T60 22" stroke="#f4f1ea" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>' +
    '<g transform="translate(9 30) scale(.55)">' + SHAPES.star('#dd8a72', '#9e4e3a') + '</g>' +
    '<g transform="translate(33 26) scale(.6)">' + SHAPES.scallop('#e3a588', '#b3694f') + '</g>' +
    '<g transform="translate(26 42) scale(.42)">' + SHAPES.glass('#7fb7ae', '#d8eeea') + '</g>' +
    '</svg>';

  NP.register({
    id: 'tide-pool',
    name: 'Tide Pool',
    icon: '🐚',
    art: ART,
    color: '#5f9ea0',
    bg: ['#4b8794', '#2c4f5a'],
    tagline: 'Pick each treasure once as the tide shuffles them',
    how: [
      'Tap a treasure you have NOT picked yet this round.',
      'After every pick the tide washes in and shuffles the beach.',
      'Pick one twice and the round is over. Pick them all to clear it.',
      'Cleared rounds add treasures. 12 rounds · 3 slips and you are out.',
    ],
    controls: 'Tap',
    start(api) {
      const info = api.el('div', 'tp-info');
      const pickedEl = api.el('span', 'tp-pill', info);
      const livesEl = api.el('span', 'tp-pill tp-lives', info);
      const lifeDots = [];
      for (let i = 0; i < LIVES; i++) lifeDots.push(api.el('i', 'tp-life', livesEl));
      const beach = api.el('div', 'tp-beach');
      const wet = api.el('div', 'tp-wet', beach);
      const layer = api.el('div', 'tp-layer', beach);
      const wave = api.el('div', 'tp-wave', beach);
      const lap = api.el('div', 'tp-lap', wave);
      api.el('div', 'tp-water', lap);
      api.el('div', 'tp-edge back', lap);
      api.el('div', 'tp-edge front', lap);
      const msg = api.el('div', 'tp-msg', beach);

      let round = 0;
      let size = 3;            // treasures at the start of this round
      let lives = LIVES;
      let items = [];          // { kind, el, picked, fy }
      let unused = [];
      let extraAt = -1;        // pick count at which a new treasure washes in
      let picks = 0;
      let locked = true;
      let cleared = 0;

      const renderInfo = () => {
        pickedEl.textContent = 'Picked ' + picks + ' / ' + items.length;
        lifeDots.forEach((d, i) => d.classList.toggle('lost', i >= lives));
        api.status('Round ' + Math.min(round, ROUNDS) + '/' + ROUNDS + ' · ' + items.length + ' treasures');
      };

      const showMsg = (text, ms) => {
        msg.textContent = text;
        msg.classList.add('show');
        api.after(ms || 900, () => msg.classList.remove('show'));
      };

      // spread treasures over a jittered grid of slots on the sand (below the water line)
      const layout = () => {
        const r = beach.getBoundingClientRect();
        const w = Math.max(200, r.width), h = Math.max(200, r.height * 0.8);
        const n = items.length;
        const cols = Math.max(2, Math.round(Math.sqrt((n + 2) * w / h)));
        const rows = Math.max(2, Math.ceil((n + 2) / cols));
        const cw = w / cols, ch = h / rows;
        const px = Math.round(Math.max(34, Math.min(78, Math.min(cw, ch) * 0.66)));
        const slots = [];
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) slots.push([x, y]);
        const pick = api.shuffle(slots).slice(0, n);
        items.forEach((it, i) => {
          const [cx, cy] = pick[i];
          const jx = (Math.random() - 0.5) * 0.34, jy = (Math.random() - 0.5) * 0.34;
          it.fy = (cy + 0.5 + jy) / rows;
          it.el.style.left = ((cx + 0.5 + jx) / cols) * 100 + '%';
          it.el.style.top = 17 + it.fy * 79 + '%';
          it.el.style.width = it.el.style.height = px + 'px';
          it.el.style.setProperty('--rot', Math.round((Math.random() - 0.5) * 50) + 'deg');
        });
      };

      // treasures settle as the water pulls back — lower ones are uncovered first
      const settle = (only) => {
        items.forEach((it) => {
          if (only && it !== only) return;
          it.el.classList.remove('settle', 'was', 'dup', 'ok');
          void it.el.offsetWidth;
          it.el.style.setProperty('--d', Math.round((1 - it.fy) * 380) + 'ms');
          it.el.classList.add('settle');
        });
      };

      const addItem = () => {
        const kind = unused.pop();
        const el = api.el('button', 'tp-item', layer);
        el.setAttribute('aria-label', kind[0]);
        api.el('i', 'tp-shadow', el);
        const art = api.el('div', 'tp-art', el);
        art.innerHTML = treasureSVG(kind);
        const it = { kind, el, picked: false, fy: 0.5 };
        api.on(el, 'pointerdown', (e) => { e.preventDefault(); tap(it); });
        items.push(it);
        return it;
      };

      const washIn = () => wave.classList.add('in');
      const washOut = () => {
        wave.classList.remove('in');
        wet.classList.remove('dry');
        void wet.offsetWidth;
        wet.classList.add('dry');
        settle();
      };

      const startRound = () => {
        round++;
        if (round > ROUNDS) { api.end('Cleared ' + cleared + ' of ' + ROUNDS + ' rounds'); return; }
        washIn();
        api.after(round === 1 ? 0 : 520, () => {
          layer.innerHTML = '';
          items = [];
          picks = 0;
          unused = api.shuffle(POOL);
          for (let i = 0; i < size; i++) addItem();
          // bigger rounds: a new treasure washes ashore halfway through
          extraAt = size >= 6 ? Math.floor(size / 2) : -1;
          layout();
          renderInfo();
          api.after(round === 1 ? 300 : 120, () => {
            washOut();
            api.after(450, () => { locked = false; });
          });
        });
      };

      const tap = (it) => {
        if (locked || !api.alive()) return;
        if (it.picked) {
          // already picked → round over
          locked = true;
          api.answer(false, 0, it.el);
          lives--;
          it.el.classList.add('dup');
          items.forEach((o) => { if (o.picked && o !== it) o.el.classList.add('was'); });
          showMsg('Already picked that one', 1300);
          renderInfo();
          size = Math.max(3, size - 1);
          api.after(1600, () => {
            if (lives <= 0) { api.end('Out of slips · cleared ' + cleared + ' rounds'); return; }
            startRound();
          });
          return;
        }
        it.picked = true;
        picks++;
        api.answer(true, 15 + 5 * items.length, it.el);
        it.el.classList.remove('settle');
        it.el.classList.add('ok');
        renderInfo();
        locked = true;

        if (picks >= items.length) {
          cleared++;
          api.addScore(40 * items.length);
          api.sfx('level');
          showMsg('Beach cleared', 1000);
          size = Math.min(14, size + 1);
          api.after(1200, startRound);
          return;
        }

        // tide washes in, shuffles, washes out
        api.after(260, () => {
          washIn();
          api.after(560, () => {
            items.forEach((o) => o.el.classList.remove('ok'));
            let fresh = null;
            if (picks === extraAt) fresh = addItem();
            layout();
            renderInfo();
            washOut();
            if (fresh) api.after(500, () => showMsg('Something washed ashore', 900));
            api.after(420, () => { locked = false; });
          });
        });
      };

      api.on(window, 'resize', () => { if (items.length) layout(); });
      wave.classList.add('in', 'instant');
      api.after(30, () => { wave.classList.remove('instant'); startRound(); });
    },
  });
})();
