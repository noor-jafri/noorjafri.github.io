// Tic Tac Toe — classic X and O vs the CPU (Easy / Hard) or 2 players.
(function () {
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const MODES = [
    { id: 'easy', label: 'CPU Easy', icon: 'easy', sub: 'Relaxed, makes mistakes' },
    { id: 'hard', label: 'CPU Hard', icon: 'hard', sub: 'Perfect play, unbeatable' },
    { id: 'duo', label: '2 Players', icon: 'duo', sub: 'Pass the phone' },
  ];

  const X_SVG = '<svg viewBox="0 0 100 100" class="tt-mk tt-x"><path pathLength="1" d="M27 27L73 73"/><path pathLength="1" d="M73 27L27 73"/></svg>';
  const O_SVG = '<svg viewBox="0 0 100 100" class="tt-mk tt-o"><circle pathLength="1" cx="50" cy="50" r="25" transform="rotate(-90 50 50)"/></svg>';
  const MODE_ICON = {
    easy: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#5fb8b0" opacity=".18"/><path d="M13 13l8 8M21 13l-8 8" stroke="#5fb8b0" stroke-width="3.2" stroke-linecap="round" fill="none"/><circle cx="25" cy="25" r="5.5" stroke="#e58a73" stroke-width="3" fill="none" opacity=".55"/></svg>',
    hard: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#e58a73" opacity=".18"/><rect x="11" y="13" width="18" height="15" rx="5" fill="#e58a73"/><rect x="18.5" y="8" width="3" height="5" rx="1.5" fill="#e58a73"/><circle cx="16.5" cy="20.5" r="2" fill="#2a3450"/><circle cx="23.5" cy="20.5" r="2" fill="#2a3450"/></svg>',
    duo: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#a9b6d6" opacity=".18"/><circle cx="15" cy="16" r="4" fill="#5fb8b0"/><path d="M8 29c0-5 3-8 7-8s7 3 7 8z" fill="#5fb8b0"/><circle cx="25.5" cy="16" r="4" fill="#e58a73"/><path d="M18.5 29c0-5 3-8 7-8s7 3 7 8z" fill="#e58a73"/></svg>',
  };
  const ART = '<svg viewBox="0 0 64 64">' +
    '<defs><linearGradient id="tti-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4866"/><stop offset="1" stop-color="#28324b"/></linearGradient></defs>' +
    '<rect x="2" y="2" width="60" height="60" rx="16" fill="url(#tti-bg)"/>' +
    '<g fill="#cfd7ea" opacity=".35"><rect x="24.5" y="11" width="2.6" height="42" rx="1.3"/><rect x="36.9" y="11" width="2.6" height="42" rx="1.3"/>' +
    '<rect x="11" y="24.5" width="42" height="2.6" rx="1.3"/><rect x="11" y="36.9" width="42" height="2.6" rx="1.3"/></g>' +
    '<g stroke="#5fb8b0" stroke-width="3.4" stroke-linecap="round"><path d="M14 14l6 6M20 14l-6 6"/><path d="M42 42l6 6M48 42l-6 6"/></g>' +
    '<circle cx="32" cy="32" r="4" fill="none" stroke="#e58a73" stroke-width="3.2"/>' +
    '<circle cx="45" cy="19" r="4" fill="none" stroke="#e58a73" stroke-width="3.2"/>' +
    '</svg>';

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
    art: ART,
    color: '#5fb8b0',
    bg: ['#34415f', '#1d2438'],
    tagline: 'Classic X and O — vs the CPU (Easy or Hard) or 2 players',
    how: [
      'Pick a mode: CPU Easy, CPU Hard, or 2 Players.',
      'Get three in a row: across, down or diagonal.',
      'Vs the CPU you are X. Who starts alternates every round.',
    ],
    controls: 'Tap a square',
    noScore: true,
    start(api) {

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
            c.innerHTML = v ? (v === 'X' ? X_SVG : O_SVG) : '';
            c.dataset.v = v || '';
          }
          c.className = 'tt-cell' + (v ? ' ' + v : '');
        });
        boardEl.classList.toggle('turn-X', !over && turn === 'X');
        boardEl.classList.toggle('turn-O', !over && turn === 'O' && !vsCpu());
        renderTally();
      }

      function showPicker() {
        mode = null;
        over = true;
        api.status('Choose a mode');
        if (pick) pick.remove();
        pick = api.el('div', 'tt-pick');
        api.el('h3', null, pick, 'Choose a mode');
        boardEl.classList.remove('turn-X', 'turn-O');
        MODES.forEach((m) => {
          const b = api.el('button', 'tt-mode', pick);
          const t = tallies[m.id];
          b.innerHTML = '<span class="i"></span><span><b></b><small></small></span>' +
            (t.rounds ? '<span class="t">X ' + t.X + ' · O ' + t.O + '<br>Draws ' + t.D + '</span>' : '');
          b.querySelector('.i').innerHTML = MODE_ICON[m.icon];
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
        api.buttons([{ label: 'Change mode', onClick: showPicker }]);
        prompt();
      }

      function prompt() {
        if (vsCpu()) {
          if (turn === 'X') api.status((mode === 'hard' ? 'CPU Hard' : 'CPU Easy') + ' · Your move (X)');
          else { api.status('CPU is thinking'); msg.innerHTML = '<span class="tt-dots"><i></i><i></i><i></i></span>'; cpuMove(); }
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
          msg.textContent = '';
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
          msg.textContent = vsCpu() ? (r.p === 'X' ? 'You win!' : 'CPU wins') : who + ' wins!';
          api.status(vsCpu() && r.p === 'O' ? 'Better luck next round' : 'Three in a row!');
          cells.forEach((c, i) => c.classList.add(r.line.includes(i) ? 'win' : 'dim'));
          drawLine(r.line);
          const mid = api.fx.at(cells[r.line[1]]);
          if (!(vsCpu() && r.p === 'O')) api.fx.burst(mid.x, mid.y, r.p === 'X' ? '#5fb8b0' : '#e58a73', 10);
          (r.p === 'X' ? tX : tO).classList.add('bump');
          if (vsCpu() && r.p === 'O') { api.sfx('bad'); api.vibrate(60); } else api.sfx('level');
        }
        renderTally();
        api.after(600, () => [tX, tO, tD].forEach((e) => e.classList.remove('bump')));
        boardEl.classList.remove('turn-X', 'turn-O');
        api.buttons([
          { label: 'Change mode', onClick: showPicker },
          { label: 'Play again', cls: 'primary', onClick: newRound },
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
