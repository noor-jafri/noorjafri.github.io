// Star Search — find the one item whose shape + color + fill combination is unique.
// Faithful to the aws-core2 original: each round uses 2 shapes, 2 colors and solid/hollow.
// The target is one combination; the three distractor kinds each flip exactly ONE feature
// (and each appears at least twice), so the target can't be spotted by any single feature.
(function () {
  // Shapes that still read clearly when hollow: circle, rounded square, triangle, diamond.
  const SHAPES = ['circle', 'square', 'triangle', 'diamond'];
  // muted, clearly distinct: coral, slate blue, sage, mustard, dusty mauve, warm white
  const COLORS = [
    ['#ee8f7c', '#e07a66'],
    ['#7fa6dc', '#6b93cc'],
    ['#93c4a2', '#7fb390'],
    ['#ecc66e', '#ddb35a'],
    ['#c79ac8', '#b585b7'],
    ['#f3eee6', '#e2dccf'],
  ];
  const MAX_ITEMS = 15;

  const SHAPE_SVG = {
    circle: (s) => '<circle r="' + 40 * s + '"',
    square: (s) => '<rect x="' + -35 * s + '" y="' + -35 * s + '" width="' + 70 * s + '" height="' + 70 * s + '" rx="' + 11 * s + '"',
    triangle: (s) => '<polygon stroke-linejoin="round" points="0,' + -40 * s + ' ' + 43 * s + ',' + 34 * s + ' ' + -43 * s + ',' + 34 * s + '"',
    diamond: (s) => '<polygon stroke-linejoin="round" points="0,' + -45 * s + ' ' + 34 * s + ',0 0,' + 45 * s + ' ' + -34 * s + ',0"',
  };

  function defsSVG() {
    let d = '<svg class="ss-defs" width="0" height="0" aria-hidden="true"><defs>' +
      '<filter id="ss-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.5"/></filter>';
    COLORS.forEach(([hi, lo], i) => {
      d += '<linearGradient id="ss-g' + i + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + hi + '"/><stop offset="1" stop-color="' + lo + '"/></linearGradient>';
    });
    return d + '</defs></svg>';
  }

  function itemSVG(it) {
    const shape = SHAPE_SVG[SHAPES[it.shape]];
    let s = '<svg viewBox="-50 -50 100 100" aria-hidden="true">';
    if (it.hollow) {
      s += '<g transform="translate(0 5)" filter="url(#ss-blur)">' + shape(0.88) + ' fill="none" stroke="rgba(0,0,0,.28)" stroke-width="12"/></g>';
      s += shape(0.88) + ' fill="none" stroke="url(#ss-g' + it.color + ')" stroke-width="12"/>';
    } else {
      s += '<g transform="translate(0 5)" filter="url(#ss-blur)">' + shape(1) + ' fill="rgba(0,0,0,.28)"/></g>';
      s += shape(1) + ' fill="url(#ss-g' + it.color + ')"/>';
    }
    return s + '</svg>';
  }

  const ART = '<svg viewBox="0 0 64 64">' +
    '<defs><linearGradient id="ssi-n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3a5e"/><stop offset="1" stop-color="#1a2240"/></linearGradient></defs>' +
    '<rect x="2" y="2" width="60" height="60" rx="16" fill="url(#ssi-n)"/>' +
    '<g fill="#dfe6f5" opacity=".7"><circle cx="10" cy="10" r=".9"/><circle cx="54" cy="8" r="1"/><circle cx="33" cy="6" r=".7"/><circle cx="7" cy="33" r=".7"/><circle cx="57" cy="31" r=".8"/></g>' +
    '<g fill="#000" opacity=".22"><circle cx="19" cy="22" r="9"/><circle cx="45" cy="22" r="9"/><circle cx="19" cy="47" r="9"/></g>' +
    '<g fill="#7fa6dc"><circle cx="19" cy="20" r="9"/><circle cx="45" cy="20" r="9"/><circle cx="19" cy="45" r="9"/></g>' +
    '<circle cx="45" cy="45" r="7" fill="none" stroke="#7fa6dc" stroke-width="3.6"/>' +
    '<circle cx="45" cy="45" r="12.5" fill="none" stroke="#ecc66e" stroke-width="2"/>' +
    '</svg>';

  NP.register({
    id: 'star-search',
    name: 'Star Search',
    icon: '🔍',
    art: ART,
    color: '#ecc66e',
    bg: ['#26324f', '#141a2e'],
    tagline: "Find the one item that's different from all the others",
    how: [
      'Tap the ONE item that is different from all the others.',
      'Every other item has at least one twin. The odd one shares its shape, color or fill with the rest, so look at all three.',
      'More items appear as you go. Wrong taps cost your streak.',
    ],
    controls: 'Tap',
    start(api) {
      api.stage.insertAdjacentHTML('beforeend', defsSVG());
      const field = api.el('div', 'ss-field');
      const sky = api.el('div', 'ss-sky', field);
      for (let i = 0; i < 34; i++) {
        const s = api.el('i', i % 9 === 0 ? 'big' : '', sky);
        s.style.left = Math.random() * 100 + '%';
        s.style.top = Math.random() * 100 + '%';
        s.style.animationDuration = (3 + Math.random() * 4).toFixed(2) + 's';
        s.style.animationDelay = (-Math.random() * 4).toFixed(2) + 's';
        s.style.opacity = (0.25 + Math.random() * 0.45).toFixed(2);
      }
      const layer = api.el('div', 'ss-items', field);

      let round = 0, found = 0, locked = true, count = 0;
      let items = []; // { shape, color, hollow, slot, jx, jy, el }
      let grid = { cols: 4, rows: 5 };

      function chooseGrid() {
        const W = field.clientWidth || 320, H = field.clientHeight || 400;
        let best = null;
        for (let c = 3; c <= 7; c++) {
          for (let r = 3; r <= 7; r++) {
            if (c * r < 16 || c * r > 24) continue;
            const aspect = (W / c) / (H / r);
            const score = Math.abs(Math.log(aspect)) + c * r * 0.01;
            if (!best || score < best.score) best = { cols: c, rows: r, score };
          }
        }
        grid = best;
      }

      function place() {
        const W = field.clientWidth, H = field.clientHeight;
        if (!W || !H) return;
        const pad = 14;
        const sw = (W - pad * 2) / grid.cols, sh = (H - pad * 2) / grid.rows;
        const D = Math.max(34, Math.min(sw, sh) * 0.7, 0);
        const size = Math.min(D, 96);
        layer.style.setProperty('--ss-d', size + 'px');
        items.forEach((it) => {
          const x = pad + (it.slot % grid.cols + 0.5 + it.jx) * sw;
          const y = pad + (Math.floor(it.slot / grid.cols) + 0.5 + it.jy) * sh;
          it.x = x; it.y = y;
          it.el.style.left = x + 'px';
          it.el.style.top = y + 'px';
        });
        hitR = Math.max(size * 0.85, 36);
      }
      let hitR = 40;

      function nextQuestion() {
        round++;
        count = Math.min(7 + Math.floor(round / 2), MAX_ITEMS);
        const s0 = api.rand(4);
        const shapes = [s0, (s0 + 1 + api.rand(3)) % 4];
        const c0 = api.rand(6);
        const colors = [c0, (c0 + 1 + api.rand(5)) % 6];
        const ts = api.rand(2), tc = api.rand(2), th = api.rand(2);
        const kinds = [
          { shape: shapes[1 - ts], color: colors[tc], hollow: th },
          { shape: shapes[ts], color: colors[1 - tc], hollow: th },
          { shape: shapes[ts], color: colors[tc], hollow: 1 - th },
        ];
        const list = [{ shape: shapes[ts], color: colors[tc], hollow: th, odd: true }];
        for (let i = 1; i < count; i++) list.push(Object.assign({}, kinds[i <= 6 ? (i - 1) % 3 : api.rand(3)]));

        chooseGrid();
        const slots = api.shuffle([...Array(grid.cols * grid.rows).keys()]);
        layer.innerHTML = '';
        items = list.map((it, i) => {
          it.slot = slots[i];
          it.jx = (Math.random() - 0.5) * 0.26;
          it.jy = (Math.random() - 0.5) * 0.22;
          const el = api.el('div', 'ss-it', layer);
          const bob = api.el('div', 'ss-bob', el);
          bob.innerHTML = itemSVG(it);
          bob.style.animationDelay = (-Math.random() * 3).toFixed(2) + 's';
          bob.style.animationDuration = (2.6 + Math.random() * 1.6).toFixed(2) + 's';
          el.style.animationDelay = (Math.random() * 140).toFixed(0) + 'ms';
          it.el = el;
          return it;
        });
        // shuffle DOM order so the target isn't always first in the tree
        api.shuffle(items.slice()).forEach((it) => layer.appendChild(it.el));
        place();
        api.status('Round ' + round + ' · ' + count + ' items · find the odd one');
        locked = false;
      }

      function choiceAt(x, y) {
        let best = null, bestD = hitR * hitR;
        items.forEach((it) => {
          const dx = x - it.x, dy = y - it.y, d = dx * dx + dy * dy;
          if (d < bestD) { best = it; bestD = d; }
        });
        return best;
      }

      function clearOut(delay) {
        api.after(delay, () => {
          layer.classList.add('out');
          api.after(260, () => { layer.classList.remove('out'); if (api.alive()) nextQuestion(); });
        });
      }

      api.on(field, 'pointerdown', (e) => {
        e.preventDefault();
        if (locked) return;
        const r = field.getBoundingClientRect();
        const it = choiceAt(e.clientX - r.left, e.clientY - r.top);
        if (!it) return;
        locked = true;
        const target = items[0];
        layer.classList.add('done');
        if (it.odd) {
          found++;
          it.el.classList.add('hit');
          api.answer(true, 50, it.el);
          clearOut(420);
        } else {
          it.el.classList.add('wrong');
          target.el.classList.add('reveal');
          api.answer(false, 50, it.el);
          clearOut(1000);
        }
      });

      api.on(window, 'resize', () => { place(); });
      api.after(30, nextQuestion);
      api.timer(60, () => api.end('Found ' + found + ' odd one' + (found === 1 ? '' : 's') + ' · reached round ' + round));
    },
  });
})();
