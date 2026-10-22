/*
 * Neuroplasticity — shared shell for the mini-games.
 *
 * Each game lives in games/<id>.js and calls NP.register(def):
 *
 *   NP.register({
 *     id: 'speed-match',            // url hash + storage key
 *     name: 'Speed Match',
 *     icon: '⚡',                    // emoji fallback
 *     art: '<svg …>',               // optional SVG icon for the menu tile + intro card (viewBox 0 0 64 64)
 *     color: '#ff6b6b',             // tile tint
 *     bg: ['#3a7bd5', '#1a1230'],   // game screen background gradient (top, bottom)
 *     tagline: 'Does this shape match the one right before it?',
 *     how: ['line', 'line'],        // shown on the intro card
 *     controls: 'Yes / No',
 *     noScore: false,               // true → no score HUD / best score (Tic Tac Toe)
 *     needsTilt: false,             // true → ask for motion permission on Start (iOS)
 *     start(api) { ...; return optionalCleanupFn; }
 *   });
 *
 * The api handed to start():
 *   api.stage                 element to render into (flex column, centered, fills the screen)
 *   api.el(tag, cls, parent, text)  createElement helper
 *   api.timer(sec, onEnd?)    countdown in the HUD; at 0 calls onEnd or api.end()
 *   api.timeLeft()            seconds left
 *   api.addScore(n) / api.getScore()
 *   api.answer(correct, base=50, at?)  streak multiplier (x1..x5), adds points, flash + sound + haptic,
 *                             "+150" popup and particle burst at `at` ({x,y} in stage px, or an Element;
 *                             default: where the player last tapped, else stage center); returns points
 *   api.fx.burst(x, y, color, count?) / api.fx.popup(text, x, y, color?) / api.fx.at(el) → {x,y}
 *   api.flash(good)           feedback only
 *   api.end(note?)            finish: shows results, saves best
 *   api.status(text)          small line under the HUD (level, round…)
 *   api.yesNo(cb, labels?)    two buttons in the bottom bar; cb(true) for yes. ←/→ keys too
 *   api.buttons([{label, cls, onClick}])  custom bottom-bar buttons
 *   api.onSwipe(cb)           cb('up'|'down'|'left'|'right'); touch swipes + arrow keys / WASD
 *   api.onKey(cb)             raw keydown
 *   api.on(target, ev, fn, opts)    listener removed automatically on exit
 *   api.after(ms, fn) / api.every(ms, fn)   auto-cleared timers
 *   api.frame(fn(dt, t))      rAF loop (dt in seconds, capped); returns stop()
 *   api.tilt()                { x: -1..1, available } from device orientation
 *   api.sfx('good'|'bad'|'tap'|'level'|'end'|'shoot'|'boom')
 *   api.vibrate(ms)
 *   api.alive()               false once the game ended or the player left
 *   api.rand(n) api.pick(arr) api.shuffle(arr)
 *   api.best                  previous best score
 */
(function () {
  'use strict';

  const games = [];
  const $ = (s) => document.querySelector(s);

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem('np.' + k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('np.' + k, JSON.stringify(v)); } catch (e) {} },
  };
  const bestOf = (id) => store.get('best.' + id) || 0;

  /* ---------- sound ---------- */
  let actx = null;
  let muted = !!store.get('muted');
  function tone(freq, dur, type, vol, slide) {
    if (muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const t = actx.currentTime;
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(vol || 0.12, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  const SFX = {
    good: () => { tone(660, 0.08, 'triangle'); setTimeout(() => tone(990, 0.1, 'triangle'), 60); },
    bad: () => tone(180, 0.22, 'sawtooth', 0.08, 90),
    tap: () => tone(520, 0.05, 'triangle', 0.08),
    level: () => [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.1, 'triangle'), i * 80)),
    end: () => [784, 659, 523, 392].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'triangle'), i * 110)),
    shoot: () => tone(900, 0.05, 'square', 0.03, 500),
    boom: () => tone(140, 0.25, 'sawtooth', 0.08, 40),
    tick: () => tone(1200, 0.03, 'square', 0.04),
  };
  const vibrate = (ms) => {
    try {
      const ua = navigator.userActivation;
      if (navigator.vibrate && (!ua || ua.hasBeenActive)) navigator.vibrate(ms);
    } catch (e) {}
  };

  /* ---------- tilt ---------- */
  const tiltState = { x: 0, available: false, listening: false };
  function onOrient(e) {
    if (e.gamma == null) return;
    tiltState.available = true;
    let g = e.gamma; // left/right in portrait
    const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    if (ang === 90) g = e.beta; else if (ang === -90 || ang === 270) g = -e.beta;
    tiltState.x = Math.max(-1, Math.min(1, g / 25));
  }
  async function ensureTilt() {
    if (tiltState.listening) return;
    try {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r !== 'granted') return;
      }
      window.addEventListener('deviceorientation', onOrient);
      tiltState.listening = true;
    } catch (e) {}
  }

  function setIcon(el, g) {
    if (g.art) el.innerHTML = g.art;
    else el.textContent = g.icon;
  }

  /* ---------- menu ---------- */
  // Lumosity-style skill areas. A game can override with def.category.
  const CATEGORIES = [
    { key: 'memory', name: 'Memory', color: '#5b8fb9', ids: ['memory-grid', 'memory-match', 'tide-pool'] },
    { key: 'speed', name: 'Speed', color: '#e07a5f', ids: ['speed-match', 'spatial-match'] },
    { key: 'attention', name: 'Attention', color: '#c9a227', ids: ['migration', 'star-search', 'trains'] },
    { key: 'flexibility', name: 'Flexibility', color: '#81b29a', ids: ['color-match', 'ebb-flow', 'brain-shift'] },
    { key: 'arcade', name: 'Arcade', color: '#9a7fb8', ids: ['tic-tac-toe', 'sky-patrol'] },
  ];
  const categoryOf = (g) => {
    const key = g.category || (CATEGORIES.find((c) => c.ids.includes(g.id)) || CATEGORIES[4]).key;
    return CATEGORIES.find((c) => c.key === key) || CATEGORIES[4];
  };

  const dayKey = (d) => {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const playedToday = () => {
    const p = store.get('played') || {};
    return p.day === dayKey() ? p.ids : [];
  };
  function recordPlay(id) {
    const today = dayKey();
    const p = store.get('played') || {};
    const ids = p.day === today ? p.ids : [];
    if (!ids.includes(id)) ids.push(id);
    store.set('played', { day: today, ids });
    const st = store.get('streak') || { last: null, days: 0 };
    if (st.last !== today) {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      st.days = st.last === dayKey(y) ? st.days + 1 : 1;
      st.last = today;
      store.set('streak', st);
    }
  }
  const streakDays = () => {
    const st = store.get('streak');
    if (!st) return 0;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return st.last === dayKey() || st.last === dayKey(y) ? st.days : 0;
  };

  // Three brain games a day, one from each of three different skill areas, seeded by the date.
  function todaysWorkout() {
    let seed = 0;
    for (const ch of dayKey()) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const pools = CATEGORIES.filter((c) => c.key !== 'arcade')
      .map((c) => games.filter((g) => categoryOf(g) === c))
      .filter((p) => p.length);
    for (let i = pools.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pools[i], pools[j]] = [pools[j], pools[i]]; }
    return pools.slice(0, 3).map((p) => p[Math.floor(rnd() * p.length)]);
  }

  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const openFromMenu = (g) => { SFX.tap(); fromMenu = true; location.hash = g.id; };

  function renderMenu() {
    const h = new Date().getHours();
    $('#greet').textContent = h < 5 ? 'Late night thinking' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';

    const played = playedToday();
    const plan = todaysWorkout();
    const done = plan.filter((g) => played.includes(g.id)).length;
    const streak = streakDays();
    $('#streak').innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 3.5 5 5.5 5 10.5A5 5 0 0 1 7 12.5c0-2 1-3.5 2-4.5.3 1.6 1.2 2.6 2.2 3C11 8 11 5 12 2z"/></svg>' +
      (streak ? '<b>' + streak + '</b> day' + (streak === 1 ? '' : 's') : 'Start a streak');

    const w = $('#workout');
    w.innerHTML =
      '<div class="w-head"><div><small>Today’s workout</small><h2>' +
      (done === plan.length ? 'All done. Nice work.' : done ? done + ' of ' + plan.length + ' done' : 'Three games, five minutes') +
      '</h2></div><div class="w-ring" style="--p:' + done / plan.length + '"><span>' + done + '/' + plan.length + '</span></div></div>' +
      '<div class="w-list"></div>';
    const list = w.querySelector('.w-list');
    plan.forEach((g) => {
      const c = categoryOf(g);
      const item = document.createElement('button');
      item.className = 'w-item' + (played.includes(g.id) ? ' done' : '');
      item.style.setProperty('--tc', g.color || c.color);
      item.innerHTML = '<span class="w-art"></span><span class="w-name">' + esc(g.name) + '</span><span class="w-cat">' + c.name + '</span><span class="w-check" aria-hidden="true"></span>';
      setIcon(item.querySelector('.w-art'), g);
      item.onclick = () => openFromMenu(g);
      list.appendChild(item);
    });
    const next = plan.find((g) => !played.includes(g.id));
    const go = document.createElement('button');
    go.className = 'w-go';
    go.textContent = next ? (done ? 'Continue workout' : 'Start workout') : 'Play again';
    go.onclick = () => openFromMenu(next || plan[0]);
    w.appendChild(go);

    const lib = $('#library');
    lib.innerHTML = '';
    CATEGORIES.forEach((c) => {
      const list = games.filter((g) => categoryOf(g) === c);
      if (!list.length) return;
      const sec = document.createElement('section');
      sec.className = 'cat';
      sec.style.setProperty('--cc', c.color);
      sec.innerHTML = '<h3><i></i>' + c.name + '<span>' + list.length + '</span></h3><div class="cards"></div>';
      const cards = sec.querySelector('.cards');
      list.forEach((g) => {
        const best = bestOf(g.id);
        const t = document.createElement('button');
        t.className = 'gcard';
        t.style.setProperty('--tc', g.color || c.color);
        t.innerHTML =
          '<span class="g-art"></span>' +
          '<span class="g-body"><span class="g-name">' + esc(g.name) + '</span>' +
          '<span class="g-tag">' + esc(g.tagline) + '</span>' +
          (g.noScore ? '<span class="g-best">Just for fun</span>' : '<span class="g-best">' + (best ? 'Best ' + best.toLocaleString() : 'Not played yet') + '</span>') +
          '</span>' + (played.includes(g.id) ? '<span class="g-done" title="Played today"></span>' : '');
        setIcon(t.querySelector('.g-art'), g);
        t.onclick = () => openFromMenu(g);
        cards.appendChild(t);
      });
      lib.appendChild(sec);
    });
  }

  /* ---------- game session ---------- */
  let session = null;
  let fromMenu = false;

  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = id === 'menu' ? '#f4ede3' : '#1c2333';
  }

  function openGame(def) {
    closeSession();
    show('game');
    $('#h-name').textContent = def.name;
    $('#h-scorebox').style.display = def.noScore ? 'none' : '';
    $('#h-timebox').style.display = 'none';
    $('#timebar').style.visibility = 'hidden';
    $('#status').textContent = '';
    $('#stage').innerHTML = '';
    $('#controls').innerHTML = '';
    $('#h-score').textContent = '0';
    $('#h-mult').textContent = '';

    const intro = $('#intro');
    setIcon($('#i-icon'), def);
    const bg = def.bg || ['#2a3348', '#1c2333'];
    $('#game').style.background = 'linear-gradient(180deg, ' + bg[0] + ' 0%, ' + bg[1] + ' 100%)';
    $('#i-name').textContent = def.name;
    $('#i-tag').textContent = def.tagline;
    const ul = $('#i-how');
    ul.innerHTML = '';
    (def.how || []).forEach((line) => { const li = document.createElement('li'); li.textContent = line; ul.appendChild(li); });
    const best = bestOf(def.id);
    $('#i-meta').innerHTML = '';
    [def.controls && '🎮 ' + def.controls, !def.noScore && '★ Best ' + best.toLocaleString()].filter(Boolean).forEach((m) => {
      const s = document.createElement('span'); s.textContent = m; $('#i-meta').appendChild(s);
    });
    $('#results').classList.remove('show');
    intro.classList.add('show');
    $('#i-start').onclick = async () => {
      if (def.needsTilt) await ensureTilt();
      intro.classList.remove('show');
      countdown(() => startSession(def));
    };
  }

  function countdown(done) {
    const cd = $('#countdown');
    let n = 3;
    cd.classList.add('show');
    const step = () => {
      if (!$('#game').classList.contains('active')) { cd.classList.remove('show'); return; }
      if (n === 0) { cd.classList.remove('show'); cd.innerHTML = ''; done(); return; }
      cd.innerHTML = '<b>' + n + '</b>';
      SFX.tick();
      n--;
      cdTimer = setTimeout(step, 600);
    };
    step();
  }
  let cdTimer = null;

  function startSession(def) {
    const stage = $('#stage');
    const controls = $('#controls');
    stage.innerHTML = '';
    controls.innerHTML = '';
    stage.className = 'stage';

    const s = {
      def, alive: true, score: 0, streak: 0, mult: 1,
      timers: new Set(), intervals: new Set(), rafs: new Set(), listeners: [],
      timer: null, cleanup: null,
    };
    session = s;
    const prevBest = bestOf(def.id);

    const on = (target, ev, fn, opts) => {
      target.addEventListener(ev, fn, opts);
      s.listeners.push([target, ev, fn, opts]);
    };
    const after = (ms, fn) => {
      const id = setTimeout(() => { s.timers.delete(id); if (s.alive) fn(); }, ms);
      s.timers.add(id);
      return id;
    };
    const every = (ms, fn) => {
      const id = setInterval(() => { if (s.alive) fn(); }, ms);
      s.intervals.add(id);
      return id;
    };
    const frame = (fn) => {
      let last = performance.now();
      let handle = { id: 0, stopped: false };
      const loop = (t) => {
        if (!s.alive || handle.stopped) return;
        const dt = Math.min(0.05, (t - last) / 1000);
        last = t;
        fn(dt, t);
        handle.id = requestAnimationFrame(loop);
      };
      handle.id = requestAnimationFrame(loop);
      s.rafs.add(handle);
      return () => { handle.stopped = true; cancelAnimationFrame(handle.id); };
    };

    const renderScore = () => {
      $('#h-score').textContent = s.score.toLocaleString();
      $('#h-mult').textContent = s.mult > 1 ? '×' + s.mult : '';
    };
    // ----- particles & popups (live in #fx, above the stage) -----
    const fxLayer = $('#fx');
    fxLayer.innerHTML = '';
    const stageOrigin = () => {
      const a = stage.getBoundingClientRect(), b = $('#game').getBoundingClientRect();
      return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
    };
    const fx = {
      at(el) {
        const r = el.getBoundingClientRect(), a = stage.getBoundingClientRect();
        return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height / 2 };
      },
      burst(x, y, color, count) {
        const o = stageOrigin();
        count = count || 14;
        for (let i = 0; i < count; i++) {
          const p = document.createElement('i');
          p.className = 'fx-p';
          const ang = Math.random() * Math.PI * 2, v = 40 + Math.random() * 70;
          p.style.left = o.x + x + 'px';
          p.style.top = o.y + y + 'px';
          p.style.background = color || 'var(--accent)';
          p.style.setProperty('--dx', Math.cos(ang) * v + 'px');
          p.style.setProperty('--dy', Math.sin(ang) * v - 30 + 'px');
          p.style.setProperty('--s', (0.5 + Math.random() * 0.9).toFixed(2));
          fxLayer.appendChild(p);
          setTimeout(() => p.remove(), 750);
        }
      },
      popup(text, x, y, color) {
        const o = stageOrigin();
        const p = document.createElement('b');
        p.className = 'fx-pop';
        p.textContent = text;
        p.style.left = o.x + x + 'px';
        p.style.top = o.y + y + 'px';
        if (color) p.style.color = color;
        fxLayer.appendChild(p);
        setTimeout(() => p.remove(), 900);
      },
    };
    let lastTap = null;
    on($('#game'), 'pointerdown', (e) => {
      const a = stage.getBoundingClientRect();
      lastTap = { x: e.clientX - a.left, y: e.clientY - a.top, t: performance.now() };
    }, true);
    const fxPoint = (at) => {
      if (at instanceof Element) return fx.at(at);
      if (at && at.x != null) return at;
      const r = stage.getBoundingClientRect();
      if (lastTap && performance.now() - lastTap.t < 500 && lastTap.x >= 0 && lastTap.y >= 0 && lastTap.x <= r.width && lastTap.y <= r.height) return lastTap;
      return { x: r.width / 2, y: r.height / 2 };
    };
    const renderDots = () => {
      const dots = $('#h-dots');
      const n = s.mult >= 5 ? 4 : s.streak % 4;
      dots.innerHTML = '<i></i><i></i><i></i><i></i>';
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i < n));
    };

    let flashT = null;
    const flash = (good) => {
      stage.classList.remove('flash-good', 'flash-bad');
      void stage.offsetWidth;
      stage.classList.add(good ? 'flash-good' : 'flash-bad');
      clearTimeout(flashT);
      flashT = setTimeout(() => stage.classList.remove('flash-good', 'flash-bad'), 60);
    };

    const api = {
      stage,
      best: prevBest,
      el(tag, cls, parent, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        (parent || stage).appendChild(e);
        return e;
      },
      alive: () => s.alive,
      fx,
      addScore(n) { s.score = Math.max(0, s.score + Math.round(n)); renderScore(); },
      getScore: () => s.score,
      answer(correct, base, at) {
        base = base == null ? 50 : base;
        flash(correct);
        const pt = fxPoint(at);
        if (correct) {
          s.streak++;
          const before = s.mult;
          s.mult = Math.min(5, 1 + Math.floor(s.streak / 4));
          const pts = base * s.mult;
          s.score += pts;
          renderScore();
          renderDots();
          if (pts > 0) fx.popup('+' + pts, pt.x, pt.y);
          fx.burst(pt.x, pt.y, s.mult > before ? '#f2c14e' : 'rgba(255,255,255,0.9)', s.mult > before ? 16 : 8);
          if (s.mult > before) { fx.popup('×' + s.mult, pt.x, pt.y - 34, '#f2c14e'); SFX.level(); } else SFX.good();
          return pts;
        }
        s.streak = 0;
        s.mult = 1;
        renderScore();
        renderDots();
        fx.popup('✕', pt.x, pt.y, '#e8707e');
        SFX.bad();
        vibrate(80);
        return 0;
      },
      flash(good) { flash(good); (good ? SFX.good : SFX.bad)(); if (!good) vibrate(60); },
      status(text) { $('#status').textContent = text || ''; },
      timer(sec, onEnd) {
        const box = $('#h-timebox');
        const bar = $('#timebar i');
        box.style.display = '';
        $('#timebar').style.visibility = 'visible';
        s.timer = { endAt: performance.now() + sec * 1000, sec };
        let last = performance.now();
        const tick = () => {
          const now = performance.now();
          // the clock stops while the app is in the background (games' frame loops pause too)
          if (document.hidden) s.timer.endAt += now - last;
          last = now;
          const left = Math.max(0, (s.timer.endAt - now) / 1000);
          $('#h-time').textContent = Math.ceil(left);
          box.classList.toggle('low', left <= 5);
          bar.style.transform = 'scaleX(' + left / sec + ')';
          if (left <= 0) { (onEnd || api.end)(); return false; }
          return true;
        };
        tick();
        const id = setInterval(() => { if (!s.alive || !tick()) clearInterval(id); }, 100);
        s.intervals.add(id);
      },
      timeLeft: () => (s.timer ? Math.max(0, (s.timer.endAt - performance.now()) / 1000) : Infinity),
      end(note) { endSession(note); },
      yesNo(cb, labels) {
        labels = labels || ['No', 'Yes'];
        controls.innerHTML = '';
        const no = api.el('button', 'btn no', controls, '✕ ' + labels[0]);
        const yes = api.el('button', 'btn yes', controls, '✓ ' + labels[1]);
        let enabled = true;
        const press = (v, b) => {
          if (!enabled || !s.alive) return;
          b.classList.add('pressed');
          setTimeout(() => b.classList.remove('pressed'), 90);
          cb(v);
        };
        on(no, 'pointerdown', (e) => { e.preventDefault(); press(false, no); });
        on(yes, 'pointerdown', (e) => { e.preventDefault(); press(true, yes); });
        on(window, 'keydown', (e) => {
          if (e.repeat) return;
          if (e.key === 'ArrowLeft' || e.key === 'n') press(false, no);
          if (e.key === 'ArrowRight' || e.key === 'y') press(true, yes);
        });
        return { enable(v) { enabled = v; no.disabled = yes.disabled = !v; } };
      },
      buttons(list) {
        controls.innerHTML = '';
        return list.map((b) => {
          const e = api.el('button', 'btn ' + (b.cls || ''), controls, b.label);
          on(e, 'pointerdown', (ev) => { ev.preventDefault(); if (s.alive) b.onClick(); });
          return e;
        });
      },
      onSwipe(cb) {
        let sx = 0, sy = 0, st = 0, tracking = false;
        const zone = $('#game');
        on(zone, 'pointerdown', (e) => { if (e.target.closest('.hud,.overlay')) return; tracking = true; sx = e.clientX; sy = e.clientY; st = performance.now(); });
        on(zone, 'pointerup', (e) => {
          if (!tracking) return;
          tracking = false;
          const dx = e.clientX - sx, dy = e.clientY - sy;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 28 || performance.now() - st > 800) return;
          if (!s.alive) return;
          cb(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        });
        on(zone, 'touchmove', (e) => e.preventDefault(), { passive: false });
        const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
        on(window, 'keydown', (e) => { if (!e.repeat && keys[e.key] && s.alive) { e.preventDefault(); cb(keys[e.key]); } });
      },
      onKey(cb) { on(window, 'keydown', (e) => { if (s.alive) cb(e); }); },
      on, after, every, frame,
      tilt: () => ({ x: tiltState.x, available: tiltState.available }),
      sfx: (n) => SFX[n] && SFX[n](),
      vibrate,
      rand: (n) => Math.floor(Math.random() * n),
      pick: (a) => a[Math.floor(Math.random() * a.length)],
      shuffle(a) {
        a = a.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
      },
    };
    s.api = api;
    renderDots();

    try {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: 'play/neuroplasticity/' + def.id, title: 'Neuroplasticity · ' + def.name, event: true });
      }
    } catch (e) {}

    recordPlay(def.id);
    const ret = def.start(api);
    if (typeof ret === 'function') s.cleanup = ret;
  }

  function stopSession(s) {
    if (!s || !s.alive) return;
    s.alive = false;
    s.timers.forEach(clearTimeout);
    s.intervals.forEach(clearInterval);
    s.rafs.forEach((h) => { h.stopped = true; cancelAnimationFrame(h.id); });
    s.listeners.forEach(([t, ev, fn, o]) => t.removeEventListener(ev, fn, o));
    try { s.cleanup && s.cleanup(); } catch (e) { console.error(e); }
  }

  function endSession(note) {
    const s = session;
    if (!s || !s.alive) return;
    stopSession(s);
    const def = s.def;
    SFX.end();
    const prev = bestOf(def.id);
    const isNew = !def.noScore && s.score > prev;
    if (isNew) store.set('best.' + def.id, s.score);
    setIcon($('#r-icon'), def);
    $('#r-title').textContent = def.noScore ? def.name : 'Time!';
    $('#r-score').textContent = def.noScore ? '' : s.score.toLocaleString();
    $('#r-score').style.display = def.noScore ? 'none' : '';
    $('#r-new').style.display = isNew && prev > 0 ? '' : 'none';
    $('#r-note').textContent = note || '';
    $('#r-best').textContent = def.noScore ? '' : '★ Best ' + Math.max(prev, s.score).toLocaleString();
    setTimeout(() => $('#results').classList.add('show'), 350);
    $('#r-again').onclick = () => { $('#results').classList.remove('show'); openGame(def); $('#i-start').click(); };
  }

  function closeSession() {
    clearTimeout(cdTimer);
    $('#countdown').classList.remove('show');
    if (session) stopSession(session);
    session = null;
    $('#intro').classList.remove('show');
    $('#results').classList.remove('show');
  }

  function route() {
    const id = decodeURIComponent(location.hash.slice(1));
    const def = games.find((g) => g.id === id);
    if (def) { openGame(def); return; }
    fromMenu = false;
    closeSession();
    show('menu');
    renderMenu();
  }

  const SPEAKER = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none"/>';
  function paintMute() {
    const icon = SPEAKER + (muted ? '<path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>' : '<path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>');
    document.querySelectorAll('.mute').forEach((b) => { b.innerHTML = icon; b.setAttribute('aria-pressed', String(muted)); });
  }

  function toggleMute() {
    muted = !muted;
    store.set('muted', muted);
    paintMute();
  }

  window.NP = {
    register(def) { games.push(def); },
    boot() {
      const toMenu = () => { if (fromMenu) { fromMenu = false; history.back(); } else location.hash = ''; };
      $('#h-back').onclick = toMenu;
      $('#r-menu').onclick = toMenu;
      $('#i-menu').onclick = toMenu;
      document.querySelectorAll('.mute').forEach((b) => { b.onclick = toggleMute; });
      paintMute();
      window.addEventListener('hashchange', route);
      document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
      document.addEventListener('gesturestart', (e) => e.preventDefault());
      route();
    },
  };
})();
