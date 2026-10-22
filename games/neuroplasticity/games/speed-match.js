// Speed Match — does this shape match the one right before it?
(function () {
  const SHAPES = [
    { s: '●', c: '#ff6b6b' },
    { s: '▲', c: '#4da3ff' },
    { s: '■', c: '#3ddc84' },
    { s: '★', c: '#ffcc4d' },
    { s: '◆', c: '#c77dff' },
    { s: '✚', c: '#ff9f43' },
  ];

  NP.register({
    id: 'speed-match',
    name: 'Speed Match',
    icon: '⚡',
    color: '#ff6b6b',
    tagline: 'Does this shape match the one right before it?',
    how: [
      'A card appears. Remember it.',
      'For every new card: is it the SAME shape as the card right before it?',
      'Answer fast. Streaks grow your multiplier.',
    ],
    controls: 'Yes / No',
    start(api) {
      api.el('style', null, null, `
        .sm-card { width: min(60vw, 260px); aspect-ratio: 3/4; border-radius: 22px; background: #fff;
          display: flex; align-items: center; justify-content: center; font-size: min(36vw, 150px);
          box-shadow: 0 12px 40px rgba(0,0,0,.4); }
        .sm-card.in { animation: sm-in .18s ease-out; }
        @keyframes sm-in { from { transform: translateX(60%) rotate(8deg); opacity: 0; } to { transform: none; opacity: 1; } }
      `);
      const card = api.el('div', 'sm-card');
      let prev = null;
      let cur = null;

      const deal = () => {
        prev = cur;
        // ~50% chance of a match once there is a previous card
        cur = prev && Math.random() < 0.5 ? prev : api.pick(SHAPES);
        card.textContent = cur.s;
        card.style.color = cur.c;
        card.classList.remove('in');
        void card.offsetWidth;
        card.classList.add('in');
      };

      deal();
      api.status('Remember this card…');
      const yn = api.yesNo((yes) => {
        api.answer(yes === (cur === prev));
        deal();
      });
      yn.enable(false);
      api.after(1200, () => {
        api.status('Does it match the previous card?');
        deal();
        yn.enable(true);
        api.timer(45);
      });
    },
  });
})();
