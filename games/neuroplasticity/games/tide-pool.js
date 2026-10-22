// Tide Pool — pick each treasure exactly once while the tide shuffles them (Tidal Treasures).
(function () {
  const POOL = ['🐚', '🦀', '⭐', '🐠', '🐙', '💎', '🦑', '🐡', '🦞', '🐢', '🪸', '🦐', '🪼', '🐬', '🦪', '🏺', '👑', '🪙'];
  const ROUNDS = 12;
  const LIVES = 3;

  NP.register({
    id: 'tide-pool',
    name: 'Tide Pool',
    icon: '🐚',
    color: '#4dd6c8',
    tagline: 'Pick each treasure once as the tide shuffles them',
    how: [
      'Tap a treasure you have NOT picked yet this round.',
      'After every pick the tide washes in and shuffles the beach.',
      'Pick one twice and the round is over. Pick them all to clear it.',
      'Cleared rounds add treasures. 12 rounds · 3 slips and you are out.',
    ],
    controls: 'Tap',
    start(api) {
      api.el('style', null, null, `
        .tp-info { display: flex; gap: 10px; align-items: center; justify-content: center; margin-bottom: 8px;
          font-size: 14px; color: #d7f6f2; font-weight: 700; min-height: 22px; }
        .tp-info .tp-pill { background: rgba(255,255,255,.1); border-radius: 999px; padding: 3px 12px; }
        .tp-beach { position: relative; width: min(100%, 440px); flex: 1; min-height: 0; max-height: 600px;
          border-radius: 26px; overflow: hidden; touch-action: none;
          background:
            radial-gradient(circle at 20% 70%, rgba(255,255,255,.18) 0 2px, transparent 3px) 0 0 / 38px 38px,
            radial-gradient(circle at 70% 30%, rgba(160,110,40,.25) 0 1.5px, transparent 2.5px) 0 0 / 27px 27px,
            linear-gradient(180deg, #f6dfa4 0%, #ecc97e 55%, #ddb265 100%);
          box-shadow: inset 0 0 0 3px rgba(255,255,255,.15), 0 14px 40px rgba(0,0,0,.35); }
        .tp-sea { position: absolute; left: 0; right: 0; top: 0; height: 9%;
          background: linear-gradient(180deg, #1f7fc4, #3fb7e0); }
        .tp-sea::after { content: ""; position: absolute; left: -10%; right: -10%; bottom: -8px; height: 16px;
          background: radial-gradient(circle at 50% 0, #e9fbff 0 7px, transparent 8px) 0 0 / 22px 16px repeat-x;
          animation: tp-lap 2.6s ease-in-out infinite alternate; }
        @keyframes tp-lap { to { transform: translateX(14px) translateY(3px); } }
        .tp-item { position: absolute; transform: translate(-50%, -50%); line-height: 1; padding: 6px;
          border-radius: 50%; transition: left .5s cubic-bezier(.4,.1,.3,1), top .5s cubic-bezier(.4,.1,.3,1), transform .15s ease;
          filter: drop-shadow(0 4px 3px rgba(80,50,10,.35)); cursor: pointer; }
        .tp-item.tap { transform: translate(-50%, -50%) scale(1.25); }
        .tp-item.new { animation: tp-new .7s ease-out; }
        @keyframes tp-new { from { transform: translate(-50%, -50%) scale(0) rotate(-90deg); } to { transform: translate(-50%, -50%) scale(1); } }
        .tp-item.dup { background: rgba(255,92,122,.55); box-shadow: 0 0 0 4px #ff5c7a; animation: tp-shake .4s ease; }
        .tp-item.was { background: rgba(255,255,255,.55); box-shadow: 0 0 0 3px rgba(61,220,132,.9); }
        @keyframes tp-shake { 0%,100% { transform: translate(-50%,-50%); } 25% { transform: translate(-58%,-50%); } 75% { transform: translate(-42%,-50%); } }
        .tp-wave { position: absolute; left: -5%; right: -5%; top: 0; height: 115%; pointer-events: none;
          background: linear-gradient(180deg, rgba(31,127,196,.95) 0%, rgba(63,183,224,.88) 80%, rgba(233,251,255,.95) 92%, rgba(233,251,255,0) 100%);
          transform: translateY(-105%); transition: transform .42s cubic-bezier(.5,0,.4,1); }
        .tp-wave.in { transform: translateY(-8%); }
        .tp-msg { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%) scale(.6); opacity: 0;
          background: rgba(26,18,48,.9); color: #fff; padding: 14px 20px; border-radius: 16px; font-weight: 800;
          font-size: 20px; text-align: center; pointer-events: none; transition: all .25s ease; white-space: nowrap; z-index: 3; }
        .tp-msg.show { opacity: 1; transform: translate(-50%,-50%) scale(1); }
      `);

      const info = api.el('div', 'tp-info');
      const pickedEl = api.el('span', 'tp-pill', info);
      const livesEl = api.el('span', 'tp-pill', info);
      const beach = api.el('div', 'tp-beach');
      api.el('div', 'tp-sea', beach);
      const layer = api.el('div', null, beach);
      const wave = api.el('div', 'tp-wave', beach);
      const msg = api.el('div', 'tp-msg', beach);

      let round = 0;
      let size = 3;            // treasures at the start of this round
      let lives = LIVES;
      let items = [];          // { emoji, el, picked }
      let unused = [];
      let extraAt = -1;        // pick count at which a new treasure washes in
      let picks = 0;
      let locked = true;
      let fontPx = 40;

      const renderInfo = () => {
        pickedEl.textContent = 'Picked ' + picks + ' / ' + items.length;
        livesEl.textContent = '❤️'.repeat(lives) + '🤍'.repeat(LIVES - lives);
        api.status('Round ' + Math.min(round, ROUNDS) + '/' + ROUNDS + ' · ' + items.length + ' treasures');
      };

      const showMsg = (text, ms) => {
        msg.textContent = text;
        msg.classList.add('show');
        api.after(ms || 900, () => msg.classList.remove('show'));
      };

      // spread treasures over a jittered grid of slots on the sand
      const layout = () => {
        const r = beach.getBoundingClientRect();
        const w = Math.max(200, r.width), h = Math.max(200, r.height * 0.86);
        const n = items.length;
        const cols = Math.max(2, Math.round(Math.sqrt((n + 2) * w / h)));
        const rows = Math.max(2, Math.ceil((n + 2) / cols));
        const cw = w / cols, ch = h / rows;
        fontPx = Math.max(26, Math.min(64, Math.min(cw, ch) * 0.52));
        const slots = [];
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) slots.push([x, y]);
        const pick = api.shuffle(slots).slice(0, n);
        items.forEach((it, i) => {
          const [cx, cy] = pick[i];
          const jx = (Math.random() - 0.5) * 0.36, jy = (Math.random() - 0.5) * 0.36;
          it.el.style.left = ((cx + 0.5 + jx) / cols) * 100 + '%';
          it.el.style.top = 12 + ((cy + 0.5 + jy) / rows) * 86 + '%';
          it.el.style.fontSize = fontPx + 'px';
        });
      };

      const addItem = (isNew) => {
        const emoji = unused.pop();
        const el = api.el('button', 'tp-item' + (isNew ? ' new' : ''), layer, emoji);
        const it = { emoji, el, picked: false };
        api.on(el, 'pointerdown', (e) => { e.preventDefault(); tap(it); });
        items.push(it);
        return it;
      };

      const startRound = () => {
        round++;
        if (round > ROUNDS) { api.end('Cleared ' + cleared + ' of ' + ROUNDS + ' rounds'); return; }
        layer.innerHTML = '';
        items = [];
        picks = 0;
        unused = api.shuffle(POOL);
        for (let i = 0; i < size; i++) addItem(false);
        // bigger rounds: a new treasure washes ashore halfway through
        extraAt = size >= 6 ? Math.floor(size / 2) : -1;
        renderInfo();
        // hide everything under the wave, then reveal
        wave.classList.add('in');
        layout();
        api.after(450, () => {
          wave.classList.remove('in');
          locked = false;
        });
      };

      let cleared = 0;

      const tap = (it) => {
        if (locked || !api.alive()) return;
        if (it.picked) {
          // already picked → round over
          locked = true;
          api.answer(false);
          lives--;
          it.el.classList.add('dup');
          items.forEach((o) => { if (o.picked && o !== it) o.el.classList.add('was'); });
          showMsg('Already picked ' + it.emoji + '!', 1300);
          renderInfo();
          size = Math.max(3, size - 1);
          api.after(1600, () => {
            if (lives <= 0) { api.end('Out of slips · cleared ' + cleared + ' rounds'); return; }
            startRound();
          });
          return;
        }
        it.picked = true;
        picks++;
        api.answer(true, 15 + 5 * items.length);
        it.el.classList.add('tap');
        api.after(150, () => it.el.classList.remove('tap'));
        renderInfo();
        locked = true;

        if (picks >= items.length) {
          cleared++;
          api.addScore(40 * items.length);
          api.sfx('level');
          showMsg('Beach cleared! 🎉', 1000);
          size = Math.min(14, size + 1);
          api.after(1200, startRound);
          return;
        }

        // tide washes in, shuffles, washes out
        api.after(160, () => {
          wave.classList.add('in');
          api.after(420, () => {
            if (picks === extraAt) { addItem(true); showMsg('Something washed ashore!', 900); }
            layout();
            renderInfo();
            wave.classList.remove('in');
            api.after(260, () => { locked = false; });
          });
        });
      };

      api.on(window, 'resize', () => { if (items.length) layout(); });
      api.after(50, startRound);
    },
  });
})();
