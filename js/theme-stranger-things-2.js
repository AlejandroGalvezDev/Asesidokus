/* Tema adicional: Stranger Things 2 — La Maldición de Vecna */
(function (root) {
  "use strict";
  const M = root.Murdoku;
  if (!M || !Array.isArray(M.THEMES)) return;

  const PORTRAIT_DIR = "assets/portraits/Stranger-Things-2/";
  const FURNITURE_DIR = "assets/furniture/Stranger-Things-2/";
  const portraits = {};

  function P(name, gender, file) {
    portraits[name] = PORTRAIT_DIR + file;
    return [name, gender];
  }

  function F(id, label, icon, occupiable, file) {
    return { id, label, icon, occupiable: !!occupiable, image: FURNITURE_DIR + file };
  }

  const theme = {
    id: "stranger_things_2",
    name: "Stranger Things 2 — La Maldición de Vecna",
    tagline: "El mal ha vuelto a Hawkins, y esta vez tiene un nombre: Vecna.",
    intro: "Años después del portal en el laboratorio, Hawkins vuelve a temblar: una nueva generación se ha unido a los viejos conocidos para enfrentar una amenaza aún peor. Alguien apareció sin vida en extrañas circunstancias. Reconstruye quién estaba en cada localización y descubre quién compartía escena con la víctima.",
    rooms: [
      "Instituto de Hawkins",
      "Casa Creel",
      "Laboratorio Nacional",
      "Heladería Scoops Ahoy",
      "Tráiler de Eddie",
      "Bosque del Mundo del Revés",
      "Comisaría de Hawkins",
      "Videoclub Family Video",
    ],
    furniture: [
      // ── OBJETOS OCUPABLES ──────────────────────────────────────────────
      F("bate", "Bate de Béisbol", "🏏", true, "bate.png"),
      F("bicicleta", "Bicicleta BMX", "🚲", true, "bicicleta.png"),
      F("coche", "Coche Patrulla", "🚓", true, "coche.png"),
      F("camara", "Cámara Fotográfica", "📷", true, "cámara.png"),
      F("guitarra", "Guitarra Eléctrica", "🎸", true, "guitarra.png"),
      F("hacha", "Hacha de Incendios", "🪓", true, "hacha.png"),
      F("walkie_talkie", "Walkie-Talkie", "📻", true, "walkie-talkie.png"),
      F("calcetines", "Calcetines de Neón", "🧦", true, "calcetines.png"),

      // ── OBJETOS NO OCUPABLES ───────────────────────────────────────────
      F("cartel_welcome", "Cartel de Bienvenida a Hawkins", "🪧", false, "cartel welcome.png"),
      F("cassette", "Cinta de Cassette", "📼", false, "cassette.png"),
      F("dado", "Dado de Rol", "🎲", false, "dado.png"),
      F("demo_perro", "Demoperro", "🐺", false, "demo-perro.png"),
      F("demogorgon", "Demogorgon", "👹", false, "demogorgon.png"),
      F("reloj", "Reloj de Péndulo", "🕰️", false, "reloj.png"),
      F("tortita", "Waffle con Nata", "🧇", false, "tortita.png"),
    ],
    names: [
      P("Argyle", "m", "Argyle.avif"),
      P("Dustin Henderson", "m", "Dustin Henderson.avif"),
      P("Eddie Munson", "m", "Eddie Munson.avif"),
      P("Erica Sinclair", "f", "Erica Sinclair.avif"),
      P("Jim Hopper", "m", "Jim Hopper.avif"),
      P("Jonathan Byers", "m", "Jonathan Byers.avif"),
      P("Joyce Byers", "f", "Joyce Byers.avif"),
      P("Karen Wheeler", "f", "Karen Wheeler.avif"),
      P("Lucas Sinclair", "m", "Lucas Sinclair.avif"),
      P("Max Mayfield", "f", "Max Mayfield.avif"),
      P("Mike Wheeler", "m", "Mike Wheeler.avif"),
      P("Murray Bauman", "m", "Murray Bauman.avif"),
      P("Nancy Wheeler", "f", "Nancy Wheeler.avif"),
      P("Once (Eleven)", "f", "Once (Eleven).avif"),
      P("Robin Buckley", "f", "Robin Buckley.avif"),
      P("Steve Harrington", "m", "Steve Harrington.avif"),
      P("Vecna", "m", "Vecna.avif"),
      P("Will Byers", "m", "Will Byers.avif"),
    ],
    portraits,
  };

  if (!M.THEMES.some((t) => t.id === theme.id)) {
    M.THEMES.push(theme);
    M.THEME_BY_ID = M.THEME_BY_ID || {};
    M.THEME_BY_ID[theme.id] = theme;
  }
})(window);
