/* All site data lives here. Edit this file to update the site. */

export const profile = {
  name: "Noor Jafri",
  title: "Cloud Engineer · Founder · Pixel Adventurer",
  location: "Nooremberg",
  level: 30,
  class: "Cloud Wizard / Token Druid",
  startedYear: 2015,
  social: [
    { name: "GitHub",   icon: "🐙", url: "https://github.com/noor-jafri" },
    { name: "LinkedIn", icon: "💼", url: "https://www.linkedin.com/in/nooralijafri/" },
    { name: "Medium",   icon: "✍️", url: "https://medium.com/@noorjafri" },
    { name: "Email",    icon: "✉️", url: "mailto:noorjafri92@gmail.com" }
  ],
  dialogue: [
    "Hello adventurer, I am Noor.",
    "Welcome to the town of Nooremberg.",
    "I have been guarding this page for you.",
    "Press any tile to begin your journey."
  ]
};

export const skills = [
  { name: "AWS",        icon: "assets/images/aws.png",        type: "Cloud",     xp: 88, mastery: 80, mana: 90, rarity: "legendary",
    lore: "Summon servers from thin air. Tame Lambda dragons. Whisper to S3 stones." },
  { name: "Python",     icon: "assets/images/python.png",     type: "Language",  xp: 92, mastery: 85, mana: 80, rarity: "legendary",
    lore: "Slithering through scripts since the early years. Bites bugs on contact." },
  { name: "Serverless", icon: "assets/images/serverless.png", type: "Framework", xp: 85, mastery: 80, mana: 75, rarity: "epic",
    lore: "Deploys without bothering with servers. The lazy wizard's trick." },
  { name: "JavaScript", icon: "assets/images/js.png",         type: "Language",  xp: 75, mastery: 65, mana: 70, rarity: "epic",
    lore: "Animates the front-line. Slightly chaotic but always entertaining." },
  { name: "VueJS",      icon: "assets/images/vue.png",        type: "Framework", xp: 60, mastery: 55, mana: 65, rarity: "rare",
    lore: "Reactive shield that paints UIs faster than the user can click." },
  { name: "Docker",     icon: "assets/images/docker.png",     type: "DevOps",    xp: 78, mastery: 70, mana: 60, rarity: "epic",
    lore: "Whales that carry your code across kingdoms in matching crates." },
  { name: "Kubernetes", icon: "assets/images/kubernetes.png", type: "DevOps",    xp: 45, mastery: 40, mana: 70, rarity: "rare",
    lore: "Eight-armed deity that orchestrates a thousand pods at once." },
  { name: "Linux",      icon: "assets/images/linux.png",      type: "OS",        xp: 78, mastery: 80, mana: 60, rarity: "epic",
    lore: "Whispered to penguins in dark terminals since the dawn of time." },
  { name: "Bash",       icon: "assets/images/bash.png",       type: "Language",  xp: 65, mastery: 70, mana: 50, rarity: "rare",
    lore: "Ancient scripture that bends shells to the wizard's will." },
  { name: "Ansible",    icon: "assets/images/ansible.png",    type: "DevOps",    xp: 70, mastery: 65, mana: 55, rarity: "rare",
    lore: "Sends instructions to a thousand servers and whispers 'idempotent'." },
  { name: "Django",     icon: "assets/images/django.png",     type: "Framework", xp: 50, mastery: 45, mana: 60, rarity: "common",
    lore: "Batteries-included wand. Solid for crafting backend fortresses." },
  { name: "GCE",        icon: "assets/images/gce.png",        type: "Cloud",     xp: 55, mastery: 50, mana: 65, rarity: "rare",
    lore: "Google's Cloud Engine. A second elemental plane for compute." },

  /* ---- New AI/architecture cards forged at DeepMask ---- */
  { name: "vLLM",                       icon: "assets/images/vllm.png",          type: "AI",           xp: 84, mastery: 78, mana: 95, rarity: "legendary",
    lore: "Speaks to GPU dragons. They breathe tokens by the thousand." },
  { name: "MCP",                        icon: "assets/images/mcp.png",           type: "AI",           xp: 82, mastery: 76, mana: 80, rarity: "epic",
    lore: "A common tongue for models and tools, so they may finally talk without bickering." },
  { name: "A2A",                        icon: "assets/images/a2a.png",           type: "AI",           xp: 76, mastery: 70, mana: 78, rarity: "epic",
    lore: "Agents whispering to agents in low voices. Sometimes plans. Sometimes mischief." },
  { name: "GPU / RDU Inference",        icon: "assets/images/gpu.png",           type: "AI",           xp: 80, mastery: 74, mana: 92, rarity: "legendary",
    lore: "Silicon golems that gobble tokens. Swap them when one grows tired." },
  { name: "RAG / F.A.G.",               icon: "assets/images/file.png",          type: "AI",           xp: 88, mastery: 82, mana: 80, rarity: "legendary",
    lore: "RAG fetches the right scroll. F.A.G. just walks into the library and opens every drawer." },
  { name: "Event-Driven Multi-tenancy", icon: "assets/images/even-driven.png",   type: "Architecture", xp: 86, mastery: 80, mana: 75, rarity: "legendary",
    lore: "A bazaar of stalls, each listening for its own town crier. Quiet most days. Loud on others." },
  { name: "Vibe Coding",                icon: "🎧",                              type: "Framework",    xp: 62, mastery: 55, mana: 99, rarity: "rare",
    lore: "Coding by ear, not by tome. Tests show up when they please." }
];

export const quests = [
  {
    title: "Technical CoFounder @ DeepMask.io",
    period: "2024 — Present",
    icon: {
      night: "assets/images/deepmask-light.png", /* light glyph for dark bg */
      day:   "assets/images/deepmask-dark.png"   /* dark glyph for light bg */
    },
    status: "active",
    highlight: "legendary",
    badges: ["vLLM", "MCP", "A2A", "GPU/RDU", "RAG", "F.A.G.", "Multi-tenant", "Event-Driven", "🚀"],
    lore: "A guildhall for 25+ AI minds who train, brew, and bicker together. We taught the filesystem to speak alongside the index — we call it <b>F.A.G.</b> We slayed the model-fragmentation hydra. Twice. The party has grown, the realm has reached a 2-digit-million valuation, and the quest continues.",
    reward: "+5000 XP · Founder Class Unlocked"
  },
  {
    title: "Solo Builder @ KalPal.io",
    period: "2024 — Present",
    icon: "assets/images/kalpal.png",
    status: "active",
    badges: ["Vibe Coding", "AI", "Side Quest"],
    lore: "A small cottage on the edge of town where I'm apprenticing in <b>vibe coding</b>. Built by feel, shipped by faith, debugged by playlist.",
    reward: "+400 XP · Vibes Calibration"
  },
  {
    title: "Cloud Engineer @ Paessler AG",
    period: "March 2018 — January 2025",
    icon: "assets/images/paessler.png",
    status: "completed",
    badges: ["AWS", "Node.js", "VueJS", "Serverless", "Python"],
    lore: "A seven-year campaign with seven other wizards to build a Cloud-Native IoT Monitoring Platform. We read the elder scrolls of distributed systems, performed the dark rituals of CI/CD, and slew the down-time dragon more than once. Sheathed the sword in early 2025 to ride out and found DeepMask.",
    reward: "+1200 XP · Cloud Mastery"
  },
  {
    title: "Associate Cloud Engineer @ Cloudways",
    period: "December 2015 — March 2017",
    icon: "assets/images/cloudways.png",
    status: "completed",
    badges: ["Ansible", "Docker", "AWS", "GCE", "Django"],
    lore: "Entered the dark cave of Linux, containers, and APIs. Earned XP from the best wizards in town while building a managed hosting platform that served thousands of merchants.",
    reward: "+700 XP · DevOps Foundations"
  }
];

export const education = [
  {
    title: "Fulda University of Applied Sciences (M.Sc.)",
    period: "April 2017 — April 2019",
    icon: "assets/images/fulda.png",
    status: "completed",
    badges: ["Cloud", "IoT", "DDD", "TDD"],
    lore: "Voyaged to far-away lands to study secrets of an ancient, magically advanced civilization. Specialised in scaling complex systems on demand.",
    reward: "+1000 XP · Distributed Systems"
  },
  {
    title: "NED University of Eng. & Tech. (B.Eng.)",
    period: "January 2012 — January 2016",
    icon: "assets/images/ned.png",
    status: "completed",
    badges: ["IoT", "Cloud", "Web"],
    lore: "100-year-old academy in Karachi. Survived a brutal curriculum and earned +10 XP for every subject that stuck. Forgot 20% of it the moment finals ended.",
    reward: "+800 XP · Engineering Foundation"
  }
];

export const achievements = [
  { id: "first-visit",   icon: "🎮", title: "Welcome, Adventurer", desc: "Loaded the page.",                always: true },
  { id: "scroll-master", icon: "📜", title: "Lore Reader",         desc: "Scrolled past About Me." },
  { id: "card-flip",     icon: "🃏", title: "Curious Strategist",  desc: "Flipped a skill card." },
  { id: "konami",        icon: "👾", title: "Konami Master",       desc: "Up Up Down Down…" },
  { id: "secret-room",   icon: "🗝️", title: "Found the Secret",    desc: "Discovered the hidden chest." },
  { id: "blog-reader",   icon: "📖", title: "Library Patron",      desc: "Visited the blog." },
  { id: "all-tiles",     icon: "🌟", title: "Full Explorer",       desc: "Hovered every menu tile." },
  { id: "theme-switch",  icon: "☀️", title: "Day & Night",         desc: "Toggled the theme." },
  { id: "snake-spotted", icon: "❗", title: "Tactical Espionage",  desc: "?! ... A wild Snake appeared." }
];

/* Tiny site-wide constants */
export const STORAGE_KEY = "nooremberg.v1";
