import { STORAGE_KEY, achievements } from "./data.js";

const ACHIEVEMENT_KEY = STORAGE_KEY + ".achievements";

/* ---------- achievements storage ---------- */
function load() {
  try { return new Set(JSON.parse(localStorage.getItem(ACHIEVEMENT_KEY) || "[]")); }
  catch { return new Set(); }
}
function save(set) {
  try { localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify([...set])); } catch {}
}

let unlocked = load();

export function hasAchievement(id) { return unlocked.has(id); }

export function unlockAchievement(id, { silent = false } = {}) {
  if (unlocked.has(id)) return;
  unlocked.add(id);
  save(unlocked);
  const meta = achievements.find(a => a.id === id);
  if (meta && !silent) {
    toast(`🏆 ${meta.title}`);
  }
  document.dispatchEvent(new CustomEvent("achievement-unlocked", { detail: id }));
}

/* ---------- toast ---------- */
let toastTimer;
export function toast(message) {
  document.querySelectorAll(".toast").forEach(t => t.remove());
  clearTimeout(toastTimer);
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  toastTimer = setTimeout(() => el.remove(), 3000);
}

/* ---------- konami code ---------- */
const KONAMI = [
  "ArrowUp","ArrowUp","ArrowDown","ArrowDown",
  "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight",
  "b","a"
];
let konamiIdx = 0;
function handleKonami(e) {
  const want = KONAMI[konamiIdx];
  if (e.key === want || e.key.toLowerCase() === want) {
    konamiIdx++;
    if (konamiIdx === KONAMI.length) {
      konamiIdx = 0;
      triggerKonami();
    }
  } else {
    konamiIdx = 0;
  }
}

function triggerKonami() {
  document.body.classList.add("secret-unlocked");
  document.body.classList.add("shake");
  setTimeout(() => document.body.classList.remove("shake"), 500);
  rainSprites(40);
  unlockAchievement("konami");
  toast("⏶⏶⏷⏷⏴⏵⏴⏵ B A — SECRET UNLOCKED");
}

/* ---------- click avatar / spawn pixels ---------- */
function attachAvatarSpawner() {
  const av = document.querySelector(".hero-avatar img");
  if (!av) return;
  let clicks = 0;
  av.addEventListener("click", (e) => {
    clicks++;
    spawnSprite(e.clientX, e.clientY);
    if (clicks === 10) {
      summonSnake();
    } else if (clicks % 5 === 0) {
      rainSprites(15);
      toast(`⚡ ${clicks} clicks — keep going!`);
    }
  });
}

function spawnSprite(x, y) {
  const glyphs = ["★","✦","◆","♥","♣","♪","♬","✺"];
  const colors = ["#ff77a8","#ffd966","#5fcde4","#7db890","#ffce96"];
  const el = document.createElement("div");
  el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
  el.style.cssText = `
    position: fixed;
    pointer-events: none;
    left: ${x}px; top: ${y}px;
    font-size: ${20 + Math.random() * 24}px;
    color: ${colors[Math.floor(Math.random() * colors.length)]};
    text-shadow: 2px 2px 0 #1a1230;
    z-index: 70;
    transition: transform 1.2s ease-out, opacity 1.2s linear;
    transform: translate(-50%, -50%) rotate(0deg);
    will-change: transform, opacity;
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    const dx = (Math.random() - 0.5) * 240;
    const dy = -120 - Math.random() * 240;
    const rot = (Math.random() - 0.5) * 720;
    el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg)`;
    el.style.opacity = "0";
  });
  setTimeout(() => el.remove(), 1300);
}

function rainSprites(count = 20) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      spawnSprite(Math.random() * window.innerWidth, -10);
    }, i * 60);
  }
}

/* ---------- Metal Gear: "?!" alert + snake cameo ---------- */
export function summonSnake() {
  console.log("[snake] summonSnake() called — kept you waiting, huh?");

  // "?!" alert — classic yellow exclamation appears, then Snake slides through.
  const alertBox = document.createElement("div");
  alertBox.className = "mgs-alert";
  alertBox.textContent = "!";
  document.body.appendChild(alertBox);

  setTimeout(() => {
    alertBox.classList.add("mgs-alert-fade");
    setTimeout(() => alertBox.remove(), 600);
  }, 1100);

  // Spawn the man himself once the alert is in.
  setTimeout(() => {
    const snake = document.createElement("img");
    snake.src = "./assets/images/snake.gif";
    snake.alt = "Solid Snake";
    snake.className = "mgs-snake";
    snake.onerror = () => console.warn("[snake] snake.gif failed to load — check assets/images/snake.gif");
    document.body.appendChild(snake);
    // CSS @keyframes animation runs automatically on append.
    setTimeout(() => snake.remove(), 5400);
  }, 900);

  toast("❗ ?! — KEPT YOU WAITING, HUH?");
  unlockAchievement("snake-spotted");
}

/* ---------- /help console ---------- */
function attachConsole() {
  let buf = "";
  let consoleEl = null;

  document.addEventListener("keydown", (e) => {
    // Activate by typing /
    if (e.key === "/" && !consoleEl && !["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      openConsole();
    }
  });

  function openConsole() {
    consoleEl = document.createElement("div");
    consoleEl.style.cssText = `
      position: fixed; left: 50%; top: 30%; transform: translate(-50%, -50%);
      background: #0f0a18; color: #7db890; border: 3px solid #5fcde4;
      box-shadow: 6px 6px 0 0 rgba(0,0,0,0.45);
      padding: 1rem; font-family: VT323, monospace; font-size: 1.2rem;
      width: min(420px, 90vw); z-index: 90;
    `;
    consoleEl.innerHTML = `
      <div style="color:#ffd966; font-family:'Press Start 2P'; font-size:0.6rem; margin-bottom:0.5rem;">> CONSOLE</div>
      <div id="console-out" style="min-height:40px; margin-bottom:0.5rem; color:#c8c4a8;">Type <b>help</b> · <b>about</b> · <b>contact</b> · <b>blog</b> · <b>secret</b> · <b>exit</b></div>
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <span style="color:#ff77a8;">$</span>
        <input id="console-in" autocomplete="off" autofocus style="flex:1; background:transparent; border:none; outline:none; color:#7db890; font:inherit;">
      </div>
    `;
    document.body.appendChild(consoleEl);
    const input = consoleEl.querySelector("#console-in");
    const out = consoleEl.querySelector("#console-out");
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const cmd = input.value.trim().toLowerCase();
        runCmd(cmd, out);
        input.value = "";
      } else if (e.key === "Escape") {
        closeConsole();
      }
    });
  }

  function closeConsole() {
    if (consoleEl) consoleEl.remove();
    consoleEl = null;
  }

  function runCmd(cmd, out) {
    const print = (msg) => out.innerHTML = msg;
    switch (cmd) {
      case "help":    print("Commands: help, about, skills, contact, blog, theme, secret, snake, achievements, exit"); break;
      case "about":   document.querySelector("#about")?.scrollIntoView({behavior:"smooth"}); print("→ about"); break;
      case "skills":  document.querySelector("#skills")?.scrollIntoView({behavior:"smooth"}); print("→ skills"); break;
      case "contact": print("✉ noorjafri92@gmail.com  ·  💼 linkedin.com/in/nooralijafri"); break;
      case "blog":    location.href = "blog.html"; break;
      case "theme":   document.querySelector("#theme-toggle")?.click(); print("toggled."); break;
      case "secret":  triggerKonami(); print("✨ unlocked."); break;
      case "snake":   summonSnake(); print("?! ... a presence is detected."); break;
      case "achievements":
        print(achievements.map(a => `${unlocked.has(a.id) || a.always ? "✔" : "·"} ${a.title}`).join("<br>")); break;
      case "exit": case "close":
        closeConsole(); break;
      case "":
        break;
      default:
        print(`unknown command: <span style="color:#ff4f78;">${cmd}</span> — try <b>help</b>`);
    }
  }
}

/* ---------- secret chest ---------- */
function attachChest() {
  const chest = document.querySelector(".secret-chest");
  if (!chest) return;
  chest.addEventListener("click", () => {
    document.body.classList.add("secret-unlocked");
    unlockAchievement("secret-room");
    toast("🗝 You opened the chest!");
    setTimeout(() => {
      document.querySelector("#secret-room")?.scrollIntoView({ behavior: "smooth" });
    }, 60);
  });
}

/* ---------- Init all ---------- */
export function initEasterEggs() {
  document.addEventListener("keydown", handleKonami);
  attachAvatarSpawner();
  attachConsole();
  attachChest();
  // mark blog visit if already visited
  if (location.pathname.includes("blog")) unlockAchievement("blog-reader", { silent: true });
}
