const M = require("../js/themes.js");

// ------------------------------------------------------------
// Verificador COMPLETAMENTE INDEPENDIENTE del solver interno:
// vuelve a comprobar, desde cero, que la lista de pistas reveladas
// en el puzzle final tiene una única asignación válida, y que esa
// asignación coincide con la solución real generada.
// ------------------------------------------------------------
function key(r, c) { return r + "," + c; }

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
  suspects.forEach((p, i) => {
    p.facts.forEach(f => { if (f.type === "room_count") roomCountFacts.push({ i, ...f }); });
  });

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
      backtrack(depth+1);
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
      if (!cellSatisfiesFact(f, p.cell[0], p.cell[1])) {
        problems.push(`Hecho falso para persona ${p.personIdx}: ${JSON.stringify(f)}`);
      }
      if (f.type === "room_count") {
        const others = puzzle.people.filter(q => q !== p && q.roomId === p.roomId).length;
        if (others !== f.count) problems.push(`room_count incorrecto para persona ${p.personIdx}`);
      }
    });
  });

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
process.exit(failed > 0 ? 1 : 0);
