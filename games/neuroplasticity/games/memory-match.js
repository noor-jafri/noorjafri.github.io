// Memory Match — does this card match the one from 2 cards ago? (2-back)
(function () {
  const CARDS = [
    { s: '🍓', bg: '#ffe0e6' },
    { s: '🍋', bg: '#fff6c9' },
    { s: '🍇', bg: '#efe0ff' },
    { s: '🥝', bg: '#e2f8d8' },
    { s: '🫐', bg: '#dde9ff' },
    { s: '🍊', bg: '#ffe9d4' },
    { s: '🍉', bg: '#ffe3e3' },
    { s: '🍍', bg: '#fff1c4' },
  ];

  NP.register({
    id: 'memory-match',
    name: 'Memory Match',
    icon: '🃏',
    color: '#c77dff',
    tagline: 'Does this shape match the one from 2 cards ago?',
    how: [
      'Two cards are dealt first. Remember them in order.',
      'For every new card: is it the SAME as the card from 2 cards ago?',
      'Watch out — matching the card right before doesn\'t count!',
    ],
    controls: 'Yes / No',
    start(api) {
      api.el('style', null, null, `
        .mm-wrap { position: relative; width: min(58vw, 34vh, 250px); aspect-ratio: 3/4; }
        .mm-card { position: absolute; inset: 0; border-radius: 22px; background: #fff;
          display: flex; align-items: center; justify-content: center; font-size: min(30vw, 17vh, 130px);
          box-shadow: 0 12px 40px rgba(0,0,0,.45); border: 6px solid #fff;
          transition: transform .32s cubic-bezier(.5,0,.75,0), opacity .32s ease; }
        .mm-card .mm-n { position: absolute; top: 8px; left: 12px; font-size: 14px; font-weight: 800; color: rgba(26,18,48,.4); }
        .mm-card.in { animation: mm-in .22s cubic-bezier(.2,.8,.3,1.1); }
        .mm-card.out { transform: translateX(-130%) rotate(-16deg); opacity: 0; }
        @keyframes mm-in { from { transform: translateX(90%) rotate(12deg); opacity: 0; } to { transform: none; opacity: 1; } }
        .mm-trail { display: flex; gap: 8px; margin-top: 18px; align-items: center; height: 44px; }
        .mm-slot { width: 34px; height: 44px; border-radius: 8px; background: rgba(255,255,255,.08);
          border: 2px dashed rgba(255,255,255,.25); display: flex; align-items: center; justify-content: center;
          font-size: 13px; color: rgba(255,255,255,.55); font-weight: 800; }
        .mm-slot.now { border-style: solid; border-color: #c77dff; color: #c77dff; }
        .mm-arrow { color: rgba(255,255,255,.4); font-size: 14px; }
      `);
      const wrap = api.el('div', 'mm-wrap');
      const trail = api.el('div', 'mm-trail');
      api.el('div', 'mm-slot', trail, '?');
      api.el('span', 'mm-arrow', trail, '→');
      api.el('div', 'mm-slot', trail, '?');
      api.el('span', 'mm-arrow', trail, '→');
      api.el('div', 'mm-slot now', trail, 'now');

      const hist = [];
      let cardEl = null;
      let n = 0;
      let level = 1;
      let run = 0;

      const show = (c) => {
        if (cardEl) {
          const old = cardEl;
          old.classList.remove('in');
          old.classList.add('out');
          api.after(340, () => old.remove());
        }
        n++;
        const e = api.el('div', 'mm-card in', wrap);
        e.style.background = c.bg;
        api.el('span', 'mm-n', e, '#' + n);
        api.el('span', null, e, c.s);
        cardEl = e;
      };

      const deal = (warmup) => {
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
        show(c);
      };

      const yn = api.yesNo((yes) => {
        const match = hist[hist.length - 1] === hist[hist.length - 3];
        const ok = yes === match;
        api.answer(ok, 50 + (level - 1) * 10);
        if (ok) { if (++run >= 5) { run = 0; level = Math.min(6, level + 1); } }
        else { run = 0; level = Math.max(1, level - 1); }
        api.status('Level ' + level + ' · same as 2 cards ago?');
        deal();
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
