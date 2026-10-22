// Star Search — find the one item that's different from all the others.
(function () {
  const COLORS = ['#ff4d5e', '#4da3ff', '#3ddc84', '#ffd93d', '#b57bff', '#f2eeff'];
  const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hex'];
  const FILLS = ['solid', 'outline', 'striped'];
  const COUNTS = [1, 2, 3];
  const VALUES = { shape: SHAPES.length, color: COLORS.length, fill: FILLS.length, count: COUNTS.length };

  const poly = (pts) => '<polygon points="' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '"';
  const ring = (n, r, rot, inner) => {
    const pts = [];
    const m = inner ? n * 2 : n;
    for (let i = 0; i < m; i++) {
      const a = rot + (i * Math.PI * 2) / m;
      const rr = inner && i % 2 ? inner : r;
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return pts;
  };
  const SHAPE_SVG = {
    circle: '<circle r="37"',
    square: '<rect x="-33" y="-33" width="66" height="66" rx="7"',
    triangle: poly([[0, -38], [38, 30], [-38, 30]]),
    diamond: poly([[0, -42], [34, 0], [0, 42], [-34, 0]]),
    star: poly(ring(5, 42, -Math.PI / 2, 18)),
    hex: poly(ring(6, 39, 0)),
  };
  const LAYOUT = {
    1: [[50, 50, 1]],
    2: [[28, 50, 0.48], [72, 50, 0.48]],
    3: [[50, 28, 0.44], [27, 71, 0.44], [73, 71, 0.44]],
  };
  let pid = 0;

  function itemSVG(it) {
    const color = COLORS[it.color];
    const fill = FILLS[it.fill];
    const id = 'ss-p' + (++pid);
    let defs = '';
    if (fill === 'striped') {
      defs = '<defs><pattern id="' + id + '" patternUnits="userSpaceOnUse" width="11" height="11" patternTransform="rotate(45)">' +
        '<rect width="5" height="11" fill="' + color + '"/></pattern></defs>';
    }
    const body = LAYOUT[COUNTS[it.count]].map(([x, y, s]) => {
      const sw = (fill === 'outline' ? 7 : 5) / Math.max(s, 0.6);
      const paint = fill === 'solid' ? 'fill="' + color + '"'
        : fill === 'outline' ? 'fill="none" stroke="' + color + '" stroke-width="' + sw + '" stroke-linejoin="round"'
        : 'fill="url(#' + id + ')" stroke="' + color + '" stroke-width="' + sw + '" stroke-linejoin="round"';
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + s * 0.92 + ')">' + SHAPE_SVG[SHAPES[it.shape]] + ' ' + paint + '/></g>';
    }).join('');
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' + defs + body + '</svg>';
  }

  NP.register({
    id: 'star-search',
    name: 'Star Search',
    icon: '🔍',
    color: '#ffd93d',
    tagline: "Find the one item that's different from all the others",
    how: [
      'Every item has a twin — except ONE.',
      'Items vary by shape, color, fill (and later, how many). Tap the one with no match.',
      'Boards get bigger and trickier as you go. Wrong taps cost your streak.',
    ],
    controls: 'Tap',
    start(api) {
      api.el('style', null, null, `
        .ss-board { display: grid; gap: var(--ss-gap); grid-template-columns: repeat(var(--ss-cols), var(--ss-cell)); }
        .ss-item { width: var(--ss-cell); height: var(--ss-cell); border-radius: 16%; background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.1); display: flex; align-items: center; justify-content: center; padding: 10%;
          cursor: pointer; transition: transform .12s, background .15s, opacity .25s; animation: ss-in .3s cubic-bezier(.3,1.5,.6,1) both; }
        .ss-item svg { width: 100%; height: 100%; display: block; overflow: visible; }
        .ss-item:active { transform: scale(.93); }
        .ss-item.hit { background: rgba(61,220,132,.3); border-color: #3ddc84; transform: scale(1.12); }
        .ss-item.wrong { background: rgba(255,92,122,.3); border-color: #ff5c7a; animation: ss-shake .35s; }
        .ss-item.reveal { background: rgba(255,204,77,.28); border-color: #ffcc4d; animation: ss-pulse .5s ease infinite alternate; }
        .ss-board.done .ss-item:not(.hit):not(.reveal):not(.wrong) { opacity: .3; }
        @keyframes ss-in { from { transform: scale(.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes ss-shake { 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
        @keyframes ss-pulse { from { transform: scale(1); } to { transform: scale(1.12); } }
      `);

      const board = api.el('div', 'ss-board');
      let level = 1;
      let locked = false;
      let n = 0;
      let found = 0;

      function makeRound() {
        const active = ['shape', 'color', 'fill'];
        if (level >= 5) active.push('count');
        const base = { shape: api.rand(6), color: api.rand(6), fill: api.rand(3), count: 0 };
        if (level >= 5 && Math.random() < 0.5) base.count = api.rand(3);
        const change = (it, f) => {
          const c = Object.assign({}, it);
          c[f] = (c[f] + 1 + api.rand(VALUES[f] - 1)) % VALUES[f];
          return c;
        };
        const key = (it) => it.shape + '.' + it.color + '.' + it.fill + '.' + it.count;
        const f = api.pick(active);
        const target = change(base, f);
        const kinds = [base];
        const seen = new Set([key(base), key(target)]);
        n = Math.min(25, 6 + (level - 1) * 2);
        // harder levels: distractors that share the target's odd feature but differ elsewhere
        let want = level <= 2 ? 0 : level <= 4 ? 1 : level <= 7 ? 2 : 3;
        want = Math.min(want, Math.floor((n - 1) / 2) - 1);
        let tries = 0;
        while (kinds.length < want + 1 && tries++ < 50) {
          const others = active.filter((g) => g !== f);
          let k = change(target, api.pick(others));
          if (level >= 9 && Math.random() < 0.4) k = change(k, api.pick(others));
          if (!seen.has(key(k))) { seen.add(key(k)); kinds.push(k); }
        }
        // every distractor kind appears at least twice
        const items = [];
        kinds.forEach((k) => { items.push(k, k); });
        while (items.length < n - 1) items.push(api.pick(kinds));
        items.push(target);
        return api.shuffle(items.map((it) => ({ it, odd: it === target })));
      }

      function layout() {
        const W = api.stage.clientWidth - 32, H = api.stage.clientHeight - 16;
        let best = { size: 0, cols: 3 };
        for (let c = 3; c <= 6; c++) {
          const rows = Math.ceil(n / c);
          const gap = Math.max(6, Math.min(12, W * 0.025));
          const size = Math.min((W - gap * (c - 1)) / c, (H - gap * (rows - 1)) / rows);
          if (size > best.size) best = { size, cols: c, gap };
        }
        const size = Math.floor(Math.min(best.size, 104));
        board.style.setProperty('--ss-cols', best.cols);
        board.style.setProperty('--ss-cell', size + 'px');
        board.style.setProperty('--ss-gap', best.gap + 'px');
      }

      function deal() {
        locked = false;
        const items = makeRound();
        board.className = 'ss-board';
        board.innerHTML = '';
        layout();
        api.status('Level ' + level + ' · Find the odd one out');
        items.forEach((x, i) => {
          const b = api.el('button', 'ss-item', board);
          b.innerHTML = itemSVG(x.it);
          b.style.animationDelay = Math.min(i * 18, 300) + 'ms';
          b.setAttribute('aria-label', 'Item ' + (i + 1));
          if (x.odd) b.dataset.odd = '1';
          api.on(b, 'pointerdown', (e) => { e.preventDefault(); tap(b, x.odd); });
        });
      }

      function tap(b, odd) {
        if (locked) return;
        locked = true;
        board.classList.add('done');
        if (odd) {
          b.style.animation = 'none';
          b.classList.add('hit');
          api.answer(true, 40 + level * 10);
          found++;
          level++;
          api.after(380, deal);
        } else {
          b.style.animation = '';
          b.classList.add('wrong');
          const t = board.querySelector('[data-odd]');
          t.style.animation = '';
          t.classList.add('reveal');
          api.answer(false);
          level = Math.max(1, level - 1);
          api.after(900, deal);
        }
      }

      api.on(window, 'resize', layout);
      deal();
      api.timer(60, () => api.end('Found ' + found + ' odd one' + (found === 1 ? '' : 's') + ' · reached level ' + level));
    },
  });
})();
