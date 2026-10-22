// Brain Shift — top card: is the number even? bottom card: is the letter a vowel?
(function () {
  const VOWELS = ['A', 'E', 'I', 'U'];
  const CONSONANTS = ['G', 'K', 'M', 'R', 'S', 'T'];

  NP.register({
    id: 'brain-shift',
    name: 'Brain Shift',
    icon: '🔀',
    color: '#4da3ff',
    tagline: 'Top card: is the number even? Bottom card: is the letter a vowel?',
    how: [
      'A card with a letter and a number (like "A7") lands in the top or bottom half.',
      'TOP half → is the NUMBER even?',
      'BOTTOM half → is the LETTER a vowel?',
      'Fast answers score more. Streaks grow your multiplier.',
    ],
    controls: 'Yes / No',
    start(api) {
      api.el('style', null, null, `
        .bs-frame { position: relative; width: min(86vw, 360px); height: min(100%, 520px, 130vw);
          display: flex; flex-direction: column; border-radius: 24px; overflow: hidden;
          border: 2px solid rgba(255,255,255,.16); box-shadow: 0 14px 40px rgba(0,0,0,.35); }
        .bs-half { position: relative; flex: 1; display: flex; align-items: center; justify-content: center; }
        .bs-top { background: linear-gradient(180deg, rgba(77,163,255,.28), rgba(77,163,255,.12)); }
        .bs-bot { background: linear-gradient(180deg, rgba(255,159,67,.12), rgba(255,159,67,.28));
          border-top: 2px dashed rgba(255,255,255,.22); }
        .bs-label { position: absolute; left: 0; right: 0; text-align: center; font-weight: 800;
          font-size: clamp(14px, 4.2vw, 18px); letter-spacing: .02em; transition: opacity .4s ease; pointer-events: none; }
        .bs-top .bs-label { top: 12px; color: #9ccaff; }
        .bs-bot .bs-label { bottom: 12px; color: #ffc48a; }
        .bs-frame.dim .bs-label { opacity: .35; }
        .bs-card { width: min(44vw, 170px); height: min(26vw, 100px, 70%); border-radius: 18px; background: #fff;
          display: flex; align-items: center; justify-content: center; gap: .08em;
          font-size: min(14vw, 60px); font-weight: 900; color: #241a42; letter-spacing: .04em;
          box-shadow: 0 10px 28px rgba(0,0,0,.4); visibility: hidden; }
        .bs-card .bs-n { color: #2b6fd6; }
        .bs-card .bs-l { color: #e0702a; }
        .bs-card.in { visibility: visible; animation: bs-in .2s cubic-bezier(.2,1.4,.5,1); }
        .bs-card.out-good { visibility: visible; animation: bs-good .16s ease-in forwards; }
        .bs-card.out-bad { visibility: visible; animation: bs-bad .22s ease-in-out forwards; }
        @keyframes bs-in { from { transform: scale(.4) rotate(-6deg); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes bs-good { to { transform: scale(.85); opacity: 0; } }
        @keyframes bs-bad { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
      `);

      const frame = api.el('div', 'bs-frame');
      const top = api.el('div', 'bs-half bs-top', frame);
      const bot = api.el('div', 'bs-half bs-bot', frame);
      api.el('div', 'bs-label', top, '▲ Number even?');
      api.el('div', 'bs-label', bot, '▼ Letter vowel?');
      const card = api.el('div', 'bs-card', top);

      let level = 0;        // 0..6
      let good = 0;         // correct answers since the last level change
      let cur = null;       // { letter, num, top }
      let shownAt = 0;

      const makeCard = () => {
        // higher levels switch halves more often (task switching is the hard part)
        const switchP = 0.35 + level * 0.06;
        const isTop = cur ? (Math.random() < switchP ? !cur.top : cur.top) : Math.random() < 0.5;
        const letter = Math.random() < 0.5 ? api.pick(VOWELS) : api.pick(CONSONANTS);
        const num = 2 + api.rand(8); // 2..9
        return { letter, num, top: isTop };
      };

      const deal = () => {
        let next = makeCard();
        // avoid exact repeats
        if (cur && next.letter === cur.letter && next.num === cur.num) next = makeCard();
        cur = next;
        card.innerHTML = '';
        api.el('span', 'bs-l', card, cur.letter);
        api.el('span', 'bs-n', card, String(cur.num));
        (cur.top ? top : bot).appendChild(card);
        card.className = 'bs-card';
        void card.offsetWidth;
        card.classList.add('in');
        shownAt = performance.now();
      };

      const truth = () => (cur.top ? cur.num % 2 === 0 : VOWELS.indexOf(cur.letter) >= 0);
      const showLevel = () => {
        frame.classList.toggle('dim', level >= 4);
        api.status('Level ' + (level + 1) + (level >= 4 ? ' · labels fading' : ''));
      };

      let busy = false;
      const yn = api.yesNo((yes) => {
        if (busy || !cur) return;
        const ok = yes === truth();
        const rt = (performance.now() - shownAt) / 1000;
        // faster answers are worth more: 30..70 base points
        const base = Math.round(30 + 40 * Math.max(0, Math.min(1, 1 - (rt - 0.5) / 2.5)));
        api.answer(ok, base);
        if (ok) {
          good++;
          if (good >= 5 && level < 6) { level++; good = 0; api.sfx('level'); showLevel(); }
        } else {
          good = 0;
          if (level > 0) { level--; showLevel(); }
        }
        busy = true;
        card.className = 'bs-card ' + (ok ? 'out-good' : 'out-bad');
        api.after(ok ? 140 : 260, () => { busy = false; deal(); });
      });

      yn.enable(false);
      api.status('Get ready…');
      api.after(700, () => {
        showLevel();
        deal();
        yn.enable(true);
        api.timer(45);
      });
    },
  });
})();
