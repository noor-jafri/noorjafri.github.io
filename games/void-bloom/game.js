(function () {
  const SIZE = 8;
  const STORAGE_KEY = "nooremberg.void-bloom.best";
  const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  const boardEl = document.getElementById("board");
  const messageEl = document.getElementById("message");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const levelEl = document.getElementById("level");
  const movesEl = document.getElementById("moves");
  const goalTextEl = document.getElementById("goal-text");
  const goalFillEl = document.getElementById("goal-fill");
  const activeBloomsEl = document.getElementById("active-blooms");
  const shadeCountEl = document.getElementById("shade-count");
  const burstStateEl = document.getElementById("burst-state");
  const resultCardEl = document.getElementById("result-card");
  const resultTextEl = document.getElementById("result-text");
  const burstBtnEl = document.getElementById("burst-btn");
  const restartBtnEl = document.getElementById("restart-btn");
  const playAgainBtnEl = document.getElementById("play-again-btn");

  const state = {
    score: 0,
    best: loadBest(),
    level: 1,
    moves: 0,
    goal: 0,
    gathered: 0,
    maxBlooms: 0,
    running: true,
    burstReady: true,
    player: { x: 0, y: 0 },
    wells: new Set(),
    blooms: new Set(),
    shades: [],
    message: ""
  };

  function loadBest() {
    try {
      return Number.parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10) || 0;
    } catch (_) {
      return 0;
    }
  }

  function saveBest() {
    try {
      localStorage.setItem(STORAGE_KEY, String(state.best));
    } catch (_) {
      // Ignore local storage errors.
    }
  }

  function key(x, y) {
    return `${x},${y}`;
  }

  function distance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function inside(x, y) {
    return x >= 0 && x < SIZE && y >= 0 && y < SIZE;
  }

  function shadeAt(x, y) {
    return state.shades.findIndex((shade) => shade.x === x && shade.y === y);
  }

  function isWell(x, y) {
    return state.wells.has(key(x, y));
  }

  function isBloom(x, y) {
    return state.blooms.has(key(x, y));
  }

  function isPlayer(x, y) {
    return state.player.x === x && state.player.y === y;
  }

  function randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  function randomTile(filter) {
    for (let attempt = 0; attempt < 2000; attempt += 1) {
      const x = randomInt(SIZE);
      const y = randomInt(SIZE);
      if (filter(x, y)) {
        return { x, y };
      }
    }

    return null;
  }

  function setMessage(text) {
    state.message = text;
    messageEl.textContent = text;
  }

  function updateBest() {
    if (state.score > state.best) {
      state.best = state.score;
      saveBest();
    }
  }

  function addBloom(count) {
    let added = 0;

    while (added < count && state.blooms.size < state.maxBlooms) {
      const tile = randomTile((x, y) => {
        return !isPlayer(x, y) && !isWell(x, y) && shadeAt(x, y) === -1 && !isBloom(x, y);
      });

      if (!tile) {
        break;
      }

      state.blooms.add(key(tile.x, tile.y));
      added += 1;
    }

    return added;
  }

  function startLevel(level) {
    state.level = level;
    state.goal = 6 + level * 2;
    state.gathered = 0;
    state.maxBlooms = Math.min(6 + level, 10);
    state.burstReady = true;
    state.wells = new Set();
    state.blooms = new Set();
    state.shades = [];
    state.player = { x: Math.floor(SIZE / 2), y: Math.floor(SIZE / 2) };

    const wellCount = Math.min(2 + level, 8);
    while (state.wells.size < wellCount) {
      const tile = randomTile((x, y) => {
        return !isPlayer(x, y) && distance({ x, y }, state.player) > 1;
      });

      if (!tile) {
        break;
      }

      state.wells.add(key(tile.x, tile.y));
    }

    addBloom(Math.min(4 + level, state.maxBlooms));

    const shadeCount = Math.min(1 + level, 6);
    while (state.shades.length < shadeCount) {
      const tile = randomTile((x, y) => {
        return !isPlayer(x, y) && !isWell(x, y) && !isBloom(x, y) && shadeAt(x, y) === -1 && distance({ x, y }, state.player) >= 4;
      });

      if (!tile) {
        break;
      }

      state.shades.push(tile);
    }

    setMessage(`Level ${level}. Gather ${state.goal} blooms and stay ahead of the shades.`);
    resultCardEl.classList.add("hidden");
    render();
  }

  function startRun() {
    state.score = 0;
    state.moves = 0;
    state.running = true;
    startLevel(1);
  }

  function endRun(reason) {
    state.running = false;
    updateBest();
    setMessage(reason);
    resultTextEl.textContent = `${reason} Final score: ${state.score}.`;
    resultCardEl.classList.remove("hidden");
    render();
  }

  function maybeAdvanceLevel() {
    if (state.gathered < state.goal) {
      return false;
    }

    state.score += 20 * state.level;
    updateBest();
    setMessage(`The garden bends to you. Level ${state.level + 1} opens.`);
    render();
    window.setTimeout(() => {
      if (state.running) {
        startLevel(state.level + 1);
      }
    }, 420);
    return true;
  }

  function witherBloomsUnderShades() {
    let withered = 0;

    for (const shade of state.shades) {
      const tileKey = key(shade.x, shade.y);
      if (state.blooms.delete(tileKey)) {
        withered += 1;
      }
    }

    if (withered > 0) {
      setMessage(`A shade consumed ${withered} bloom${withered === 1 ? "" : "s"}.`);
    }
  }

  function moveShades() {
    const next = [];
    const reserved = new Set();
    const remaining = new Set(state.shades.map((shade) => key(shade.x, shade.y)));

    for (const shade of state.shades) {
      remaining.delete(key(shade.x, shade.y));

      const candidates = [
        { x: shade.x, y: shade.y },
        { x: shade.x + 1, y: shade.y },
        { x: shade.x - 1, y: shade.y },
        { x: shade.x, y: shade.y + 1 },
        { x: shade.x, y: shade.y - 1 }
      ];

      let bestMove = { x: shade.x, y: shade.y };
      let bestDistance = distance(bestMove, state.player);

      for (const candidate of candidates.sort(() => Math.random() - 0.5)) {
        const candidateKey = key(candidate.x, candidate.y);
        if (!inside(candidate.x, candidate.y)) {
          continue;
        }
        if (isWell(candidate.x, candidate.y)) {
          continue;
        }
        if (reserved.has(candidateKey) || remaining.has(candidateKey)) {
          continue;
        }

        const candidateDistance = distance(candidate, state.player);
        if (candidateDistance < bestDistance) {
          bestMove = candidate;
          bestDistance = candidateDistance;
        }
      }

      next.push(bestMove);
      reserved.add(key(bestMove.x, bestMove.y));
    }

    state.shades = next;
    witherBloomsUnderShades();

    if (shadeAt(state.player.x, state.player.y) !== -1) {
      endRun("A shade closed the gap.");
    }
  }

  function collectBloomIfPresent() {
    const tileKey = key(state.player.x, state.player.y);
    if (!state.blooms.delete(tileKey)) {
      return;
    }

    state.gathered += 1;
    state.score += 10 + state.level * 2;
    updateBest();
    setMessage(`Bloom secured. ${state.goal - state.gathered} left for this level.`);
  }

  function afterTurn() {
    if (!state.running) {
      return;
    }

    if (maybeAdvanceLevel()) {
      return;
    }

    if (state.moves % 3 === 0) {
      addBloom(1);
    }

    moveShades();

    if (!state.running) {
      return;
    }

    if (state.blooms.size < 2) {
      addBloom(1);
    }

    render();
  }

  function movePlayer(dx, dy) {
    if (!state.running) {
      return;
    }

    const nextX = state.player.x + dx;
    const nextY = state.player.y + dy;

    if (!inside(nextX, nextY)) {
      setMessage("The garden ends there.");
      render();
      return;
    }

    if (isWell(nextX, nextY)) {
      setMessage("A dark well blocks your path.");
      render();
      return;
    }

    state.player = { x: nextX, y: nextY };
    state.moves += 1;

    if (shadeAt(nextX, nextY) !== -1) {
      endRun("You stepped into a shade.");
      return;
    }

    collectBloomIfPresent();
    afterTurn();
  }

  function useBurst() {
    if (!state.running || !state.burstReady) {
      return;
    }

    state.moves += 1;
    state.burstReady = false;
    const added = addBloom(3);
    setMessage(added > 0 ? `Bloom Burst awakened ${added} new bloom${added === 1 ? "" : "s"}.` : "Bloom Burst flickered, but the field is already full.");
    render();
  }

  function tileLabel(x, y) {
    if (isPlayer(x, y)) {
      return "You";
    }
    if (shadeAt(x, y) !== -1) {
      return "Shade";
    }
    if (isWell(x, y)) {
      return "Well";
    }
    if (isBloom(x, y)) {
      return "Bloom";
    }
    return "Empty tile";
  }

  function tileGlyph(x, y) {
    if (isPlayer(x, y)) {
      return "@";
    }
    if (shadeAt(x, y) !== -1) {
      return "X";
    }
    if (isWell(x, y)) {
      return "O";
    }
    if (isBloom(x, y)) {
      return "*";
    }
    return "";
  }

  function renderBoard() {
    boardEl.innerHTML = "";

    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        const cell = document.createElement("button");
        const dx = x - state.player.x;
        const dy = y - state.player.y;
        const adjacent = Math.abs(dx) + Math.abs(dy) === 1;

        cell.type = "button";
        cell.className = "cell";
        if (adjacent && !isWell(x, y) && state.running) {
          cell.classList.add("reachable");
          cell.addEventListener("click", () => movePlayer(Math.sign(dx), Math.sign(dy)));
        } else {
          cell.addEventListener("click", () => {
            if (state.running) {
              setMessage(`${tileLabel(x, y)}.`);
              render();
            }
          });
        }

        if (isPlayer(x, y)) {
          cell.classList.add("player");
        } else if (shadeAt(x, y) !== -1) {
          cell.classList.add("shade");
        } else if (isWell(x, y)) {
          cell.classList.add("well");
        } else if (isBloom(x, y)) {
          cell.classList.add("bloom");
        }

        cell.setAttribute("aria-label", `Row ${y + 1}, Column ${x + 1}, ${tileLabel(x, y)}`);
        cell.textContent = tileGlyph(x, y);
        boardEl.appendChild(cell);
      }
    }
  }

  function render() {
    renderBoard();

    scoreEl.textContent = String(state.score);
    bestEl.textContent = String(state.best);
    levelEl.textContent = String(state.level);
    movesEl.textContent = String(state.moves);
    goalTextEl.textContent = `${state.gathered} / ${state.goal}`;
    goalFillEl.style.width = `${Math.min(100, (state.gathered / state.goal) * 100)}%`;
    activeBloomsEl.textContent = String(state.blooms.size);
    shadeCountEl.textContent = String(state.shades.length);
    burstStateEl.textContent = state.burstReady ? "READY" : "SPENT";
    burstBtnEl.classList.toggle("spent", !state.burstReady);
    burstBtnEl.disabled = !state.running || !state.burstReady;
  }

  document.addEventListener("keydown", (event) => {
    const keyName = event.key.toLowerCase();

    if (keyName === "arrowup" || keyName === "w") {
      event.preventDefault();
      movePlayer(DIRECTIONS.up.x, DIRECTIONS.up.y);
      return;
    }

    if (keyName === "arrowdown" || keyName === "s") {
      event.preventDefault();
      movePlayer(DIRECTIONS.down.x, DIRECTIONS.down.y);
      return;
    }

    if (keyName === "arrowleft" || keyName === "a") {
      event.preventDefault();
      movePlayer(DIRECTIONS.left.x, DIRECTIONS.left.y);
      return;
    }

    if (keyName === "arrowright" || keyName === "d") {
      event.preventDefault();
      movePlayer(DIRECTIONS.right.x, DIRECTIONS.right.y);
      return;
    }

    if (keyName === "b") {
      event.preventDefault();
      useBurst();
      return;
    }

    if (keyName === "r") {
      event.preventDefault();
      startRun();
    }
  });

  document.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", () => {
      const move = DIRECTIONS[button.dataset.move];
      movePlayer(move.x, move.y);
    });
  });

  burstBtnEl.addEventListener("click", useBurst);
  restartBtnEl.addEventListener("click", startRun);
  playAgainBtnEl.addEventListener("click", startRun);

  bestEl.textContent = String(state.best);
  startRun();
})();
