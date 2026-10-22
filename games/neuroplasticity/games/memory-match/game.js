// Memory Match — does this card match the one from 2 cards ago? (2-back)
// Look (Lumosity-style): plain white cards with one flat symbol on a muted plum table. New cards slide in
// from the right; judged cards flip face-down into a "2 ago / 1 ago" trail below.
(function () {
  const GEO = {
    heart: '<path d="M50 84 C24 66 12 50 16 34 C20 20 40 16 50 32 C60 16 80 20 84 34 C88 50 76 66 50 84 Z"/>',
    moon: '<path d="M58 12 A38 38 0 1 0 88 64 A30 30 0 0 1 58 12 Z"/>',
    hexagon: '<path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z"/>',
    drop: '<path d="M50 10 C62 30 78 46 78 62 A28 28 0 0 1 22 62 C22 46 38 30 50 10 Z"/>',
    sparkle: '<path d="M50 8 C53 36 64 47 92 50 C64 53 53 64 50 92 C47 64 36 53 8 50 C36 47 47 36 50 8 Z"/>',
    ring: '<path fill-rule="evenodd" d="M50 14 A36 36 0 1 1 49.9 14 Z M50 34 A16 16 0 1 0 50.1 34 Z"/>',
    bolt: '<path d="M58 8 L22 56 L46 56 L40 92 L78 42 L54 42 Z"/>',
    leaf: '<path d="M16 84 C16 40 40 16 86 14 C84 60 60 84 16 84 Z"/>',
  };
  const CORAL = '#d9785f', MUSTARD = '#d3a24a', SAGE = '#6f9f88', PLUM = '#7d6597';
  const CARDS = [
    { k: 'heart', c: CORAL },
    { k: 'moon', c: MUSTARD },
    { k: 'hexagon', c: SAGE },
    { k: 'drop', c: PLUM },
    { k: 'sparkle', c: MUSTARD },
    { k: 'ring', c: CORAL },
    { k: 'bolt', c: PLUM },
    { k: 'leaf', c: SAGE },
  ];
  const flat = (s) =>
    '<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="' + s.c + '" stroke="' + s.c + '" stroke-width="3" stroke-linejoin="round">' + GEO[s.k] + '</g></svg>';

  const ART =
    '<svg viewBox="0 0 64 64">' +
    '<rect x="6" y="18" width="18" height="26" rx="3.5" fill="#8a76a6"/>' +
    '<rect x="15" y="15" width="18" height="26" rx="3.5" fill="#a592bf"/>' +
    '<rect x="29" y="9" width="28" height="40" rx="5" fill="#fff"/>' +
    '<path d="M43 39 C35 33 31 28 32.5 23.5 C34 19.5 40 18.5 43 23 C46 18.5 52 19.5 53.5 23.5 C55 28 51 33 43 39 Z" fill="#d9785f"/>' +
    '</svg>';

  NP.register({
    id: 'memory-match',
    name: 'Memory Match',
    icon: '🃏',
    art: ART,
    color: '#8e74b0',
    bg: ['#4b4064', '#221c31'],
    tagline: 'Does this shape match the one from 2 cards ago?',
    how: [
      'Two cards are dealt first. Remember them in order.',
      'For every new card: is it the SAME as the card from 2 cards ago?',
      'Watch out — matching the card right before doesn\'t count!',
    ],
    controls: 'Yes / No',
    start(api) {
      const table = api.el('div', 'mm-table');
      const play = api.el('div', 'mm-play', table);
      const trail = api.el('div', 'mm-trail', table);
      const lane = api.el('div', 'mm-lane', trail);
      const slots = [0, 1, 2].map((i) => {
        const s = api.el('div', 'mm-slot', lane);
        s.style.setProperty('--i', i);
        return s;
      });
      const labels = api.el('div', 'mm-labels', trail);
      api.el('span', null, labels, 'earlier');
      api.el('span', 'target', labels, '2 ago');
      api.el('span', null, labels, '1 ago');

      const hist = [];
      let cardEl = null;
      let n = 0;
      let level = 1;
      let run = 0;
      let minis = []; // { el, i }

      const offsetTo = (el) => {
        const a = el.getBoundingClientRect(), b = play.getBoundingClientRect();
        return { x: a.left + a.width / 2 - (b.left + b.width / 2), y: a.top + a.height / 2 - (b.top + b.height / 2) };
      };

      const shiftTrail = () => {
        minis.forEach((m) => {
          m.i = Math.max(0, m.i - 1);
          m.el.style.setProperty('--i', m.i);
        });
        const pile = minis.filter((m) => m.i === 0);
        pile.forEach((m, k) => {
          m.el.style.setProperty('--r', ((k % 3) - 1) * 3 + 'deg');
          m.el.style.setProperty('--d', Math.min(k, 3) * -2 + 'px');
        });
        while (pile.length > 4) { const m = pile.shift(); m.el.remove(); minis.splice(minis.indexOf(m), 1); }
      };

      const addMini = (num) => {
        const el = api.el('div', 'mm-mini', lane);
        el.style.setProperty('--i', 2);
        api.el('b', null, el, '#' + num);
        minis.push({ el, i: 2 });
      };

      const retire = (el, verdict) => {
        const num = el.dataset.n;
        if (verdict) el.classList.add(verdict);
        shiftTrail();
        const o = offsetTo(slots[2]);
        const T = (x, y, s, ry) => 'translate(' + x + 'px,' + y + 'px) scale(' + s + ') rotateY(' + ry + 'deg)';
        const frames = verdict === 'bad'
          ? [
            { transform: T(0, 0, 1, 0) },
            { transform: T(-7, 0, 1, 0), offset: 0.1 },
            { transform: T(6, 0, 1, 0), offset: 0.2 },
            { transform: T(0, 0, 1, 0), offset: 0.3 },
            { transform: T(o.x, o.y, 0.34, 180) },
          ]
          : [
            { transform: T(0, 0, 1, 0) },
            { transform: T(0, 0, 1, 0), offset: verdict ? 0.15 : 0.01 },
            { transform: T(o.x, o.y, 0.34, 180) },
          ];
        const dur = verdict === 'bad' ? 520 : 400;
        el.style.zIndex = 1;
        el.animate(frames, { duration: dur, easing: 'ease-in-out', fill: 'forwards' });
        api.after(dur, () => { el.remove(); addMini(num); });
      };

      const show = (c, verdict) => {
        if (cardEl) retire(cardEl, verdict);
        n++;
        const e = api.el('div', 'mm-card', play);
        e.dataset.n = n;
        e.style.zIndex = 2;
        const front = api.el('div', 'mm-face mm-front', e);
        api.el('span', 'mm-n', front, '#' + n);
        const sym = api.el('span', 'mm-sym', front);
        sym.innerHTML = flat(c);
        api.el('div', 'mm-face mm-back', e);
        e.animate([
          { transform: 'translateX(70%) rotate(4deg)', opacity: 0 },
          { transform: 'translateX(0) rotate(0deg)', opacity: 1 },
        ], { duration: 320, easing: 'cubic-bezier(.25,.6,.3,1)' });
        cardEl = e;
      };

      const deal = (warmup, verdict) => {
        let c;
        if (warmup || hist.length < 2) {
          c = api.pick(CARDS.filter((x) => x !== hist[hist.length - 1]));
        } else {
          const twoBack = hist[hist.length - 2];
          const oneBack = hist[hist.length - 1];
          if (Math.random() < 0.5) c = twoBack;
          else {
            const others = CARDS.filter((x) => x !== twoBack);
            // Harder levels: lure with the 1-back card more often
            const lure = oneBack !== twoBack && Math.random() < Math.min(0.5, 0.08 * level);
            c = lure ? oneBack : api.pick(others);
          }
        }
        hist.push(c);
        if (hist.length > 3) hist.shift();
        show(c, verdict);
      };

      const yn = api.yesNo((yes) => {
        const match = hist[hist.length - 1] === hist[hist.length - 3];
        const ok = yes === match;
        api.answer(ok, 50 + (level - 1) * 10, cardEl);
        if (ok) { if (++run >= 5) { run = 0; level = Math.min(6, level + 1); } }
        else { run = 0; level = Math.max(1, level - 1); }
        api.status('Level ' + level + ' · same as 2 cards ago?');
        deal(false, ok ? 'good' : 'bad');
      });
      yn.enable(false);

      api.status('Remember this card… (1 of 2)');
      deal(true);
      api.after(1300, () => {
        api.status('…and this one (2 of 2)');
        deal(true);
      });
      api.after(2600, () => {
        api.status('Same as 2 cards ago?');
        deal();
        yn.enable(true);
        api.timer(45);
      });
    },
  });
})();
