# Neuroplasticity

13 mobile brain games inspired by Lumosity, ported from the M5Stack Core2 version (`aws-core2`).
Plain HTML/CSS/JS, no build step. Live at https://noorjafri.com/games/neuroplasticity/

```
neuroplasticity/
├── index.html            menu + game screen markup; loads core and every game
├── core/
│   ├── np.js             shell: menu pages, HUD, timer, scoring, best scores, input, sound, fx
│   └── np.css            shared styles
└── games/
    └── <id>/
        ├── game.js       NP.register({...}) — the game itself
        └── game.css      the game's styles (classes prefixed per game)
```

## Adding a game

1. Create `games/<id>/game.js` and `games/<id>/game.css`.
2. Register it with `NP.register({ id, name, icon, art, color, bg, tagline, how, controls, start(api) })`.
   The full `api` is documented at the top of `core/np.js`.
3. Add its `<link>` and `<script>` to `index.html`. Menu order = script order (6 per page).

Use only `api.after` / `api.every` / `api.frame` / `api.on` for timers, loops and listeners,
so everything is cleaned up when the player leaves the game.

## Run locally

From the repository root:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/games/neuroplasticity/
