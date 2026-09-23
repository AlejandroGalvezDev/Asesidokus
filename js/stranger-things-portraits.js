/* Retratos reales del caso Stranger Things.
 * Solo sustituye los avatares de sospechosos; no altera tablero ni lógica.
 */
(function () {
  "use strict";

  const ORDER = [
    "Mike Wheeler",
    "Eleven",
    "Dustin Henderson",
    "Lucas Sinclair",
    "Will Byers",
    "Max Mayfield",
    "Jonathan Byers",
    "Nancy Wheeler",
    "Joyce Byers",
    "Jim Hopper",
    "Karen Wheeler",
    "Ted Wheeler",
    "Steve Harrington",
    "Barb Holland"
  ];

  const PORTRAITS = {
    "Mike Wheeler": "assets/portraits/Stranger-Things/Mike Wheeler.png",
    "Eleven": "assets/portraits/Stranger-Things/Eleven.png",
    "Dustin Henderson": "assets/portraits/Stranger-Things/Dustin Henderson.png",
    "Lucas Sinclair": "assets/portraits/Stranger-Things/Lucas Sinclair.png",
    "Will Byers": "assets/portraits/Stranger-Things/Will Byers.png",
    "Max Mayfield": "assets/portraits/Stranger-Things/Max Mayfield.png",
    "Jonathan Byers": "assets/portraits/Stranger-Things/Jonathan Byers.png",
    "Nancy Wheeler": "assets/portraits/Stranger-Things/Nancy Wheeler.png",
    "Joyce Byers": "assets/portraits/Stranger-Things/Joyce Byers.png",
    "Jim Hopper": "assets/portraits/Stranger-Things/Jim Hopper.png",
    "Karen Wheeler": "assets/portraits/Stranger-Things/Karen Wheeler.png",
    "Ted Wheeler": "assets/portraits/Stranger-Things/Ted Wheeler.png",
    "Steve Harrington": "assets/portraits/Stranger-Things/Steve Harrington.png",
    "Barb Holland": "assets/portraits/Stranger-Things/Barb Holland.png"
  };

  function isStrangerThings() {
    return location.hash.indexOf("stranger_things~") !== -1;
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
    if (!isStrangerThings()) return;
    const imgs = Array.from(document.querySelectorAll('img[src*="assets/portraits/"]'));
    imgs.forEach((img, index) => {
      const name = nearestName(img) || ORDER[index % ORDER.length];
      const src = PORTRAITS[name];
      if (!src || img.dataset.strangerThingsPortrait === name) return;
      img.src = src;
      img.alt = name;
      img.dataset.strangerThingsPortrait = name;
    });
  }

  const observer = new MutationObserver(applyPortraits);
  document.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.documentElement, { childList: true, subtree: true });
    applyPortraits();
  });
  window.addEventListener("hashchange", () => setTimeout(applyPortraits, 0));
})();
