// Spatial Match — is the lit square in the same spot as the one before?
(function () {
  NP.register({
    id: 'spatial-match',
    name: 'Spatial Match',
    icon: '🔲',
    color: '#4da3ff',
    tagline: 'Is the lit square in the same spot as the one before?',
    how: [
      'One square lights up. Remember where.',
      'Each turn: is the lit square in the SAME spot as the previous one?',
      'Keep a streak going and the grid gets bigger.',
    ],
    controls: 'Yes / No',
    start(api) {
      api.el('style', null, null, `
        .sp-grid { display: grid; gap: min(2.4vw, 1.4vh, 12px); width: min(84vw, 46vh, 380px); aspect-ratio: 1;
          padding: min(2.4vw, 1.4vh, 12px); border-radius: 24px; background: rgba(255,255,255,.06);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); transition: transform .3s ease; }
        .sp-grid.grow { animation: sp-grow .4s ease; }
        @keyframes sp-grow { 0% { transform: scale(.85); opacity: .3; } 100% { transform: none; opacity: 1; } }
        .sp-cell { border-radius: 14px; background: #2b2050; box-shadow: inset 0 -4px 0 rgba(0,0,0,.25);
          transition: background .12s ease, box-shadow .12s ease, transform .12s ease; }
        .sp-cell.lit { background: linear-gradient(160deg, #7cc4ff, #4da3ff 55%, #2f6fe0);
          box-shadow: 0 0 28px rgba(77,163,255,.7), inset 0 -4px 0 rgba(0,0,0,.2); animation: sp-pop .2s ease-out; }
        @keyframes sp-pop { 0% { transform: scale(.7); } 70% { transform: scale(1.06); } 100% { transform: none; } }
      `);
      const grid = api.el('div', 'sp-grid');
      let size = 0;
      let cells = [];
      let prev = -1;
      let cur = -1;
      let level = 1;
      let run = 0;

      const build = (n) => {
        size = n;
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = 'repeat(' + n + ', 1fr)';
        cells = [];
        for (let i = 0; i < n * n; i++) cells.push(api.el('div', 'sp-cell', grid));
        grid.classList.remove('grow');
        void grid.offsetWidth;
        grid.classList.add('grow');
        prev = cur = -1;
      };

      const neighbors = (i) => {
        const r = Math.floor(i / size), c = i % size, out = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && cc >= 0 && rr < size && cc < size) out.push(rr * size + cc);
        }
        return out;
      };

      const light = (i) => {
        cells.forEach((c) => c.classList.remove('lit'));
        // re-trigger the pop even when the same cell lights again
        api.after(70, () => { if (cells[i]) cells[i].classList.add('lit'); });
      };

      const deal = () => {
        prev = cur;
        if (prev < 0) cur = api.rand(size * size);
        else if (Math.random() < 0.5) cur = prev;
        else {
          // higher levels: non-matches are often right next to the previous spot
          const near = Math.random() < Math.min(0.75, 0.1 * level);
          const pool = near ? neighbors(prev) : [...Array(size * size).keys()].filter((k) => k !== prev);
          cur = api.pick(pool);
        }
        light(cur);
      };

      const yn = api.yesNo((yes) => {
        const ok = yes === (cur === prev);
        api.answer(ok, 50 + (level - 1) * 8);
        let rebuild = false;
        if (ok) {
          if (++run >= 5) { run = 0; level = Math.min(8, level + 1); }
        } else {
          run = 0;
          level = Math.max(1, level - 1);
        }
        const want = level >= 4 ? 4 : 3;
        if (want !== size) rebuild = true;
        api.status('Level ' + level + ' · ' + size + '×' + size + ' · same spot?');
        if (rebuild) {
          // new grid size → show a fresh first square to remember
          yn.enable(false);
          build(want);
          api.sfx('level');
          api.status('Level ' + level + ' · ' + want + '×' + want + ' grid — remember this…');
          deal();
          api.after(900, () => { api.status('Level ' + level + ' · same spot?'); deal(); yn.enable(true); });
        } else deal();
      });
      yn.enable(false);

      build(3);
      api.status('Remember this square…');
      deal();
      api.after(1200, () => {
        api.status('Level 1 · same spot as before?');
        deal();
        yn.enable(true);
        api.timer(45);
      });
    },
  });
})();
