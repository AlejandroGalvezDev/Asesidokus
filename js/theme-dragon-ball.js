/* Tema adicional: Dragon Ball */
(function (root) {
  "use strict";
  const M = root.Murdoku;
  if (!M || !Array.isArray(M.THEMES)) return;

  function F(id, label, icon, occupiable) {
    return { id, label, icon, occupiable: !!occupiable };
  }

  const theme = {
    id: "dragon_ball",
    name: "Dragon Ball — El Misterio de las Siete Bolas",
    tagline: "Una reunión de guerreros termina en tragedia antes de invocar al dragón.",
    intro: "Los Guerreros Z y sus aliados se reunieron para proteger las siete Bolas de Dragón, pero uno de ellos apareció sin vida. Reconstruye dónde estaba cada personaje en el momento del crimen y descubre quién compartía escenario con la víctima.",
    rooms: ["Casa Kame", "Capsule Corp.", "Palacio de Kami", "Torre Karin", "Planeta Namek", "Torneo de Artes Marciales", "Ciudad del Oeste"],
    furniture: [
      F("nube_voladora", "Nube Voladora", "☁️", true),
      F("capsula", "cápsula de entrenamiento", "💊", true),
      F("dragon_ball", "Bola de Dragón", "🔮", false),
      F("radar", "Radar del Dragón", "📡", false),
      F("senzu", "judías Senzu", "🫘", false),
      F("nave_capsula", "nave cápsula", "🚀", false),
      F("puerta_santuario", "puerta del santuario", "⛩️", false)
    ],
    names: [
      ["Goku", "m"], ["Bulma", "f"], ["Vegeta", "m"], ["Chi-Chi", "f"], ["Piccolo", "m"],
      ["Krillin", "m"], ["Android 18", "f"], ["Gohan", "m"], ["Videl", "f"], ["Trunks", "m"],
      ["Pan", "f"], ["Yamcha", "m"], ["Launch", "f"], ["Tien", "m"]
    ]
  };

  if (!M.THEMES.some((t) => t.id === theme.id)) {
    M.THEMES.push(theme);
    M.THEME_BY_ID = M.THEME_BY_ID || {};
    M.THEME_BY_ID[theme.id] = theme;
  }
})(window);
