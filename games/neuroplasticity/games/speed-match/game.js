// Speed Match — does this shape match the one right before it?
// Look (Lumosity-style): plain white cards with one flat symbol on a muted slate table, dealt from a deck;
// judged cards flip face-down onto a discard pile.
(function () {
  // Glossy shape geometry (viewBox 0 0 100 100)
  const GEO = {
    circle: '<circle cx="50" cy="50" r="36"/>',
    triangle: '<path d="M50 12 L90 84 L10 84 Z"/>',
    square: '<rect x="15" y="15" width="70" height="70" rx="12"/>',
    star: '<path d="M50 8 L62 37 L93 39 L69 59 L77 90 L50 73 L23 90 L31 59 L7 39 L38 37 Z"/>',
    diamond: '<path d="M50 6 L88 50 L50 94 L12 50 Z"/>',
    cross: '<path d="M37 10h26v27h27v26H63v27H37V63H10V37h27z"/>',
  };
  // Calm, slightly desaturated accents
  const SHAPES = [
    { k: 'circle', c: '#e07a5f' },
    { k: 'triangle', c: '#4f7cac' },
    { k: 'square', c: '#6fa58a' },
    { k: 'star', c: '#d9a441' },
    { k: 'diamond', c: '#8e6c9e' },
    { k: 'cross', c: '#3f8f8c' },
  ];

  const flat = (s) =>
    '<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="' + s.c + '" stroke="' + s.c + '" stroke-width="4" stroke-linejoin="round">' + GEO[s.k] + '</g></svg>';

  const ART =
    '<svg viewBox="0 0 64 64">' +
    '<rect x="9" y="13" width="28" height="38" rx="5" fill="#d7dde3" transform="rotate(-10 23 32)"/>' +
    '<rect x="25" y="10" width="30" height="42" rx="5" fill="#fff" transform="rotate(6 40 31)"/>' +
    '<circle cx="40" cy="31" r="9" fill="#e07a5f"/>' +
    '</svg>';

  NP.register({
    id: 'speed-match',
    name: 'Speed Match',
    icon: '⚡',
    art: ART,
    color: '#e07a5f',
    bg: ['#34505f', '#1a2731'],
    tagline: 'Does this shape match the one right before it?',
    how: [
      'A card appears. Remember it.',
      'For every new card: is it the SAME shape as the card right before it?',
      'Answer fast. Streaks grow your multiplier.',
    ],
    controls: 'Yes / No',
    start(api) {
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const felt = api.el('div', 'sm-felt');
      felt.innerHTML = '<i class="sm-spot"></i>';
      const table = api.el('div', 'sm-table');
      const play = api.el('div', 'sm-play', table);
      const piles = api.el('div', 'sm-piles', table);
      const discardWrap = api.el('div', 'sm-pilewrap', piles);
      const discard = api.el('div', 'sm-pile', discardWrap);
      api.el('small', null, discardWrap, 'previous');
      const deckWrap = api.el('div', 'sm-pilewrap', piles);
      const deck = api.el('div', 'sm-pile sm-deck', deckWrap);
      api.el('small', null, deckWrap, 'deck');
      for (let i = 0; i < 5; i++) {
        const b = api.el('div', 'sm-mini', deck);
        b.style.transform = 'translate(' + -i * 1.5 + 'px,' + -i * 2.5 + 'px)';
      }

      let prev = null;
      let cur = null;
      let curEl = null;
      let pileN = 0;

      const center = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      };
      const offsetTo = (el) => {
        const a = center(el), b = center(play);
        return { x: a.x - b.x, y: a.y - b.y };
      };

      const makeCard = (s) => {
        const c = api.el('div', 'sm-card', play);
        const inner = api.el('div', 'sm-inner', c);
        const front = api.el('div', 'sm-face sm-front', inner);
        front.innerHTML = '<span class="sm-big">' + flat(s) + '</span>';
        api.el('div', 'sm-face sm-back', inner);
        return c;
      };

      const toPile = () => {
        const m = api.el('div', 'sm-mini', discard);
        const rot = (Math.random() * 8 - 4).toFixed(1);
        const k = Math.min(pileN, 6);
        m.style.transform = 'translate(' + (Math.random() * 6 - 3).toFixed(1) + 'px,' + -k * 2 + 'px) rotate(' + rot + 'deg)';
        pileN++;
        while (discard.children.length > 7) discard.firstChild.remove();
        [...discard.children].forEach((ch, i, a) => { ch.style.zIndex = i; ch.style.filter = 'brightness(' + (0.7 + 0.3 * (i / Math.max(1, a.length - 1))) + ')'; });
      };

      const throwAway = (el, verdict) => {
        if (!el) return;
        const o = offsetTo(discard);
        const rot = Math.random() * 10 - 5;
        if (verdict) el.classList.add(verdict);
        const T = (x, y, s, ry, r) => 'translate(' + x + 'px,' + y + 'px) scale(' + s + ') rotateY(' + ry + 'deg) rotate(' + r + 'deg)';
        const frames = verdict === 'bad'
          ? [
            { transform: T(0, 0, 1, 0, 0) },
            { transform: T(-7, 0, 1, 0, 0), offset: 0.1 },
            { transform: T(6, 0, 1, 0, 0), offset: 0.2 },
            { transform: T(0, 0, 1, 0, 0), offset: 0.3 },
            { transform: T(o.x, o.y, 0.36, 180, rot) },
          ]
          : [
            { transform: T(0, 0, 1, 0, 0) },
            { transform: T(0, 0, 1, 0, 0), offset: verdict ? 0.18 : 0.01 },
            { transform: T(o.x, o.y, 0.36, 180, rot) },
          ];
        el.style.zIndex = 1;
        const dur = verdict === 'bad' ? 520 : verdict ? 420 : 360;
        el.animate(frames, { duration: dur, easing: 'ease-in-out', fill: 'forwards' });
        api.after(dur, () => { el.remove(); toPile(); });
      };

      const deal = () => {
        prev = cur;
        // ~50% chance of a match once there is a previous card
        cur = prev && Math.random() < 0.5 ? prev : api.pick(SHAPES);
        const el = makeCard(cur);
        el.style.zIndex = 2;
        const o = offsetTo(deck);
        deck.classList.remove('lift');
        void deck.offsetWidth;
        deck.classList.add('lift');
        const T = (x, y, s, ry, r) => 'translate(' + x + 'px,' + y + 'px) scale(' + s + ') rotateY(' + ry + 'deg) rotate(' + r + 'deg)';
        el.animate([
          { transform: T(o.x, o.y, 0.36, 180, 4) },
          { transform: T(o.x * 0.35, o.y * 0.35, 0.8, 90, 1), offset: 0.5 },
          { transform: T(0, 0, 1, 0, 0) },
        ], { duration: reduce ? 220 : 300, easing: 'cubic-bezier(.25,.6,.3,1)' });
        curEl = el;
        return el;
      };

      deal();
      api.status('Remember this card…');
      const yn = api.yesNo((yes) => {
        const ok = yes === (cur === prev);
        const old = curEl;
        api.answer(ok, 50, old);
        throwAway(old, ok ? 'good' : 'bad');
        deal();
      });
      yn.enable(false);
      api.after(1200, () => {
        api.status('Does it match the previous card?');
        throwAway(curEl, null);
        deal();
        yn.enable(true);
        api.timer(45);
      });
    },
  });
})();
