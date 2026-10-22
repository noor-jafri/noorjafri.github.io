// Memory Grid — remember which tiles lit up, then tap them (Memory Matrix style).
(function () {
  const ROUNDS = 12;
  const gridFor = (k) => (k <= 3 ? 3 : k <= 5 ? 4 : k <= 8 ? 5 : k <= 12 ? 6 : 7);

  NP.register({
    id: 'memory-grid',
    name: 'Memory Grid',
    icon: '🟦',
    color: '#4da3ff',
    tagline: 'Remember which tiles lit up, then tap them',
    how: [
      'Some tiles light up for a moment. Memorize them.',
      'When they go dark, tap every tile that was lit.',
      'Get them all → more tiles next round. One wrong tap ends the round.',
      '12 rounds. Perfect rounds earn a bonus.',
    ],
    controls: 'Tap',
    start(api) {
      api.el('style', null, null, `
        .mg-board { display: grid; gap: 8px; padding: 10px; border-radius: 20px;
          background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
          box-shadow: 0 14px 40px rgba(0,0,0,.35); touch-action: none; }
        .mg-board.rot { transition: transform .6s cubic-bezier(.5,0,.3,1); }
        .mg-tile { border-radius: 12px; background: #3a2d6b; border: 0; padding: 0; cursor: pointer;
          transition: background .18s ease, transform .12s ease, box-shadow .18s ease;
          box-shadow: inset 0 -4px 0 rgba(0,0,0,.25); }
        .mg-tile.in { animation: mg-in .3s ease both; }
        @keyframes mg-in { from { transform: scale(.4); opacity: 0; } to { transform: none; opacity: 1; } }
        .mg-tile.lit { background: #4da3ff; box-shadow: 0 0 22px rgba(77,163,255,.75), inset 0 -4px 0 rgba(0,0,0,.2); }
        .mg-tile.hit { background: #3ddc84; box-shadow: 0 0 18px rgba(61,220,132,.6), inset 0 -4px 0 rgba(0,0,0,.2); transform: scale(.94); }
        .mg-tile.miss { background: #ff5c7a; animation: mg-shake .3s ease; }
        .mg-tile.reveal { background: rgba(77,163,255,.35); box-shadow: inset 0 0 0 3px #4da3ff; }
        .mg-board.input .mg-tile:not(.hit):active { transform: scale(.94); }
        @keyframes mg-shake { 0%,100% { transform: none; } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .mg-msg { margin-top: 14px; font-weight: 800; font-size: 18px; min-height: 24px; color: #ffcc4d; text-align: center;
          transition: opacity .2s ease; }
      `);

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
        msg.textContent = '';
        phase = 'show';
        board.classList.remove('rot', 'input');
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
          targets.forEach((i) => tiles[i].classList.add('lit'));
          api.sfx('tap');
          api.after(showMs, () => {
            targets.forEach((i) => tiles[i].classList.remove('lit'));
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
        api.status('Round ' + round + '/' + ROUNDS + ' · tap the ' + k + ' tiles');
      }

      function tap(i) {
        if (phase !== 'input' || found.has(i)) return;
        const t = tiles[i];
        if (targets.has(i)) {
          found.add(i);
          t.classList.add('hit');
          api.answer(true, 10);
          if (found.size === targets.size) {
            phase = 'done';
            perfects++;
            const bonus = 25 * k;
            api.addScore(bonus);
            api.sfx('level');
            msg.textContent = 'Perfect! +' + bonus;
            maxK = Math.max(maxK, k);
            k = Math.min(20, k + 1);
            next(900);
          }
        } else {
          phase = 'done';
          t.classList.add('miss');
          api.answer(false);
          targets.forEach((j) => { if (!found.has(j)) tiles[j].classList.add('reveal'); });
          msg.textContent = 'Missed — here they were';
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
