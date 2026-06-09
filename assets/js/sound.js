const MUSIC = new URL("../music/", import.meta.url).href;
const sounds = {};

export function loadSound(key, src) {
  const a = new Audio(src);
  a.preload = "auto";
  sounds[key] = a;
}

export function isPlaying(key) {
  const s = sounds[key];
  return !!s && !s.paused && !s.ended;
}

/** @param {{ ifIdle?: boolean }} opts — ifIdle: skip when this clip is already playing */
export function playSound(key, { ifIdle = false } = {}) {
  const s = sounds[key];
  if (!s) return;
  if (ifIdle && isPlaying(key)) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

export function stopSound(key) {
  const s = sounds[key];
  if (!s) return;
  s.pause();
  s.currentTime = 0;
}

loadSound("calling", `${MUSIC}calling.mp3`);
loadSound("alert", `${MUSIC}alert.mp3`);
loadSound("kept", `${MUSIC}kept.mp3`);
