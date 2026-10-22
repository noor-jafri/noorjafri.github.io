// Memory Grid — remember which tiles lit up, then tap them (Memory Matrix style).
(function () {
  const ROUNDS = 12;
  const gridFor = (k) => (k <= 3 ? 3 : k <= 5 ? 4 : k <= 8 ? 5 : k <= 12 ? 6 : 7);

  NP.register({
    id: 'memory-grid',
    name: 'Memory Grid',
    icon: '🟦',
    art: '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="mg-art-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd6c9"/><stop offset="1" stop-color="#4fb3a6"/></linearGradient></defs>' +
      '<rect x="5" y="5" width="54" height="54" rx="13" fill="#3a4a5e"/>' +
      [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
        const on = [0, 4, 5, 7].indexOf(i) >= 0;
        return '<rect x="' + (11 + (i % 3) * 15) + '" y="' + (11 + Math.floor(i / 3) * 15) + '" width="12" height="12" rx="3" fill="' + (on ? 'url(#mg-art-t)' : '#566a82') + '"/>';
      }).join('') + '</svg>',
    color: '#5fb8ad',
    bg: ['#344457', '#1d2734'],
    tagline: 'Remember which tiles lit up, then tap them',
    how: [
      'Some tiles light up for a moment. Memorize them.',
      'When they go dark, tap every tile that was lit.',
      'Get them all → more tiles next round. One wrong tap ends the round.',
      '12 rounds. Perfect rounds earn a bonus.',
    ],
    controls: 'Tap',
    start(api) {
      const board = api.el('div', 'mg-board');
      const msg = api.el('div', 'mg-msg');

      let round = 0;
      let k = 3;
      let maxK = 3;
      let perfects = 0;
      let tiles = [];
      let targets = new Set();
      let found = new Set();
      let phase = 'idle';
      let n = 3;

      const size = () => {
        const r = api.stage.getBoundingClientRect();
        const s = Math.max(180, Math.min(r.width - 32, r.height - 70, 520));
        board.style.width = board.style.height = s + 'px';
        board.style.gap = Math.max(4, Math.round(s / (n * 9))) + 'px';
      };
      api.on(window, 'resize', size);

      function newRound() {
        round++;
        n = gridFor(k);
        api.status('Round ' + round + '/' + ROUNDS + ' · ' + k + ' tiles · memorize!');
        msg.textContent = 'Memorize';
        msg.className = 'mg-msg';
        phase = 'show';
        board.classList.remove('rot', 'input', 'clear');
        board.style.transform = 'none';
        board.innerHTML = '';
        board.style.gridTemplateColumns = 'repeat(' + n + ', 1fr)';
        board.style.gridTemplateRows = 'repeat(' + n + ', 1fr)';
        size();
        tiles = [];
        for (let i = 0; i < n * n; i++) {
          const t = api.el('button', 'mg-tile in', board);
          t.style.animationDelay = (i * 12) + 'ms';
          api.on(t, 'pointerdown', (e) => { e.preventDefault(); tap(i); });
          tiles.push(t);
        }
        targets = new Set(api.shuffle(tiles.map((_, i) => i)).slice(0, k));
        found = new Set();
        const showMs = Math.min(2400, 1200 + 90 * k);
        api.after(420 + n * n * 12, () => {
          tiles.forEach((x) => { x.classList.remove('in'); x.style.animationDelay = '0ms'; });
          [...targets].forEach((i, j) => { tiles[i].style.animationDelay = (j * 25) + 'ms'; tiles[i].classList.add('lit'); });
          api.sfx('tap');
          api.after(showMs, () => {
            targets.forEach((i) => { tiles[i].classList.remove('lit'); tiles[i].classList.add('off'); });
            const rotate = k >= 6 && Math.random() < 0.5;
            if (rotate) {
              board.classList.add('rot');
              void board.offsetWidth;
              board.style.transform = 'rotate(' + (Math.random() < 0.5 ? 90 : -90) + 'deg)';
              api.after(650, goInput);
            } else {
              api.after(150, goInput);
            }
          });
        });
      }

      function goInput() {
        phase = 'input';
        board.classList.add('input');
        msg.textContent = 'Your turn';
        api.status('Round ' + round + '/' + ROUNDS + ' · tap the ' + k + ' tiles');
      }

      function tap(i) {
        if (phase !== 'input' || found.has(i)) return;
        const t = tiles[i];
        t.style.animationDelay = '0ms';
        if (targets.has(i)) {
          found.add(i);
          t.classList.add('hit');
          api.answer(true, 10, t);
          if (found.size === targets.size) {
            phase = 'done';
            perfects++;
            const bonus = 25 * k;
            api.addScore(bonus);
            api.sfx('level');
            msg.textContent = 'Perfect  +' + bonus;
            msg.className = 'mg-msg good';
            board.classList.add('clear');
            const c = api.fx.at(board);
            api.fx.burst(c.x, c.y, '#7fd6c9', 16);
            maxK = Math.max(maxK, k);
            k = Math.min(20, k + 1);
            next(900);
          }
        } else {
          phase = 'done';
          t.classList.add('miss');
          api.answer(false, 0, t);
          targets.forEach((j) => { if (!found.has(j)) tiles[j].classList.add('reveal'); });
          msg.textContent = 'Here they were';
          msg.className = 'mg-msg bad';
          k = Math.max(3, k - 1);
          next(1600);
        }
      }

      function next(ms) {
        api.after(ms, () => {
          if (round >= ROUNDS) {
            api.end('Most tiles remembered: ' + maxK + ' · ' + perfects + '/' + ROUNDS + ' perfect rounds');
          } else {
            newRound();
          }
        });
      }

      api.after(50, newRound);
    },
  });
})();
