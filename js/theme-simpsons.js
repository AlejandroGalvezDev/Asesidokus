/* Tema adicional: Los Simpsons */
(function (root) {
  "use strict";
  const M = root.Murdoku;
  if (!M || !Array.isArray(M.THEMES)) return;

  const PORTRAIT_DIR = "assets/portraits/The-Simpsons/";
  const FURNITURE_DIR = "assets/furniture/The-Simpsons/";
  const portraits = {};

  function P(name, gender, file) {
    portraits[name] = PORTRAIT_DIR + file;
    return [name, gender];
  }

  function F(id, label, icon, occupiable, file) {
    return {
      id,
      label,
      icon,
      occupiable: !!occupiable,
      image: FURNITURE_DIR + file,
    };
  }

  const theme = {
    id: "simpsons",
    name: "Los Simpsons — Misterio en Springfield",
    tagline: "Una noche en Springfield, un crimen imposible y demasiados sospechosos amarillos.",
    intro: "La tranquilidad de Springfield se ha terminado: alguien apareció sin vida durante una reunión de vecinos. Coloca a cada personaje en el lugar correcto y descubre quién compartía habitación con la víctima.",
    rooms: [
      "Casa de los Simpson",
      "Taberna de Moe",
      "Escuela Primaria de Springfield",
      "Central Nuclear",
      "Kwik-E-Mart",
      "Ayuntamiento",
      "Casa del Árbol",
      "Iglesia de Springfield",
    ],
    furniture: [
      F("sillon", "sillón de los Simpson", "🛋️", true, "sillón.webp"),
      F("coche", "coche de Springfield", "🚗", true, "coche.webp"),
      F("coche_naranja", "coche naranja", "🚗", true, "coche naranja.webp"),
      F("donut", "donut", "🍩", false, "donut.webp"),
      F("cerveza_duff", "cerveza Duff", "🍺", false, "Cerveza Duff.png"),
      F("television", "televisión", "📺", false, "televisión.png"),
      F("cuadro", "cuadro de Springfield", "🖼️", false, "cuadro.png"),
      F("dentadura", "dentadura postiza", "🦷", false, "dentadura.png"),
      F("bola_nieve", "bola de nieve", "🐱", false, "Bola de nieve segundo.webp"),
      F("ayudante", "Ayudante de Santa Claus", "🐕", false, "Ayudante de SantaClaus.webp"),
      F("blinky", "Blinky", "🐟", false, "Blinky.webp"),
      F("flying_hellfish", "Flying Hellfish", "🎖️", false, "Flying_Hellfish.webp"),
      F("goofball", "Goofball", "🎱", false, "Goofball.webp"),
      F("itchy", "Itchy", "🐭", false, "Itchy.webp"),
      F("plopper", "Plopper", "🐷", false, "Plopper.webp"),
      F("poochie", "Poochie", "🐶", false, "Poochie.webp"),
      F("scratchy", "Scratchy", "🐱", false, "Scratchy.webp"),
      F("kang_kodos", "Sacerdote Kang Kodos", "👽", false, "Sacerdote Kang Kodos.png"),
      F("burns_drogado", "Señor Burns drogado", "🧪", false, "Señor Burns drogado.png"),
      F("spider_man", "Spider-Man", "🕷️", false, "Spider-Man.webp"),
      F("uss_tom_clancy", "USS Tom Clancy", "🚢", false, "USS_Tom_Clancy.webp"),
      F("mono_fumador", "mono fumador", "🐒", false, "mono fumador.webp"),
      F("puerta_raices", "puerta dimensional con raíces", "🚪", false, "puerta dimensional con raices.png"),
      F("puerta_piedra", "puerta dimensional de piedra", "🚪", false, "puerta dimensional de piedra.png"),
      F("pajaro_bebedor", "pájaro bebedor", "🐦", false, "pájaro bebedor.png"),
    ],
    names: [
      P("Adolf Hitler", "m", "Adolf_Hitler.webp"),
      P("Akira", "m", "Akira.webp"),
      P("Alex Whitney", "f", "Alex_Whitney.webp"),
      P("Artie Ziff", "m", "Artie_Ziff.webp"),
      P("Audrey McConnell", "f", "Audrey_McConnell.webp"),
      P("Becky", "f", "Becky.webp"),
      P("Benjamin", "m", "Benjamin.webp"),
      P("Bill", "m", "Bill.webp"),
      P("Bill Clinton", "m", "Bill_Clinton.webp"),
      P("Charlie", "m", "Charlie.webp"),
      P("Clancy Bouvier", "m", "Clancy_Bouvier.webp"),
      P("Cookie Kwan", "f", "Cookie_Kwan.webp"),
      P("Cosine", "f", "Cosine.webp"),
      P("Dave Shutton", "m", "Dave_Shutton.webp"),
      P("Desconocido", "m", "Desconocido.webp"),
      P("Doug", "m", "Doug.webp"),
      P("E-mail", "m", "E-mail.webp"),
      P("Eleanor Abernathy", "f", "Eleanor_Abernathy.webp"),
      P("Frank Grimes", "m", "Frank_Grimes.webp"),
      P("Gary", "m", "Gary.webp"),
      P("George Bush", "m", "George_Bush.webp"),
      P("Gerald Samson", "m", "Gerald_Samson.webp"),
      P("Grady", "m", "Grady.webp"),
      P("Ham", "m", "Ham.webp"),
      P("Hyman Krustofsky", "m", "Hyman_Krustofsky.webp"),
      P("Jack Marley", "m", "Jack_Marley.webp"),
      P("Jessica Lovejoy", "f", "Jessica_Lovejoy.webp"),
      P("Johnny Tightlips", "m", "Johnny_Tightlips.webp"),
      P("Lewis", "m", "Lewis.webp"),
      P("Ling Bouvier", "f", "Ling_Bouvier.webp"),
      P("Luigi Risotto", "m", "Luigi_Risotto.webp"),
      P("Martha Prince", "f", "Martha_Prince.webp"),
      P("Martha Quimby", "f", "Martha_Quimby.webp"),
      P("Martin Prince Sr.", "m", "Martin_Prince_Sr.webp"),
      P("Marty", "m", "Marty.webp"),
      P("Melissa", "f", "Melissa.webp"),
      P("Mr. Muntz", "m", "Mr._Muntz.webp"),
      P("Mrs. Glick", "f", "Mrs._Glick.webp"),
      P("Ms. Albright", "f", "Ms._Albright.webp"),
      P("Report Card", "m", "Report_Card.webp"),
      P("Richard", "m", "Richard.webp"),
      P("Richard Nixon", "m", "Richard_Nixon.webp"),
      P("Sam", "m", "Sam.webp"),
      P("Sarah Wiggum", "f", "Sarah_Wiggum.webp"),
      P("Scott Christian", "m", "Scott_Christian.webp"),
      P("Sylvia Winfield", "f", "Sylvia_Winfield.webp"),
      P("The Yes Guy", "m", "The_Yes_Guy.webp"),
      P("Weasel 1", "m", "Weasel_1.webp"),
    ],
    portraits,
  };

  if (!M.THEMES.some((t) => t.id === theme.id)) {
    M.THEMES.push(theme);
    M.THEME_BY_ID = M.THEME_BY_ID || {};
    M.THEME_BY_ID[theme.id] = theme;
  }
})(window);
