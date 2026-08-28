/**
 * MURDOKU — motor de generación y resolución
 * ------------------------------------------------------------
 * Este archivo no sabe nada de temas, nombres ni idiomas: solo entiende
 * de filas, columnas, habitaciones y muebles. Todo lo "narrativo" vive
 * en themes.js. Aquí vive la parte que garantiza que cada caso generado
 * tenga UNA y solo una solución posible.
 *
 * Funciona tanto en el navegador (adjunta `window.Murdoku`) como en
 * Node (exporta `module.exports`) para poder testear el motor de forma
 * aislada antes de tocar la interfaz.
 */
(function (root) {
  "use strict";

  const Murdoku = {};

  // ============================================================
  // 1. RNG determinista (para que un "código de caso" sea repetible)
  // ============================================================
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStringToSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return (h >>> 0) ^ Date.now() & 0; // pure fn of str
  }
  function makeRng(seed) {
    if (typeof seed === "string") seed = hashStringToSeed(seed);
    if (typeof seed !== "number") seed = (Math.random() * 2 ** 32) >>> 0;
    return mulberry32(seed);
  }
  function randInt(rng, maxExclusive) {
    return Math.floor(rng() * maxExclusive);
  }
  function choice(rng, arr) {
    return arr[randInt(rng, arr.length)];
  }
  function shuffled(rng, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(rng, i + 1);
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }
  Murdoku.makeRng = makeRng;
  Murdoku.hashStringToSeed = hashStringToSeed;

  function key(r, c) {
    return r + "," + c;
  }

  // ============================================================
  // 2. Partición del tablero en habitaciones rectangulares
  //    (corte "guillotina": cada corte parte un rectángulo en dos)
  // ============================================================
  function generateRooms(rng, rows, cols, targetRooms, minDim) {
    minDim = minDim || 2;
    let rects = [{ r0: 0, c0: 0, r1: rows - 1, c1: cols - 1 }];

    function dims(rect) {
      return { h: rect.r1 - rect.r0 + 1, w: rect.c1 - rect.c0 + 1 };
    }
    function canSplit(rect) {
      const { h, w } = dims(rect);
      return h >= minDim * 2 || w >= minDim * 2;
    }

    let guard = 0;
    while (rects.length < targetRooms && guard++ < 200) {
      const splittable = rects.filter(canSplit);
      if (splittable.length === 0) break;
      splittable.sort((a, b) => {
        const da = dims(a), db = dims(b);
        return db.h * db.w - da.h * da.w;
      });
      const pool = splittable.slice(0, Math.min(3, splittable.length));
      const rect = choice(rng, pool);
      const { h, w } = dims(rect);
      const canH = h >= minDim * 2;
      const canW = w >= minDim * 2;
      const horizontal = canH && canW ? rng() < 0.5 : canH;

      rects = rects.filter((r) => r !== rect);
      if (horizontal) {
        const span = h - minDim * 2 + 1;
        const cut = rect.r0 + minDim + randInt(rng, span);
        rects.push({ r0: rect.r0, c0: rect.c0, r1: cut - 1, c1: rect.c1 });
        rects.push({ r0: cut, c0: rect.c0, r1: rect.r1, c1: rect.c1 });
      } else {
        const span = w - minDim * 2 + 1;
        const cut = rect.c0 + minDim + randInt(rng, span);
        rects.push({ r0: rect.r0, c0: rect.c0, r1: rect.r1, c1: cut - 1 });
        rects.push({ r0: rect.r0, c0: cut, r1: rect.r1, c1: rect.c1 });
      }
    }

    // Construir mapa celda -> índice de habitación
    const roomOf = Array.from({ length: rows }, () => new Array(cols).fill(-1));
    rects.forEach((rect, idx) => {
      for (let r = rect.r0; r <= rect.r1; r++) {
        for (let c = rect.c0; c <= rect.c1; c++) roomOf[r][c] = idx;
      }
    });

    const rooms = rects.map((rect, idx) => {
      const cells = [];
      for (let r = rect.r0; r <= rect.r1; r++)
        for (let c = rect.c0; c <= rect.c1; c++) cells.push([r, c]);
      return { id: idx, bounds: rect, cells };
    });

    return { rooms, roomOf };
  }
  Murdoku.generateRooms = generateRooms;

  // ============================================================
  // 3. Adyacencia — depende de la variante de reglas del caso
  // ============================================================
  const ADJACENCY = {
    // Reglas clásicas: arriba / abajo / izquierda / derecha
    orthogonal: [[-1, 0], [1, 0], [0, -1], [0, 1]],
    // Variante "Estrella": también cuentan las diagonales (8 direcciones)
    diagonal8: [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1],
    ],
    // Variante "Caballos": movimiento de caballo de ajedrez
    knight: [
      [-2, -1], [-2, 1], [2, -1], [2, 1],
      [-1, -2], [-1, 2], [1, -2], [1, 2],
    ],
  };
  Murdoku.ADJACENCY = ADJACENCY;

  function neighborsOf(r, c, rows, cols, mode) {
    const deltas = ADJACENCY[mode] || ADJACENCY.orthogonal;
    const out = [];
    for (const [dr, dc] of deltas) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push([nr, nc]);
    }
    return out;
  }
  Murdoku.neighborsOf = neighborsOf;

  // ============================================================
  // 4. Colocación de muebles
  //    occupiable = true  -> una persona puede estar EN esa celda
  //    occupiable = false -> la celda queda bloqueada para personas,
  //                          pero sirve como referencia ("junto a X")
  // ============================================================
  function placeFurniture(rng, rows, cols, roomOf, rooms, furnitureTypes, count) {
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([r, c]);
    const order = shuffled(rng, cells);

    // reparte el mobiliario intentando cubrir varias habitaciones
    const perRoomCount = new Map();
    const furniture = [];
    const used = new Set();
    let idx = 0;
    let attempts = 0;
    while (furniture.length < count && attempts < order.length) {
      const [r, c] = order[idx % order.length];
      idx++;
      attempts++;
      const k = key(r, c);
      if (used.has(k)) continue;
      const roomId = roomOf[r][c];
      const already = perRoomCount.get(roomId) || 0;
      // como mucho ~2 muebles por habitación pequeña para no saturarla
      const room = rooms[roomId];
      const maxForRoom = Math.max(1, Math.floor(room.cells.length / 3));
      if (already >= maxForRoom && furniture.length < count - 1) continue;

      const type = choice(rng, furnitureTypes);
      furniture.push({
        id: furniture.length,
        typeId: type.id,
        occupiable: !!type.occupiable,
        r, c,
        roomId,
      });
      used.add(k);
      perRoomCount.set(roomId, already + 1);
    }
    return furniture;
  }
  Murdoku.placeFurniture = placeFurniture;

  // ============================================================
  // 5. Emparejamiento aleatorio fila<->columna evitando celdas
  //    bloqueadas (backtracking con orden aleatorio = robusto
  //    incluso si hay muchas celdas bloqueadas)
  // ============================================================
  function randomPerfectMatching(rng, n, blockedSet) {
    const colsOrder = Array.from({ length: n }, (_, i) => i);
    const rowOrder = shuffled(rng, Array.from({ length: n }, (_, i) => i));
    const assign = new Array(n).fill(-1);
    const usedCols = new Array(n).fill(false);

    function backtrack(i) {
      if (i === rowOrder.length) return true;
      const r = rowOrder[i];
      const candidates = shuffled(rng, colsOrder).filter(
        (c) => !usedCols[c] && !blockedSet.has(key(r, c))
      );
      for (const c of candidates) {
        usedCols[c] = true;
        assign[r] = c;
        if (backtrack(i + 1)) return true;
        usedCols[c] = false;
        assign[r] = -1;
      }
      return false;
    }
    const ok = backtrack(0);
    return ok ? assign : null;
  }
  Murdoku.randomPerfectMatching = randomPerfectMatching;

  // ============================================================
  // 6. Descripción de muebles (para saber si hace falta nombrar
  //    la habitación al referirse a ellos, por ambigüedad)
  // ============================================================
  function furnitureIsUniqueInGrid(furniture, typeId) {
    return furniture.filter((f) => f.typeId === typeId).length === 1;
  }
  function furnitureIsUniqueInRoom(furniture, typeId, roomId) {
    return furniture.filter((f) => f.typeId === typeId && f.roomId === roomId).length === 1;
  }
  Murdoku.furnitureIsUniqueInGrid = furnitureIsUniqueInGrid;
  Murdoku.furnitureIsUniqueInRoom = furnitureIsUniqueInRoom;

  // ============================================================
  // 7. Catálogo de HECHOS verdaderos sobre una persona dada su
  //    celda solución. Cada hecho trae su propio "candidateCells"
  //    (el conjunto de celdas del tablero compatibles con el
  //    hecho) para poder usarlo luego como restricción unaria.
  // ============================================================
  function computeFactCatalog(ctx, personIdx) {
    const { rows, cols, roomOf, rooms, furniture, adjacencyMode, solution } = ctx;
    const [r, c] = solution[personIdx];
    const roomId = roomOf[r][c];
    const room = rooms[roomId];
    const facts = [];

    // -- estar en la habitación --
    facts.push({
      type: "room",
      roomId,
      weight: 1,
      candidateCells: room.cells,
    });

    // -- esquina de la habitación --
    const { r0, c0, r1, c1 } = room.bounds;
    const isCorner = (r === r0 || r === r1) && (c === c0 || c === c1) && (r1 > r0 || c1 > c0);
    if (isCorner) {
      const corners = [
        [r0, c0], [r0, c1], [r1, c0], [r1, c1],
      ].filter((cell, i, arr) => arr.findIndex((x) => x[0] === cell[0] && x[1] === cell[1]) === i);
      facts.push({
        type: "corner",
        roomId,
        weight: 2,
        candidateCells: corners,
      });
    }

    // -- cuántas otras personas comparten la habitación --
    const others = solution.filter((cell, i) => i !== personIdx && roomOf[cell[0]][cell[1]] === roomId);
    facts.push({
      type: "room_count",
      roomId,
      count: others.length,
      weight: others.length === 0 ? 3 : 2,
      candidateCells: room.cells,
    });

    // -- mobiliario: adyacencia / encima / misma fila / misma columna --
    // Solo se generan hechos que referencian un mueble CONCRETO si ese
    // tipo de mueble es único dentro de su habitación: así, al nombrar
    // la habitación en la frase, la referencia queda inequívoca.
    for (const f of furniture) {
      const sameCell = f.r === r && f.c === c;
      const uniqueEnough = furnitureIsUniqueInRoom(furniture, f.typeId, f.roomId);
      if (sameCell && f.occupiable && uniqueEnough) {
        const cellsOfType = furniture
          .filter((x) => x.typeId === f.typeId && x.occupiable)
          .map((x) => [x.r, x.c]);
        facts.push({
          type: "on",
          furnitureId: f.id,
          weight: 3,
          candidateCells: [[f.r, f.c]],
        });
        // ¿fue la única persona de todo el caso sobre este TIPO de mueble?
        const occupiedOfType = ctx.solution.filter(([sr, sc]) =>
          furniture.some((x) => x.typeId === f.typeId && x.occupiable && x.r === sr && x.c === sc)
        );
        if (occupiedOfType.length === 1) {
          facts.push({
            type: "on_unique",
            furnitureId: f.id,
            weight: 4,
            candidateCells: cellsOfType,
          });
        }
      }
      if (!sameCell && uniqueEnough) {
        const isNeighbor = neighborsOf(f.r, f.c, rows, cols, adjacencyMode).some(
          ([nr, nc]) => nr === r && nc === c
        );
        // "junto a" solo se cuenta dentro de la misma habitación
        if (isNeighbor && f.roomId === roomId) {
          const spots = neighborsOf(f.r, f.c, rows, cols, adjacencyMode).filter(
            ([nr, nc]) => roomOf[nr][nc] === f.roomId
          );
          facts.push({
            type: "adjacent",
            furnitureId: f.id,
            weight: 2,
            candidateCells: spots,
          });
        }
        if (f.r === r) {
          facts.push({
            type: "same_row",
            furnitureId: f.id,
            weight: 1,
            candidateCells: Array.from({ length: cols }, (_, cc) => [r, cc]).filter(
              ([, cc]) => !(cc === f.c)
            ),
          });
        }
        if (f.c === c) {
          facts.push({
            type: "same_col",
            furnitureId: f.id,
            weight: 1,
            candidateCells: Array.from({ length: rows }, (_, rr) => [rr, c]).filter(
              ([rr]) => !(rr === f.r)
            ),
          });
        }
      }
    }

    return facts;
  }
  Murdoku.computeFactCatalog = computeFactCatalog;

  // ============================================================
  // 8. Solver: cuenta soluciones compatibles con las pistas
  //    reveladas hasta el momento (con tope, para parar pronto).
  // ============================================================
  function countSolutions(ctx, revealed, cap) {
    // revealed: array (uno por sospechoso) de arrays de hechos elegidos
    const { rows, cols, roomOf, blockedSet, suspects, rooms } = ctx;
    const n = suspects.length; // sospechosos (sin la víctima)

    const candSets = suspects.map((sIdx, i) => {
      const factList = revealed[i];
      if (!factList || factList.length === 0) {
        // sin pistas: cualquier celda libre de mobiliario bloqueante
        const all = [];
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) if (!blockedSet.has(key(r, c))) all.push([r, c]);
        return all;
      }
      let set = null;
      for (const f of factList) {
        const s = new Set(f.candidateCells.map(([r, c]) => key(r, c)));
        set = set === null ? s : new Set([...set].filter((x) => s.has(x)));
      }
      return [...set].map((k) => k.split(",").map(Number)).filter(([r, c]) => !blockedSet.has(key(r, c)));
    });

    // heurística: intentar primero a los sospechosos con menos opciones
    const order = candSets
      .map((cands, i) => ({ i, len: cands.length }))
      .sort((a, b) => a.len - b.len)
      .map((x) => x.i);

    const usedRows = new Array(rows).fill(false);
    const usedCols = new Array(cols).fill(false);
    const assign = new Array(n).fill(null);
    let count = 0;

    // restricciones "de conteo por habitación" (alone / con K personas)
    const roomCountFacts = [];
    revealed.forEach((factList, i) => {
      (factList || []).forEach((f) => {
        if (f.type === "room_count") roomCountFacts.push({ suspectPos: i, ...f });
      });
    });

    function finalizeAndValidate() {
      // celda restante para la víctima
      let freeRow = -1, freeCol = -1;
      for (let r = 0; r < rows; r++) if (!usedRows[r]) freeRow = r;
      for (let c = 0; c < cols; c++) if (!usedCols[c]) freeCol = c;
      if (freeRow === -1 || freeCol === -1) return false;
      if (blockedSet.has(key(freeRow, freeCol))) return false;

      if (roomCountFacts.length > 0) {
        const allCells = assign.map((cell) => cell);
        allCells.push([freeRow, freeCol]); // víctima
        const roomMembers = new Map();
        allCells.forEach(([r, c]) => {
          const rid = roomOf[r][c];
          roomMembers.set(rid, (roomMembers.get(rid) || 0) + 1);
        });
        for (const rc of roomCountFacts) {
          const [r, c] = assign[rc.suspectPos];
          const rid = roomOf[r][c];
          const others = (roomMembers.get(rid) || 1) - 1;
          if (others !== rc.count) return false;
        }
      }
      return true;
    }

    function backtrack(depth) {
      if (count >= cap || nodeBudgetRef.n <= 0) return;
      nodeBudgetRef.n--;
      if (depth === n) {
        if (finalizeAndValidate()) count++;
        return;
      }
      const i = order[depth];
      for (const [r, c] of candSets[i]) {
        if (usedRows[r] || usedCols[c]) continue;
        usedRows[r] = usedCols[c] = true;
        assign[i] = [r, c];
        backtrack(depth + 1);
        usedRows[r] = usedCols[c] = false;
        assign[i] = null;
        if (count >= cap || nodeBudgetRef.n <= 0) return;
      }
    }
    const nodeBudgetRef = { n: 250000 };
    backtrack(0);
    // si se agotó el presupuesto sin terminar de contar, tratamos el
    // resultado como "ambiguo" (>=2): es la postura conservadora, evita
    // quedarnos colgados en layouts patológicos y simplemente hace que
    // selectClues() añada una pista más en vez de darse por satisfecho.
    if (nodeBudgetRef.n <= 0 && count < cap) return Math.max(count, 2);
    return count;
  }
  Murdoku.countSolutions = countSolutions;

  // ============================================================
  // Utilidades varias exportadas
  // ============================================================
  Murdoku.key = key;
  Murdoku.choice = choice;
  Murdoku.shuffled = shuffled;
  Murdoku.randInt = randInt;

  // Export universal
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Murdoku;
  } else {
    root.Murdoku = Murdoku;
  }
})(typeof window !== "undefined" ? window : globalThis);
