/* Tema adicional: Stranger Things */
(function (root) {
  "use strict";
  const M = root.Murdoku;
  if (!M || !Array.isArray(M.THEMES)) return;

  // F extendida: admite image, maxCount, roomIds, group, maxPerGroup
  function F(id, label, icon, occupiable, opts) {
    const obj = { id, label, icon, occupiable: !!occupiable };
    if (opts) {
      if (opts.image)       obj.image       = opts.image;
      if (opts.maxCount)    obj.maxCount    = opts.maxCount;
      if (opts.roomIds)     obj.roomIds     = opts.roomIds;
      if (opts.group)       obj.group       = opts.group;
      if (opts.maxPerGroup != null) obj.maxPerGroup = opts.maxPerGroup;
    }
    return obj;
  }

  const IMG = "assets/furniture/Stranger-Things/";

  const theme = {
    id: "stranger_things",
    name: "Stranger Things — El Misterio del Mundo Invertido",
    tagline: "Hawkins está en peligro. Alguien ha desaparecido en circunstancias extrañas.",
    intro: "Un grupo de amigos y autoridades de Hawkins se reunieron para investigar un evento paranormal. Pero alguien apareció muerto. Reconstruye quién estaba en cada lugar y descubre quién compartía ubicación con la víctima en el Mundo Invertido.",
    rooms: [
      "Casa de Mike",
      "Sótano de Hawkins",
      "Laboratorio Nacional",
      "Casa Byers",
      "Tienda de Hawkins",
      "Bosque Oscuro",
      "Comisaría de Hawkins",
      "Piscina Estivale"
    ],

    furniture: [
      // ── OBJETOS OCUPABLES ──────────────────────────────────────────────

      // Walkie-Talkie: los chicos se comunicaban por radio
      // Repetible (hasta 3). occupiable. Sin restricción de sala.
      F("walkie_talkie", "Walkie-Talkie", "📻", true, {
        image: IMG + "walkie-talkie.png",
        maxCount: 3,
      }),

      // Bate: arma improvisada de Mike contra los Demogorgons
      // Repetible (hasta 2). occupiable. Sin restricción de sala.
      F("bate", "Bate de Béisbol", "🏏", true, {
        image: IMG + "bate.png",
        maxCount: 2,
      }),

      // Calcetines: referencia a la moda de los 80 y al "agujero" en el piso
      // Repetible (hasta 3). occupiable. Sin restricción de sala.
      F("calcetines", "Calcetines de Neon", "🧦", true, {
        image: IMG + "calcetines.png",
        maxCount: 3,
      }),

      // Guitarra: instrumento de Dustin y instrumento de distracción
      // Única. occupiable. Sin restricción de sala.
      F("guitarra", "Guitarra Sintetizador", "🎸", true, {
        image: IMG + "guitarra.png",
      }),

      // Hacha: herramienta peligrosa del Laboratorio Nacional
      // Repetible (hasta 2). occupiable. Sin restricción de sala.
      F("hacha", "Hacha de Emergencia", "🪓", true, {
        image: IMG + "hacha.png",
        maxCount: 2,
      }),

      // Cámara: para documentar evidencia paranormal (referencia a Jonathan)
      // Repetible (hasta 2). occupiable. Sin restricción de sala.
      F("camara", "Cámara Fotográfica", "📷", true, {
        image: IMG + "camara.png",
        maxCount: 2,
      }),

      // Coche: vehículos para transportarse por Hawkins
      // Repetible (hasta 3). occupiable. Sin restricción de sala.
      F("coche", "Chevrolet 1979", "🚗", true, {
        image: IMG + "coche.png",
        maxCount: 3,
      }),

      // ── OBJETOS NO OCUPABLES ───────────────────────────────────────────

      // Fuente de sodas: lugar de encuentro icónico
      // Repetible. No occupiable. Sin restricción de sala.
      F("fuente_sodas", "Fuente de Sodas", "🥤", false, {
        image: IMG + "fuente-sodas.png",
        maxCount: 2,
      }),

      // Vela: para hacer comunicaciones paranormales (luces en la pared)
      // Repetible. No occupiable. Sin restricción de sala.
      F("vela", "Vela Roja", "🕯️", false, {
        image: IMG + "vela.png",
        maxCount: 4,
      }),

      // Lámpara de Lava: elemento retro de los 80
      // Repetible. No occupiable. Sin restricción de sala.
      F("lampara_lava", "Lámpara de Lava", "🟢", false, {
        image: IMG + "lampara-lava.png",
        maxCount: 2,
      }),

      // Portal del Mundo Invertido: lugar de paso
      // Única. No occupiable. Sin restricción de sala.
      F("portal", "Portal del Mundo Invertido", "🌀", false, {
        image: IMG + "portal.png",
      }),

      // Equipo de Investigación: instrumentos del Laboratorio
      // Repetible. No occupiable. Sin restricción de sala.
      F("equipo_investigacion", "Equipo Científico", "🔬", false, {
        image: IMG + "equipo-investigacion.png",
        maxCount: 3,
      }),

      // Película en VHS: referencia cultural de los 80
      // Repetible. No occupiable. Sin restricción de sala.
      F("vhs", "Película VHS", "📼", false, {
        image: IMG + "vhs.png",
        maxCount: 2,
      }),

      // Flores Upside Down: flores del Mundo Invertido
      // Repetible. No occupiable. Sin restricción de sala.
      F("flores", "Flores Oscuras", "🌹", false, {
        image: IMG + "flores.png",
        maxCount: 3,
      }),

      // Lámpara de Neón: atmósfera de los 80
      // Repetible. No occupiable. Sin restricción de sala.
      F("lampara_neon", "Letrero de Neón", "🔴", false, {
        image: IMG + "lampara-neon.png",
        maxCount: 2,
      }),
    ],

    names: [
      // Protagonistas principales
      ["Mike Wheeler", "m"],
      ["Eleven", "f"],
      ["Dustin Henderson", "m"],
      ["Lucas Sinclair", "m"],
      ["Will Byers", "m"],
      ["Max Mayfield", "f"],

      // Personajes secundarios
      ["Jonathan Byers", "m"],
      ["Nancy Wheeler", "f"],
      ["Joyce Byers", "f"],
      ["Jim Hopper", "m"],

      // Otros personajes
      ["Karen Wheeler", "f"],
      ["Ted Wheeler", "m"],
      ["Steve Harrington", "m"],
      ["Barb Holland", "f"],
    ],
  };

  if (!M.THEMES.some((t) => t.id === theme.id)) {
    M.THEMES.push(theme);
    M.THEME_BY_ID = M.THEME_BY_ID || {};
    M.THEME_BY_ID[theme.id] = theme;
  }
})(window);
