/* Tema adicional: Harry Potter — Misterio en Hogwarts */
(function (root) {
  "use strict";
  const M = root.Murdoku;
  if (!M || !Array.isArray(M.THEMES)) return;

  const PORTRAIT_DIR = "assets/portraits/Harry-Potter/";
  const FURNITURE_DIR = "assets/furniture/Harry-Potter/";
  const portraits = {};

  function P(name, gender, file) {
    portraits[name] = PORTRAIT_DIR + file;
    return [name, gender];
  }

  function F(id, label, icon, occupiable, file) {
    return { id, label, icon, occupiable: !!occupiable, image: FURNITURE_DIR + file };
  }

  const theme = {
    id: "harry_potter",
    name: "Harry Potter — El Misterio de Hogwarts",
    tagline: "Una noche en Hogwarts, un hechizo imposible y un misterio entre las cuatro casas.",
    intro: "Durante una noche de tormenta en Hogwarts, alguien apareció sin vida después del banquete. Coloca a cada bruja, mago y criatura en el lugar correcto para descubrir quién compartía estancia con la víctima.",
    rooms: [
      "Gran Comedor",
      "Sala Común de Gryffindor",
      "Sala Común de Slytherin",
      "Biblioteca de Hogwarts",
      "Aula de Pociones",
      "Torre de Astronomía",
      "Despacho de Dumbledore",
      "Bosque Prohibido",
    ],
    furniture: [
      F("escoba", "escoba voladora", "🧹", true, "escoba.png"),
      F("sombrero", "Sombrero Seleccionador", "🎩", true, "sombrero.png"),
      F("libro", "libro de hechizos", "📖", true, "libro.png"),
      F("copa", "copa de Hogwarts", "🏆", true, "copa.png"),
      F("diploma", "diploma mágico", "📜", false, "diploma.png"),
      F("gafas", "gafas redondas", "👓", false, "gafas.png"),
      F("escudo_gryffindor", "escudo de Gryffindor", "🦁", false, "escudo Griffindor.avif"),
      F("escudo_hufflepuff", "escudo de Hufflepuff", "🦡", false, "escudo Hufflepuff.avif"),
      F("escudo_ravenclaw", "escudo de Ravenclaw", "🦅", false, "escudo Ravenclaw.avif"),
      F("escudo_slytherin", "escudo de Slytherin", "🐍", false, "escudo Slytherin.avif"),
    ],
    names: [
      P("Albus Dumbledore", "m", "Albus Dumbledore.avif"),
      P("Argus Filch", "m", "Argus Filch.avif"),
      P("Bellatrix Lestrange", "f", "Bellatrix Lestrange.avif"),
      P("Cho Chang", "f", "Cho Chang.avif"),
      P("Dolores Umbridge", "f", "Dolores Umbridge.avif"),
      P("Draco Malfoy", "m", "Draco Malfoy.avif"),
      P("Fleur Delacour", "f", "Fleur Delacour.avif"),
      P("Ginny Weasley", "f", "Ginny Weasley.avif"),
      P("Harry Potter", "m", "Harry Potter.avif"),
      P("Hermione Granger", "f", "Hermione Granger.avif"),
      P("Lucius Malfoy", "m", "Lucius Malfoy.avif"),
      P("Luna Lovegood", "f", "Luna Lovegood.avif"),
      P("Minerva McGonagall", "f", "Minerva McGonagall.avif"),
      P("Neville Longbottom", "m", "Neville Longbottom.avif"),
      P("Ron Weasley", "m", "Ron Weasley.avif"),
      P("Severus Snape", "m", "Severus Snape.avif"),
      P("Sirius Black", "m", "Sirius Black.avif"),
      P("Viktor Krum", "m", "Viktor Krum.avif"),
      P("Voldemort", "m", "Voldemort.avif"),
    ],
    portraits,
  };

  if (!M.THEMES.some((t) => t.id === theme.id)) {
    M.THEMES.push(theme);
    M.THEME_BY_ID = M.THEME_BY_ID || {};
    M.THEME_BY_ID[theme.id] = theme;
  }
})(window);
