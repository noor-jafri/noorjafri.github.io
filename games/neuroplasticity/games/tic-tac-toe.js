// Tic Tac Toe — classic X and O vs the CPU (Easy / Hard) or 2 players.
(function () {
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const MODES = [
    { id: 'easy', label: 'CPU Easy', icon: '🙂', sub: 'Relaxed — makes mistakes' },
    { id: 'hard', label: 'CPU Hard', icon: '🤖', sub: 'Perfect play — unbeatable' },
    { id: 'duo', label: '2 Players', icon: '👥', sub: 'Pass the phone' },
  ];

  function result(b) {
    for (const l of LINES) {
      const v = b[l[0]];
      if (v && v === b[l[1]] && v === b[l[2]]) return { p: v, line: l };
    }
    return b.every(Boolean) ? { p: 'draw' } : null;
  }
  const empties = (b) => b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);

  // Minimax from O's perspective (CPU is always O). Faster wins score higher.
  function mm(b, p, depth) {
    const r = result(b);
    if (r) return r.p === 'draw' ? 0 : r.p === 'O' ? 10 - depth : depth - 10;
    let best = p === 'O' ? -Infinity : Infinity;
    for (const i of empties(b)) {
      b[i] = p;
      const s = mm(b, p === 'O' ? 'X' : 'O', depth + 1);
      b[i] = null;
      best = p === 'O' ? Math.max(best, s) : Math.min(best, s);
    }
    return best;
  }
  function finishing(b, p) {
    for (const l of LINES) {
      const vals = l.map((i) => b[i]);
      if (vals.filter((v) => v === p).length === 2 && vals.includes(null)) return l[vals.indexOf(null)];
    }
    return -1;
  }

  NP.register({
    id: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    icon: '⭕',
    color: '#4da3ff',
    tagline: 'Classic X and O — vs the CPU (Easy or Hard) or 2 players',
    how: [
      'Pick a mode: CPU Easy, CPU Hard, or 2 Players.',
      'Get three in a row — across, down or diagonal.',
      'Vs the CPU you are X. Who starts alternates every round.',
    ],
    controls: 'Tap a square',
    noScore: true,
    start(api) {
      api.el('style', null, null, `
        .tt-wrap { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: min(4vh, 22px); }
        .tt-tally { display: flex; gap: 10px; width: min(88vw, 52vh, 400px); }
        .tt-tally div { flex: 1; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-radius: 14px;
          padding: 8px 4px; text-align: center; transition: transform .2s, background .2s; }
        .tt-tally small { display: block; font-size: 11px; color: #a99fd0; text-transform: uppercase; letter-spacing: .06em; white-space: nowrap; }
        .tt-tally b { font-size: 24px; font-variant-numeric: tabular-nums; }
        .tt-tally .x b { color: #4da3ff; } .tt-tally .o b { color: #ff6b9a; } .tt-tally .d b { color: #ffcc4d; }
        .tt-tally div.turn { background: rgba(255,255,255,.14); transform: translateY(-2px); }
        .tt-tally div.bump { animation: tt-bump .5s ease; }
        @keyframes tt-bump { 40% { transform: scale(1.15); } }
        .tt-board { position: relative; width: min(88vw, 52vh, 400px); aspect-ratio: 1; display: grid;
          grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .tt-cell { border-radius: 18px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
          display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: min(18vw, 11vh, 84px);
          line-height: 1; transition: background .15s, transform .1s; cursor: pointer; }
        .tt-cell:active { transform: scale(.96); }
        .tt-cell.X { color: #4da3ff; text-shadow: 0 0 18px rgba(77,163,255,.6); }
        .tt-cell.O { color: #ff6b9a; text-shadow: 0 0 18px rgba(255,107,154,.6); }
        .tt-cell.X span, .tt-cell.O span { animation: tt-pop .22s cubic-bezier(.3,1.6,.6,1); }
        @keyframes tt-pop { from { transform: scale(.2); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .tt-cell.win { background: rgba(255,204,77,.22); border-color: #ffcc4d; }
        .tt-cell.dim { opacity: .35; }
        .tt-line { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
        .tt-line line { stroke: #ffcc4d; stroke-width: .12; stroke-linecap: round; stroke-dasharray: 4; stroke-dashoffset: 4;
          animation: tt-draw .35s ease-out forwards; filter: drop-shadow(0 0 .08px #fff); }
        @keyframes tt-draw { to { stroke-dashoffset: 0; } }
        .tt-msg { font-size: 22px; font-weight: 800; min-height: 28px; text-align: center; }
        .tt-pick { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 14px; padding: 16px; background: #1a1230; z-index: 2; }
        .tt-pick h3 { font-size: 20px; margin-bottom: 4px; }
        .tt-mode { width: min(88vw, 380px); display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: 18px;
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); text-align: left; transition: transform .1s, background .15s; }
        .tt-mode:active { transform: scale(.97); background: rgba(255,255,255,.16); }
        .tt-mode .i { font-size: 34px; }
        .tt-mode b { display: block; font-size: 18px; }
        .tt-mode small { color: #a99fd0; font-size: 13px; }
        .tt-mode .t { margin-left: auto; font-size: 12px; color: #a99fd0; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
      `);

      const tallies = {}; // mode -> { X, O, D, rounds }
      MODES.forEach((m) => (tallies[m.id] = { X: 0, O: 0, D: 0, rounds: 0 }));

      const wrap = api.el('div', 'tt-wrap');
      const tally = api.el('div', 'tt-tally', wrap);
      const tX = api.el('div', 'x', tally);
      const tD = api.el('div', 'd', tally);
      const tO = api.el('div', 'o', tally);
      const boardEl = api.el('div', 'tt-board', wrap);
      const msg = api.el('div', 'tt-msg', wrap);
      const cells = [];
      for (let i = 0; i < 9; i++) {
        const c = api.el('button', 'tt-cell', boardEl);
        c.setAttribute('aria-label', 'Square ' + (i + 1));
        api.on(c, 'pointerdown', (e) => { e.preventDefault(); humanMove(i); });
        cells.push(c);
      }
      let lineSvg = null;
      let pick = null;

      let mode = null;
      let board = [];
      let turn = 'X';
      let over = true;
      let busy = false;

      const vsCpu = () => mode !== 'duo';
      const name = (p) => (vsCpu() ? (p === 'X' ? 'You' : 'CPU') : 'Player ' + p);

      function renderTally() {
        const t = tallies[mode];
        tX.innerHTML = '<small>' + (vsCpu() ? 'You · X' : 'X wins') + '</small><b>' + t.X + '</b>';
        tD.innerHTML = '<small>Draws</small><b>' + t.D + '</b>';
        tO.innerHTML = '<small>' + (vsCpu() ? 'CPU · O' : 'O wins') + '</small><b>' + t.O + '</b>';
        tX.classList.toggle('turn', !over && turn === 'X');
        tO.classList.toggle('turn', !over && turn === 'O');
      }

      function render() {
        board.forEach((v, i) => {
          const c = cells[i];
          const was = c.dataset.v || '';
          if (was !== (v || '')) {
            c.innerHTML = v ? '<span>' + (v === 'X' ? '✕' : '◯') + '</span>' : '';
            c.dataset.v = v || '';
          }
          c.className = 'tt-cell' + (v ? ' ' + v : '');
        });
        renderTally();
      }

      function showPicker() {
        mode = null;
        over = true;
        api.status('Choose a mode');
        if (pick) pick.remove();
        pick = api.el('div', 'tt-pick');
        api.el('h3', null, pick, 'Choose a mode');
        MODES.forEach((m) => {
          const b = api.el('button', 'tt-mode', pick);
          const t = tallies[m.id];
          b.innerHTML = '<span class="i"></span><span><b></b><small></small></span>' +
            (t.rounds ? '<span class="t">X ' + t.X + ' · O ' + t.O + '<br>Draws ' + t.D + '</span>' : '');
          b.querySelector('.i').textContent = m.icon;
          b.querySelector('b').textContent = m.label;
          b.querySelector('small').textContent = m.sub;
          api.on(b, 'pointerdown', (e) => { e.preventDefault(); api.sfx('tap'); chooseMode(m.id); });
        });
        api.buttons([{ label: 'Done', onClick: finish }]);
      }

      function finish() {
        const played = MODES.filter((m) => tallies[m.id].rounds);
        const note = played.length
          ? played.map((m) => { const t = tallies[m.id]; return m.label + ': X ' + t.X + ' · O ' + t.O + ' · Draws ' + t.D; }).join('   •   ')
          : 'Thanks for playing!';
        api.end(note);
      }

      function chooseMode(id) {
        mode = id;
        if (pick) { pick.remove(); pick = null; }
        newRound();
      }

      function newRound() {
        const t = tallies[mode];
        board = Array(9).fill(null);
        turn = t.rounds % 2 === 0 ? 'X' : 'O';
        over = false;
        busy = false;
        if (lineSvg) { lineSvg.remove(); lineSvg = null; }
        msg.textContent = '';
        render();
        api.buttons([{ label: '↺ Change mode', onClick: showPicker }]);
        prompt();
      }

      function prompt() {
        if (vsCpu()) {
          if (turn === 'X') api.status((mode === 'hard' ? 'CPU Hard' : 'CPU Easy') + ' · Your move (X)');
          else { api.status('CPU is thinking…'); cpuMove(); }
        } else {
          api.status('Player ' + turn + '’s move');
        }
      }

      function humanMove(i) {
        if (over || busy || !mode || board[i]) return;
        if (vsCpu() && turn !== 'X') return;
        place(i);
      }

      function place(i) {
        board[i] = turn;
        api.sfx('tap');
        const r = result(board);
        if (r) { render(); return endRound(r); }
        turn = turn === 'X' ? 'O' : 'X';
        render();
        prompt();
      }

      function cpuMove() {
        busy = true;
        const roundAt = board.slice();
        api.after(380 + api.rand(320), () => {
          if (over || mode == null || board.join() !== roundAt.join()) return;
          busy = false;
          place(mode === 'hard' ? hardMove() : easyMove());
        });
      }

      function easyMove() {
        const win = finishing(board, 'O');
        if (win >= 0 && Math.random() < 0.7) return win;
        const block = finishing(board, 'X');
        if (block >= 0 && Math.random() < 0.35) return block;
        return api.pick(empties(board));
      }

      function hardMove() {
        const free = empties(board);
        if (free.length === 9) return api.pick([0, 2, 4, 6, 8]);
        let best = -Infinity;
        let moves = [];
        for (const i of free) {
          board[i] = 'O';
          const s = mm(board, 'X', 1);
          board[i] = null;
          if (s > best) { best = s; moves = [i]; } else if (s === best) moves.push(i);
        }
        return api.pick(moves);
      }

      function endRound(r) {
        over = true;
        const t = tallies[mode];
        t.rounds++;
        if (r.p === 'draw') {
          t.D++;
          msg.textContent = 'Draw!';
          api.status('Nobody wins this one');
          cells.forEach((c) => c.classList.add('dim'));
          tD.classList.add('bump');
          api.sfx('tap');
        } else {
          t[r.p]++;
          const who = name(r.p);
          msg.textContent = vsCpu() ? (r.p === 'X' ? 'You win! 🎉' : 'CPU wins 🤖') : who + ' wins! 🎉';
          api.status(vsCpu() && r.p === 'O' ? 'Better luck next round' : 'Three in a row!');
          cells.forEach((c, i) => c.classList.add(r.line.includes(i) ? 'win' : 'dim'));
          drawLine(r.line);
          (r.p === 'X' ? tX : tO).classList.add('bump');
          if (vsCpu() && r.p === 'O') { api.sfx('bad'); api.vibrate(60); } else api.sfx('level');
        }
        renderTally();
        api.after(600, () => [tX, tO, tD].forEach((e) => e.classList.remove('bump')));
        api.buttons([
          { label: '↺ Change mode', onClick: showPicker },
          { label: '▶ Play again', cls: 'primary', onClick: newRound },
        ]);
      }

      function drawLine(l) {
        const ns = 'http://www.w3.org/2000/svg';
        lineSvg = document.createElementNS(ns, 'svg');
        lineSvg.setAttribute('class', 'tt-line');
        lineSvg.setAttribute('viewBox', '0 0 3 3');
        const ln = document.createElementNS(ns, 'line');
        const a = l[0], b = l[2];
        const ax = (a % 3) + 0.5, ay = Math.floor(a / 3) + 0.5;
        const bx = (b % 3) + 0.5, by = Math.floor(b / 3) + 0.5;
        // extend a bit beyond the end cells
        const dx = (bx - ax) * 0.18, dy = (by - ay) * 0.18;
        ln.setAttribute('x1', ax - dx); ln.setAttribute('y1', ay - dy);
        ln.setAttribute('x2', bx + dx); ln.setAttribute('y2', by + dy);
        ln.setAttribute('pathLength', '4');
        lineSvg.appendChild(ln);
        boardEl.appendChild(lineSvg);
      }

      // keyboard: 1–9 (top-left to bottom-right) or numpad layout, Enter = play again
      api.onKey((e) => {
        if (e.repeat) return;
        if (/^[1-9]$/.test(e.key)) {
          const n = +e.key - 1;
          humanMove(e.code && e.code.indexOf('Numpad') === 0 ? (2 - Math.floor(n / 3)) * 3 + (n % 3) : n);
        } else if (e.key === 'Enter' && over && mode) newRound();
      });

      board = Array(9).fill(null);
      mode = 'easy';
      render();
      showPicker();
    },
  });
})();
