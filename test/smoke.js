const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

// red de seguridad: si algo deja vivo el event loop (p.ej. un setInterval
// del temporizador del juego), forzamos la salida para no colgar el runner
setTimeout(() => {
  console.error("❌ TIMEOUT: la prueba no terminó a tiempo (¿quedó un temporizador activo?)");
  process.exit(1);
}, 8000);

async function run() {
  const html = `<!DOCTYPE html><html><body><div id="app"></div></body></html>`;
  const dom = new JSDOM(html, { url: "https://example.test/murdoku/", runScripts: "dangerously", pretendToBeVisual: true });
  const { window } = dom;
  // navigator.clipboard no existe en jsdom por defecto
  Object.defineProperty(window.navigator, "clipboard", {
    value: { writeText: () => Promise.resolve() },
    configurable: true,
  });

  function loadScript(relPath) {
    const code = fs.readFileSync(path.join(__dirname, "..", relPath), "utf8");
    const scriptEl = window.document.createElement("script");
    scriptEl.textContent = code;
    window.document.body.appendChild(scriptEl);
  }

  ["js/engine.js", "js/generator.js", "js/themes.js", "js/phrasing.js", "js/app.js"].forEach(loadScript);

  // esperar a que el DOMContentLoaded listener de app.js se dispare
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true, cancelable: true }));

  await new Promise((r) => setTimeout(r, 50));

  const assert = (cond, msg) => {
    if (!cond) throw new Error("FALLO: " + msg);
    console.log("OK:", msg);
  };

  const doc = window.document;
  assert(doc.querySelector(".picker-hero h1").textContent.includes("ASESIDOKU"), "la pantalla de inicio se renderiza");
  assert(doc.querySelectorAll(".theme-card").length >= 14, "hay al menos 14 tarjetas de caso");

  // elegir dificultad "facil" para un tablero pequeño y rápido de resolver
  const facilChip = [...doc.querySelectorAll(".diff-chip")].find((b) => b.textContent.startsWith("Fácil"));
  facilChip.click();
  assert(doc.querySelector(".diff-chip[aria-pressed=\"true\"]").textContent.startsWith("Fácil"), "el chip de dificultad cambia de estado");

  // lanzar el primer caso (clásico)
  const firstCard = doc.querySelector(".theme-card");
  firstCard.click();

  assert(doc.querySelector(".case-title"), "se renderiza el panel del expediente");
  assert(doc.querySelector(".board"), "se renderiza el tablero");
  assert(doc.querySelectorAll(".suspect-card[data-person]").length > 0, "hay fichas de sospechosos");

  const M = window.Murdoku;
  const puzzle = M.generatePuzzle; // solo para confirmar que sigue expuesto
  assert(typeof puzzle === "function", "el motor sigue expuesto en window.Murdoku tras cargar la UI");

  // Vamos a colocar a todos los sospechosos en su celda REAL (usando los
  // datos internos del puzzle activo) simulando clics reales de usuario,
  // para probar el flujo completo de victoria a través del DOM.
  // Accedemos al estado interno indirectamente: recreamos el mismo puzzle
  // no es trivial desde fuera del cierre, así que en su lugar simulamos
  // clics de "armar sospechoso" + "clic en celda" leyendo la posición
  // desde las etiquetas de pista del DOM es complejo; en su lugar
  // verificamos el flujo de interacción básico (armar/colocar/conflicto).

  const cards = [...doc.querySelectorAll(".suspect-card[data-person]")];
  const firstSuspectCard = cards[0];
  firstSuspectCard.click(); // armar
  assert(firstSuspectCard.classList.contains("armed"), "al pulsar una ficha se arma (seleccionada para colocar)");

  const firstCell = doc.querySelector(".cell");
  firstCell.click(); // colocar
  assert(!firstSuspectCard.classList.contains("armed"), "tras colocar, la ficha deja de estar armada");
  assert(firstSuspectCard.classList.contains("placed"), "la ficha queda marcada como colocada");
  assert(firstCell.querySelector(".token"), "aparece una ficha (token) en la celda del tablero");

  // mover la misma ficha a otra celda (recoger y volver a colocar)
  const secondCell = doc.querySelectorAll(".cell")[1];
  secondCell.click(); // como no hay nadie armado y la celda está vacía, no debería hacer nada
  firstCell.click(); // recoger de nuevo (queda armado)
  assert(firstSuspectCard.classList.contains("armed"), "hacer clic en una celda ocupada sin nadie armado la recoge");

  console.log("\n✅ Todas las comprobaciones de humo pasaron.");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
