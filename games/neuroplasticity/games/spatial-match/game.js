// Spatial Match — is the lit square in the same spot as the one before?
// Look (Lumosity-style): each turn a plain white card with a grid of soft squares (one lit in calm teal)
// rises from below; the previous card tips back, flips face-down and joins a receding stack behind it.
(function () {
  const ART =
    '<svg viewBox="0 0 64 64">' +
    '<rect x="14" y="5" width="36" height="8" rx="3" fill="#6f8aa8"/>' +
    '<rect x="10" y="10" width="44" height="48" rx="6" fill="#fff"/>' +
    [0, 1, 2].map((r) => [0, 1, 2].map((c) =>
      '<rect x="' + (15 + c * 12) + '" y="' + (17 + r * 12) + '" width="10" height="10" rx="2.5" fill="' +
      (r === 1 && c === 2 ? '#3f9b96' : '#dfe5ec') + '"/>').join('')).join('') +
    '</svg>';

  NP.register({
    id: 'spatial-match',
    name: 'Spatial Match',
    icon: '🔲',
    art: ART,
    color: '#5b7fa6',
    bg: ['#3c5571', '#1a2433'],
    tagline: 'Is the lit square in the same spot as the one before?',
    how: [
      'One square lights up. Remember where.',
      'Each turn: is the lit square in the SAME spot as the previous one?',
      'Keep a streak going and the grid gets bigger.',
    ],
    controls: 'Yes / No',
    start(api) {
      const table = api.el('div', 'sp-table');
      const play = api.el('div', 'sp-play', table);
      let size = 3;
      let prev = -1;
      let cur = -1;
      let level = 1;
      let run = 0;
      let curEl = null;
      let litEl = null;
      let stack = [];

      const neighbors = (i) => {
        const r = Math.floor(i / size), c = i % size, out = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && cc >= 0 && rr < size && cc < size) out.push(rr * size + cc);
        }
        return out;
      };

      const restack = () => {
        stack.forEach((el, k) => { el.style.setProperty('--k', stack.length - k); el.style.zIndex = 4 - (stack.length - k); });
        while (stack.length > 3) stack.shift().remove();
      };

      const retire = (el, verdict) => {
        if (!el) return;
        if (verdict) el.classList.add(verdict);
        el.classList.remove('live');
        const T = (x, y, s, rx) => 'translate(' + x + 'px,' + y + '%) scale(' + s + ') rotateX(' + rx + 'deg)';
        const frames = verdict === 'bad'
          ? [
            { transform: T(0, 0, 1, 0) },
            { transform: T(-7, 0, 1, 0), offset: 0.12 },
            { transform: T(6, 0, 1, 0), offset: 0.24 },
            { transform: T(0, 0, 1, 0), offset: 0.36 },
            { transform: T(0, -10, 0.94, 180) },
          ]
          : [
            { transform: T(0, 0, 1, 0) },
            { transform: T(0, 0, 1, 0), offset: verdict ? 0.18 : 0.01 },
            { transform: T(0, -10, 0.94, 180) },
          ];
        const dur = verdict === 'bad' ? 540 : 420;
        el.style.zIndex = 5;
        el.animate(frames, { duration: dur, easing: 'ease-in-out', fill: 'forwards' });
        api.after(dur, () => {
          el.remove();
          const s = api.el('div', 'sp-stack', play);
          play.insertBefore(s, play.firstChild);
          stack.push(s);
          restack();
        });
        // older stack cards recede one step right away
        stack.forEach((s) => { const k = +s.style.getPropertyValue('--k') + 1; s.style.setProperty('--k', k); s.style.zIndex = 4 - k; });
      };

      const deal = (verdict) => {
        prev = cur;
        if (prev < 0) cur = api.rand(size * size);
        else if (Math.random() < 0.5) cur = prev;
        else {
          // higher levels: non-matches are often right next to the previous spot
          const near = Math.random() < Math.min(0.75, 0.1 * level);
          const pool = near ? neighbors(prev) : [...Array(size * size).keys()].filter((k) => k !== prev);
          cur = api.pick(pool);
        }
        retire(curEl, verdict);
        const card = api.el('div', 'sp-card live', play);
        card.style.zIndex = 6;
        const front = api.el('div', 'sp-face sp-front', card);
        api.el('div', 'sp-face sp-back', card);
        const grid = api.el('div', 'sp-grid', front);
        grid.style.gridTemplateColumns = 'repeat(' + size + ', 1fr)';
        grid.classList.toggle('big', size > 3);
        for (let i = 0; i < size * size; i++) {
          const c = api.el('div', 'sp-cell', grid);
          if (i === cur) { c.classList.add('lit'); litEl = c; }
        }
        card.animate([
          { transform: 'translateY(55%) scale(.96)', opacity: 0 },
          { transform: 'translateY(0) scale(1)', opacity: 1 },
        ], { duration: 340, easing: 'cubic-bezier(.25,.6,.3,1)' });
        curEl = card;
      };

      const yn = api.yesNo((yes) => {
        const ok = yes === (cur === prev);
        api.answer(ok, 50 + (level - 1) * 8, litEl || curEl);
        if (ok) {
          if (++run >= 5) { run = 0; level = Math.min(8, level + 1); }
        } else {
          run = 0;
          level = Math.max(1, level - 1);
        }
        const want = level >= 4 ? 4 : 3;
        const verdict = ok ? 'good' : 'bad';
        if (want !== size) {
          // new grid size → show a fresh first square to remember
          yn.enable(false);
          size = want;
          prev = cur = -1;
          api.sfx('level');
          api.status('Level ' + level + ' · ' + size + '×' + size + ' grid — remember this…');
          deal(verdict);
          api.after(1000, () => { api.status('Level ' + level + ' · same spot?'); deal(null); yn.enable(true); });
        } else {
          api.status('Level ' + level + ' · ' + size + '×' + size + ' · same spot?');
          deal(verdict);
        }
      });
      yn.enable(false);

      api.status('Remember this square…');
      deal(null);
      api.after(1200, () => {
        api.status('Level 1 · same spot as before?');
        deal(null);
        yn.enable(true);
        api.timer(45);
      });
    },
  });
})();
