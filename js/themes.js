/**
 * MURDOKU — catálogo de temas ("casos")
 * ------------------------------------------------------------
 * Cada tema es puro CONTENIDO (nombres, habitaciones, mobiliario,
 * texto). El motor (engine.js / generator.js) no sabe nada de esto:
 * solo recibe `theme.furniture` y usa `theme.adjacencyMode`.
 *
 * Los 14 "casos nuevos" que pediste (trail, faro, cena, fútbol,
 * vecindario, estrella, oficina, hockey, pirata, doble, batalla de
 * estrellas, caballeros, asedio, fórmula 1) están recreados aquí de
 * forma ORIGINAL: las páginas de pmlemay.github.io/4color no se
 * pudieron cargar (404 / app cliente sin contenido accesible), así
 * que en vez de adivinar copié el ESPÍRITU de cada nombre y generé
 * contenido propio. Tres de ellos añaden además una variante de
 * regla real (ver `adjacencyMode` / `isDouble`), explicada en el
 * panel "Cómo resolver el caso" de la propia app.
 */
(function (root) {
  "use strict";

  const M = typeof module !== "undefined" && module.exports ? require("./generator.js") : root.Murdoku;

  function F(id, label, icon, occupiable) {
    return { id, label, icon, occupiable: !!occupiable };
  }

  const THEMES = [];

  // ------------------------------------------------------------
  // 1. Caso clásico — la escena de siempre (equivalente al "Beginner's
  //    Night" del PDF de referencia), para aprender las reglas.
  // ------------------------------------------------------------
  THEMES.push({
    id: "clasico",
    name: "La Primera Noche",
    tagline: "El caso ideal para aprender las reglas de Murdoku.",
    intro: "¡Alguien fue asesinado anoche! Coloca a cada sospechoso en la escena del crimen para descubrir quién estaba solo con la víctima.",
    rooms: ["Salón", "Dormitorio Principal", "Habitación de Invitados", "Comedor", "Cocina", "Baño", "Despacho", "Recibidor"],
    furniture: [
      F("cama", "cama", "🛏️", true),
      F("silla", "silla", "🪑", true),
      F("alfombra", "alfombra", "🟧", true),
      F("planta", "planta", "🪴", false),
      F("ventana", "ventana", "🪟", false),
      F("tv", "TV", "📺", false),
      F("mesa", "mesa", "🍽️", false),
    ],
    names: [
      ["Axel", "m"], ["Cara", "f"], ["Bella", "f"], ["Douglas", "m"], ["Ella", "f"],
      ["Vincent", "m"], ["Heather", "f"], ["Gizelle", "f"], ["Bryce", "m"], ["Coralie", "f"],
      ["Daniel", "m"], ["Francine", "f"], ["Etienne", "m"], ["Henriette", "f"],
    ],
  });

  // ------------------------------------------------------------
  // 2. Sendero (trail-murdoku)
  // ------------------------------------------------------------
  THEMES.push({
    id: "sendero",
    name: "El Sendero Perdido",
    tagline: "Un grupo de excursionistas... uno no volvió del sendero.",
    intro: "El grupo de senderismo llegó al refugio, pero faltaba alguien al pasar lista. Reconstruye dónde estaba cada excursionista en el momento del extravío.",
    rooms: ["Mirador", "Puente Colgante", "Campamento", "Cascada", "Refugio", "Cruce de Caminos", "Bosque Alto", "Claro del Río"],
    furniture: [
      F("tronco", "tronco caído", "🪵", true),
      F("roca", "roca plana", "🪨", true),
      F("hoguera", "hoguera", "🔥", false),
      F("mochila", "mochila", "🎒", false),
      F("cartel", "cartel de ruta", "🪧", false),
      F("tienda", "tienda de campaña", "⛺", false),
    ],
    names: [
      ["Marina", "f"], ["Teo", "m"], ["Iris", "f"], ["Rafael", "m"], ["Nuria", "f"],
      ["Hugo", "m"], ["Carla", "f"], ["Simón", "m"], ["Valeria", "f"], ["Adrián", "m"],
      ["Lucía", "f"], ["Mateo", "m"], ["Olalla", "f"],
    ],
  });

  // ------------------------------------------------------------
  // 3. Faro encantado (haunted-lighthouse-murdoku)
  // ------------------------------------------------------------
  THEMES.push({
    id: "faro",
    name: "El Faro Encantado",
    tagline: "Dicen que el farero nunca se fue... y ahora hay un cuerpo más.",
    intro: "La tormenta aisló el faro durante toda la noche. Al amanecer, uno de los visitantes apareció muerto. Descubre quién estaba en cada rincón del faro.",
    rooms: ["Sala de la Linterna", "Escalera de Caracol", "Almacén", "Cocina", "Muelle", "Cuarto del Farero", "Sótano"],
    furniture: [
      F("baul", "baúl", "🧰", true),
      F("hamaca", "hamaca", "🛏️", true),
      F("farol", "farol de aceite", "🏮", false),
      F("ancla", "ancla", "⚓", false),
      F("mapa", "mapa náutico", "🗺️", false),
      F("reloj", "reloj de péndulo", "🕰️", false),
    ],
    names: [
      ["Amelia", "f"], ["Cornelius", "m"], ["Rosalind", "f"], ["Barnaby", "m"], ["Isadora", "f"],
      ["Thaddeus", "m"], ["Wren", "f"], ["Edmund", "m"], ["Marguerite", "f"], ["Silas", "m"],
      ["Odette", "f"], ["Ambrose", "m"],
    ],
  });

  // ------------------------------------------------------------
  // 4. Cena entre amigos (dinner-party-murdoku)
  // ------------------------------------------------------------
  THEMES.push({
    id: "cena",
    name: "La Cena que Terminó Mal",
    tagline: "Ocho invitados, una mesa larga... y un plato que nadie terminó.",
    intro: "La anfitriona había preparado la cena perfecta. Alguien no llegó al postre. Ubica a cada invitado para saber quién compartía mesa con la víctima.",
    rooms: ["Comedor", "Cocina", "Salón", "Terraza", "Bodega", "Vestíbulo", "Jardín"],
    furniture: [
      F("silla_cena", "silla de comedor", "🪑", true),
      F("sofa", "sofá", "🛋️", true),
      F("mesa_larga", "mesa larga", "🍽️", false),
      F("candelabro", "candelabro", "🕯️", false),
      F("piano", "piano", "🎹", false),
      F("jarron", "jarrón", "🏺", false),
    ],
    names: [
      ["Beatriz", "f"], ["Nicolás", "m"], ["Renata", "f"], ["Gustavo", "m"], ["Ines", "f"],
      ["Leandro", "m"], ["Paulina", "f"], ["Ramiro", "m"], ["Delia", "f"], ["Octavio", "m"],
      ["Celia", "f"], ["Fernando", "m"],
    ],
  });

  // ------------------------------------------------------------
  // 5. Partido de fútbol (soccer-game-murdoku)
  // ------------------------------------------------------------
  THEMES.push({
    id: "futbol",
    name: "El Once Titular",
    tagline: "El árbitro pitó el final... y encontraron a alguien tendido en el campo.",
    intro: "Todo el equipo estaba en el estadio cuando ocurrió. Reconstruye la posición de cada jugador para saber quién estaba junto a la víctima.",
    rooms: ["Campo de Juego", "Banquillo", "Vestuario", "Túnel", "Grada", "Sala de Prensa"],
    furniture: [
      F("baston", "banco", "🪑", true),
      F("balon", "balón", "⚽", false),
      F("trofeo", "trofeo", "🏆", false),
      F("porteria", "portería", "🥅", false),
      F("botiquin", "botiquín", "🩹", false),
      F("marcador", "marcador", "📟", false),
    ],
    names: [
      ["Tomás", "m"], ["Facu", "m"], ["Rocío", "f"], ["Bruno", "m"], ["Alma", "f"],
      ["Ezequiel", "m"], ["Milagros", "f"], ["Franco", "m"], ["Camila", "f"], ["Ignacio", "m"],
      ["Julieta", "f"], ["Maxi", "m"],
    ],
  });

  // ------------------------------------------------------------
  // 6. Vigilancia vecinal (neighbourhood-watch-murdoku)
  // ------------------------------------------------------------
  THEMES.push({
    id: "vecindario",
    name: "Vigilancia Vecinal",
    tagline: "En esta calle nunca pasaba nada... hasta anoche.",
    intro: "La ronda de vigilancia vecinal terminó encontrando algo que nadie esperaba. Descubre dónde estaba cada vecino a esa hora.",
    rooms: ["Jardín Delantero", "Garaje", "Porche", "Parque Comunal", "Buzones", "Patio Trasero", "Calle Principal"],
    furniture: [
      F("banco_parque", "banco de parque", "🪑", true),
      F("cesped", "tumbona de césped", "🪴", true),
      F("farola", "farola", "💡", false),
      F("coche", "coche aparcado", "🚗", false),
      F("bici", "bicicleta", "🚲", false),
      F("buzon", "buzón", "📮", false),
    ],
    names: [
      ["Deborah", "f"], ["Norman", "m"], ["Patricia", "f"], ["Walter", "m"], ["Sheila", "f"],
      ["Gerald", "m"], ["Marlene", "f"], ["Trevor", "m"], ["Yolanda", "f"], ["Stanley", "m"],
      ["Roxanne", "f"], ["Melvin", "m"],
    ],
  });

  // ------------------------------------------------------------
  // 7. Noche de estrellas (star-murdoku) — variante: "junto a" también
  //    cuenta en diagonal (8 direcciones), como los picos de una estrella.
  // ------------------------------------------------------------
  THEMES.push({
    id: "estrella",
    name: "Noche de Estrellas",
    tagline: "Regla especial: aquí 'junto a' también cuenta en diagonal.",
    intro: "El observatorio celebraba su noche anual de estrellas. Cuidado: en este caso, 'estar junto a algo' también incluye las diagonales.",
    adjacencyMode: "diagonal8",
    rooms: ["Cúpula del Telescopio", "Terraza de Observación", "Biblioteca Astronómica", "Cafetería", "Planetario", "Recepción"],
    furniture: [
      F("telescopio_silla", "silla del telescopio", "🪑", true),
      F("puf", "puf reclinable", "🛋️", true),
      F("telescopio", "telescopio", "🔭", false),
      F("globo", "globo terráqueo", "🌐", false),
      F("mapa_estelar", "mapa estelar", "🗺️", false),
      F("cafe", "máquina de café", "☕", false),
    ],
    names: [
      ["Estela", "f"], ["Orión", "m"], ["Vega", "f"], ["Casiopea", "f"], ["Altair", "m"],
      ["Andrómeda", "f"], ["Régulus", "m"], ["Lyra", "f"], ["Draco", "m"], ["Nova", "f"],
      ["Sirio", "m"], ["Celeste", "f"],
    ],
  });

  // ------------------------------------------------------------
  // 8. Edificio de oficinas (the-office-building)
  // ------------------------------------------------------------
  THEMES.push({
    id: "oficina",
    name: "El Edificio de Oficinas",
    tagline: "Todos se quedaron hasta tarde. Solo uno no llegó a fichar la salida.",
    intro: "El guardia de seguridad encontró algo raro en la planta once. Reconstruye dónde estaba cada empleado esa noche.",
    rooms: ["Sala de Juntas", "Recepción", "Cocina de Oficina", "Cubículos", "Sala de Servidores", "Despacho de Dirección", "Archivo"],
    furniture: [
      F("silla_oficina", "silla de oficina", "🪑", true),
      F("sofa_recepcion", "sofá de recepción", "🛋️", true),
      F("impresora", "impresora", "🖨️", false),
      F("planta_oficina", "planta de oficina", "🪴", false),
      F("pizarra", "pizarra", "🗒️", false),
      F("cafetera", "cafetera", "☕", false),
    ],
    names: [
      ["Débora", "f"], ["Ricardo", "m"], ["Alicia", "f"], ["Norberto", "m"], ["Susana", "f"],
      ["Ernesto", "m"], ["Teresa", "f"], ["Aurelio", "m"], ["Manuela", "f"], ["Ismael", "m"],
      ["Cristina", "f"], ["Baltasar", "m"],
    ],
  });

  // ------------------------------------------------------------
  // 9. Partido de hockey (hockey-game-murdoku)
  // ------------------------------------------------------------
  THEMES.push({
    id: "hockey",
    name: "Sudden Death",
    tagline: "El partido se fue a la prórroga. Alguien no vio el final.",
    intro: "Entre el hielo, el banquillo y los vestuarios, algo ocurrió durante la prórroga. Ubica a cada jugador en la pista.",
    rooms: ["Pista de Hielo", "Banquillo", "Vestuario Local", "Vestuario Visitante", "Grada", "Zona de Penalización"],
    furniture: [
      F("banco_hockey", "banco del equipo", "🪑", true),
      F("camilla", "camilla", "🛏️", true),
      F("disco", "disco (puck)", "🏒", false),
      F("marcador_hockey", "marcador electrónico", "📟", false),
      F("porteria_hockey", "portería", "🥅", false),
      F("zamboni", "máquina pulidora de hielo", "🚜", false),
    ],
    names: [
      ["Erik", "m"], ["Nadia", "f"], ["Viktor", "m"], ["Sasha", "f"], ["Lars", "m"],
      ["Ingrid", "f"], ["Magnus", "m"], ["Freya", "f"], ["Gustaf", "m"], ["Solveig", "f"],
      ["Anders", "m"], ["Astrid", "f"],
    ],
  });

  // ------------------------------------------------------------
  // 10. Barco pirata (pirate-ship-murdoku)
  // ------------------------------------------------------------
  THEMES.push({
    id: "pirata",
    name: "El Motín del Marea Negra",
    tagline: "Un tesoro, una tripulación... y un capitán que no vio el amanecer.",
    intro: "La tripulación del Marea Negra despertó sin capitán. Reconstruye la posición de cada pirata a bordo.",
    rooms: ["Cubierta Principal", "Camarote del Capitán", "Bodega", "Timón", "Cocina del Barco", "Sala de Cañones", "Mástil Mayor"],
    furniture: [
      F("hamaca_pirata", "hamaca", "🛏️", true),
      F("barril_sentado", "barril volteado", "🪑", true),
      F("cofre", "cofre del tesoro", "🧰", false),
      F("cañon", "cañón", "💣", false),
      F("loro", "percha del loro", "🦜", false),
      F("timon_rueda", "rueda del timón", "☸️", false),
    ],
    names: [
      ["Morgana", "f"], ["Barbanegro Jr.", "m"], ["Escarlata", "f"], ["Tobías", "m"], ["Perla", "f"],
      ["Cornelio", "m"], ["Anaís", "f"], ["Roque", "m"], ["Dorotea", "f"], ["Jonás", "m"],
      ["Serafina", "f"], ["Wilfredo", "m"],
    ],
  });

  // ------------------------------------------------------------
  // 11. Doble Murdoku (double-murdoku) — dos escenas ligadas: hay que
  //     resolver ambas para cerrar el caso. (isDouble se maneja en main.js)
  // ------------------------------------------------------------
  THEMES.push({
    id: "doble_a",
    name: "Doble Crimen — Planta Baja",
    tagline: "Dos crímenes, dos plantas, una sola noche. Empieza por la planta baja.",
    intro: "Ocurrieron dos incidentes la misma noche, en dos plantas distintas de la misma casa. Resuelve esta y luego la de arriba.",
    isDouble: true,
    doublePairId: "doble_b",
    rooms: ["Recibidor", "Salón", "Comedor", "Cocina", "Trastero", "Porche"],
    furniture: [
      F("cama_db", "sofá cama", "🛏️", true),
      F("silla_db", "silla", "🪑", true),
      F("planta_db", "planta", "🪴", false),
      F("mesa_db", "mesa", "🍽️", false),
      F("tv_db", "TV", "📺", false),
      F("ventana_db", "ventana", "🪟", false),
    ],
    names: [
      ["Aurora", "f"], ["Benito", "m"], ["Clara", "f"], ["Diego", "m"], ["Elvira", "f"],
      ["Fermín", "m"], ["Gala", "f"], ["Hilario", "m"], ["Idoia", "f"], ["Joaquín", "m"],
    ],
  });
  THEMES.push({
    id: "doble_b",
    name: "Doble Crimen — Planta Alta",
    tagline: "La segunda mitad del caso: el piso de arriba.",
    intro: "El desenlace de la misma noche, ahora en la planta alta de la casa.",
    isDouble: true,
    doublePairId: "doble_a",
    rooms: ["Dormitorio Principal", "Habitación de Invitados", "Baño", "Despacho", "Ático", "Balcón"],
    furniture: [
      F("cama_da", "cama", "🛏️", true),
      F("alfombra_da", "alfombra", "🟧", true),
      F("escritorio", "escritorio", "🗄️", false),
      F("espejo", "espejo", "🪞", false),
      F("lampara", "lámpara", "💡", false),
      F("baul_da", "baúl", "🧰", false),
    ],
    names: [
      ["Aurora", "f"], ["Benito", "m"], ["Clara", "f"], ["Diego", "m"], ["Elvira", "f"],
      ["Fermín", "m"], ["Gala", "f"], ["Hilario", "m"], ["Idoia", "f"], ["Joaquín", "m"],
    ],
  });

  // ------------------------------------------------------------
  // 12. Batalla de Estrellas (starbattle-murdoku) — variante: además de
  //     colocar sospechosos, dos celdas del tablero llevan una ✦ y NINGÚN
  //     sospechoso puede terminar sobre ellas (como las celdas prohibidas
  //     de Star Battle). Se implementa como mobiliario no ocupable fijo,
  //     ya soportado por el motor: no requiere código nuevo, solo tema.
  // ------------------------------------------------------------
  THEMES.push({
    id: "batalla_estrellas",
    name: "Batalla de Estrellas",
    tagline: "Regla especial: las casillas marcadas con ✦ nunca pueden ocuparse.",
    intro: "Un simulacro militar terminó en tragedia. Ten cuidado: las casillas con una estrella marcada en el suelo están fuera de los límites.",
    rooms: ["Sala de Mando", "Armería", "Barracones", "Comedor Militar", "Patio de Instrucción", "Torre de Vigilancia"],
    furniture: [
      F("catre", "catre", "🛏️", true),
      F("silla_mando", "silla de mando", "🪑", true),
      F("estrella_prohibida", "casilla marcada ✦", "✦", false),
      F("mapa_mando", "mapa táctico", "🗺️", false),
      F("radio", "radio", "📻", false),
      F("bandera", "bandera", "🚩", false),
    ],
    names: [
      ["Ariadna", "f"], ["Comandante Ruiz", "m"], ["Selene", "f"], ["Máximo", "m"], ["Bianca", "f"],
      ["Teodoro", "m"], ["Nayara", "f"], ["Custodio", "m"], ["Palmira", "f"], ["Anselmo", "m"],
    ],
  });

  // ------------------------------------------------------------
  // 13. Los Caballeros (knights-murdoku) — variante: "junto a" se mide
  //     con movimiento de caballo de ajedrez.
  // ------------------------------------------------------------
  THEMES.push({
    id: "caballeros",
    name: "El Torneo de los Caballeros",
    tagline: "Regla especial: aquí 'junto a' se mueve como el caballo del ajedrez.",
    intro: "Durante el gran torneo, algo pasó en el castillo. Atención: en este caso especial, las relaciones de cercanía se miden con un movimiento de caballo (en L), no en línea recta.",
    adjacencyMode: "knight",
    rooms: ["Salón del Trono", "Armería Real", "Establos", "Torre del Homenaje", "Capilla", "Patio de Armas"],
    furniture: [
      F("trono", "trono", "🪑", true),
      F("yacija", "yacija", "🛏️", true),
      F("armadura", "armadura", "🛡️", false),
      F("estandarte", "estandarte", "🚩", false),
      F("brasero", "brasero", "🔥", false),
      F("yelmo_mesa", "mesa de armas", "🍽️", false),
    ],
    names: [
      ["Sir Alaric", "m"], ["Lady Rowena", "f"], ["Sir Cedric", "m"], ["Lady Isolde", "f"], ["Sir Gareth", "m"],
      ["Lady Elowen", "f"], ["Sir Tristan", "m"], ["Lady Guinevere", "f"], ["Sir Percival", "m"], ["Lady Vivienne", "f"],
    ],
  });

  // ------------------------------------------------------------
  // 14. Asedio al castillo (castle-siege-murdoku)
  // ------------------------------------------------------------
  THEMES.push({
    id: "asedio",
    name: "El Asedio",
    tagline: "El castillo resistió el asedio... pero algo pasó dentro de sus muros.",
    intro: "Mientras el ejército enemigo acampaba fuera, alguien murió dentro del castillo. Ubica a cada habitante de la fortaleza.",
    rooms: ["Muralla Norte", "Torre de Vigía", "Gran Salón", "Mazmorra", "Cocina del Castillo", "Capilla del Castillo", "Foso"],
    furniture: [
      F("catre_asedio", "catre", "🛏️", true),
      F("banco_asedio", "banco de piedra", "🪑", true),
      F("catapulta", "maqueta de catapulta", "🏹", false),
      F("antorcha", "antorcha", "🔥", false),
      F("barril_asedio", "barril de provisiones", "🛢️", false),
      F("campana", "campana de alarma", "🔔", false),
    ],
    names: [
      ["Wilhelmina", "f"], ["Aldric", "m"], ["Godiva", "f"], ["Bertrand", "m"], ["Millicent", "f"],
      ["Osric", "m"], ["Adelina", "f"], ["Conrad", "m"], ["Editha", "f"], ["Rutger", "m"],
    ],
  });

  // ------------------------------------------------------------
  // 15. Fórmula 1 (formula1-murdoku)
  // ------------------------------------------------------------
  THEMES.push({
    id: "formula1",
    name: "Gran Premio Nocturno",
    tagline: "El equipo celebraba la pole position. La fiesta terminó en tragedia.",
    intro: "Todo el equipo estaba en el paddock la noche antes de la carrera. Reconstruye dónde estaba cada miembro del equipo.",
    rooms: ["Box de Equipo", "Sala de Estrategia", "Paddock Club", "Zona de Neumáticos", "Podio", "Sala de Prensa F1"],
    furniture: [
      F("silla_box", "silla de pit wall", "🪑", true),
      F("sofa_paddock", "sofá del paddock", "🛋️", true),
      F("neumatico", "neumático", "🛞", false),
      F("trofeo_f1", "trofeo del Gran Premio", "🏆", false),
      F("monitor_telemetria", "monitor de telemetría", "🖥️", false),
      F("bandera_cuadros", "bandera a cuadros", "🏁", false),
    ],
    names: [
      ["Lena", "f"], ["Rico", "m"], ["Talia", "f"], ["Dorian", "m"], ["Simone", "f"],
      ["Matteo", "m"], ["Priya", "f"], ["Kilian", "m"], ["Noor", "f"], ["Basti", "m"],
    ],
  });

  const THEME_BY_ID = {};
  THEMES.forEach((t) => (THEME_BY_ID[t.id] = t));

  M.THEMES = THEMES;
  M.THEME_BY_ID = THEME_BY_ID;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = M;
  } else {
    root.Murdoku = M;
  }
})(typeof window !== "undefined" ? window : globalThis);
