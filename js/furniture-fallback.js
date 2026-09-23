/* Fallback para imágenes de muebles
 * Cuando una imagen de mueble no carga, muestra el emoji correspondiente
 * OPTIMIZADO: Evita bucles infinitos con MutationObserver
 */
(function () {
  "use strict";

  // Mapeo de iconos emoji para los muebles cuando fallan las imágenes
  const FURNITURE_EMOJI = {
    // Ocupables
    "walkie-talkie": "📻",
    "bate": "🏏",
    "calcetines": "🧦",
    "guitarra": "🎸",
    "hacha": "🪓",
    "camara": "📷",
    "coche": "🚗",
    
    // No ocupables
    "fuente-sodas": "🥤",
    "vela": "🕯️",
    "lampara-lava": "🟢",
    "portal": "🌀",
    "equipo-investigacion": "🔬",
    "vhs": "📼",
    "flores": "🌹",
    "lampara-neon": "🔴",
  };

  // Conjunto de imágenes ya procesadas para evitar duplicados
  const processedImages = new WeakSet();

  // Función para reemplazar imagen fallida con emoji
  function handleImageError(img) {
    // Evita procesar la misma imagen dos veces
    if (processedImages.has(img)) return;
    processedImages.add(img);
    
    const src = img.src || "";
    
    // Busca qué emoji corresponde según el nombre de archivo
    for (const [key, emoji] of Object.entries(FURNITURE_EMOJI)) {
      if (src.includes(key)) {
        // Reemplaza la imagen con el emoji
        img.style.display = "none";
        
        // Crea un elemento span con el emoji
        const emojiSpan = document.createElement("span");
        emojiSpan.textContent = emoji;
        emojiSpan.style.fontSize = "inherit";
        emojiSpan.style.lineHeight = "inherit";
        emojiSpan.className = "furniture-emoji-fallback";
        emojiSpan.setAttribute("data-furniture", key);
        
        // Inserta el emoji donde estaba la imagen
        if (img.parentNode) {
          img.parentNode.insertBefore(emojiSpan, img);
        }
        return;
      }
    }
  }

  // Función para aplicar fallback a todas las imágenes
  function applyFallbacks() {
    const imgs = Array.from(document.querySelectorAll('img[src*="assets/furniture/"]'));
    
    imgs.forEach(img => {
      // No procesa imágenes ya tratadas
      if (processedImages.has(img)) return;
      
      // Manejador para cuando la imagen falla
      img.addEventListener("error", function() {
        handleImageError(this);
      }, { once: true }); // Solo se ejecuta una vez
      
      // También verifica si ya está rota
      if (!img.complete || (img.naturalHeight === 0 && img.naturalWidth === 0)) {
        handleImageError(img);
      }
    });
  }

  // Aplicar fallbacks cuando el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyFallbacks);
  } else {
    // El DOM ya está listo
    applyFallbacks();
  }

  // Escuchar cambios, pero de forma optimizada
  let mutationTimeout;
  const observer = new MutationObserver(() => {
    clearTimeout(mutationTimeout);
    mutationTimeout = setTimeout(applyFallbacks, 100);
  });

  // Solo observa nodos añadidos, no cambios de atributos
  observer.observe(document.documentElement, { 
    childList: true, 
    subtree: true 
  });

  // Limpiar observer cuando la página se descarga
  window.addEventListener("beforeunload", () => {
    observer.disconnect();
  });
})();
