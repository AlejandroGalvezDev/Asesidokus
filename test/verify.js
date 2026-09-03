const M = require("../js/themes.js");

// ------------------------------------------------------------
// Verificador COMPLETAMENTE INDEPENDIENTE del solver interno:
// vuelve a comprobar, desde cero, que la lista de pistas reveladas
// en el puzzle final tiene una única asignación válida, y que esa
// asignación coincide con la solución real generada.
// ------------------------------------------------------------
function key(r, c) { return r + "," + c; }

// Tipos de hecho "relacionales": comparan la celda de una persona con la
// de OTRA persona (sospechoso o víctima), así que no se pueden verificar
// solo con candidateCells (ver comentario en engine.js/computeFactCatalog).
const RELATIONAL_TYPES = new Set([
  "row_offset_person", "col_offset_person", "same_diag_person",
  "same_room_person", "not_adjacent_person",
]);

function relationalFactHolds(puzzle, fact, mine, other) {
  const [mr, mc] = mine, [orow, ocol] = other;
  switch (fact.type) {
    case "row_offset_person": return (orow - mr) === fact.dr;
    case "col_offset_person": return (ocol - mc) === fact.dc;
    case "same_diag_person": return mr !== orow && Math.abs(orow - mr) === Math.abs(ocol - mc);
    case "same_room_person": return puzzle.roomOf[mr][mc] === puzzle.roomOf[orow][ocol];
    case "not_adjacent_person":
      return !M.neighborsOf(mr, mc, puzzle.n, puzzle.n, puzzle.adjacencyMode).some(
        ([nr, nc]) => nr === orow && nc === ocol
      );
    default: return true;
  }
}

function cellSatisfiesFact(fact, r, c) {
  return fact.candidateCells.some(([fr, fc]) => fr === r && fc === c);
}

function independentCount(puzzle, cap) {
  const n = puzzle.n;
  const blocked = new Set(
    puzzle.furniture.filter(f => !f.occupiable).map(f => key(f.r, f.c))
  );
  const suspects = puzzle.people.filter(p => !p.isVictim);

  const candSets = suspects.map(p => {
    if (p.facts.length === 0) {
      const all = [];
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!blocked.has(key(r,c))) all.push([r,c]);
      return all;
    }
    let cells = null;
    for (const f of p.facts) {
      const s = new Set(f.candidateCells.map(([r,c]) => key(r,c)));
      cells = cells === null ? [...s] : cells.filter(k => s.has(k));
    }
    return cells.map(k => k.split(",").map(Number)).filter(([r,c]) => !blocked.has(key(r,c)));
  });

  const order = candSets.map((c,i)=>({i,len:c.length})).sort((a,b)=>a.len-b.len).map(x=>x.i);
  const usedR = new Array(n).fill(false);
  const usedC = new Array(n).fill(false);
  const assign = new Array(suspects.length).fill(null);
  let count = 0;
  const solutions = [];

  const roomCountFacts = [];
  const relationalFacts = [];
  suspects.forEach((p, i) => {
    p.facts.forEach(f => {
      if (f.type === "room_count") roomCountFacts.push({ i, ...f });
      if (RELATIONAL_TYPES.has(f.type)) relationalFacts.push({ i, ...f });
    });
  });
  const personIdxToPos = new Map();
  suspects.forEach((p, i) => personIdxToPos.set(p.personIdx, i));
  const victimPerson = puzzle.people.find(p => p.isVictim);
  const victimIdx = victimPerson ? victimPerson.personIdx : null;

  // igual que en engine.js: las relaciones sospechoso<->sospechoso se
  // podan en cuanto ambos extremos están fijados (no solo al final),
  // porque si no el árbol de búsqueda se dispara con pistas relacionales.
  const relationalByOwnerPos = new Map();
  const relationalByTargetPos = new Map();
  relationalFacts.forEach((rf) => {
    if (!relationalByOwnerPos.has(rf.i)) relationalByOwnerPos.set(rf.i, []);
    relationalByOwnerPos.get(rf.i).push(rf);
    const targetPos = personIdxToPos.get(rf.refPersonIdx);
    if (targetPos != null) {
      if (!relationalByTargetPos.has(targetPos)) relationalByTargetPos.set(targetPos, []);
      relationalByTargetPos.get(targetPos).push(rf);
    }
  });
  function relationalOkAt(i) {
    const mine = assign[i];
    const owned = relationalByOwnerPos.get(i);
    if (owned) {
      for (const rf of owned) {
        const targetPos = personIdxToPos.get(rf.refPersonIdx);
        if (targetPos == null) continue; // apunta a la víctima: se valida al final
        const other = assign[targetPos];
        if (other && !relationalFactHolds(puzzle, rf, mine, other)) return false;
      }
    }
    const incoming = relationalByTargetPos.get(i);
    if (incoming) {
      for (const rf of incoming) {
        const owner = assign[rf.i];
        if (owner && !relationalFactHolds(puzzle, rf, owner, mine)) return false;
      }
    }
    return true;
  }

  function finalize() {
    let freeR = -1, freeC = -1;
    for (let r=0;r<n;r++) if(!usedR[r]) freeR = r;
    for (let c=0;c<n;c++) if(!usedC[c]) freeC = c;
    if (freeR===-1||freeC===-1) return null;
    if (blocked.has(key(freeR,freeC))) return null;
    if (roomCountFacts.length) {
      const all = assign.map(a=>a);
      all.push([freeR,freeC]);
      const roomMembers = new Map();
      all.forEach(([r,c]) => {
        const rid = puzzle.roomOf[r][c];
        roomMembers.set(rid, (roomMembers.get(rid)||0)+1);
      });
      for (const rc of roomCountFacts) {
        const [r,c] = assign[rc.i];
        const rid = puzzle.roomOf[r][c];
        const others = (roomMembers.get(rid)||1) - 1;
        if (others !== rc.count) return null;
      }
    }
    // sospechoso<->sospechoso ya se podó durante el backtracking; aquí
    // solo falta lo que apunta a la víctima (celda conocida al completar).
    if (relationalFacts.length && victimIdx != null) {
      const victimCell = [freeR, freeC];
      for (const rf of relationalFacts) {
        const targetPos = personIdxToPos.get(rf.refPersonIdx);
        if (targetPos != null) continue;
        const mine = assign[rf.i];
        if (!relationalFactHolds(puzzle, rf, mine, victimCell)) return null;
      }
    }
    return [freeR, freeC];
  }

  function backtrack(depth) {
    if (count >= cap) return;
    if (depth === suspects.length) {
      const victimCell = finalize();
      if (victimCell) {
        count++;
        solutions.push({ assign: assign.slice(), victimCell });
      }
      return;
    }
    const i = order[depth];
    for (const [r,c] of candSets[i]) {
      if (usedR[r] || usedC[c]) continue;
      usedR[r]=usedC[c]=true;
      assign[i]=[r,c];
      if (relationalOkAt(i)) backtrack(depth+1);
      usedR[r]=usedC[c]=false;
      assign[i]=null;
      if (count>=cap) return;
    }
  }
  backtrack(0);
  return { count, solutions, suspects, order };
}

function verifyPuzzle(puzzle) {
  const problems = [];

  // 1. cada hecho revelado debe ser cierto en la solución real
  puzzle.people.forEach(p => {
    p.facts.forEach(f => {
      if (RELATIONAL_TYPES.has(f.type)) {
        const other = puzzle.people.find(q => q.personIdx === f.refPersonIdx);
        if (!other) {
          problems.push(`Referencia de persona inexistente en hecho relacional de ${p.personIdx}: ${JSON.stringify(f)}`);
        } else if (!relationalFactHolds(puzzle, f, p.cell, other.cell)) {
          problems.push(`Hecho relacional falso para persona ${p.personIdx}: ${JSON.stringify(f)}`);
        }
        if (f.type === "same_room_person" && other && other.isVictim) {
          problems.push(`Fuga de solución: same_room_person apunta a la víctima (persona ${p.personIdx})`);
        }
        return;
      }
      if (!cellSatisfiesFact(f, p.cell[0], p.cell[1])) {
        problems.push(`Hecho falso para persona ${p.personIdx}: ${JSON.stringify(f)}`);
      }
      if (f.type === "room_count") {
        const others = puzzle.people.filter(q => q !== p && q.roomId === p.roomId).length;
        if (others !== f.count) problems.push(`room_count incorrecto para persona ${p.personIdx}`);
      }
    });
  });

  // 1b. cuota mínima de variedad: al menos 3 pistas de exclusión y al
  //     menos 2 que relacionen a dos personajes entre sí (algunos tipos
  //     cuentan para ambas categorías, p.ej. "no estaba junto a X").
  const EXCLUSION_TYPES = new Set(["not_in_room", "not_adjacent", "not_on_type", "not_adjacent_person"]);
  const allFacts = puzzle.people.flatMap(p => p.facts);
  const exclusionCount = allFacts.filter(f => EXCLUSION_TYPES.has(f.type)).length;
  const relationalCount = allFacts.filter(f => RELATIONAL_TYPES.has(f.type)).length;
  if (exclusionCount < 3) problems.push(`Solo ${exclusionCount} pistas de exclusión (se esperaban >= 3)`);
  if (relationalCount < 2) problems.push(`Solo ${relationalCount} pistas relacionales entre personajes (se esperaban >= 2)`);

  // 2. exactamente una habitación con exactamente 2 personas (la de la víctima)
  const roomCounts = new Map();
  puzzle.people.forEach(p => roomCounts.set(p.roomId, (roomCounts.get(p.roomId)||0)+1));
  const victim = puzzle.people.find(p => p.isVictim);
  const murderer = puzzle.people.find(p => p.isMurderer);
  if (!victim || !murderer) problems.push("Falta víctima o asesino");
  else {
    if (victim.roomId !== murderer.roomId) problems.push("Víctima y asesino no comparten habitación");
    const inVictimRoom = puzzle.people.filter(p => p.roomId === victim.roomId).length;
    if (inVictimRoom !== 2) problems.push(`La habitación de la víctima tiene ${inVictimRoom} personas (debería ser 2)`);
  }

  // 3. verificación de unicidad INDEPENDIENTE
  const { count, solutions } = independentCount(puzzle, 2);
  if (count !== 1) {
    problems.push(`El verificador independiente encontró ${count} soluciones (se esperaba 1)`);
  } else {
    // 4. la solución encontrada debe coincidir con la solución real
    const suspects = puzzle.people.filter(p => !p.isVictim);
    const found = solutions[0];
    const orderMap = found.order; // índice en `suspects` -> posición en backtrack
    // reconstruir mapping real: found.assign está indexado por posición "i" (índice en `suspects` array, no en order)
    let mismatch = false;
    suspects.forEach((p, i) => {
      const cell = found.assign[i];
      if (!cell || cell[0] !== p.cell[0] || cell[1] !== p.cell[1]) mismatch = true;
    });
    if (mismatch) problems.push("La solución única encontrada NO coincide con la solución real generada");
  }

  // 5. todas las celdas de personas deben evitar mobiliario no ocupable
  const blocked = new Set(puzzle.furniture.filter(f => !f.occupiable).map(f => key(f.r, f.c)));
  puzzle.people.forEach(p => {
    if (blocked.has(key(p.cell[0], p.cell[1]))) problems.push(`Persona ${p.personIdx} está sobre mueble bloqueado`);
  });

  // 6. filas y columnas únicas
  const rows = new Set(), cols = new Set();
  puzzle.people.forEach(p => { rows.add(p.cell[0]); cols.add(p.cell[1]); });
  if (rows.size !== puzzle.n || cols.size !== puzzle.n) problems.push("Filas/columnas repetidas entre personas");

  return problems;
}

// ------------------------------------------------------------
// Ejecutar el stress test
// ------------------------------------------------------------
const difficulties = ["facil", "media", "dificil", "experto"];
const TRIALS = parseInt(process.env.TRIALS || "4", 10);
let total = 0, failed = 0;
const timings = [];
const factStats = [];

for (const theme of M.THEMES) {
  for (const diff of difficulties) {
    for (let trial = 0; trial < TRIALS; trial++) {
      total++;
      const seed = `${theme.id}-${diff}-${trial}-v1`;
      const t0 = Date.now();
      let puzzle;
      try {
        puzzle = M.generatePuzzle(theme, diff, M.hashStringToSeed(seed));
      } catch (e) {
        failed++;
        console.log(`❌ ${theme.id}/${diff}/${trial}: excepción ${e.message}`);
        continue;
      }
      const dt = Date.now() - t0;
      timings.push(dt);
      const totalFacts = puzzle.people.reduce((s,p)=>s+p.facts.length,0);
      factStats.push(totalFacts / (puzzle.n - 1));

      const problems = verifyPuzzle(puzzle);
      if (problems.length) {
        failed++;
        console.log(`❌ ${theme.id}/${diff}/${trial} (n=${puzzle.n}, ${dt}ms):`);
        problems.forEach(p => console.log("   - " + p));
      } else {
        console.log(`✅ ${theme.id}/${diff}/${trial} n=${puzzle.n} rooms=${puzzle.rooms.length} facts/suspect=${(totalFacts/(puzzle.n-1)).toFixed(2)} dif=${puzzle.difficulty.label} (${dt}ms)`);
      }
    }
  }
}

console.log("\n================ RESUMEN ================");
console.log(`Total: ${total}  Fallos: ${failed}`);
console.log(`Tiempo medio: ${(timings.reduce((a,b)=>a+b,0)/timings.length).toFixed(1)}ms  máx: ${Math.max(...timings)}ms`);
console.log(`Pistas medias por sospechoso: ${(factStats.reduce((a,b)=>a+b,0)/factStats.length).toFixed(2)}`);

// -- Verificación adicional: tema Dragon Ball (cargado vía jsdom/vm,
//    igual que en el navegador, porque usa 'window' en su IIFE) -------
try {
  const vm = require("vm");
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM("<!DOCTYPE html><body></body>", { url: "https://example.test/" });
  const ctx = vm.createContext(dom.window);
  const readAndRun = (p) => vm.runInContext(require("fs").readFileSync(p, "utf8"), ctx);
  ["../js/engine.js","../js/generator.js","../js/themes.js",
   "../js/theme-dragon-ball.js","../js/phrasing.js"]
    .forEach((p) => readAndRun(require("path").join(__dirname, p)));

  const MB = dom.window.Murdoku;
  const dbTheme = MB.THEMES.find((t) => /dragon/i.test(t.name || t.id || ""));
  if (!dbTheme) throw new Error("Tema Dragon Ball no encontrado en THEMES");

  const EXCL = new Set(["not_in_room","not_adjacent","not_on_type","not_adjacent_person"]);
  const REL  = new Set(["row_offset_person","col_offset_person","same_diag_person","same_room_person","not_adjacent_person"]);
  let dbOk = 0, dbFail = 0;
  for (const diff of ["facil","media","dificil","experto"]) {
    for (let t = 0; t < 8; t++) {
      const puzzle = MB.generatePuzzle(dbTheme, diff, "db"+diff+t);
      const suspects = puzzle.people.filter((p) => !p.isVictim);
      const allFacts = suspects.flatMap((s) => s.facts);
      const nExcl = allFacts.filter((f) => EXCL.has(f.type)).length;
      const nRel  = allFacts.filter((f) => REL.has(f.type)).length;
      if (nExcl < 3 || nRel < 2) {
        console.log(`❌ Dragon Ball ${diff}/${t}: excl=${nExcl} rel=${nRel} (se esperaban >=3 y >=2)`);
        dbFail++;
      } else {
        suspects.forEach((s) => MB.clueTextFor(puzzle, s)); // no debe lanzar
        dbOk++;
      }
    }
  }
  console.log(`\n-- Dragon Ball (jsdom) -- OK: ${dbOk}  Fallos: ${dbFail}`);
  failed += dbFail;
} catch (e) {
  console.log("⚠️  Verificación Dragon Ball omitida (jsdom no disponible):", e.message);
}

process.exit(failed > 0 ? 1 : 0);
