/* Tema adicional: Dragon Ball */
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

  const IMG = "assets/furniture/dragon-ball/";

  const theme = {
    id: "dragon_ball",
    name: "Dragon Ball — El Misterio de las Siete Bolas",
    tagline: "Una reunión de guerreros termina en tragedia antes de invocar al dragón.",
    intro: "Los Guerreros Z se reunieron para proteger las siete Bolas de Dragón, pero uno de ellos apareció sin vida. Reconstruye dónde estaba cada personaje en el momento del crimen y descubre quién compartía escenario con la víctima.",
    rooms: ["Casa Kame", "Sala del Tiempo", "Torneo de Artes Marciales", "laboratorio Capsule Corp.", "Planeta Namek", "Nave Saiyajin"],

    furniture: [
      // ── Nube Kintón ────────────────────────────────────────────────────
      // occupiable: un personaje puede volar sobre ella.
      // Sin restricción de sala: puede aparecer en cualquier lugar.
      F("nube_kinton", "Nube Kintón", "☁️", true, {
        image: IMG + "nube kinton.png",
      }),

      // ── Bolas de Dragón (7 variantes) ──────────────────────────────────
      // Máximo 1 instancia de cada tipo, y máximo 2 bolas en total por partida.
      // Sin restricción de sala (pueden estar escondidas en cualquier lugar).
      F("bola1", "Bola de Dragón ★",       "🔮", false, { image: IMG + "bola de dragón 1 estrella.png",    group: "bolas", maxPerGroup: 2 }),
      F("bola2", "Bola de Dragón ★★",      "🔮", false, { image: IMG + "bola de dragón 2 estrellas.png",   group: "bolas", maxPerGroup: 2 }),
      F("bola3", "Bola de Dragón ★★★",     "🔮", false, { image: IMG + "bola de dragón 3 estrellas.png",   group: "bolas", maxPerGroup: 2 }),
      F("bola4", "Bola de Dragón ★★★★",    "🔮", false, { image: IMG + "bola de dragón 4 estrellas.png",   group: "bolas", maxPerGroup: 2 }),
      F("bola5", "Bola de Dragón ★★★★★",   "🔮", false, { image: IMG + "bola de dragón 5 estrellas.png",   group: "bolas", maxPerGroup: 2 }),
      F("bola6", "Bola de Dragón ★★★★★★",  "🔮", false, { image: IMG + "bola de dragón 6 estrellas.png",   group: "bolas", maxPerGroup: 2 }),
      F("bola7", "Bola de Dragón ★★★★★★★", "🔮", false, { image: IMG + "bola de dragón 7 estrellas.png",   group: "bolas", maxPerGroup: 2 }),

      // ── Radar del Dragón ───────────────────────────────────────────────
      // Repetible (hasta 3). occupiable. Sin restricción de sala.
      F("radar", "Radar del Dragón", "📡", true, {
        image: IMG + "radar.png",
        maxCount: 3,
      }),

      // ── Capsule Corp. ──────────────────────────────────────────────────
      // Repetible (hasta 4). No occupiable. Sin restricción de sala:
      // las cápsulas aparecen por todo el universo Dragon Ball.
      F("capsule_corp", "Capsule Corp.", "💊", false, {
        image: IMG + "capsule Corp..png",
        maxCount: 4,
      }),

      // ── Nave Goku ──────────────────────────────────────────────────────
      // Repetible (hasta 3). occupiable. Sin restricción de sala.
      F("nave_saiyajin", "Nave Goku", "🚀", true, {
        image: IMG + "nave goku.png",
        maxCount: 3,
      }),

      // ── Nave de Trunks ─────────────────────────────────────────────────
      // Única. occupiable. Sin restricción de sala (viaja a través del tiempo).
      F("nave_trunks", "Nave de Trunks", "🛸", true, {
        image: IMG + "nave Trunks.png",
      }),

      // ── Anillos Potara ─────────────────────────────────────────────────
      // Repetibles (hasta 3). occupiable. Sin restricción de sala.
      F("potara", "Anillos Potara", "💍", true, {
        image: IMG + "anillos potara.png",
        maxCount: 3,
      }),

      // ── Dende ──────────────────────────────────────────────────────────
      // Personaje único. No occupiable. Sin restricción de sala.
      F("dende", "Dende", "🟢", false, {
        image: IMG + "Dende.png",
      }),

      // ── Arale ──────────────────────────────────────────────────────────
      // Robot/personaje único. No occupiable. Sin restricción de sala.
      F("arale", "Arale", "🤖", false, {
        image: IMG + "Arale.png",
      }),

      // ── Tao Pai Pai ────────────────────────────────────────────────────
      // Villano único. No occupiable. Sin restricción de sala.
      F("tao_pai_pai", "Tao Pai Pai", "🗡️", false, {
        image: IMG + "Tao Pai Pai.png",
      }),

      // ── Ulong ──────────────────────────────────────────────────────────
      // Personaje menor único. No occupiable. Sin restricción de sala.
      F("ulong", "Ulong", "🐷", false, {
        image: IMG + "Ulong.png",
      }),
    ],

    names: [
      ["Goku",        "m"],
      ["Vegeta",      "m"],
      ["Lunch",       "f"],
      ["Bulma",       "f"],
      ["Piccolo",     "m"],
      ["Krillin",     "m"],
      ["Androide 18", "f"],
      ["Bobbidi",     "m"],
      ["Eliza",       "f"],
    ],
  };

  if (!M.THEMES.some((t) => t.id === theme.id)) {
    M.THEMES.push(theme);
    M.THEME_BY_ID = M.THEME_BY_ID || {};
    M.THEME_BY_ID[theme.id] = theme;
  }
})(window);
