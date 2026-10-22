// Ebb & Flow — green leaves: swipe where they POINT; orange leaves: swipe where they MOVE.
// Look (Lumosity-style): flat almond leaves with one vein, sage green / warm orange, drifting calmly over a
// muted teal pond with slow light and faint ripples.
(function () {
  const DIRS = ['up', 'right', 'down', 'left'];
  const VEC = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  const ROT = { right: 0, down: 90, left: 180, up: 270 };
  const COLORS = {
    green: { a: '#b6d19b', b: '#8fb27a', vein: '#6c8f5d' },
    orange: { a: '#f2bb7c', b: '#de9550', vein: '#b37136' },
  };
  const LEAF = 'M8 30 C 30 7, 68 6, 96 30 C 68 54, 30 53, 8 30 Z';
  const VEIN = 'M10 30 Q 52 27, 90 30';
  // Leaf drawn pointing RIGHT (tip on the right, stem on the left), rotated per direction.
  const leafSvg = (k) =>
    '<svg viewBox="-4 0 104 60" width="100%" height="100%" aria-hidden="true">' +
    '<path d="M-2 31 L 12 30" stroke="' + COLORS[k].vein + '" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="' + LEAF + '" fill="url(#ef-g-' + k + ')"/>' +
    '<path d="' + VEIN + '" stroke="' + COLORS[k].vein + '" stroke-width="2" stroke-linecap="round" fill="none" opacity=".8"/>' +
    '</svg>';
  const shadowSvg =
    '<svg viewBox="-4 0 104 60" width="100%" height="100%" aria-hidden="true"><path d="' + LEAF + '" fill="#0e2528"/></svg>';
  const defs = () =>
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    Object.keys(COLORS).map((k) =>
      '<linearGradient id="ef-g-' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + COLORS[k].a + '"/>' +
      '<stop offset="1" stop-color="' + COLORS[k].b + '"/></linearGradient>').join('') +
    '</defs></svg>';
  const miniLeaf = (k) =>
    '<svg viewBox="-4 0 104 60" width="20" height="12" aria-hidden="true"><path d="' + LEAF + '" fill="' + COLORS[k].b + '"/></svg>';
  const ARROW =
    '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M18 50 H 74 M54 28 L 78 50 L 54 72" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ART =
    '<svg viewBox="0 0 64 64">' +
    '<defs><linearGradient id="efi-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6d19b"/><stop offset="1" stop-color="#8fb27a"/></linearGradient>' +
    '<linearGradient id="efi-o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2bb7c"/><stop offset="1" stop-color="#de9550"/></linearGradient></defs>' +
    '<g transform="translate(4 8) rotate(-24 22 14) scale(.46)"><path d="' + LEAF + '" fill="url(#efi-g)"/><path d="' + VEIN + '" stroke="#6c8f5d" stroke-width="3" fill="none"/></g>' +
    '<g transform="translate(18 32) rotate(18 22 14) scale(.46)"><path d="' + LEAF + '" fill="url(#efi-o)"/><path d="' + VEIN + '" stroke="#b37136" stroke-width="3" fill="none"/></g>' +
    '</svg>';

  NP.register({
    id: 'ebb-flow',
    name: 'Ebb & Flow',
    icon: '🍃',
    art: ART,
    color: '#6f9a92',
    bg: ['#55807d', '#284346'],
    tagline: 'Green leaves: where they point. Orange leaves: where they move.',
    how: [
      'A field of leaves all point one way and drift (maybe another way).',
      'GREEN leaves → swipe the direction they POINT.',
      'ORANGE leaves → swipe the direction they MOVE.',
      'Arrow keys / WASD work on desktop.',
    ],
    controls: 'Swipe',
    start(api) {
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const water = api.el('div', 'ef-water');
      water.innerHTML = defs() + '<i class="ef-glow a"></i><i class="ef-glow b"></i>';
      const field = api.el('div', 'ef-field');
      const hint = api.el('div', 'ef-hint', api.stage);
      hint.innerHTML = ARROW;
      const legend = api.el('div', 'ef-legend', api.stage);
      legend.innerHTML =
        '<span>' + miniLeaf('green') + 'green · <b>point</b></span>' +
        '<span>' + miniLeaf('orange') + 'orange · <b>move</b></span>';

      let level = 1;
      let correctRun = 0;
      let leaves = [];
      let trial = null;
      let accepting = false;
      let W = 0, H = 0;

      const measure = () => { W = field.clientWidth; H = field.clientHeight; };

      const ripple = (x, y, big) => {
        if (reduce) return;
        const r = api.el('i', 'ef-ripple' + (big ? ' big' : ''), water);
        r.style.left = x + 'px';
        r.style.top = y + 'px';
        api.after(big ? 2600 : 3200, () => r.remove());
      };
      api.every(1500, () => { if (W) ripple(Math.random() * W, Math.random() * H); });

      const newTrial = () => {
        measure();
        field.innerHTML = '';
        const color = Math.random() < 0.5 ? 'green' : 'orange';
        const point = api.pick(DIRS);
        // Higher levels → more conflicts between pointing and moving
        const conflict = Math.random() < Math.min(0.85, 0.35 + level * 0.06);
        const move = conflict ? api.pick(DIRS.filter((d) => d !== point)) : point;
        const count = Math.min(12, 5 + Math.floor(level / 2) + api.rand(2));
        const speed = Math.min(150, 28 + level * 9); // px per second
        const size = Math.max(44, Math.min(W, H) * (0.21 - Math.min(0.07, level * 0.006)));
        trial = { color, point, move, answer: color === 'green' ? point : move, speed };

        // Spread leaves on a jittered grid so they don't overlap too much
        const cols = Math.ceil(Math.sqrt(count * (W / Math.max(1, H))));
        const rows = Math.ceil(count / cols);
        const cells = api.shuffle([...Array(cols * rows).keys()]).slice(0, count);
        const sh = Math.max(4, size * 0.08);
        leaves = cells.map((ci) => {
          const el = api.el('div', 'ef-leaf', field);
          el.style.width = size + 'px';
          el.style.height = size * 0.6 + 'px';
          const shadow = api.el('div', 'ef-sh', el);
          shadow.innerHTML = shadowSvg;
          const leaf = api.el('div', 'ef-lf', el);
          leaf.innerHTML = leafSvg(color);
          const cx = ((ci % cols) + 0.2 + Math.random() * 0.6) * (W / cols);
          const cy = (Math.floor(ci / cols) + 0.2 + Math.random() * 0.6) * (H / rows);
          return { el, shadow, leaf, x: cx, y: cy, w: size, h: size * 0.6, sh, wob: Math.random() * 6.28 };
        });
        place(performance.now());
        field.classList.remove('fade');
        field.classList.add('show');
        accepting = true;
      };

      const place = (t) => {
        const rot = ROT[trial.point];
        for (const L of leaves) {
          const wob = reduce ? 0 : Math.sin(t / 900 + L.wob) * 3;
          const bob = reduce ? 1 : 1 + Math.sin(t / 1300 + L.wob * 2) * 0.025;
          L.el.style.transform = 'translate(' + (L.x - L.w / 2).toFixed(1) + 'px,' + (L.y - L.h / 2).toFixed(1) + 'px)';
          const r = 'rotate(' + (rot + wob).toFixed(2) + 'deg)';
          L.leaf.style.transform = r + ' scale(' + bob.toFixed(3) + ')';
          // shadow sits a little further below-right when the leaf "rises"
          const lift = L.sh * (0.8 + (bob - 1) * 8);
          L.shadow.style.transform = 'translate(' + lift.toFixed(1) + 'px,' + (lift * 1.4).toFixed(1) + 'px) ' + r;
        }
      };

      api.frame((dt, t) => {
        if (!trial) return;
        const [vx, vy] = VEC[trial.move];
        const m = Math.max(leaves.length ? leaves[0].w : 0, 1) / 2;
        for (const L of leaves) {
          L.x += vx * trial.speed * dt;
          L.y += vy * trial.speed * dt;
          if (L.x > W + m) L.x -= W + 2 * m;
          if (L.x < -m) L.x += W + 2 * m;
          if (L.y > H + m) L.y -= H + 2 * m;
          if (L.y < -m) L.y += H + 2 * m;
        }
        place(t);
      });

      api.onSwipe((dir) => {
        if (!accepting || !trial) return;
        accepting = false;
        const ok = dir === trial.answer;
        const sr = api.stage.getBoundingClientRect(), fr = field.getBoundingClientRect();
        const cx = fr.left - sr.left + W / 2, cy = fr.top - sr.top + H / 2;
        api.answer(ok, 40 + level * 5, { x: cx, y: cy });
        ripple(W / 2, H / 2, true);
        if (ok) {
          correctRun++;
          if (correctRun >= 3) { correctRun = 0; level = Math.min(14, level + 1); }
        } else {
          correctRun = 0;
          level = Math.max(1, level - 1);
          hint.style.setProperty('--r', ROT[trial.answer] + 'deg');
          hint.classList.remove('pop');
          void hint.offsetWidth;
          hint.classList.add('pop');
        }
        api.status('Level ' + level + ' · ' + (ok ? 'Nice!' : 'It was ' + trial.answer));
        field.classList.remove('show');
        field.classList.add('fade');
        api.after(ok ? 220 : 520, newTrial);
      });

      api.on(window, 'resize', measure);
      api.status('Level 1 · swipe!');
      // wait a frame so the stage has its final size
      api.after(30, () => { newTrial(); api.timer(45); });
    },
  });
})();
