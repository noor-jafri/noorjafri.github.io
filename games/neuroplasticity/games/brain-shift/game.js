// Brain Shift — top card: is the number even? bottom card: is the letter a vowel?
(function () {
  const VOWELS = ['A', 'E', 'I', 'U'];
  const CONSONANTS = ['G', 'K', 'M', 'R', 'S', 'T'];

  const ART = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><clipPath id="bsArtClip"><rect x="6" y="6" width="52" height="52" rx="12"/></clipPath></defs>' +
    '<g clip-path="url(#bsArtClip)"><rect x="6" y="6" width="52" height="26" fill="#6f8fb3"/>' +
    '<rect x="6" y="32" width="52" height="26" fill="#d4a47c"/><rect x="6" y="31.3" width="52" height="1.4" fill="#fff" opacity=".6"/></g>' +
    '<rect x="17" y="10" width="30" height="18" rx="4" fill="#fbfaf7"/>' +
    '<text x="32" y="24" text-anchor="middle" font-family="-apple-system, Helvetica, Arial, sans-serif" font-weight="700" font-size="12"><tspan fill="#c4774a">A</tspan><tspan fill="#4a6b93">7</tspan></text>' +
    '<rect x="17" y="36" width="30" height="18" rx="4" fill="#fbfaf7" opacity=".35"/>' +
    '</svg>';

  NP.register({
    id: 'brain-shift',
    name: 'Brain Shift',
    icon: '🔀',
    art: ART,
    color: '#6f8fb3',
    bg: ['#3d4c66', '#232a3b'],
    tagline: 'Top card: is the number even? Bottom card: is the letter a vowel?',
    how: [
      'A card with a letter and a number (like "A7") lands in the top or bottom half.',
      'TOP half → is the NUMBER even?',
      'BOTTOM half → is the LETTER a vowel?',
      'Fast answers score more. Streaks grow your multiplier.',
    ],
    controls: 'Yes / No',
    start(api) {
      const frame = api.el('div', 'bs-frame');
      const top = api.el('div', 'bs-half bs-top', frame);
      const bot = api.el('div', 'bs-half bs-bot', frame);
      for (let i = 0; i < 3; i++) { api.el('i', 'bs-orb', top); api.el('i', 'bs-orb', bot); }
      const tl = api.el('div', 'bs-label', top);
      api.el('span', 'bs-chip', tl, '123');
      api.el('span', null, tl, 'Number even?');
      const bl = api.el('div', 'bs-label', bot);
      api.el('span', 'bs-chip', bl, 'ABC');
      api.el('span', null, bl, 'Letter vowel?');
      api.el('div', 'bs-divider', frame);

      // slot (slides between halves) > breathe (idle) > card (feedback) > inner (flip) > faces
      const slot = api.el('div', 'bs-slot', frame);
      const breathe = api.el('div', 'bs-breathe', slot);
      const card = api.el('div', 'bs-card', breathe);
      const inner = api.el('div', 'bs-inner flipped', card);
      const front = api.el('div', 'bs-face bs-front', inner);
      const back = api.el('div', 'bs-face bs-back', inner);
      api.el('div', 'bs-back-logo', back);
      const cTL = api.el('div', 'bs-corner tl', front);
      const cBR = api.el('div', 'bs-corner br', front);
      const big = api.el('div', 'bs-big', front);
      const bigL = api.el('span', 'bs-l', big);
      const bigN = api.el('span', 'bs-n', big);

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

      // inner is showing its back when this runs: swap the face, slide, flip up
      const deal = () => {
        let next = makeCard();
        if (cur && next.letter === cur.letter && next.num === cur.num) next = makeCard();
        cur = next;
        bigL.textContent = cur.letter;
        bigN.textContent = String(cur.num);
        cTL.textContent = cur.letter + cur.num;
        cBR.textContent = cur.letter + cur.num;
        slot.classList.toggle('bot', !cur.top);
        top.classList.toggle('on', cur.top);
        bot.classList.toggle('on', !cur.top);
        card.className = 'bs-card';
        inner.classList.remove('flipped');
        shownAt = performance.now() + 120; // count from when the face is readable
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
        const rt = Math.max(0, (performance.now() - shownAt) / 1000);
        // faster answers are worth more: 30..70 base points
        const base = Math.round(30 + 40 * Math.max(0, Math.min(1, 1 - (rt - 0.5) / 2.5)));
        api.answer(ok, base, card);
        if (ok) {
          good++;
          if (good >= 5 && level < 6) { level++; good = 0; api.sfx('level'); showLevel(); }
        } else {
          good = 0;
          if (level > 0) { level--; showLevel(); }
        }
        busy = true;
        card.className = 'bs-card ' + (ok ? 'good' : 'bad');
        // good: flip face-down right away; bad: shake first, then flip
        api.after(ok ? 60 : 300, () => {
          inner.classList.add('flipped');
          api.after(150, () => { busy = false; deal(); });
        });
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
