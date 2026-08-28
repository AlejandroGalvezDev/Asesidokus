/**
 * MURDOKU — generador de casos
 * ------------------------------------------------------------
 * Toma un "theme" (de themes.js) + una dificultad + una semilla, y
 * produce un caso COMPLETO: tablero, habitaciones, mobiliario,
 * sospechosos con sus pistas y la solución. Verifica con el solver
 * de engine.js que la combinación de pistas reveladas tiene
 * EXACTAMENTE una solución antes de entregar el caso.
 */
(function (root) {
  "use strict";

  const M = typeof module !== "undefined" && module.exports ? require("./engine.js") : root.Murdoku;

  const DIFFICULTY_SIZE_RANGE = {
    facil: [5, 6],
    media: [6, 7],
    dificil: [7, 8],
    experto: [8, 9],
  };

  function pickSize(rng, difficultyKey) {
    const [lo, hi] = DIFFICULTY_SIZE_RANGE[difficultyKey] || [6, 7];
    return lo + M.randInt(rng, hi - lo + 1);
  }

  function buildContext(rng, theme, n, adjacencyMode) {
    const roomsTarget = Math.max(3, Math.min(theme.rooms.length, n - 1 + (n >= 8 ? 1 : 0)));
    const { rooms, roomOf } = M.generateRooms(rng, n, n, roomsTarget, 2);
    const furnitureCount = n + M.randInt(rng, 3) - 1; // n-1 .. n+1
    const furniture = M.placeFurniture(
      rng, n, n, roomOf, rooms, theme.furniture, Math.max(n - 1, furnitureCount)
    );
    const blockedSet = new Set(
      furniture.filter((f) => !f.occupiable).map((f) => M.key(f.r, f.c))
    );
    return { rows: n, cols: n, rooms, roomOf, furniture, blockedSet, adjacencyMode };
  }

  function tryGenerateStructure(rng, theme, n, adjacencyMode) {
    const ctx = buildContext(rng, theme, n, adjacencyMode);
    const colAssign = M.randomPerfectMatching(rng, n, ctx.blockedSet);
    if (!colAssign) return null;

    const solution = Array.from({ length: n }, (_, personIdx) => [personIdx, colAssign[personIdx]]);

    // contar personas por habitación en la solución real
    const roomMembers = new Map();
    solution.forEach(([r, c], personIdx) => {
      const rid = ctx.roomOf[r][c];
      if (!roomMembers.has(rid)) roomMembers.set(rid, []);
      roomMembers.get(rid).push(personIdx);
    });

    const candidateRooms = [...roomMembers.entries()].filter(([, members]) => members.length === 2);
    if (candidateRooms.length === 0) return null;

    const [victimRoomId, pair] = M.choice(rng, candidateRooms);
    const shuffledPair = M.shuffled(rng, pair);
    const victimIdx = shuffledPair[0];
    const murdererIdx = shuffledPair[1];

    return { ctx, solution, victimIdx, murdererIdx, victimRoomId };
  }

  function generateStructureWithRetries(rng, theme, n, adjacencyMode, maxTries) {
    for (let i = 0; i < maxTries; i++) {
      const res = tryGenerateStructure(rng, theme, n, adjacencyMode);
      if (res) return res;
    }
    return null;
  }

  // ------------------------------------------------------------
  // Selección de pistas: revela hechos hasta que el caso tenga
  // una única solución, dando a cada sospechoso al menos 1 pista,
  // y luego intenta podar pistas redundantes para que quede
  // elegante en vez de sobrecargado.
  // ------------------------------------------------------------
  const FACT_PRIORITY = ["room", "adjacent", "corner", "same_row", "same_col", "on", "on_unique", "room_count"];

  function factSortKey(f) {
    const idx = FACT_PRIORITY.indexOf(f.type);
    return idx === -1 ? 99 : idx;
  }

  function selectClues(rng, ctx, solution, suspectOrder, cap) {
    const n = solution.length;
    const catalogs = suspectOrder.map((personIdx) => M.computeFactCatalog(
      { ...ctx, solution }, personIdx
    ));

    const revealed = suspectOrder.map(() => []);
    const usedFactKeys = suspectOrder.map(() => new Set());

    function factIdOf(f) {
      return f.type + ":" + (f.furnitureId ?? "") + ":" + (f.roomId ?? "") + ":" + (f.count ?? "");
    }

    function tryAddFact(i) {
      const catalog = M.shuffled(rng, catalogs[i]).sort((a, b) => factSortKey(a) - factSortKey(b));
      for (const f of catalog) {
        const id = factIdOf(f);
        if (usedFactKeys[i].has(id)) continue;
        usedFactKeys[i].add(id);
        revealed[i].push(f);
        return true;
      }
      return false;
    }

    // 1) una pista base para cada sospechoso (si es posible)
    for (let i = 0; i < suspectOrder.length; i++) tryAddFact(i);

    const solverCtx = { ...ctx, suspects: suspectOrder };

    let guard = 0;
    const SOFT_CAP = 4;
    while (M.countSolutions(solverCtx, revealed, 2) !== 1 && guard++ < 200) {
      // añade una pista más, priorizando al sospechoso con MENOS pistas
      // hasta ahora (para repartir la dificultad de forma pareja en vez
      // de sobrecargar siempre al mismo sospechoso)
      const byLoad = suspectOrder
        .map((_, i) => i)
        .sort((a, b) => revealed[a].length - revealed[b].length || rng() - 0.5);
      let added = false;
      for (const cap of [SOFT_CAP, Infinity]) {
        for (const i of byLoad) {
          if (revealed[i].length >= cap) continue;
          if (tryAddFact(i)) {
            added = true;
            break;
          }
        }
        if (added) break;
      }
      if (!added) break; // no quedan más hechos disponibles en todo el caso
    }

    const solved = M.countSolutions(solverCtx, revealed, 2) === 1;

    // 2) poda: intenta simplificar quitando pistas de más sin perder unicidad
    //    (varias rondas, hasta que ya no se pueda simplificar más)
    if (solved) {
      let improved = true;
      let rounds = 0;
      while (improved && rounds++ < 5) {
        improved = false;
        const idxWithExtra = suspectOrder
          .map((_, i) => i)
          .filter((i) => revealed[i].length > 1);
        for (const i of M.shuffled(rng, idxWithExtra)) {
          const sorted = [...revealed[i]].sort((a, b) => factSortKey(a) - factSortKey(b));
          for (let keep = sorted.length - 1; keep >= 1; keep--) {
            const backup = revealed[i];
            const candidate = sorted.slice(0, keep);
            if (candidate.length < backup.length) {
              revealed[i] = candidate;
              if (M.countSolutions(solverCtx, revealed, 2) === 1) {
                improved = true;
              } else {
                revealed[i] = backup;
                break;
              }
            }
          }
        }
      }
    }

    return { revealed, solved };
  }

  function difficultyLabel(n, revealed) {
    const totalFacts = revealed.reduce((s, f) => s + f.length, 0);
    const heavy = revealed.filter((f) => f.some((x) => x.type === "room_count" && x.count > 0)).length;
    const score = (n - 5) * 3 + totalFacts * 0.4 + heavy * 1.0;
    if (score < 6) return { key: "facil", label: "Fácil", stars: 1 };
    if (score < 10) return { key: "media", label: "Media", stars: 2 };
    if (score < 14) return { key: "dificil", label: "Difícil", stars: 3 };
    return { key: "experto", label: "Experto", stars: 4 };
  }

  function generatePuzzle(theme, difficultyKey, seedInput) {
    const seed = seedInput ?? Math.floor(Math.random() * 2 ** 32);
    const rng = M.makeRng(seed);
    const adjacencyMode = theme.adjacencyMode || "orthogonal";

    let structure = null;
    let n = pickSize(rng, difficultyKey);
    for (let attempt = 0; attempt < 8 && !structure; attempt++) {
      structure = generateStructureWithRetries(rng, theme, n, adjacencyMode, 60);
      if (!structure) n = Math.min(9, n + 1);
    }
    if (!structure) throw new Error("No se pudo generar la estructura del caso (reintentar con otra semilla).");

    const { ctx, solution, victimIdx, murdererIdx } = structure;
    const n_ = solution.length;
    const suspectOrder = M.shuffled(rng, Array.from({ length: n_ }, (_, i) => i).filter((i) => i !== victimIdx));

    const { revealed, solved } = selectClues(rng, ctx, solution, suspectOrder, 2);
    if (!solved) {
      // reintenta el caso completo con otra tirada si no se pudo cerrar
      return generatePuzzle(theme, difficultyKey, (seed + 1013904223) >>> 0);
    }

    const difficulty = difficultyLabel(n_, revealed);

    // -------- adjuntar contenido narrativo del tema (nombres) --------
    const roomNamePool = M.shuffled(rng, theme.rooms);
    const namedRooms = ctx.rooms.map((room, i) => ({
      ...room,
      name: roomNamePool[i % roomNamePool.length],
    }));
    const roomNameById = {};
    namedRooms.forEach((r) => (roomNameById[r.id] = r.name));

    const furnitureTypeById = {};
    theme.furniture.forEach((t) => (furnitureTypeById[t.id] = t));
    const namedFurniture = ctx.furniture.map((f) => {
      const t = furnitureTypeById[f.typeId] || { label: f.typeId, icon: "❔" };
      return { ...f, label: t.label, icon: t.icon };
    });

    const needed = n_;
    let namePool = theme.names;
    if (namePool.length < needed) {
      // por si algún tema tuviera menos nombres que personas necesarias
      namePool = namePool.concat(namePool.map(([nm, g], i) => [`${nm} ${Math.ceil((i + 2))}`, g]));
    }
    const shuffledNames = M.shuffled(rng, namePool).slice(0, needed);

    const people = suspectOrder.map((personIdx, i) => ({
      personIdx,
      isVictim: false,
      isMurderer: personIdx === murdererIdx,
      cell: solution[personIdx],
      roomId: ctx.roomOf[solution[personIdx][0]][solution[personIdx][1]],
      facts: revealed[i],
    }));
    people.push({
      personIdx: victimIdx,
      isVictim: true,
      isMurderer: false,
      cell: solution[victimIdx],
      roomId: ctx.roomOf[solution[victimIdx][0]][solution[victimIdx][1]],
      facts: [],
    });
    // reordenar para que la víctima quede al final del reparto de nombres
    // (solo afecta a qué nombre visual recibe cada persona, no a la lógica)
    const peopleForNaming = [...people.filter((p) => !p.isVictim), people.find((p) => p.isVictim)];
    peopleForNaming.forEach((p, i) => {
      const [nm, gender] = shuffledNames[i];
      p.name = nm;
      p.gender = gender;
    });

    return {
      seed,
      themeId: theme.id,
      title: theme.name,
      tagline: theme.tagline,
      intro: theme.intro,
      n: n_,
      adjacencyMode,
      rooms: namedRooms,
      roomOf: ctx.roomOf,
      roomNameById,
      furniture: namedFurniture,
      people,
      difficulty,
      isDouble: !!theme.isDouble,
      doublePairId: theme.doublePairId || null,
    };
  }
  M.generatePuzzle = generatePuzzle;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = M;
  } else {
    root.Murdoku = M;
  }
})(typeof window !== "undefined" ? window : globalThis);
