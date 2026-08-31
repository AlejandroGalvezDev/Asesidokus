/* Retratos reales del caso Dragon Ball.
 * Solo sustituye los avatares de sospechosos; no altera tablero ni lógica.
 */
(function () {
  "use strict";

  const ORDER = ["Goku", "Vegeta", "Lunch", "Bulma", "Piccolo", "Krillin"];
  const PORTRAITS = {
    Goku: "assets/portraits/dragon-ball/goku.webp",
    Vegeta: "assets/portraits/dragon-ball/vegeta.webp",
    Lunch: "assets/portraits/dragon-ball/lunch.webp",
    Bulma: "assets/portraits/dragon-ball/bulma.webp",
    Piccolo: "assets/portraits/dragon-ball/piccolo.webp",
    Krillin: "assets/portraits/dragon-ball/krillin.webp"
  };

  function isDragonBall() {
    return location.hash.indexOf("dragon_ball~") !== -1;
  }

  function nearestName(img) {
    const attrs = [img.alt, img.title, img.getAttribute("aria-label")]
      .filter(Boolean).join(" ");
    for (const name of ORDER) if (attrs.includes(name)) return name;

    let node = img.parentElement;
    for (let depth = 0; node && depth < 5; depth++, node = node.parentElement) {
      const text = node.textContent || "";
      for (const name of ORDER) {
        if (new RegExp(`(^|\\s)${name}(\\s|$)`).test(text)) return name;
      }
    }
    return null;
  }

  function applyPortraits() {
    if (!isDragonBall()) return;
    const imgs = Array.from(document.querySelectorAll('img[src*="assets/portraits/"]'));
    imgs.forEach((img, index) => {
      const name = nearestName(img) || ORDER[index % ORDER.length];
      const src = PORTRAITS[name];
      if (!src || img.dataset.dragonBallPortrait === name) return;
      img.src = src;
      img.alt = name;
      img.dataset.dragonBallPortrait = name;
    });
  }

  const observer = new MutationObserver(applyPortraits);
  document.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.documentElement, { childList: true, subtree: true });
    applyPortraits();
  });
  window.addEventListener("hashchange", () => setTimeout(applyPortraits, 0));
})();
