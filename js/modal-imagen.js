// =====================================
// MODALES SECUENCIALES (UNA SOLA VENTANA)
// =====================================

const ABRIR_INMEDIATO = true;

// CONFIGURACIÓN (aquí controlas todo)
const MODALES = [
  {
    src: "imagenes/dia_madre.png",
    alt: "Día de la Madre Do Sul",
    duracion: 3
  },
  {
    src: "imagenes/happy_hour.png",
    alt: "Happy Hour Do Sul",
    duracion: 2
  }
];

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal-imagen-inicial");
  const btnClose = document.getElementById("cerrar-modal-imagen");
  const img = document.getElementById("img-bienvenida");

  if (!modal || !btnClose || !img) return;

  let index = 0;
  let timer = null;
  let activo = false;

  function mostrarModal(i) {
    if (i >= MODALES.length) {
      cerrarModal();
      return;
    }

    index = i;
    const m = MODALES[index];

    img.src = m.src;
    img.alt = m.alt || "Promoción Do Sul";

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");

    activo = true;

    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      mostrarModal(index + 1);
    }, m.duracion * 1000);
  }

  function cerrarModal() {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    activo = false;
  }

  if (ABRIR_INMEDIATO && MODALES.length > 0) {
    mostrarModal(0);
  }

  // Cierre manual
  btnClose.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    cerrarModal();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrarModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activo) cerrarModal();
  });
});