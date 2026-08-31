/* Retratos dedicados para el caso Dragon Ball.
 * Se aplica como una capa visual sin alterar el tablero ni la lógica de Murdoku.
 */
(function () {
  "use strict";

  const ORDER = ["Goku", "Vegeta", "Gohan", "Bulma", "Piccolo", "Krillin"];
  const portraits = {
    Goku:    { skin: "#f2b27f", hair: "M18 82 L28 28 L38 52 L48 12 L58 50 L72 18 L70 60 L86 36 L78 88 Z", outfit: "#e8751a", chest: "#123d7a" },
    Vegeta:  { skin: "#efb07e", hair: "M18 88 L22 20 L34 50 L42 8 L50 48 L58 8 L66 50 L78 18 L82 88 Z", outfit: "#274d87", chest: "#f2f2e9" },
    Gohan:   { skin: "#efb07e", hair: "M20 86 L26 34 L38 48 L48 18 L58 48 L70 30 L78 88 Z", outfit: "#5c2d6f", chest: "#e6c7a0" },
    Bulma:   { skin: "#f0b28c", hair: "M18 86 L18 36 Q28 12 50 14 Q76 16 82 46 L76 88 L66 58 L56 74 L44 58 L32 78 Z", outfit: "#c43d45", chest: "#8bc9d9" },
    Piccolo: { skin: "#82a85c", hair: "M18 88 L20 40 Q50 4 80 40 L82 88 Z", outfit: "#f2f0e4", chest: "#744a86" },
    Krillin: { skin: "#f0b07d", hair: "M25 86 Q24 24 50 18 Q76 24 75 86 Z", outfit: "#e8751a", chest: "#163f7a" }
  };

  function isDragonBall() {
    return location.hash.indexOf("dragon_ball~") !== -1;
  }

  function svgFor(name) {
    const p = portraits[name];
    if (!p) return null;
    const dots = name === "Krillin" ? '<circle cx="42" cy="31" r="2" fill="#9b5a42"/><circle cx="50" cy="27" r="2" fill="#9b5a42"/><circle cx="58" cy="31" r="2" fill="#9b5a42"/>' : "";
    const antenna = name === "Piccolo" ? '<path d="M30 38 Q22 16 30 8 M70 38 Q78 16 70 8" fill="none" stroke="#4e6f43" stroke-width="5" stroke-linecap="round"/>' : "";
    const scarf = name === "Bulma" ? '<path d="M22 88 L78 88 L68 100 L32 100 Z" fill="#d73b3e"/>' : "";
    const turban = name === "Piccolo" ? '<path d="M18 45 Q50 8 82 45 L78 56 Q50 34 22 56 Z" fill="#eee9db"/>' : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 130"><rect width="100" height="130" rx="10" fill="#10151d"/><path d="M10 130 Q18 84 50 84 Q82 84 90 130" fill="${p.outfit}"/><path d="M28 130 L38 92 L62 92 L72 130" fill="${p.chest}"/><path d="M22 50 Q22 26 50 24 Q78 26 78 50 L74 82 Q66 96 50 98 Q34 96 26 82 Z" fill="${p.skin}"/>${turban}<path d="${p.hair}" fill="#111216"/>${antenna}<ellipse cx="40" cy="59" rx="4" ry="3" fill="#111"/><ellipse cx="60" cy="59" rx="4" ry="3" fill="#111"/><path d="M42 76 Q50 81 58 76" fill="none" stroke="#7c3e35" stroke-width="2" stroke-linecap="round"/>${dots}${scarf}</svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function nearestName(img) {
    const attrs = [img.alt, img.title, img.getAttribute("aria-label")].filter(Boolean).join(" ");
    for (const name of ORDER) if (attrs.includes(name)) return name;
    let node = img.parentElement;
    for (let depth = 0; node && depth < 5; depth++, node = node.parentElement) {
      const text = node.textContent || "";
      for (const name of ORDER) if (new RegExp(`(^|\\s)${name}(\\s|$)`).test(text)) return name;
    }
    return null;
  }

  function applyPortraits() {
    if (!isDragonBall()) return;
    const imgs = Array.from(document.querySelectorAll('img[src*="assets/portraits/"]'));
    imgs.forEach((img, index) => {
      if (img.dataset.dragonBallPortrait === "1") return;
      const name = nearestName(img) || ORDER[index % ORDER.length];
      const src = svgFor(name);
      if (!src) return;
      img.src = src;
      img.alt = name;
      img.dataset.dragonBallPortrait = "1";
    });
  }

  const observer = new MutationObserver(applyPortraits);
  document.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.documentElement, { childList: true, subtree: true });
    applyPortraits();
  });
  window.addEventListener("hashchange", () => setTimeout(applyPortraits, 0));
})();
