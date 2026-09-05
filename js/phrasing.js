/**
 * MURDOKU — frases en español
 * ------------------------------------------------------------
 * Convierte los "hechos" estructurados que genera engine.js en las
 * frases que ve el jugador en la ficha de cada sospechoso. No decide
 * NADA sobre qué pista mostrar (eso ya lo decidió generator.js);
 * solo las traduce a un español natural, variado y evocador, sin
 * revelar nunca la solución de forma directa.
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
    // Dragon Ball
    nube: "la", bola: "la", radar: "el", nave: "la", anillos: "los",
    // Dragon Ball — objetos específicos para asegurar artículo correcto
    "nave goku": "la", "nave de trunks": "la",
    capsule: "la", dende: "el", arale: "la", ulong: "el",
    // "Tao Pai Pai" → primera palabra "tao", heurística → "el" (correcto)
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
  // "ningún/ninguna X" (para pistas de exclusión sobre un tipo de mueble)
  function noneOfType(puzzle, typeId) {
    const t = puzzle.furniture.find((x) => x.typeId === typeId);
    const label = t ? t.label : "mueble";
    const art = spanishArticle(label);
    return `${art === "el" ? "ningún" : "ninguna"} ${label}`;
  }

  // -- Nombre de otra persona (sospechoso o víctima) a partir de su
  //    personIdx "en crudo" — usado por las pistas relacionales --
  function personName(puzzle, personIdx) {
    const p = puzzle.people && puzzle.people.find((x) => x.personIdx === personIdx);
    return p ? p.name : "otra persona presente en el caso";
  }

  // -- Selección determinista de una plantilla entre varias -------------
  // Con la misma semilla de caso, el mismo hecho SIEMPRE produce la misma
  // frase (para que un código de caso compartido se vea igual al abrirlo),
  // pero hechos distintos —o casos distintos— varían con naturalidad.
  function templateChoice(puzzle, seedKey, options) {
    if (options.length === 1) return options[0];
    const seed = M.hashStringToSeed(`${puzzle.seed}|${seedKey}`);
    const rng = M.makeRng(seed);
    return options[Math.floor(rng() * options.length)];
  }

  // -- Verbo/acción según el tipo de mueble (por icono, agrupa "mobiliario
  //    para tumbarse", "para sentarse" y el resto) — aporta variedad de
  //    tipo "acción o estado" sin inventar datos que no estén en el tema --
  function actionTemplatesFor(icon) {
    if (icon === "🛏️") return ["Estaba tumbada/o en {X}.", "Descansaba en {X}.", "Reposaba en {X}."];
    if (icon === "🪑" || icon === "🛋️") return ["Estaba sentada/o en {X}.", "Ocupaba {X}.", "Se había acomodado en {X}."];
    if (icon === "☁️") return ["Volaba sobre {X}.", "Surcaba el cielo en {X}.", "Se desplazaba en {X}."];
    if (icon === "🚀" || icon === "🛸") return ["Viajaba a bordo de {X}.", "Estaba dentro de {X}.", "Se encontraba en {X}."];
    if (icon === "📡") return ["Manejaba {X}.", "Rastreaba las bolas con {X}.", "Estaba junto a {X}."];
    if (icon === "💍") return ["Llevaba {X}.", "Portaba {X}.", "Sostenía {X}."];
    return ["Estaba sobre {X}.", "Se encontraba sobre {X}.", "Permanecía sobre {X}."];
  }
  function actionUniqueTemplatesFor(icon) {
    if (icon === "🛏️") return ["tumbada/o en", "descansando en"];
    if (icon === "🪑" || icon === "🛋️") return ["sentada/o en", "acomodada/o en"];
    if (icon === "☁️") return ["volando en", "surcando el cielo en"];
    if (icon === "🚀" || icon === "🛸") return ["a bordo de", "viajando en"];
    if (icon === "📡") return ["manejando", "rastreando con"];
    if (icon === "💍") return ["portando", "llevando"];
    return ["sobre", "junto a"];
  }

  function pluralize(word, n) {
    return n === 1 ? word : `${word}s`;
  }

  // -- Un hecho -> una frase --------------------------------------------
  function factSentence(puzzle, fact) {
    const roomName = fact.roomId != null ? puzzle.roomNameById[fact.roomId] : null;
    const seedKey = `${fact.type}:${fact.furnitureId ?? ""}:${fact.roomId ?? ""}:${fact.count ?? ""}:${fact.refPersonIdx ?? ""}:${fact.dr ?? ""}:${fact.dc ?? ""}:${fact.furnitureTypeId ?? ""}`;
    const pick = (options) => templateChoice(puzzle, seedKey, options);

    switch (fact.type) {
      // -- Ubicación concreta --------------------------------------
      case "room":
        return pick([
          `Estaba en ${withArticle(roomName)}.`,
          `Se encontraba en ${withArticle(roomName)}.`,
          `La situaban en ${withArticle(roomName)} en el momento de los hechos.`,
        ]);
      case "corner":
        return pick([
          `Estaba en una esquina ${deArticle(roomName)}.`,
          `Se había quedado en un rincón ${deArticle(roomName)}.`,
        ]);
      case "room_count":
        if (fact.count === 0) {
          return pick([
            `Estaba solo/a en ${withArticle(roomName)}.`,
            `Nadie más la/lo acompañaba en ${withArticle(roomName)}.`,
          ]);
        }
        if (fact.count === 1) return `Estaba en ${withArticle(roomName)} con otra persona.`;
        return `Estaba en ${withArticle(roomName)} con otras ${numberWord(fact.count)} personas.`;

      // -- Objeto / superficie + acción o estado --------------------
      case "adjacent": {
        if (puzzle.adjacencyMode === "knight") {
          return `Estaba a un movimiento de caballo de ajedrez ${furnitureAfterPrep(puzzle, fact.furnitureId, "de")}.`;
        }
        const suffix = puzzle.adjacencyMode === "diagonal8" ? " (aquí también cuentan las diagonales)" : "";
        return pick([
          `Estaba junto ${furnitureAfterPrep(puzzle, fact.furnitureId, "a")}${suffix}.`,
          `Se encontraba al lado ${furnitureAfterPrep(puzzle, fact.furnitureId, "de")}${suffix}.`,
        ]);
      }
      case "on": {
        const f = puzzle.furniture.find((x) => x.id === fact.furnitureId);
        const templates = actionTemplatesFor(f ? f.icon : "");
        return pick(templates).replace("{X}", describeFurniture(puzzle, fact.furnitureId));
      }
      case "on_unique": {
        const f = puzzle.furniture.find((x) => x.id === fact.furnitureId);
        const typeId = f ? f.typeId : null;
        const verb = pick(actionUniqueTemplatesFor(f ? f.icon : ""));
        return pick([
          `Era la única persona de todo el caso ${verb} ${describeFurnitureType(puzzle, typeId)}.`,
          `Nadie más en todo el caso estaba ${verb} ${describeFurnitureType(puzzle, typeId)}.`,
        ]);
      }

      // -- Posición relativa / diagonal-columna, respecto a un mueble --
      case "same_row":
        return pick([
          `Estaba en la misma fila que ${describeFurniture(puzzle, fact.furnitureId)}.`,
          `Compartía fila con ${describeFurniture(puzzle, fact.furnitureId)}.`,
        ]);
      case "same_col":
        return pick([
          `Estaba en la misma columna que ${describeFurniture(puzzle, fact.furnitureId)}.`,
          `Compartía columna con ${describeFurniture(puzzle, fact.furnitureId)}.`,
        ]);
      case "same_diag":
        return pick([
          `Estaba en la misma diagonal que ${describeFurniture(puzzle, fact.furnitureId)}.`,
          `Quedaba alineada/o en diagonal con ${describeFurniture(puzzle, fact.furnitureId)}.`,
        ]);

      // -- Exclusión ---------------------------------------------------
      case "not_adjacent":
        return pick([
          `No estaba junto ${furnitureAfterPrep(puzzle, fact.furnitureId, "a")}.`,
          `No se encontraba cerca ${furnitureAfterPrep(puzzle, fact.furnitureId, "de")}.`,
        ]);
      case "not_in_room":
        return pick([
          `No estaba en ${withArticle(puzzle.roomNameById[fact.roomId])}.`,
          `No fue vista/o en ${withArticle(puzzle.roomNameById[fact.roomId])}.`,
          `Se puede descartar ${withArticle(puzzle.roomNameById[fact.roomId])} en su caso.`,
        ]);
      case "not_on_type":
        return pick([
          `No estaba sobre ${noneOfType(puzzle, fact.furnitureTypeId)}.`,
          `No se la/lo vio sobre ${noneOfType(puzzle, fact.furnitureTypeId)}.`,
        ]);

      // -- Compañía / relación entre personajes ------------------------
      case "same_room_person":
        return pick([
          `Compartía habitación con ${personName(puzzle, fact.refPersonIdx)}.`,
          `Estaba en la misma sala que ${personName(puzzle, fact.refPersonIdx)}.`,
        ]);
      case "not_adjacent_person":
        return pick([
          `No estaba junto a ${personName(puzzle, fact.refPersonIdx)}.`,
          `No se encontraba cerca de ${personName(puzzle, fact.refPersonIdx)}.`,
        ]);
      case "same_diag_person":
        return pick([
          `Estaba en la misma diagonal que ${personName(puzzle, fact.refPersonIdx)}.`,
          `Compartía diagonal con ${personName(puzzle, fact.refPersonIdx)}.`,
        ]);
      case "row_offset_person": {
        const dir = fact.dr > 0 ? "norte" : "sur";
        const mag = Math.abs(fact.dr);
        const magWord = numberWord(mag);
        const filaWord = pluralize("fila", mag);
        return pick([
          `Estaba ${magWord} ${filaWord} al ${dir} de ${personName(puzzle, fact.refPersonIdx)}.`,
          `A ${magWord} ${filaWord} al ${dir} de ${personName(puzzle, fact.refPersonIdx)}, ahí estaba.`,
        ]);
      }
      case "col_offset_person": {
        const dir = fact.dc > 0 ? "oeste" : "este";
        const mag = Math.abs(fact.dc);
        const magWord = numberWord(mag);
        const colWord = pluralize("columna", mag);
        return pick([
          `Estaba ${magWord} ${colWord} al ${dir} de ${personName(puzzle, fact.refPersonIdx)}.`,
          `A ${magWord} ${colWord} al ${dir} de ${personName(puzzle, fact.refPersonIdx)}, ahí estaba.`,
        ]);
      }

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
    return person.facts.map((f) => factSentence(puzzle, f)).filter(Boolean).join(" ");
  }

  M.describeFurniture = describeFurniture;
  M.clueTextFor = clueTextFor;
  M.factSentence = factSentence;
  void aArticle; // reservado por si se necesita fuera de furnitureAfterPrep

  if (typeof module !== "undefined" && module.exports) {
    module.exports = M;
  } else {
    root.Murdoku = M;
  }
})(typeof window !== "undefined" ? window : globalThis);
