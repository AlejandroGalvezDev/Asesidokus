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
    const { rows, cols, roomOf, rooms, furniture, adjacencyMode, solution, victimIdx } = ctx;
    const [r, c] = solution[personIdx];
    const roomId = roomOf[r][c];
    const room = rooms[roomId];
    const facts = [];
    // tablero completo, reutilizado por los hechos de exclusión/relación
    // (candidateCells que no restringen nada por sí solos, o que se
    // filtran a mano a partir de un conjunto excluido)
    const fullBoard = [];
    for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) fullBoard.push([rr, cc]);

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
        } else if (!isNeighbor && f.roomId === roomId) {
          // -- ausencia: NO estaba junto a este mueble (pista de exclusión) --
          const neighborCells = neighborsOf(f.r, f.c, rows, cols, adjacencyMode);
          const excluded = new Set(neighborCells.map(([nr, nc]) => key(nr, nc)));
          facts.push({
            type: "not_adjacent",
            furnitureId: f.id,
            weight: 1,
            candidateCells: fullBoard.filter(([rr, cc]) => !excluded.has(key(rr, cc))),
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
        // -- misma diagonal que un mueble --
        const diagDr = r - f.r, diagDc = c - f.c;
        if (diagDr !== 0 && Math.abs(diagDr) === Math.abs(diagDc)) {
          const cellsOnDiag = [];
          if (diagDr === diagDc) {
            const constVal = f.r - f.c; // diagonal principal: r - c constante
            for (let rr = 0; rr < rows; rr++) {
              const cc = rr - constVal;
              if (cc >= 0 && cc < cols) cellsOnDiag.push([rr, cc]);
            }
          } else {
            const constVal = f.r + f.c; // anti-diagonal: r + c constante
            for (let rr = 0; rr < rows; rr++) {
              const cc = constVal - rr;
              if (cc >= 0 && cc < cols) cellsOnDiag.push([rr, cc]);
            }
          }
          facts.push({
            type: "same_diag",
            furnitureId: f.id,
            weight: 2,
            candidateCells: cellsOnDiag.filter(([rr, cc]) => !(rr === f.r && cc === f.c)),
          });
        }
      }
    }

    // -- exclusión: nunca estuvo sobre ningún mueble de este tipo --
    const occupiableTypeIds = [...new Set(furniture.filter((x) => x.occupiable).map((x) => x.typeId))];
    for (const typeId of occupiableTypeIds) {
      const cellsOfType = furniture
        .filter((x) => x.typeId === typeId && x.occupiable)
        .map((x) => [x.r, x.c]);
      const personIsOnType = cellsOfType.some(([tr, tc]) => tr === r && tc === c);
      if (!personIsOnType) {
        const excluded = new Set(cellsOfType.map(([tr, tc]) => key(tr, tc)));
        facts.push({
          type: "not_on_type",
          furnitureTypeId: typeId,
          weight: 1,
          candidateCells: fullBoard.filter(([rr, cc]) => !excluded.has(key(rr, cc))),
        });
      }
    }

    // -- exclusión: no estaba en tal otra habitación --
    for (const otherRoom of rooms) {
      if (otherRoom.id === roomId) continue;
      facts.push({
        type: "not_in_room",
        roomId: otherRoom.id,
        weight: 1,
        candidateCells: fullBoard.filter(([rr, cc]) => roomOf[rr][cc] !== otherRoom.id),
      });
    }

    // -- relación con otras personas (sospechosos y víctima) --
    // Estos hechos no tienen un candidateCells propio que los restrinja
    // (la posición de LA OTRA persona también es una incógnita), así que
    // aquí se listan con "todo el tablero" como candidateCells (no filtran
    // nada por sí solos) y es el propio solver (countSolutions, más abajo)
    // el que valida la relación real una vez que TODAS las posiciones
    // -incluida la de la víctima- quedan asignadas.
    for (let other = 0; other < solution.length; other++) {
      if (other === personIdx) continue;
      const [orow, ocol] = solution[other];
      const dr = orow - r;
      const dc = ocol - c;
      const otherIsVictim = victimIdx != null && other === victimIdx;

      if (dr !== 0) {
        facts.push({
          type: "row_offset_person",
          refPersonIdx: other,
          dr,
          weight: 2,
          candidateCells: fullBoard,
        });
      }
      if (dc !== 0) {
        facts.push({
          type: "col_offset_person",
          refPersonIdx: other,
          dc,
          weight: 2,
          candidateCells: fullBoard,
        });
      }
      if (dr !== 0 && Math.abs(dr) === Math.abs(dc)) {
        facts.push({
          type: "same_diag_person",
          refPersonIdx: other,
          weight: 2,
          candidateCells: fullBoard,
        });
      }
      // "compartía habitación con X" nunca se genera contra la víctima:
      // su habitación solo tiene sitio para ella y el asesino, así que
      // esa combinación delataría directamente la solución del caso.
      if (!otherIsVictim && roomOf[orow][ocol] === roomId) {
        facts.push({
          type: "same_room_person",
          refPersonIdx: other,
          weight: 2,
          candidateCells: fullBoard,
        });
      }
      const isNeighborPerson = neighborsOf(r, c, rows, cols, adjacencyMode).some(
        ([nr, nc]) => nr === orow && nc === ocol
      );
      if (!isNeighborPerson) {
        facts.push({
          type: "not_adjacent_person",
          refPersonIdx: other,
          weight: 1,
          candidateCells: fullBoard,
        });
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
    const { rows, cols, roomOf, blockedSet, suspects, rooms, adjacencyMode, victimIdx } = ctx;
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

    // restricciones relacionales persona<->persona (o persona<->víctima):
    // se comprueban EN CUANTO ambos extremos de la relación están
    // fijados (normalmente dentro del propio backtracking, para podar
    // pronto en vez de esperar a tener el tablero entero relleno) y,
    // como red de seguridad final, las que solo se pueden resolver
    // contra la víctima se validan al completar la asignación.
    const RELATIONAL_TYPES = new Set([
      "row_offset_person", "col_offset_person", "same_diag_person",
      "same_room_person", "not_adjacent_person",
    ]);
    const personIdxToPos = new Map();
    suspects.forEach((personIdx, i) => personIdxToPos.set(personIdx, i));

    const relationalFacts = [];
    const relationalByOwnerPos = new Map();
    const relationalByTargetPos = new Map();
    revealed.forEach((factList, i) => {
      (factList || []).forEach((f) => {
        if (!RELATIONAL_TYPES.has(f.type)) return;
        const entry = { suspectPos: i, ...f };
        relationalFacts.push(entry);
        if (!relationalByOwnerPos.has(i)) relationalByOwnerPos.set(i, []);
        relationalByOwnerPos.get(i).push(entry);
        const targetPos = personIdxToPos.get(f.refPersonIdx);
        if (targetPos != null) {
          if (!relationalByTargetPos.has(targetPos)) relationalByTargetPos.set(targetPos, []);
          relationalByTargetPos.get(targetPos).push(entry);
        }
      });
    });

    function relationHolds(rf, mine, other) {
      const [mr, mc] = mine, [orow, ocol] = other;
      switch (rf.type) {
        case "row_offset_person": return (orow - mr) === rf.dr;
        case "col_offset_person": return (ocol - mc) === rf.dc;
        case "same_diag_person": return mr !== orow && Math.abs(orow - mr) === Math.abs(ocol - mc);
        case "same_room_person": return roomOf[mr][mc] === roomOf[orow][ocol];
        case "not_adjacent_person":
          return !neighborsOf(mr, mc, rows, cols, adjacencyMode).some(([nr, nc]) => nr === orow && nc === ocol);
        default: return true;
      }
    }

    // al asignar la posición `i`, comprueba toda relación (propia, o de
    // otro sospechoso ya colocado que apunte a `i`) cuyos DOS extremos
    // ya estén fijados; en cuanto una falla, se puede descartar la rama
    // entera sin seguir explorándola.
    function relationalOkAt(i) {
      const mine = assign[i];
      const owned = relationalByOwnerPos.get(i);
      if (owned) {
        for (const rf of owned) {
          const targetPos = personIdxToPos.get(rf.refPersonIdx);
          if (targetPos == null) continue; // apunta a la víctima: se valida al final
          const other = assign[targetPos];
          if (other && !relationHolds(rf, mine, other)) return false;
        }
      }
      const incoming = relationalByTargetPos.get(i);
      if (incoming) {
        for (const rf of incoming) {
          const owner = assign[rf.suspectPos];
          if (owner && !relationHolds(rf, owner, mine)) return false;
        }
      }
      return true;
    }

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

      // las relaciones sospechoso<->sospechoso ya se podaron durante el
      // backtracking (relationalOkAt); aquí solo falta comprobar las que
      // apuntan a la víctima, cuya celda solo se conoce al completar todo.
      if (relationalFacts.length > 0 && victimIdx != null) {
        const victimCell = [freeRow, freeCol];
        for (const rf of relationalFacts) {
          const targetPos = personIdxToPos.get(rf.refPersonIdx);
          if (targetPos != null) continue; // sospechoso<->sospechoso: ya validado
          const mine = assign[rf.suspectPos];
          if (!relationHolds(rf, mine, victimCell)) return false;
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
        if (relationalOkAt(i)) backtrack(depth + 1);
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
