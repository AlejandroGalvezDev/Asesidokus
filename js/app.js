/**
 * MURDOKU — interfaz de la aplicación
 * ------------------------------------------------------------
 * Todo lo que toca el DOM vive aquí. La lógica de generación y
 * resolución vive en engine.js / generator.js / phrasing.js — este
 * archivo solo la consume.
 */
(function () {
  "use strict";
  const M = window.Murdoku;

  // Un emoji representativo por tema, solo para la pantalla de selección.
  const THEME_EMOJI = {
    clasico: "🔎", sendero: "🥾", faro: "🗼", cena: "🍽️", futbol: "⚽",
    vecindario: "🏘️", estrella: "🌌", oficina: "🏢", hockey: "🏒",
    pirata: "🏴‍☠️", doble_a: "🏚️", doble_b: "🏚️", batalla_estrellas: "✦",
    caballeros: "♞", asedio: "🏰", formula1: "🏎️",
  };
  const ADJ_BADGE = { diagonal8: "Regla especial: diagonales", knight: "Regla especial: movimiento de caballo" };

  const PORTRAIT_ASSETS = [
    "assets/portraits/portrait-01.png",
    "assets/portraits/portrait-02.png",
    "assets/portraits/portrait-03.png",
    "assets/portraits/portrait-04.png",
    "assets/portraits/portrait-05.png",
    "assets/portraits/reference_portrait.png",
  ];
  const FURNITURE_ASSETS = {
    cama: "assets/furniture/bed.png",
    hamaca: "assets/furniture/bed.png",
    planta: "assets/furniture/plant.png",
    mesa: "assets/furniture/table.png",
    "mesa larga": "assets/furniture/table.png",
    tv: "assets/furniture/tv.png",
    alfombra: "assets/furniture/rug.png",
    silla: "assets/furniture/reference_furniture.png",
    sofá: "assets/furniture/reference_furniture.png",
    sofa: "assets/furniture/reference_furniture.png",
  };

  function portraitFor(personIdx) {
    return PORTRAIT_ASSETS[Math.abs(personIdx) % PORTRAIT_ASSETS.length];
  }
  function furnitureAssetFor(furniture) {
    const label = String(furniture.label || "").toLowerCase();
    const exact = FURNITURE_ASSETS[label];
    if (exact) return exact;
    if (label.includes("planta")) return FURNITURE_ASSETS.planta;
    if (label.includes("alfombra")) return FURNITURE_ASSETS.alfombra;
    if (label.includes("mesa")) return FURNITURE_ASSETS.mesa;
    if (label.includes("cama") || label.includes("hamaca") || label.includes("camilla")) return FURNITURE_ASSETS.cama;
    if (label.includes("silla") || label.includes("banco") || label.includes("puf") || label.includes("sofá") || label.includes("sofa")) return FURNITURE_ASSETS.silla;
    if (label === "tv") return FURNITURE_ASSETS.tv;
    return null;
  }

  const els = {};
  const state = {
    view: "picker",
    difficulty: "media",
    puzzle: null,
    doubleSession: null, // { sideAId, sideBId, puzzles:{A,B}, active:'A'|'B', solvedSides:Set }
    placementsBySeed: new Map(), // seed -> Map(personIdx -> [r,c])  (una por caso activo)
    armed: null,
    startedAt: null,
    timerId: null,
    elapsedMs: 0,
    solved: false,
  };

  function getPlacements() {
    const seed = currentActivePuzzle().seed;
    if (!state.placementsBySeed.has(seed)) state.placementsBySeed.set(seed, new Map());
    return state.placementsBySeed.get(seed);
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") node.className = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (k.startsWith("on") && typeof attrs[k] === "function") node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    }
    (children || []).forEach((c) => { if (c) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return node;
  }

  // ============================================================
  // Arranque
  // ============================================================
  document.addEventListener("DOMContentLoaded", () => {
    els.root = $("#app");
    const fromHash = readCaseFromHash();
    if (fromHash) {
      startFromCode(fromHash);
    } else {
      renderPicker();
    }
  });

  // ============================================================
  // Códigos de caso compartibles: TEMA-DIFICULTAD-SEMILLA36
  // ============================================================
  function caseCode(themeId, difficulty, seed) {
    return `${themeId}~${difficulty}~${seed.toString(36)}`;
  }
  function parseCaseCode(code) {
    const parts = code.split("~");
    if (parts.length !== 3) return null;
    const [themeId, difficulty, seed36] = parts;
    if (!M.THEME_BY_ID[themeId]) return null;
    const seed = parseInt(seed36, 36);
    if (!Number.isFinite(seed)) return null;
    return { themeId, difficulty, seed };
  }
  function readCaseFromHash() {
    const h = location.hash.replace(/^#/, "");
    if (!h) return null;
    return parseCaseCode(decodeURIComponent(h));
  }
  function startFromCode(parsed) {
    const theme = M.THEME_BY_ID[parsed.themeId];
    const puzzle = M.generatePuzzle(theme, parsed.difficulty, parsed.seed);
    beginSession(theme, parsed.difficulty, puzzle);
  }

  // ============================================================
  // Pantalla de selección de caso
  // ============================================================
  function renderPicker() {
    state.view = "picker";
    stopTimer();
    location.hash = "";
    const themes = M.THEMES.filter((t) => t.id !== "doble_b"); // doble_b se lanza junto a doble_a

    const wrap = el("div", { class: "picker" }, [
      el("div", { class: "picker-hero" }, [
        el("h1", {}, ["ASESIDOKU"]),
        el("p", {}, [
          "Coloca a cada sospechoso en la escena del crimen usando lógica pura: una persona por fila, una por columna. ",
          "Quien comparta habitación con la víctima es el asesino. Cada caso se genera al momento y tiene una única solución posible.",
        ]),
      ]),
      buildDifficultyRow(),
      el("div", { class: "theme-grid", id: "theme-grid" }, themes.map(themeCard)),
    ]);

    els.root.innerHTML = "";
    els.root.appendChild(buildHeader(false));
    els.root.appendChild(wrap);
    els.root.appendChild(buildFooter());
  }

  function buildDifficultyRow() {
    const opts = [
      ["facil", "Fácil", "★"],
      ["media", "Media", "★★"],
      ["dificil", "Difícil", "★★★"],
      ["experto", "Experto", "★★★★"],
    ];
    const row = el("div", { class: "diff-row", role: "group", "aria-label": "Dificultad" });
    opts.forEach(([key, label, stars]) => {
      const btn = el("button", {
        class: "diff-chip",
        "aria-pressed": String(state.difficulty === key),
        onclick: () => { state.difficulty = key; renderPicker(); },
      }, [label, el("span", { class: "stars" }, [stars])]);
      row.appendChild(btn);
    });
    return row;
  }

  function themeCard(theme) {
    const special = ADJ_BADGE[theme.adjacencyMode] || (theme.isDouble ? "Caso doble" : null);
    return el("button", { class: "theme-card", onclick: () => launchTheme(theme.id) }, [
      special ? el("span", { class: "badge-special" }, [special]) : null,
      el("span", { class: "emoji" }, [THEME_EMOJI[theme.id] || "🕵️"]),
      el("h3", {}, [theme.name]),
      el("p", {}, [theme.tagline]),
    ]);
  }

  function launchTheme(themeId) {
    const theme = M.THEME_BY_ID[themeId];
    if (theme.isDouble) {
      const sideAId = theme.id;
      const sideBId = theme.doublePairId;
      const themeA = M.THEME_BY_ID[sideAId];
      const themeB = M.THEME_BY_ID[sideBId];
      const seedBase = Math.floor(Math.random() * 2 ** 32);
      const puzzleA = M.generatePuzzle(themeA, state.difficulty, seedBase);
      const puzzleB = M.generatePuzzle(themeB, state.difficulty, (seedBase + 777) >>> 0);
      state.doubleSession = { sideAId, sideBId, puzzles: { A: puzzleA, B: puzzleB }, active: "A", solvedSides: new Set() };
      beginSession(themeA, state.difficulty, puzzleA, true);
      return;
    }
    const puzzle = M.generatePuzzle(theme, state.difficulty, Math.floor(Math.random() * 2 ** 32));
    beginSession(theme, state.difficulty, puzzle);
  }

  // ============================================================
  // Sesión de juego
  // ============================================================
  function beginSession(theme, difficulty, puzzle, isDouble) {
    state.view = "game";
    state.puzzle = puzzle;
    state.placementsBySeed.set(puzzle.seed, new Map());
    state.armed = null;
    state.solved = false;
    state.elapsedMs = 0;
    if (!isDouble) state.doubleSession = null;
    location.hash = encodeURIComponent(caseCode(puzzle.themeId, difficulty, puzzle.seed));
    startTimer();
    renderGame();
  }

  function currentActivePuzzle() {
    if (state.doubleSession) return state.doubleSession.puzzles[state.doubleSession.active];
    return state.puzzle;
  }

  function renderGame() {
    const puzzle = currentActivePuzzle();
    els.root.innerHTML = "";

    const shell = el("div", { class: "play-shell" });
    const suspectRail = el("aside", { class: "suspect-rail", "aria-label": "Panel de sospechosos" });
    suspectRail.appendChild(buildHeader(true));
    suspectRail.appendChild(buildCasePanel(puzzle));
    shell.appendChild(suspectRail);
    shell.appendChild(buildScenePanel(puzzle));
    shell.appendChild(buildToolRail());

    els.root.appendChild(shell);
    els.root.appendChild(buildFooter());
    refreshBoardState();
  }

  function buildHeader(inGame) {
    const actions = [];
    if (inGame) {
      actions.push(el("button", { class: "icon-btn", onclick: shareCode }, ["🔗 Compartir caso"]));
      actions.push(el("button", { class: "icon-btn", onclick: () => launchSameTheme() }, ["🔄 Nuevo caso"]));
      actions.push(el("button", { class: "icon-btn", onclick: renderPicker }, ["📁 Otros casos"]));
    }
    return el("header", { class: "app-header" }, [
      el("div", { class: "brand", onclick: renderPicker, style: "cursor:pointer" }, [
        el("div", { class: "brand-badge" }, ["A"]),
        el("div", {}, [
          el("p", { class: "brand-title" }, ["ASESIDOKU"]),
          el("p", { class: "brand-sub" }, [inGame ? "por Manuel Garand" : "Casos procedurales · una única solución garantizada"]),
        ]),
      ]),
      el("div", { class: "header-actions" }, actions),
    ]);
  }

  function buildToolRail() {
    return el("aside", { class: "tool-rail", "aria-label": "Herramientas del caso" }, [
      el("div", { class: "tool-rail-top" }, [
        el("span", { class: "tool-label" }, ["Herramientas"]),
        el("button", { class: "tool-button tool-danger", title: "Vaciar tablero", "aria-label": "Vaciar tablero", onclick: onResetPlacements }, ["×"]),
        el("button", { class: "tool-button tool-eraser", title: "Borrar una ficha", "aria-label": "Borrar una ficha", onclick: () => { state.armed = null; toast("Selecciona una ficha colocada para moverla o retirarla."); } }, ["⌫", el("small", {}, ["mantén para borrar todo"]) ]),
        el("button", { class: "tool-button tool-muted", disabled: "true", title: "Deshacer", "aria-label": "Deshacer" }, ["DESHACER"]),
      ]),
      el("div", { class: "tool-rail-bottom" }, [
        el("button", { class: "tool-button tool-hint", onclick: onHint }, ["💡 Pista"]),
        el("button", { class: "tool-button tool-muted tool-send", disabled: "true" }, ["ENVIAR", el("small", {}, ["(coloca a todos primero"]) ]),
        el("button", { class: "tool-button tool-help", onclick: () => toast("Selecciona un sospechoso y después una casilla del tablero.") }, ["CÓMO JUGAR"]),
        el("div", { class: "tool-icon-row" }, [
          el("button", { class: "tool-square", title: "Ayuda", "aria-label": "Ayuda", onclick: () => toast("Una persona por fila, una por columna.") }, ["?"]),
          el("button", { class: "tool-square", title: "Comprobar", "aria-label": "Comprobar", onclick: onCheck }, ["↗"]),
          el("button", { class: "tool-square", title: "Revelar solución", "aria-label": "Revelar solución", onclick: onReveal }, ["▣"]),
        ]),
        el("div", { class: "tool-icon-row" }, [
          el("button", { class: "tool-square", title: "Silenciar", "aria-label": "Silenciar", onclick: () => toast("No hay sonidos activos en esta versión.") }, ["⌁"]),
          el("button", { class: "tool-square", title: "Ajustes", "aria-label": "Ajustes", onclick: () => toast("Ajustes visuales disponibles próximamente.") }, ["⚙"]),
        ]),
      ]),
    ]);
  }

  function launchSameTheme() {
    const themeId = state.doubleSession ? state.doubleSession.sideAId : state.puzzle.themeId;
    launchTheme(themeId);
  }

  function shareCode() {
    const url = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => toast("Enlace del caso copiado al portapapeles."));
    } else {
      toast("Copia el enlace de la barra de direcciones para compartir este caso.");
    }
  }

  // ------------------------------------------------------------
  // Panel del expediente (sospechosos + pistas)
  // ------------------------------------------------------------
  function buildCasePanel(puzzle) {
    const panel = el("div", { class: "case-panel" }, [
      el("div", { class: "case-file-tab" }, [`EXPEDIENTE Nº ${String(puzzle.seed % 100000).padStart(5, "0")}`]),
      el("h2", { class: "case-title" }, [puzzle.title]),
      el("p", { class: "case-tagline" }, [puzzle.tagline]),
      el("p", { class: "case-intro" }, [puzzle.intro]),
    ]);

    if (state.doubleSession) panel.appendChild(buildDoubleTabs());

    const meta = el("div", { class: "meta-row" }, [
      el("span", { class: "meta-pill stars" }, ["★".repeat(puzzle.difficulty.stars) + "☆".repeat(4 - puzzle.difficulty.stars) + " " + puzzle.difficulty.label]),
      el("span", { class: "meta-pill" }, [`Tablero ${puzzle.n}×${puzzle.n}`]),
      el("span", { class: "meta-pill" }, [`${puzzle.rooms.length} habitaciones`]),
      el("span", { class: "meta-pill timer", id: "timer-pill" }, [formatTime(state.elapsedMs)]),
    ]);
    panel.appendChild(meta);

    if (ADJ_BADGE[puzzle.adjacencyMode]) {
      panel.appendChild(el("ul", { class: "global-clues" }, [
        el("li", {}, [`⚠️ ${ADJ_BADGE[puzzle.adjacencyMode]}: "junto a" se interpreta de forma distinta en este caso (ver leyenda del tablero).`]),
      ]));
    }

    panel.appendChild(el("h3", { class: "suspects-title" }, ["Sospechosos"]));
    const list = el("div", { class: "suspect-list", id: "suspect-list" });
    puzzle.people.filter((p) => !p.isVictim).forEach((p) => list.appendChild(suspectCard(puzzle, p)));
    list.appendChild(victimCard(puzzle, puzzle.people.find((p) => p.isVictim)));
    panel.appendChild(list);

    panel.appendChild(el("div", { class: "controls-row" }, [
      el("button", { class: "icon-btn", id: "btn-check", onclick: onCheck }, ["🔍 Comprobar"]),
      el("button", { class: "icon-btn", id: "btn-hint", onclick: onHint }, ["💡 Pista"]),
      el("button", { class: "icon-btn danger", id: "btn-reset", onclick: onResetPlacements }, ["🗑️ Vaciar tablero"]),
      el("button", { class: "icon-btn danger", id: "btn-reveal", onclick: onReveal }, ["🏳️ Revelar solución"]),
    ]));

    return panel;
  }

  function buildDoubleTabs() {
    const ds = state.doubleSession;
    const nameA = M.THEME_BY_ID[ds.sideAId].name.replace(/^Doble Crimen — /, "");
    const nameB = M.THEME_BY_ID[ds.sideBId].name.replace(/^Doble Crimen — /, "");
    const row = el("div", { class: "double-tabs" });
    [["A", nameA], ["B", nameB]].forEach(([side, label]) => {
      const solved = ds.solvedSides.has(side);
      row.appendChild(el("button", {
        "aria-pressed": String(ds.active === side),
        onclick: () => { ds.active = side; state.armed = null; renderGame(); },
      }, [label, solved ? el("span", { class: "check" }, ["✓"]) : null]));
    });
    return row;
  }

  function suspectCard(puzzle, person) {
    const placed = getPlacements().has(person.personIdx);
    const armed = state.armed === person.personIdx;
    const classes = ["suspect-card"];
    if (placed) classes.push("placed");
    if (armed) classes.push("armed");
    const tilt = ((person.personIdx * 37) % 7 - 3) * 0.5;
    return el("div", {
      class: classes.join(" "),
      style: `--tilt:${tilt}deg`,
      "data-person": person.personIdx,
      "data-gender": person.gender || "",
      onclick: () => onArmSuspect(person.personIdx),
    }, [
      el("div", { class: "suspect-portrait" }, [
        el("img", { src: portraitFor(person.personIdx), alt: `Retrato de ${person.name}`, loading: "lazy" }),
        el("span", { class: "gender-badge", "aria-label": person.gender === "f" ? "Mujer" : "Hombre" }, [person.gender === "f" ? "♀" : "♂"]),
      ]),
      el("div", { class: "suspect-info" }, [
        el("div", { class: "name-row" }, [
          el("span", { class: "name" }, [person.name]),
          el("span", { class: "token" }, [placed ? cellLabel(getPlacements().get(person.personIdx)) : "sin ubicar"]),
        ]),
        el("p", { class: "clue" }, [M.clueTextFor(puzzle, person)]),
      ]),
    ]);
  }

  function victimCard(puzzle, victim) {
    return el("div", { class: "suspect-card victim-card", style: "cursor:default; --tilt:1deg", "data-gender": victim.gender || "" }, [
      el("div", { class: "suspect-portrait" }, [
        el("img", { src: portraitFor(victim.personIdx), alt: `Retrato de ${victim.name}`, loading: "lazy" }),
        el("span", { class: "gender-badge", "aria-label": victim.gender === "f" ? "Mujer" : "Hombre" }, [victim.gender === "f" ? "♀" : "♂"]),
      ]),
      el("div", { class: "suspect-info" }, [
        el("div", { class: "name-row" }, [
          el("span", { class: "name" }, [victim.name]),
          el("span", { class: "victim-tag" }, ["Víctima"]),
        ]),
        el("p", { class: "clue" }, [M.clueTextFor(puzzle, victim)]),
      ]),
    ]);
  }

  function cellLabel(cell) {
    const [r, c] = cell;
    return `F${r + 1} · C${c + 1}`;
  }

  // ------------------------------------------------------------
  // Escena del crimen (tablero)
  // ------------------------------------------------------------
  function buildScenePanel(puzzle) {
    const panel = el("div", { class: "scene-panel" }, [
      el("div", { class: "scene-header" }, [
        el("h2", {}, ["Escena del crimen"]),
        el("span", { class: "meta-pill" }, [state.armed != null ? "Toca una casilla para colocar" : "Toca a un sospechoso y luego una casilla"]),
      ]),
    ]);

    const boardWrap = el("div", { class: "board-wrap" });
    const board = el("div", { class: "board", id: "board" });
    board.style.setProperty("--n", puzzle.n);

    const furnitureByCell = new Map();
    puzzle.furniture.forEach((f) => furnitureByCell.set(f.r + "," + f.c, f));

    for (let r = 0; r < puzzle.n; r++) {
      for (let c = 0; c < puzzle.n; c++) {
        const room = puzzle.roomOf[r][c];
        const cellClasses = ["cell"];
        if (r === 0 || puzzle.roomOf[r - 1][c] !== room) cellClasses.push("room-edge-top");
        if (r === puzzle.n - 1 || puzzle.roomOf[r + 1][c] !== room) cellClasses.push("room-edge-bottom");
        if (c === 0 || puzzle.roomOf[r][c - 1] !== room) cellClasses.push("room-edge-left");
        if (c === puzzle.n - 1 || puzzle.roomOf[r][c + 1] !== room) cellClasses.push("room-edge-right");

        const furn = furnitureByCell.get(r + "," + c);
        if (furn && !furn.occupiable) cellClasses.push("blocked");

        const cellEl = el("div", {
          class: cellClasses.join(" "),
          "data-r": r, "data-c": c, "data-room": room,
          title: furn ? furn.label : "",
          onclick: () => onCellClick(r, c),
        });
        if (furn) {
          const asset = furnitureAssetFor(furn);
          const icon = el("span", { class: `furniture-icon${asset ? " has-asset" : ""}` }, asset
            ? [el("img", { src: `${asset}?v=2`, alt: furn.label, loading: "lazy" })]
            : [furn.icon]);
          cellEl.appendChild(icon);
        }
        board.appendChild(cellEl);
      }
    }
    boardWrap.appendChild(board);

    const labelLayer = el("div", { class: "room-label-layer" });
    puzzle.rooms.forEach((room) => {
      const cx = ((room.bounds.c0 + room.bounds.c1 + 1) / 2) / puzzle.n * 100;
      const cy = ((room.bounds.r0 + room.bounds.r1 + 1) / 2) / puzzle.n * 100;
      labelLayer.appendChild(el("span", {
        class: "room-label",
        style: `left:${cx}%; top:${cy}%;`,
      }, [room.name]));
    });
    boardWrap.appendChild(labelLayer);
    panel.appendChild(boardWrap);

    panel.appendChild(el("div", { class: "legend" }, [
      el("span", { class: "item" }, [el("span", { class: "swatch ok" }), "Casilla ocupable"]),
      el("span", { class: "item" }, [el("span", { class: "swatch blocked" }), "No se puede ocupar"]),
      el("span", { class: "item" }, ["🟨 = mueble ocupable (te puedes colocar encima)"]),
    ]));

    return panel;
  }

  // ============================================================
  // Interacción
  // ============================================================
  function onArmSuspect(personIdx) {
    state.armed = state.armed === personIdx ? null : personIdx;
    refreshBoardState();
  }

  function onCellClick(r, c) {
    const puzzle = currentActivePuzzle();
    const furn = puzzle.furniture.find((f) => f.r === r && f.c === c);
    if (furn && !furn.occupiable) {
      toast("Esa casilla no se puede ocupar.");
      return;
    }
    const occupantEntry = [...getPlacements().entries()].find(([, cell]) => cell[0] === r && cell[1] === c);

    if (state.armed == null) {
      if (occupantEntry) {
        // recoger a quien ya está ahí para poder moverlo
        state.armed = occupantEntry[0];
        getPlacements().delete(occupantEntry[0]);
        refreshBoardState();
      }
      return;
    }

    if (occupantEntry && occupantEntry[0] !== state.armed) {
      getPlacements().delete(occupantEntry[0]);
    }
    getPlacements().set(state.armed, [r, c]);
    state.armed = null;
    refreshBoardState();
    maybeCheckWin(true);
  }

  function onResetPlacements() {
    state.placementsBySeed.set(currentActivePuzzle().seed, new Map());
    state.armed = null;
    refreshBoardState();
  }

  function onHint() {
    const puzzle = currentActivePuzzle();
    const suspects = puzzle.people.filter((p) => !p.isVictim);
    const unplaced = suspects.filter((p) => !getPlacements().has(p.personIdx));
    if (unplaced.length === 0) {
      toast("Ya has ubicado a todos los sospechosos.");
      return;
    }
    const pick = unplaced[Math.floor(Math.random() * unplaced.length)];
    getPlacements().set(pick.personIdx, pick.cell.slice());
    toast(`Pista: ${pick.name} estaba en F${pick.cell[0] + 1} · C${pick.cell[1] + 1}.`);
    refreshBoardState();
    maybeCheckWin(true);
  }

  function onReveal() {
    const puzzle = currentActivePuzzle();
    puzzle.people.filter((p) => !p.isVictim).forEach((p) => getPlacements().set(p.personIdx, p.cell.slice()));
    refreshBoardState();
    openStampModal(puzzle, true);
  }

  function onCheck() {
    const result = evaluate(currentActivePuzzle());
    if (result.conflicts.size > 0) {
      toast("Hay sospechosos compartiendo fila o columna. Revisa las casillas en rojo.");
    } else if (!result.complete) {
      toast("Vas bien hasta ahora, pero aún faltan sospechosos por ubicar.");
    } else if (!result.correct) {
      toast("Todos ubicados, pero alguna pista no se cumple todavía. Revisa las fichas.");
    } else {
      toast("¡Todo encaja! Comprobando…");
    }
    refreshBoardState(result);
  }

  function maybeCheckWin(silent) {
    const puzzle = currentActivePuzzle();
    const result = evaluate(puzzle);
    if (result.complete && result.correct) {
      state.solved = true;
      stopTimer();
      if (state.doubleSession) {
        state.doubleSession.solvedSides.add(state.doubleSession.active);
        renderGame(); // refresca el check de la pestaña resuelta
      }
      openStampModal(puzzle, false);
    }
    return result;
  }

  // ------------------------------------------------------------
  // Evaluación de la solución actual del jugador
  // ------------------------------------------------------------
  function evaluate(puzzle) {
    const suspects = puzzle.people.filter((p) => !p.isVictim);
    const complete = suspects.every((p) => getPlacements().has(p.personIdx));
    const rowOf = new Map(), colOf = new Map();
    const conflicts = new Set();
    suspects.forEach((p) => {
      const cell = getPlacements().get(p.personIdx);
      if (!cell) return;
      const [r, c] = cell;
      if (rowOf.has(r)) { conflicts.add(rowOf.get(r)); conflicts.add(p.personIdx); }
      if (colOf.has(c)) { conflicts.add(colOf.get(c)); conflicts.add(p.personIdx); }
      rowOf.set(r, p.personIdx);
      colOf.set(c, p.personIdx);
    });

    let correct = complete && conflicts.size === 0;
    const clueBroken = new Set();
    if (correct) {
      // víctima = fila y columna que sobran
      let freeR = -1, freeC = -1;
      for (let r = 0; r < puzzle.n; r++) if (!rowOf.has(r)) freeR = r;
      for (let c = 0; c < puzzle.n; c++) if (!colOf.has(c)) freeC = c;
      const victimCell = [freeR, freeC];
      const blocked = puzzle.furniture.some((f) => !f.occupiable && f.r === freeR && f.c === freeC);
      if (blocked) correct = false;

      const roomMembers = new Map();
      suspects.forEach((p) => {
        const [r, c] = getPlacements().get(p.personIdx);
        const rid = puzzle.roomOf[r][c];
        roomMembers.set(rid, (roomMembers.get(rid) || 0) + 1);
      });
      if (freeR >= 0 && freeC >= 0) {
        const vRoom = puzzle.roomOf[freeR][freeC];
        roomMembers.set(vRoom, (roomMembers.get(vRoom) || 0) + 1);
      }

      suspects.forEach((p) => {
        const [r, c] = getPlacements().get(p.personIdx);
        for (const f of p.facts) {
          let ok = f.candidateCells.some(([fr, fc]) => fr === r && fc === c);
          if (ok && f.type === "room_count") {
            const rid = puzzle.roomOf[r][c];
            const others = (roomMembers.get(rid) || 1) - 1;
            ok = others === f.count;
          }
          if (!ok) { clueBroken.add(p.personIdx); correct = false; }
        }
      });
    }

    return { complete, conflicts, correct, clueBroken };
  }

  function refreshBoardState(precomputed) {
    const puzzle = currentActivePuzzle();
    const result = precomputed || evaluate(puzzle);

    // tablero
    document.querySelectorAll(".cell").forEach((cellEl) => {
      const r = Number(cellEl.dataset.r), c = Number(cellEl.dataset.c);
      const existingToken = cellEl.querySelector(".token");
      if (existingToken) existingToken.remove();
      cellEl.classList.remove("conflict-cell");
      const entry = [...getPlacements().entries()].find(([, cell]) => cell[0] === r && cell[1] === c);
      if (entry) {
        const person = puzzle.people.find((p) => p.personIdx === entry[0]);
        const tokenEl = el("span", { class: "token" }, [initials(person.name)]);
        cellEl.appendChild(tokenEl);
        if (result.conflicts.has(entry[0]) || result.clueBroken.has(entry[0])) cellEl.classList.add("conflict-cell");
      }
    });

    // fichas de sospechosos
    document.querySelectorAll(".suspect-card[data-person]").forEach((cardEl) => {
      const idx = Number(cardEl.dataset.person);
      cardEl.classList.toggle("armed", state.armed === idx);
      cardEl.classList.toggle("placed", getPlacements().has(idx));
      cardEl.classList.toggle("conflict", result.conflicts.has(idx) || result.clueBroken.has(idx));
      const tokenSpan = cardEl.querySelector(".token");
      if (tokenSpan) tokenSpan.textContent = getPlacements().has(idx) ? cellLabel(getPlacements().get(idx)) : "sin ubicar";
    });
  }

  function initials(name) {
    return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  }

  // ============================================================
  // Sello final / modal de resolución
  // ============================================================
  function openStampModal(puzzle, gaveUp) {
    const murderer = puzzle.people.find((p) => p.isMurderer);
    const victim = puzzle.people.find((p) => p.isVictim);
    const overlay = el("div", { class: "stamp-overlay", onclick: (e) => { if (e.target === overlay) overlay.remove(); } });
    const card = el("div", { class: "stamp-card" }, [
      el("span", { class: "stamp-mark" }, [gaveUp ? "CASO REVELADO" : "CASO CERRADO"]),
      el("h3", {}, [gaveUp ? "Esto es lo que pasó de verdad…" : "¡Lo resolviste!"]),
      el("p", {}, [
        `${victim.name} fue la víctima. `,
        el("span", { class: "killer-name" }, [`${murderer.name}`]),
        ` compartía habitación con ella/él: es quien cometió el crimen.`,
      ]),
      el("p", {}, [gaveUp
        ? "Puedes intentar otro caso, o generar uno nuevo con este mismo tema."
        : `Tiempo: ${formatTime(state.elapsedMs)}. Buen ojo, detective.`]),
      el("div", { class: "stamp-actions" }, [
        el("button", { class: "icon-btn primary", onclick: () => { overlay.remove(); launchSameTheme(); } }, ["🔄 Otro caso igual"]),
        el("button", { class: "icon-btn", onclick: () => { overlay.remove(); renderPicker(); } }, ["📁 Ver todos los casos"]),
        el("button", { class: "icon-btn", onclick: () => overlay.remove() }, ["Cerrar"]),
      ]),
    ]);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  // ============================================================
  // Temporizador
  // ============================================================
  function startTimer() {
    stopTimer();
    state.startedAt = Date.now();
    state.timerId = setInterval(() => {
      state.elapsedMs = Date.now() - state.startedAt;
      const pill = document.getElementById("timer-pill");
      if (pill) pill.textContent = formatTime(state.elapsedMs);
    }, 1000);
  }
  function stopTimer() {
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = null;
  }
  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  // ============================================================
  // Toast
  // ============================================================
  let toastTimer = null;
  function toast(msg) {
    let t = document.getElementById("toast");
    if (t) t.remove();
    t = el("div", { class: "toast", id: "toast" }, [msg]);
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 3200);
  }

  function buildFooter() {
    return el("footer", { class: "app-footer" }, [
      "Asesidoku — casos generados de forma procedural, cada uno con solución única verificada. Inspirado en el formato de los rompecabezas de misterio lógico.",
    ]);
  }

  // Pequeño gancho de depuración: expone el estado de juego de forma
  // read-only para pruebas automatizadas (no aporta ninguna ventaja al
  // jugador que no tuviera ya viendo las pistas, y no persiste nada).
  window.__murdokuDebug = {
    getState: () => state,
    getPuzzle: () => currentActivePuzzle(),
  };
})();
