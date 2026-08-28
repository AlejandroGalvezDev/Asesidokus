# Murdoku — casos de misterio generados por procedimiento

Aplicación web (HTML + CSS + JavaScript puro, sin build ni dependencias en
producción) que genera **casos de Murdoku** al vuelo: coloca a cada
sospechoso en la escena del crimen usando lógica pura —una persona por
fila, una por columna— hasta descubrir quién compartía habitación con la
víctima.

Cada caso se genera de forma procedural y se verifica con un solver antes
de mostrarse: **está garantizado que tiene una única solución posible.**

## Cómo se juega

- El tablero es una cuadrícula de N×N dividida en habitaciones.
- Cada sospechoso (y la víctima) ocupa una única casilla; nunca hay dos
  personas en la misma fila o en la misma columna.
- Cada sospechoso trae una pista (o dos) sobre su posición: en qué
  habitación estaba, junto a qué mueble, en qué esquina, con cuánta gente
  más compartía sala, etc.
- La víctima no tiene pista propia: su casilla es la fila/columna que
  sobra una vez ubicados todos los sospechosos.
- Quien acabe compartiendo habitación con la víctima es el asesino.
- Toca a un sospechoso para "armarlo" y luego toca una casilla del
  tablero para colocarlo. Puedes recoger y mover fichas ya puestas.

Tres casos añaden una regla especial (se avisa en la propia ficha del
caso):

- **Noche de Estrellas** — "junto a" también cuenta en diagonal.
- **El Torneo de los Caballeros** — "junto a" se mide con un movimiento
  de caballo de ajedrez (en L).
- **Doble Crimen** — dos escenas independientes (planta baja / planta
  alta) que se resuelven por separado dentro del mismo caso.

## Cómo ejecutarlo

No requiere build ni servidor: basta con abrir `index.html` en un
navegador, o servirlo estáticamente:

```bash
npx serve .
# o simplemente
python3 -m http.server 8080
```

Para publicarlo en GitHub Pages (por ejemplo, en el repo `Asesidokus`):
sube el contenido de esta carpeta a la rama que uses para Pages (o a
`main` si Pages está configurado para servir desde la raíz) y activa
GitHub Pages en la configuración del repositorio.

## Estructura del proyecto

```
index.html          punto de entrada
css/styles.css       todo el diseño visual
js/engine.js         motor: habitaciones, mobiliario, permutaciones,
                      catálogo de hechos y el solver que cuenta soluciones
js/generator.js       genera un caso completo y elige el conjunto de
                      pistas mínimo que deja una única solución
js/themes.js          contenido de cada caso: nombres, habitaciones,
                      mobiliario y texto de ambientación (16 temas)
js/phrasing.js        traduce los "hechos" internos a frases en español
                      (con concordancia de género/artículos)
js/app.js             interfaz: selector de casos, tablero interactivo,
                      temporizador, modo doble, códigos compartibles
test/verify.js         genera cientos de casos por tema/dificultad y
                      los verifica con un solver 100% independiente del
                      motor (uniqueness check + coherencia interna)
test/smoke.js          prueba de humo de la interfaz en un DOM simulado
test/solve.js           resuelve un caso real de cada tema simulando
                      clics reales y comprueba que se revela el asesino
test/extra.js           modo doble, detección de conflictos, "revelar
                      solución" y códigos de caso compartibles por URL
```

## Cómo funciona la garantía de solución única

1. Se genera un tablero con habitaciones rectangulares y mobiliario al
   azar, y una asignación aleatoria de personas a casillas (una fila y
   una columna por persona).
2. Se calcula el catálogo de hechos verdaderos sobre cada sospechoso
   (habitación, mueble adyacente, esquina, fila/columna compartida con
   un mueble, cuántas personas más había en su sala...).
3. Un solver por backtracking (el mismo tipo de algoritmo que resuelve
   Sudokus) cuenta cuántas asignaciones distintas cumplen las pistas
   reveladas hasta el momento.
4. Se van revelando pistas —repartidas de forma pareja entre los
   sospechosos— hasta que el solver confirma **exactamente una**
   solución posible, y después se podan las pistas redundantes para
   dejar el caso lo más limpio posible sin perder la unicidad.
5. `test/verify.js` repite este proceso cientos de veces por tema y
   dificultad y vuelve a contarlo todo con un verificador
   **completamente independiente** del código del generador, para
   confirmar que no hay ningún caso con más de una solución.

## Ejecutar las pruebas

```bash
npm install        # instala jsdom (única dependencia, solo de test)
node test/verify.js            # stress test del motor (rápido)
TRIALS=40 node test/verify.js  # stress test más exhaustivo
node test/smoke.js             # humo de la interfaz
node test/solve.js             # resuelve un caso real por tema vía DOM
node test/extra.js             # modo doble, conflictos, códigos de caso
```

## Notas sobre el contenido

- La mecánica está basada en el formato "murder-mystery logic puzzle"
  popularizado por *Murdoku* (Manuel Garand / Puzzlewright Press) y por
  murdermysterypuzzles.com — usada aquí como referencia de reglas, no de
  contenido: todos los casos, nombres, habitaciones y textos de este
  proyecto son originales.
- Los 14 "casos nuevos" pedidos (sendero, faro, cena, fútbol, vecindario,
  estrella, oficina, hockey, pirata, doble, batalla de estrellas,
  caballeros, asedio y fórmula 1) están recreados aquí de forma original:
  las páginas de referencia en `pmlemay.github.io/4color` devolvían error
  404 al intentar consultarlas (parecen depender de una app cliente sin
  contenido accesible sin JavaScript), así que en vez de adivinar su
  contenido exacto se generó contenido propio fiel al espíritu de cada
  nombre, y se implementaron como reglas especiales reales los tres casos
  cuyo nombre sugería claramente una variante mecánica (estrella, doble,
  caballeros). Si tienes acceso al contenido original de esas páginas,
  puedo ajustar el tema correspondiente para que se parezca más.
