const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

setTimeout(() => { console.error("❌ TIMEOUT en test/extra.js"); process.exit(1); }, 15000);

function bootDom(url) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`, {
    url: url || "https://example.test/murdoku/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  Object.defineProperty(window.navigator, "clipboard", { value: { writeText: () => Promise.resolve() }, configurable: true });
  ["js/engine.js", "js/generator.js", "js/themes.js", "js/phrasing.js", "js/app.js"].forEach((rel) => {
    const code = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
    const s = window.document.createElement("script");
    s.textContent = code;
    window.document.body.appendChild(s);
  });
  return dom;
}

const assert = (cond, msg) => { if (!cond) throw new Error("FALLO: " + msg); console.log("OK:", msg); };

async function testDoubleMode() {
  const dom = bootDom();
  const { window } = dom;
  const doc = window.document;
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  await new Promise((r) => setTimeout(r, 20));

  const facilChip = [...doc.querySelectorAll(".diff-chip")].find((b) => b.textContent.startsWith("Fácil"));
  facilChip.click();

  const dobleCard = [...doc.querySelectorAll(".theme-card h3")].find((h) => h.textContent.includes("Planta Baja"));
  assert(dobleCard, "existe la tarjeta del caso Doble Crimen (Planta Baja)");
  dobleCard.closest(".theme-card").click();
  await new Promise((r) => setTimeout(r, 20));

  assert(doc.querySelector(".double-tabs"), "aparecen las pestañas del modo doble");
  const tabs = doc.querySelectorAll(".double-tabs button");
  assert(tabs.length === 2, "hay exactamente dos pestañas (planta baja / planta alta)");

  // resolver el lado activo (A)
  let puzzle = window.__murdokuDebug.getPuzzle();
  puzzle.people.filter((p) => !p.isVictim).forEach((s) => {
    doc.querySelector(`.suspect-card[data-person="${s.personIdx}"]`).click();
    const [r, c] = s.cell;
    doc.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`).click();
  });
  await new Promise((r) => setTimeout(r, 20));
  assert(doc.querySelector(".stamp-overlay"), "se resuelve el lado A del caso doble");
  doc.querySelector(".stamp-overlay").remove();

  // cambiar a la pestaña B y comprobar que A quedó marcada con check
  const tabsAfter = [...doc.querySelectorAll(".double-tabs button")];
  assert(tabsAfter[0].querySelector(".check"), "la pestaña A muestra la marca de resuelto");
  tabsAfter[1].click();
  await new Promise((r) => setTimeout(r, 10));

  const puzzleB = window.__murdokuDebug.getPuzzle();
  assert(puzzleB.themeId !== puzzle.themeId, "al cambiar de pestaña se activa el otro sub-caso (planta alta)");
}

async function testConflictAndReveal() {
  const dom = bootDom();
  const { window } = dom;
  const doc = window.document;
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  await new Promise((r) => setTimeout(r, 20));
  const facilChip = [...doc.querySelectorAll(".diff-chip")].find((b) => b.textContent.startsWith("Fácil"));
  facilChip.click();
  doc.querySelector(".theme-card").click();
  await new Promise((r) => setTimeout(r, 20));

  const puzzle = window.__murdokuDebug.getPuzzle();
  const suspects = puzzle.people.filter((p) => !p.isVictim);

  // colocar a los dos primeros sospechosos EN LA MISMA FILA a propósito,
  // eligiendo una fila y columnas que estén libres de mobiliario bloqueado
  const blocked = new Set(puzzle.furniture.filter((f) => !f.occupiable).map((f) => f.r + "," + f.c));
  let row = 0, openCols = [];
  for (let r = 0; r < puzzle.n && openCols.length < 2; r++) {
    const cols = [];
    for (let c = 0; c < puzzle.n; c++) if (!blocked.has(r + "," + c)) cols.push(c);
    if (cols.length >= 2) { row = r; openCols = cols; }
  }
  [suspects[0], suspects[1]].forEach((s, i) => {
    doc.querySelector(`.suspect-card[data-person="${s.personIdx}"]`).click();
    doc.querySelector(`.cell[data-r="${row}"][data-c="${openCols[i]}"]`).click();
  });
  await new Promise((r) => setTimeout(r, 10));

  const card0 = doc.querySelector(`.suspect-card[data-person="${suspects[0].personIdx}"]`);
  const card1 = doc.querySelector(`.suspect-card[data-person="${suspects[1].personIdx}"]`);
  assert(card0.classList.contains("conflict"), "se marca conflicto en la primera ficha (misma fila)");
  assert(card1.classList.contains("conflict"), "se marca conflicto en la segunda ficha (misma fila)");
  assert(!doc.querySelector(".stamp-overlay"), "no se declara victoria mientras hay conflictos");

  // ahora, rendirse y comprobar el sello de "revelado"
  doc.getElementById("btn-reveal").click();
  await new Promise((r) => setTimeout(r, 10));
  const overlay = doc.querySelector(".stamp-overlay");
  assert(overlay, "aparece el sello al revelar la solución");
  assert(overlay.textContent.includes("CASO REVELADO"), "el sello dice CASO REVELADO al rendirse");
}

async function testShareableCode() {
  const dom1 = bootDom();
  const w1 = dom1.window;
  w1.document.dispatchEvent(new w1.Event("DOMContentLoaded"));
  await new Promise((r) => setTimeout(r, 20));
  const facilChip = [...w1.document.querySelectorAll(".diff-chip")].find((b) => b.textContent.startsWith("Media"));
  facilChip.click();
  w1.document.querySelector(".theme-card").click();
  await new Promise((r) => setTimeout(r, 20));

  const puzzle1 = w1.__murdokuDebug.getPuzzle();
  const hash = w1.location.hash;
  assert(hash && hash.length > 1, "se genera un código de caso en la URL al empezar a jugar");

  const dom2 = bootDom("https://example.test/murdoku/" + hash);
  const w2 = dom2.window;
  w2.document.dispatchEvent(new w2.Event("DOMContentLoaded"));
  await new Promise((r) => setTimeout(r, 20));
  const puzzle2 = w2.__murdokuDebug.getPuzzle();

  assert(puzzle2.themeId === puzzle1.themeId, "cargar la URL compartida reconstruye el mismo tema");
  assert(puzzle2.seed === puzzle1.seed, "cargar la URL compartida reconstruye la misma semilla");
  const same = puzzle1.people.every((p, i) => p.cell[0] === puzzle2.people[i].cell[0] && p.cell[1] === puzzle2.people[i].cell[1]);
  assert(same, "el caso reconstruido desde el código tiene EXACTAMENTE la misma solución");
}

(async () => {
  await testDoubleMode();
  await testConflictAndReveal();
  await testShareableCode();
  console.log("\n✅ Todas las pruebas adicionales (doble caso, conflictos, revelar, código compartible) pasaron.");
  process.exit(0);
})().catch((e) => { console.error("❌", e); process.exit(1); });
