// js/chef-modal.js
(function () {
  // ————— Datos —————
  const PLATOS = [
    { imagen: "imagenes/platos/LANGOSTA.webp",           descripcion: "Nuestra deliciosa Langosta" },
    { imagen: "imagenes/platos/langostinos_do_sul.webp", descripcion: "Nuestros Langostinos Do Sul" },
    { imagen: "imagenes/platos/picada.webp",             descripcion: "¡Una deliciosa picada!" },
    { imagen: "imagenes/platos/seviche_pulpo.webp",      descripcion: "Un seviche de pulpo" },
    { imagen: "imagenes/platos/lang_ajillo.webp",        descripcion: "Unos langostinos al ajillo." },
    { imagen: "imagenes/platos/lomo_trufa.webp",         descripcion: "Nuestro espectacular Lomo en Salsa de Trufa" },
    { imagen: "imagenes/platos/H_JACK_R.webp",           descripcion: "Una hamburguesa Jack Daniels doble" }
  ];

  // ————— Estado/refs —————
  let ready = false;
  let modal, cerrar, img, desc;

  const ensureDom = () => {
    if (ready) return true;
    modal  = document.getElementById("modal-promocion");
    cerrar = document.getElementById("cerrar-modal");
    img    = document.getElementById("imagen-plato");
    desc   = document.getElementById("descripcion-plato");
    if (!modal || !cerrar || !img || !desc) {
      console.warn("[chef-modal] Faltan elementos del modal");
      return false;
    }
    cerrar.addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    ready = true;
    return true;
  };

  // ————— Lógica —————
  function pickAndRenderDish() {
    const plato = PLATOS[Math.floor(Math.random() * PLATOS.length)];
    img.src = plato.imagen;
    img.alt = plato.descripcion;
    desc.innerHTML =
      `<div style="font-weight:bold; font-size:1.2rem; margin-bottom:.5rem;">👨‍🍳 El chef te sugiere…</div>${plato.descripcion}`;
  }

  function open() {
    if (!ensureDom()) return;
    pickAndRenderDish();
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
  }

  function close() {
    if (!modal) return;
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    // nada más aquí: el rodizio escucha su propio evento
  }

  // Exponer API global
  window.ChefModal = { open, close };

  // ⚠️ Importante: SIN auto-open aquí. Se abrirá cuando tú lo llames:
  //   RodizioModal -> (al cerrar) -> ChefModal.open()
})();
