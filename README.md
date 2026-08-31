# Murdoku — casos de misterio generados por procedimiento

Aplicación web (HTML + CSS + JavaScript puro, sin build ni dependencias en producción) que genera casos de Murdoku al vuelo: coloca a cada sospechoso en la escena del crimen usando lógica pura —una persona por fila, una por columna— hasta descubrir quién compartía habitación con la víctima.

Cada caso se genera de forma procedural y se verifica con un solver antes de mostrarse: está garantizado que tiene una única solución posible.

## Temáticas

El proyecto cuenta con 17 temáticas, incluida **Dragon Ball — El Misterio de las Siete Bolas**, con personajes, escenarios y elementos inspirados en el universo del anime.

## Cómo se juega

- El tablero es una cuadrícula de N×N dividida en habitaciones.
- Cada sospechoso (y la víctima) ocupa una única casilla; nunca hay dos personas en la misma fila o en la misma columna.
- Cada sospechoso trae una pista sobre su posición.
- La víctima no tiene pista propia: su casilla es la fila/columna que sobra una vez ubicados todos los sospechosos.
- Quien acabe compartiendo habitación con la víctima es el asesino.

Tres casos añaden una regla especial: Noche de Estrellas, El Torneo de los Caballeros y Doble Crimen.

## Cómo ejecutarlo

No requiere build ni servidor: basta con abrir `index.html` en un navegador, o servirlo estáticamente:

```bash
npx serve .
# o
python3 -m http.server 8080
```

## Estructura del proyecto

```text
index.html                  punto de entrada
css/styles.css              diseño visual
js/engine.js                motor y solver
js/generator.js             generación procedural de casos
js/themes.js                catálogo de los 16 temas originales
js/theme-dragon-ball.js     temática adicional de Dragon Ball (tema 17)
js/phrasing.js              generación de frases y pistas
js/app.js                   interfaz de la aplicación
test/                       pruebas automáticas
```

## Ejecutar las pruebas

```bash
npm install
node test/verify.js
node test/smoke.js
node test/solve.js
node test/extra.js
```
