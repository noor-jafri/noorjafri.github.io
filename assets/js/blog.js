import { unlockAchievement, toast } from "./easter-eggs.js";
import { STORAGE_KEY } from "./data.js";

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

unlockAchievement("blog-reader", { silent: true });

/* day/night persistence (shared) */
function loadTheme() {
  try {
    const t = localStorage.getItem(STORAGE_KEY + ".theme");
    if (t === "day") document.documentElement.dataset.theme = "day";
  } catch {}
}
function initTheme() {
  loadTheme();
  $("#theme-toggle")?.addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme === "day" ? "" : "day";
    if (cur) document.documentElement.dataset.theme = "day"; else delete document.documentElement.dataset.theme;
    try { localStorage.setItem(STORAGE_KEY + ".theme", cur || "night"); } catch {}
    toast(cur ? "☀ DAY MODE" : "☾ NIGHT MODE");
  });
}

/* HUD year + clock */
function initHud() {
  const clock = $("#hud-clock");
  if (clock) {
    const tick = () => {
      const d = new Date();
      clock.textContent = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    };
    tick(); setInterval(tick, 30000);
  }
}

/* ---------- minimal markdown renderer ---------- */
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function renderMarkdown(md) {
  // Pull fenced code blocks out before line processing
  const blocks = [];
  md = md.replace(/```([a-z]*)\n([\s\S]*?)```/gi, (_, lang, code) => {
    blocks.push(`<pre><code class="lang-${lang}">${escapeHtml(code)}</code></pre>`);
    return `CODE${blocks.length - 1}`;
  });

  const lines = md.split("\n");
  const out = [];
  let i = 0;
  let inList = false;
  let inQuote = false;
  const flushList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  const flushQuote = () => { if (inQuote) { out.push("</blockquote>"); inQuote = false; } };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (/^#{1,6} /.test(line)) {
      flushList(); flushQuote();
      const m = line.match(/^(#{1,6}) (.*)$/);
      out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
    } else if (/^> /.test(line)) {
      flushList();
      if (!inQuote) { out.push("<blockquote>"); inQuote = true; }
      out.push(`<p>${inline(line.replace(/^> /, ""))}</p>`);
    } else if (/^[-*] /.test(line)) {
      flushQuote();
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inline(line.replace(/^[-*] /, ""))}</li>`);
    } else if (line.trim() === "") {
      flushList(); flushQuote();
      out.push("");
    } else {
      flushList(); flushQuote();
      out.push(`<p>${inline(line)}</p>`);
    }
    i++;
  }
  flushList(); flushQuote();

  let html = out.join("\n");
  html = html.replace(/CODE(\d+)/g, (_, n) => blocks[+n]);
  return html;
}

function inline(text) {
  text = escapeHtml(text);
  // links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) =>
    `<a href="${u}" target="_blank" rel="noopener">${t}</a>`);
  // bold
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italic
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // inline code
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  return text;
}

/* ---------- Page-specific ---------- */
async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch ${path}: ${res.status}`);
  return res.json();
}

async function fetchText(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch ${path}: ${res.status}`);
  return res.text();
}

async function listingPage() {
  const list = $("#post-list");
  if (!list) return;
  try {
    const posts = await fetchJson("./content/posts/index.json");
    posts.sort((a,b) => b.date.localeCompare(a.date));
    list.innerHTML = posts.map(p => `
      <a class="menu-tile reveal" href="post.html?slug=${encodeURIComponent(p.slug)}">
        <span class="title">📖 ${escapeHtml(p.title)}</span>
        <span class="desc">${escapeHtml(p.excerpt)}</span>
        <span class="meta" style="font-size:0.85rem; color:var(--ink-mute);">
          ${escapeHtml(p.date)} · ${p.readMin} min read · ${p.tags.map(t => `#${escapeHtml(t)}`).join(" ")}
        </span>
        <span class="arrow">▸ READ</span>
      </a>
    `).join("");

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } });
    });
    $$("#post-list .reveal").forEach(n => obs.observe(n));
  } catch (e) {
    list.innerHTML = `<p style="color: var(--c-red);">Failed to load posts: ${escapeHtml(e.message)}</p>`;
  }
}

async function postPage() {
  const article = $("#post-article");
  if (!article) return;
  const slug = new URLSearchParams(location.search).get("slug");
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    article.innerHTML = `
      <p>No scroll specified, traveler. The library awaits.</p>
      <p style="margin-top: 1rem;">
        <a class="hud-btn" href="./blog.html">◂ RETURN TO LIBRARY</a>
      </p>
    `;
    // Bounce after a short pause so the user sees what happened.
    setTimeout(() => { location.replace("./blog.html"); }, 1500);
    return;
  }
  try {
    const [index, md] = await Promise.all([
      fetchJson("./content/posts/index.json"),
      fetchText(`./content/posts/${slug}.md`)
    ]);
    const meta = index.find(p => p.slug === slug);
    if (meta) {
      $("#post-meta").innerHTML = `
        <div class="meta">${escapeHtml(meta.date)} · ${meta.readMin} min read</div>
        <div class="badges" style="margin: 0.5rem 0;">
          ${meta.tags.map(t => `<span class="badge">${escapeHtml(t)}</span>`).join("")}
        </div>
      `;
      document.title = `${meta.title} · Noor Jafri`;
    }
    article.innerHTML = renderMarkdown(md);
  } catch (e) {
    article.innerHTML = `<p style="color: var(--c-red);">Could not load this scroll: ${escapeHtml(e.message)}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initHud();
  listingPage();
  postPage();
});
