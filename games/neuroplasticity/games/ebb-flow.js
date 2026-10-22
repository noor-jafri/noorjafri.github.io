// Ebb & Flow — green leaves: swipe where they POINT; orange leaves: swipe where they MOVE.
(function () {
  const DIRS = ['up', 'right', 'down', 'left'];
  const VEC = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  const ROT = { right: 0, down: 90, left: 180, up: 270 };
  const COLORS = {
    green: { fill: '#3ddc84', dark: '#1f9e58' },
    orange: { fill: '#ff9f43', dark: '#c96a12' },
  };
  // Leaf drawn pointing RIGHT (tip on the right), rotated per direction.
  const leafSvg = (c) =>
    '<svg viewBox="0 0 100 60" width="100%" height="100%" aria-hidden="true">' +
    '<path d="M4 30 C 22 4, 62 2, 96 30 C 62 58, 22 56, 4 30 Z" fill="' + c.fill + '" stroke="' + c.dark + '" stroke-width="3"/>' +
    '<path d="M4 30 L 90 30" stroke="' + c.dark + '" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M30 30 L 44 16 M30 30 L 44 44 M54 30 L 66 19 M54 30 L 66 41" stroke="' + c.dark + '" stroke-width="2.4" stroke-linecap="round" fill="none"/>' +
    '</svg>';

  NP.register({
    id: 'ebb-flow',
    name: 'Ebb & Flow',
    icon: '🍃',
    color: '#3ddc84',
    tagline: 'Green leaves: where they point. Orange leaves: where they move.',
    how: [
      'A field of leaves all point one way and drift (maybe another way).',
      '🟢 GREEN leaves → swipe the direction they POINT.',
      '🟠 ORANGE leaves → swipe the direction they MOVE.',
      'Arrow keys / WASD work on desktop.',
    ],
    controls: 'Swipe',
    start(api) {
      api.el('style', null, null, `
        .ef-field { position: absolute; inset: 0; overflow: hidden; touch-action: none;
          background: radial-gradient(ellipse at 50% 40%, rgba(61,220,132,.07), transparent 70%); }
        .ef-field.fade { opacity: 0; transition: opacity .16s ease; }
        .ef-field.show { opacity: 1; transition: opacity .2s ease; }
        .ef-leaf { position: absolute; left: 0; top: 0; will-change: transform; pointer-events: none;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,.35)); }
        .ef-leaf svg { display: block; }
        .ef-legend { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%);
          display: flex; gap: 10px; font-size: 12px; font-weight: 700; pointer-events: none; z-index: 2; white-space: nowrap; }
        .ef-legend span { padding: 5px 10px; border-radius: 999px; background: rgba(0,0,0,.35); }
        .ef-legend .g { color: #3ddc84; } .ef-legend .o { color: #ff9f43; }
        .ef-hint { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-size: min(22vw, 120px); opacity: 0; pointer-events: none; z-index: 3; }
        .ef-hint.pop { animation: ef-pop .45s ease-out; }
        @keyframes ef-pop { 0% { opacity: .9; transform: scale(.7); } 100% { opacity: 0; transform: scale(1.25); } }
      `);
      const field = api.el('div', 'ef-field');
      const hint = api.el('div', 'ef-hint', api.stage);
      const legend = api.el('div', 'ef-legend', api.stage);
      api.el('span', 'g', legend, '🍃 green → POINT');
      api.el('span', 'o', legend, '🍂 orange → MOVE');

      let level = 1;
      let correctRun = 0;
      let leaves = [];
      let trial = null;
      let accepting = false;
      let W = 0, H = 0;

      const measure = () => { W = field.clientWidth; H = field.clientHeight; };

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
        const size = Math.max(40, Math.min(W, H) * (0.2 - Math.min(0.07, level * 0.006)));
        trial = { color, point, move, answer: color === 'green' ? point : move };

        // Spread leaves on a jittered grid so they don't overlap too much
        const cols = Math.ceil(Math.sqrt(count * (W / Math.max(1, H))));
        const rows = Math.ceil(count / cols);
        const cells = api.shuffle([...Array(cols * rows).keys()]).slice(0, count);
        leaves = cells.map((ci) => {
          const el = api.el('div', 'ef-leaf', field);
          el.style.width = size + 'px';
          el.style.height = size * 0.6 + 'px';
          el.innerHTML = leafSvg(COLORS[color]);
          const cx = ((ci % cols) + 0.2 + Math.random() * 0.6) * (W / cols);
          const cy = (Math.floor(ci / cols) + 0.2 + Math.random() * 0.6) * (H / rows);
          return { el, x: cx, y: cy, w: size, h: size * 0.6, wob: Math.random() * 6.28 };
        });
        trial.speed = speed;
        place(0);
        field.classList.remove('fade');
        field.classList.add('show');
        accepting = true;
      };

      const place = (t) => {
        const rot = ROT[trial.point];
        for (const L of leaves) {
          const wob = Math.sin(t / 380 + L.wob) * 5;
          L.el.style.transform = 'translate(' + (L.x - L.w / 2) + 'px,' + (L.y - L.h / 2) + 'px) rotate(' + (rot + wob) + 'deg)';
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

      const ARROW = { up: '⬆️', down: '⬇️', left: '⬅️', right: '➡️' };
      api.onSwipe((dir) => {
        if (!accepting || !trial) return;
        accepting = false;
        const ok = dir === trial.answer;
        api.answer(ok, 40 + level * 5);
        if (ok) {
          correctRun++;
          if (correctRun >= 3) { correctRun = 0; level = Math.min(14, level + 1); }
        } else {
          correctRun = 0;
          level = Math.max(1, level - 1);
          hint.textContent = ARROW[trial.answer];
          hint.classList.remove('pop');
          void hint.offsetWidth;
          hint.classList.add('pop');
        }
        api.status('Level ' + level + ' · ' + (ok ? 'Nice!' : 'It was ' + trial.answer));
        field.classList.remove('show');
        field.classList.add('fade');
        api.after(ok ? 180 : 450, newTrial);
      });

      api.on(window, 'resize', measure);
      api.status('Level 1 · swipe!');
      // wait a frame so the stage has its final size
      api.after(30, () => { newTrial(); api.timer(45); });
    },
  });
})();
