/**
 * MURDOKU — frases en español
 * ------------------------------------------------------------
 * Convierte los "hechos" estructurados que genera engine.js en las
 * frases que ve el jugador en la ficha de cada sospechoso. No decide
 * NADA sobre qué pista mostrar (eso ya lo decidió generator.js);
 * solo las traduce a un español natural.
 */
(function (root) {
  "use strict";

  const M = typeof module !== "undefined" && module.exports ? require("./themes.js") : root.Murdoku;

  // -- Diccionario de género por sustantivo "cabeza" de la frase --------
  // Suficiente para cubrir todas las habitaciones y muebles del catálogo
  // de temas. Si aparece una palabra nueva que no está aquí, se usa una
  // heurística razonable (ver spanishArticle).
  const GENDER = {
    // habitaciones
    salón: "el", dormitorio: "el", habitación: "la", comedor: "el", cocina: "la",
    baño: "el", despacho: "el", recibidor: "el", mirador: "el", puente: "el",
    campamento: "el", cascada: "la", refugio: "el", cruce: "el", bosque: "el",
    claro: "el", sala: "la", escalera: "la", almacén: "el", muelle: "el",
    cuarto: "el", sótano: "el", terraza: "la", bodega: "la", vestíbulo: "el",
    jardín: "el", campo: "el", banquillo: "el", vestuario: "el", túnel: "el",
    grada: "la", garaje: "el", porche: "el", parque: "el", buzones: "los",
    patio: "el", calle: "la", cúpula: "la", biblioteca: "la", cafetería: "la",
    planetario: "el", recepción: "la", cubículos: "los", archivo: "el",
    pista: "la", zona: "la", cubierta: "la", camarote: "el", timón: "el",
    mástil: "el", trastero: "el", ático: "el", balcón: "el", armería: "la",
    barracones: "los", torre: "la", establos: "los", capilla: "la",
    muralla: "la", mazmorra: "la", foso: "el", box: "el", podio: "el",
    club: "el", paddock: "el",
    // muebles
    cama: "la", silla: "la", alfombra: "la", planta: "la", ventana: "la",
    tv: "la", mesa: "la", tronco: "el", roca: "la", hoguera: "la",
    mochila: "la", cartel: "el", tienda: "la", baúl: "el", hamaca: "la",
    farol: "el", ancla: "el", mapa: "el", reloj: "el", sofá: "el",
    candelabro: "el", piano: "el", jarrón: "el", banco: "el", balón: "el",
    trofeo: "el", portería: "la", botiquín: "el", marcador: "el",
    tumbona: "la", farola: "la", coche: "el", bicicleta: "la", buzón: "el",
    puf: "el", telescopio: "el", globo: "el", máquina: "la", impresora: "la",
    pizarra: "la", cafetera: "la", camilla: "la", disco: "el", percha: "la",
    rueda: "la", cañón: "el", cofre: "el", barril: "el", escritorio: "el",
    espejo: "el", lámpara: "la", catre: "el", casilla: "la", radio: "la",
    bandera: "la", trono: "el", yacija: "la", armadura: "la", estandarte: "el",
    brasero: "el", antorcha: "la", campana: "la", neumático: "el", monitor: "el",
    zamboni: "la",
  };

  function normalize(w) {
    return w.toLowerCase().replace(/[().,✦]/g, "");
  }

  function spanishArticle(phrase) {
    const words = phrase.split(/\s+/).map(normalize).filter(Boolean);
    if (words.length === 0) return "el";
    if (GENDER[words[0]]) return GENDER[words[0]];
    const last = words[words.length - 1];
    if (GENDER[last]) return GENDER[last];
    // heurística de respaldo
    const w = words[0];
    if (/(ción|sión|dad|tud|umbre|ie)$/.test(w)) return "la";
    if (/a$/.test(w)) return "la";
    return "el";
  }
  M.spanishArticle = M.spanishArticle || spanishArticle;

  function withArticle(name) {
    return `${spanishArticle(name)} ${name}`;
  }

  // "de" + artículo, con la contracción "del" cuando corresponde
  function deArticle(name) {
    const art = spanishArticle(name);
    return art === "el" ? `del ${name}` : `de ${art} ${name}`;
  }
  // "a" + artículo, con la contracción "al" cuando corresponde (uso interno)
  function aArticle(name) {
    const art = spanishArticle(name);
    return art === "el" ? `al ${name}` : `a ${art} ${name}`;
  }
  void aArticle; // reservado por si se necesita fuera de furnitureAfterPrep

  // -- Descripción de un mueble concreto (con artículo), con
  //    desambiguación por sala cuando hay más de uno del mismo tipo --
  function furniturePhrase(puzzle, furnitureId) {
    const f = puzzle.furniture.find((x) => x.id === furnitureId);
    if (!f) return "un elemento de la escena";
    const sameTypeCount = puzzle.furniture.filter((x) => x.typeId === f.typeId).length;
    if (sameTypeCount === 1) return f.label;
    const roomName = puzzle.roomNameById[f.roomId];
    return `${f.label} ${deArticle(roomName)}`;
  }
  // versión con artículo delante, para contextos sin contracción ("sobre X", "que X")
  function describeFurniture(puzzle, furnitureId) {
    const f = puzzle.furniture.find((x) => x.id === furnitureId);
    const art = f ? spanishArticle(f.label) : "el";
    return `${art} ${furniturePhrase(puzzle, furnitureId)}`;
  }
  // versión para pegar tras una preposición "a" o "de" (con contracción)
  function furnitureAfterPrep(puzzle, furnitureId, prep) {
    const f = puzzle.furniture.find((x) => x.id === furnitureId);
    const phrase = furniturePhrase(puzzle, furnitureId);
    const art = f ? spanishArticle(f.label) : "el";
    if (prep === "a") return art === "el" ? `al ${phrase}` : `a ${art} ${phrase}`;
    if (prep === "de") return art === "el" ? `del ${phrase}` : `de ${art} ${phrase}`;
    return `${prep} ${art} ${phrase}`;
  }

  function describeFurnitureType(puzzle, typeId) {
    const t = puzzle.furniture.find((x) => x.typeId === typeId);
    return t ? withArticle(t.label) : "un mueble";
  }

  // -- Un hecho -> una frase --------------------------------------------
  function factSentence(puzzle, fact) {
    const roomName = fact.roomId != null ? puzzle.roomNameById[fact.roomId] : null;
    switch (fact.type) {
      case "room":
        return `Estaba en ${withArticle(roomName)}.`;
      case "corner":
        return `Estaba en una esquina ${deArticle(roomName)}.`;
      case "room_count":
        if (fact.count === 0) return `Estaba solo/a en ${withArticle(roomName)}.`;
        if (fact.count === 1) return `Estaba en ${withArticle(roomName)} con otra persona.`;
        return `Estaba en ${withArticle(roomName)} con otras ${numberWord(fact.count)} personas.`;
      case "adjacent": {
        if (puzzle.adjacencyMode === "knight") {
          return `Estaba a un movimiento de caballo de ajedrez ${furnitureAfterPrep(puzzle, fact.furnitureId, "de")}.`;
        }
        const suffix = puzzle.adjacencyMode === "diagonal8" ? " (aquí también cuentan las diagonales)" : "";
        return `Estaba junto ${furnitureAfterPrep(puzzle, fact.furnitureId, "a")}${suffix}.`;
      }
      case "on":
        return `Estaba sobre ${describeFurniture(puzzle, fact.furnitureId)}.`;
      case "on_unique":
        return `Era la única persona de todo el caso sobre ${describeFurnitureType(puzzle, puzzle.furniture.find(f=>f.id===fact.furnitureId).typeId)}.`;
      case "same_row":
        return `Estaba en la misma fila que ${describeFurniture(puzzle, fact.furnitureId)}.`;
      case "same_col":
        return `Estaba en la misma columna que ${describeFurniture(puzzle, fact.furnitureId)}.`;
      default:
        return "";
    }
  }

  function numberWord(n) {
    const words = ["cero", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho"];
    return words[n] || String(n);
  }

  function clueTextFor(puzzle, person) {
    if (person.isVictim) return "Fue hallada/o en la última posición restante, tras ubicar a todos los demás.";
    if (!person.facts || person.facts.length === 0) return "Sin pista directa: se deduce por eliminación.";
    return person.facts.map((f) => factSentence(puzzle, f)).join(" ");
  }

  M.describeFurniture = describeFurniture;
  M.clueTextFor = clueTextFor;
  M.factSentence = factSentence;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = M;
  } else {
    root.Murdoku = M;
  }
})(typeof window !== "undefined" ? window : globalThis);
