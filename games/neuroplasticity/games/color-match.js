// Color Match — does the left word's MEANING match the right word's INK color?
(function () {
  const COLORS = [
    { name: 'RED', ink: '#e53935' },
    { name: 'BLUE', ink: '#1e66f5' },
    { name: 'GREEN', ink: '#1f9d55' },
    { name: 'YELLOW', ink: '#e6b400' },
    { name: 'PURPLE', ink: '#8e3bd6' },
    { name: 'ORANGE', ink: '#ff6a00' },
  ];
  const NEUTRAL = '#2a2340';

  NP.register({
    id: 'color-match',
    name: 'Color Match',
    icon: '🎨',
    color: '#c77dff',
    tagline: "Does the left word's meaning match the right word's ink color?",
    how: [
      'LEFT card: read what the word SAYS.',
      'RIGHT card: look at the INK color (ignore the word).',
      'Yes if they are the same color, No if not.',
    ],
    controls: 'Yes / No',
    start(api) {
      api.el('style', null, null, `
        .cm-row { display: flex; gap: min(4vw, 18px); width: 100%; max-width: 460px; justify-content: center; }
        .cm-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px; min-width: 0; }
        .cm-lbl { font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #a99fd0;
          background: rgba(255,255,255,.06); padding: 6px 12px; border-radius: 999px; white-space: nowrap; }
        .cm-lbl b { color: #ffcc4d; }
        .cm-card { width: 100%; aspect-ratio: 4/5; max-height: min(52vh, 300px); border-radius: 22px; background: #fff;
          display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 40px rgba(0,0,0,.4);
          font-weight: 900; font-size: min(8.4vw, 40px); letter-spacing: .02em; }
        .cm-card.in { animation: cm-in .2s ease-out both; }
        .cm-col:nth-child(2) .cm-card.in { animation-delay: .04s; }
        @keyframes cm-in { from { transform: translateY(18px) scale(.92); opacity: 0; } to { transform: none; opacity: 1; } }
        .cm-q { margin-top: 18px; color: #a99fd0; font-size: 14px; text-align: center; }
        .cm-q b { color: #f2eeff; }
      `);

      const row = api.el('div', 'cm-row');
      const colL = api.el('div', 'cm-col', row);
      const colR = api.el('div', 'cm-col', row);
      const lblL = api.el('div', 'cm-lbl', colL);
      lblL.innerHTML = 'Word <b>meaning</b>';
      const cardL = api.el('div', 'cm-card', colL);
      const lblR = api.el('div', 'cm-lbl', colR);
      lblR.innerHTML = '<b>Ink</b> color';
      const cardR = api.el('div', 'cm-card', colR);
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

        cardL.textContent = meaning.name;
        cardL.style.color = lInk;
        cardR.textContent = rWord.name;
        cardR.style.color = rInk.ink;
        [cardL, cardR].forEach((c) => { c.classList.remove('in'); void c.offsetWidth; c.classList.add('in'); });
      };

      const lvlText = () => api.status('Level ' + (level + 1));

      api.yesNo((yes) => {
        const ok = yes === match;
        api.answer(ok, 50 + level * 10);
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
