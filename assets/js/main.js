import { profile, skills, quests, education, achievements, STORAGE_KEY } from "./data.js";
import { initEasterEggs, unlockAchievement, toast, hasAchievement } from "./easter-eggs.js";

/* ---------- helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = (s) => {
  const t = document.createElement("template");
  t.innerHTML = s.trim();
  return t.content.firstElementChild;
};

/* Render a skill / quest icon — supports both image paths (legacy) and emoji glyphs (new). */
const isImagePath = (v) => typeof v === "string" && (v.includes("/") || /\.(png|gif|svg|jpe?g|webp)$/i.test(v));
const renderIcon = (icon, alt = "", className = "") => {
  if (!icon) return "";
  return isImagePath(icon)
    ? `<img src="${icon}" alt="${alt}">`
    : `<span class="emoji-icon ${className}" role="img" aria-label="${alt}">${icon}</span>`;
};

/* ---------- background flair ---------- */
function spawnStars(count = 60) {
  const layer = $(".stars");
  if (!layer) return;
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.className = "star";
    s.style.top  = `${Math.random() * 100}%`;
    s.style.left = `${Math.random() * 100}%`;
    s.style.animationDelay = `${Math.random() * 3}s`;
    s.style.opacity = (0.3 + Math.random() * 0.7).toString();
    layer.appendChild(s);
  }
}

function spawnClouds() {
  const glyphs = ["☁", "✦", "✧", "★", "❀"];
  for (let i = 0; i < 5; i++) {
    const c = document.createElement("div");
    c.className = "cloud";
    c.textContent = glyphs[i % glyphs.length];
    c.style.top = `${5 + Math.random() * 60}%`;
    c.style.color = ["#7db890","#5fcde4","#ffd966","#ff77a8","#f1f2da"][i % 5];
    c.style.animationDuration = `${30 + Math.random() * 40}s`;
    c.style.animationDelay = `${-Math.random() * 30}s`;
    document.body.appendChild(c);
  }
}

/* ---------- hero dialogue typewriter ---------- */
function initDialogue() {
  const box = $(".dialogue .typed");
  const dotsEl = $(".dialogue-dots");
  if (!box || !dotsEl) return;
  let i = 0;
  let line = 0;
  let timer;

  function renderDots() {
    dotsEl.innerHTML = profile.dialogue.map((_, idx) =>
      `<span class="${idx === line ? "on" : ""}"></span>`
    ).join("");
  }
  function type() {
    const text = profile.dialogue[line];
    if (i <= text.length) {
      box.textContent = text.slice(0, i);
      i++;
      timer = setTimeout(type, 32);
    } else {
      timer = setTimeout(next, 2400);
    }
  }
  function next() {
    line = (line + 1) % profile.dialogue.length;
    i = 0;
    renderDots();
    type();
  }
  $(".dialogue").addEventListener("click", () => {
    clearTimeout(timer);
    i = profile.dialogue[line].length + 1;
    next();
  });
  renderDots();
  type();
}

/* ---------- HUD ---------- */
function initHud() {
  const clock = $("#hud-clock");
  if (clock) {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2,"0");
      const mm = String(d.getMinutes()).padStart(2,"0");
      clock.textContent = `${hh}:${mm}`;
    };
    tick();
    setInterval(tick, 30000);
  }
  const yearsEl = $("#hud-years");
  if (yearsEl) {
    const years = new Date().getFullYear() - profile.startedYear;
    yearsEl.textContent = `${years}Y`;
  }
  const themeBtn = $("#theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const cur = document.documentElement.dataset.theme === "day" ? "" : "day";
      if (cur) document.documentElement.dataset.theme = "day";
      else delete document.documentElement.dataset.theme;
      try { localStorage.setItem(STORAGE_KEY + ".theme", cur || "night"); } catch (_) {}
      toast(cur ? "☀ DAY MODE" : "☾ NIGHT MODE");
      unlockAchievement("theme-switch");
    });
  }
  const muteBtn = $("#sound-toggle");
  if (muteBtn) {
    muteBtn.addEventListener("click", () => toast("🔇 SFX OFF (TODO)"));
  }
}

function loadTheme() {
  try {
    const t = localStorage.getItem(STORAGE_KEY + ".theme");
    if (t === "day") document.documentElement.dataset.theme = "day";
  } catch (_) {}
}

/* ---------- skill cards ---------- */
function rarityClassFor(xp) {
  if (xp >= 85) return "legendary";
  if (xp >= 70) return "epic";
  if (xp >= 50) return "rare";
  return "common";
}
function barClassFor(value) {
  if (value >= 80) return "high";
  if (value >= 55) return "mid";
  return "low";
}

function renderSkills() {
  const grid = $("#skills-grid");
  if (!grid) return;
  grid.innerHTML = "";

  for (const s of skills) {
    const rarity = s.rarity || rarityClassFor(s.xp);
    const card = html(`
      <button class="card" data-rarity="${rarity}" data-type="${s.type}" aria-label="Skill card: ${s.name}">
        <div class="card-inner">
          <div class="card-face front">
            <div class="card-rarity">${rarity}</div>
            <div class="card-art">${renderIcon(s.icon, s.name, "card-emoji")}</div>
            <div class="card-name">${s.name}</div>
            <div class="card-type">${s.type}</div>
            <div class="card-stats">
              <div class="stat-row"><span class="key">XP</span><div class="bar ${barClassFor(s.xp)}"><span style="width:${s.xp}%"></span></div></div>
              <div class="stat-row"><span class="key">MASTERY</span><div class="bar ${barClassFor(s.mastery)}"><span style="width:${s.mastery}%"></span></div></div>
              <div class="stat-row"><span class="key">MANA</span><div class="bar ${barClassFor(s.mana)}"><span style="width:${s.mana}%"></span></div></div>
            </div>
            <div class="card-flip-hint">▸ flip</div>
          </div>
          <div class="card-face back">
            <div class="card-name">${s.name}</div>
            <div class="card-type">${s.type} · ${rarity}</div>
            <p style="margin: 0.5rem 0; color: var(--ink-dim);">${s.lore}</p>
            <div class="card-flip-hint">▸ back</div>
          </div>
        </div>
      </button>
    `);
    card.style.setProperty("--rarity", `var(--rarity-${rarity})`);
    card.addEventListener("click", () => {
      card.classList.toggle("is-flipped");
      unlockAchievement("card-flip");
    });
    grid.appendChild(card);
  }

  // Animate XP bars in once visible
  const obs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        obs.unobserve(e.target);
      }
    }
  }, { threshold: 0.15 });
  $$("#skills-grid .card").forEach(el => obs.observe(el));
}

/* Filter chips */
function initFilters() {
  const row = $("#skill-filters");
  if (!row) return;
  const types = ["All", ...new Set(skills.map(s => s.type))];
  row.innerHTML = types.map((t, i) =>
    `<button class="chip ${i === 0 ? "active" : ""}" data-type="${t}">${t}</button>`
  ).join("");
  row.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    $$(".chip", row).forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    const want = btn.dataset.type;
    $$("#skills-grid .card").forEach(c => {
      const match = want === "All" || c.dataset.type === want;
      c.style.display = match ? "" : "none";
    });
  });
}

/* ---------- Quests / Education ---------- */
function renderQuestList(target, items) {
  const el = $(target);
  if (!el) return;
  el.innerHTML = "";
  for (const q of items) {
    const node = html(`
      <article class="quest ${q.status || ""} ${q.highlight || ""} reveal">
        <div class="quest-icon">${renderIcon(q.icon, q.title, "quest-emoji")}</div>
        <div>
          <h3>${q.title}</h3>
          <div class="meta">${q.period}</div>
          <div class="badges">${q.badges.map(b => `<span class="badge">${b}</span>`).join("")}</div>
          <p class="lore">${q.lore}</p>
          <div class="reward">${q.reward}</div>
        </div>
      </article>
    `);
    el.appendChild(node);
  }
  // reveal on scroll
  const obs = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) {
      e.target.classList.add("in");
      obs.unobserve(e.target);
    }
  }, { threshold: 0.1 });
  $$(`${target} .reveal`).forEach(n => obs.observe(n));
}

/* ---------- Tile hover tracker (for achievement) ---------- */
function trackTiles() {
  const set = new Set();
  const tiles = $$(".menu-tile");
  tiles.forEach(t => {
    const handler = () => {
      set.add(t.dataset.id || t.textContent.trim());
      if (set.size >= tiles.length) unlockAchievement("all-tiles");
    };
    t.addEventListener("mouseenter", handler);
    t.addEventListener("touchstart", handler, { passive: true });
    t.addEventListener("focus", handler);
  });
}

/* ---------- Scroll achievement ---------- */
function trackScroll() {
  const about = $("#about");
  if (!about) return;
  const obs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        unlockAchievement("scroll-master");
        obs.disconnect();
      }
    }
  }, { threshold: 0.5 });
  obs.observe(about);
}

/* ---------- Achievements rendering ---------- */
export function renderAchievements() {
  const list = $("#achievements-list");
  if (!list) return;
  list.innerHTML = achievements.map(a => {
    const got = a.always || hasAchievement(a.id);
    return `
      <div class="achievement ${got ? "unlocked" : "locked"}">
        <div class="a-icon">${got ? a.icon : "🔒"}</div>
        <div>
          <div class="a-title">${a.title}</div>
          <div class="a-desc">${got ? a.desc : "???"}</div>
        </div>
      </div>
    `;
  }).join("");
}

/* ---------- Init ---------- */
function init() {
  loadTheme();
  spawnStars();
  spawnClouds();
  initDialogue();
  initHud();
  renderSkills();
  initFilters();
  renderQuestList("#quests-list", quests);
  renderQuestList("#education-list", education);
  trackTiles();
  trackScroll();
  initEasterEggs();
  renderAchievements();
  unlockAchievement("first-visit", { silent: true });

  // Re-render achievements when one unlocks
  document.addEventListener("achievement-unlocked", renderAchievements);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
