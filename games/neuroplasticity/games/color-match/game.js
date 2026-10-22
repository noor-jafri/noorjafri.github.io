// Color Match — does the left word's MEANING match the right word's INK color?
(function () {
  const COLORS = [
    { name: 'RED', ink: '#cf3f3f' },
    { name: 'BLUE', ink: '#2f68c4' },
    { name: 'GREEN', ink: '#2c8f58' },
    { name: 'YELLOW', ink: '#e0a81e' },
    { name: 'PURPLE', ink: '#7b4fc0' },
    { name: 'ORANGE', ink: '#e8742a' },
  ];
  const NEUTRAL = '#2b3240';

  NP.register({
    id: 'color-match',
    name: 'Color Match',
    icon: '🎨',
    art: '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<g transform="rotate(-8 22 34)"><rect x="6" y="14" width="30" height="38" rx="6" fill="#1d2434" opacity=".18" transform="translate(1.5 2.5)"/><rect x="6" y="14" width="30" height="38" rx="6" fill="#fff"/>' +
      '<rect x="12" y="31" width="18" height="5" rx="2.5" fill="#cf3f3f"/></g>' +
      '<g transform="rotate(8 42 34)"><rect x="28" y="14" width="30" height="38" rx="6" fill="#1d2434" opacity=".18" transform="translate(1.5 2.5)"/><rect x="28" y="14" width="30" height="38" rx="6" fill="#f6f7f9"/>' +
      '<rect x="34" y="31" width="18" height="5" rx="2.5" fill="#2f68c4"/></g></svg>',
    color: '#8a7fc4',
    bg: ['#3a3f5c', '#22253a'],
    tagline: "Does the left word's meaning match the right word's ink color?",
    how: [
      'LEFT card: read what the word SAYS.',
      'RIGHT card: look at the INK color (ignore the word).',
      'Yes if they are the same color, No if not.',
    ],
    controls: 'Yes / No',
    start(api) {
      const row = api.el('div', 'cm-row');
      const colL = api.el('div', 'cm-col', row);
      const colR = api.el('div', 'cm-col', row);
      const lblL = api.el('div', 'cm-lbl', colL);
      lblL.innerHTML = 'Meaning';
      const cardL = api.el('div', 'cm-card', api.el('div', 'cm-float', colL));
      const lblR = api.el('div', 'cm-lbl', colR);
      lblR.innerHTML = 'Ink color';
      const cardR = api.el('div', 'cm-card', api.el('div', 'cm-float', colR));
      const q = api.el('div', 'cm-q');
      q.innerHTML = 'Does the <b>left meaning</b> match the <b>right ink</b>?';

      let level = 0;
      let run = 0;
      let match = false;

      const other = (c) => api.pick(COLORS.filter((x) => x !== c));

      const deal = () => {
        const meaning = api.pick(COLORS);
        match = Math.random() < 0.5;
        const rInk = match ? meaning : other(meaning);
        // Right word text: same as its ink early on, then conflicting (Stroop)
        let rWord = rInk;
        if (level >= 1) rWord = Math.random() < 0.75 ? other(rInk) : rInk;
        // Trap: right WORD says the left meaning while ink differs
        if (level >= 3 && !match && Math.random() < 0.4) rWord = meaning;
        // Left ink: neutral early, then colored (distracting)
        let lInk = NEUTRAL;
        if (level >= 2) lInk = (Math.random() < 0.7 ? other(meaning) : meaning).ink;

        cardL.style.color = lInk;
        cardR.style.color = rInk.ink;
        [cardL, cardR].forEach((c) => {
          c.textContent = '';
          c.classList.remove('in');
          void c.offsetWidth;
          c.classList.add('in');
        });
        cardL.appendChild(document.createElement('span')).textContent = meaning.name;
        cardR.appendChild(document.createElement('span')).textContent = rWord.name;
      };

      const lvlText = () => api.status('Level ' + (level + 1));

      api.yesNo((yes) => {
        const ok = yes === match;
        api.answer(ok, 50 + level * 10, row);
        row.classList.remove('good', 'bad');
        void row.offsetWidth;
        row.classList.add(ok ? 'good' : 'bad');
        if (ok) {
          run++;
          if (run >= 4) { run = 0; if (level < 5) { level++; api.sfx('level'); } }
        } else {
          run = 0;
          level = Math.max(0, level - 1);
        }
        lvlText();
        deal();
      });
      deal();
      lvlText();
      api.timer(45);
    },
  });
})();
