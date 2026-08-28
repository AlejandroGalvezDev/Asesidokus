const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

setTimeout(() => {
  console.error("❌ TIMEOUT en test/solve.js");
  process.exit(1);
}, 15000);

async function run() {
  const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`, {
    url: "https://example.test/murdoku/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  Object.defineProperty(window.navigator, "clipboard", {
    value: { writeText: () => Promise.resolve() },
    configurable: true,
  });

  ["js/engine.js", "js/generator.js", "js/themes.js", "js/phrasing.js", "js/app.js"].forEach((rel) => {
    const code = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
    const s = window.document.createElement("script");
    s.textContent = code;
    window.document.body.appendChild(s);
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  await new Promise((r) => setTimeout(r, 30));

  const doc = window.document;
  const assert = (cond, msg) => { if (!cond) throw new Error("FALLO: " + msg); console.log("OK:", msg); };

  let successes = 0;
  const THEMES_TO_TRY = doc.defaultView.Murdoku.THEMES.map((t) => t.id).filter((id) => id !== "doble_b");

  for (const themeId of THEMES_TO_TRY) {
    // volver al selector y elegir dificultad fácil para acelerar
    const backBtn = doc.querySelector(".brand");
    if (backBtn) backBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    const facilChip = [...doc.querySelectorAll(".diff-chip")].find((b) => b.textContent.startsWith("Fácil"));
    facilChip.click();

    const card = [...doc.querySelectorAll(".theme-card h3")].find((h) => {
      const theme = window.Murdoku.THEME_BY_ID[themeId];
      return h.textContent === theme.name;
    });
    assert(card, `existe la tarjeta del tema ${themeId}`);
    card.closest(".theme-card").click();
    await new Promise((r) => setTimeout(r, 10));

    const puzzle = window.__murdokuDebug.getPuzzle();
    assert(puzzle && puzzle.themeId === themeId, `el puzzle activo corresponde al tema ${themeId}`);

    const suspects = puzzle.people.filter((p) => !p.isVictim);
    for (const s of suspects) {
      const cardEl = doc.querySelector(`.suspect-card[data-person="${s.personIdx}"]`);
      assert(cardEl, `existe la ficha del sospechoso ${s.name}`);
      cardEl.click(); // armar
      const [r, c] = s.cell;
      const cellEl = doc.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      assert(cellEl, `existe la celda (${r},${c}) para ${s.name}`);
      cellEl.click(); // colocar en la celda REAL de la solución
    }

    await new Promise((r) => setTimeout(r, 20));

    const overlay = doc.querySelector(".stamp-overlay");
    assert(overlay, `aparece el sello de resolución para ${themeId}`);
    assert(overlay.textContent.includes("CASO CERRADO"), `el sello dice CASO CERRADO para ${themeId}`);
    const murderer = puzzle.people.find((p) => p.isMurderer);
    assert(overlay.textContent.includes(murderer.name), `el sello nombra correctamente al asesino (${murderer.name}) para ${themeId}`);
    overlay.remove();
    successes++;
  }

  console.log(`\n✅ ${successes}/${THEMES_TO_TRY.length} casos resueltos de extremo a extremo vía DOM simulado.`);
  process.exit(0);
}

run().catch((e) => { console.error("❌", e); process.exit(1); });
