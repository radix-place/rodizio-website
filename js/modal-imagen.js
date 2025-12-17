// =====================================
// MODAL IMAGEN INICIAL (AUTO OPEN + AUTO CLOSE)
// =====================================

// En segundos (más claro):
const ABRIR_INMEDIATO = true; // true = abre apenas carga
const DURACION_MODAL_S = 4;   // <-- el modal dura N segundos y se cierra solo

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal-imagen-inicial");
  const btnClose = document.getElementById("cerrar-modal-imagen");

  if (!modal || !btnClose) return;

  let timerCerrar = null;

  function abrirModal() {
    // Mostrar
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");

    // Programar autocierre
    if (timerCerrar) clearTimeout(timerCerrar);
    timerCerrar = setTimeout(cerrarModal, DURACION_MODAL_S * 1000);
  }

  function cerrarModal() {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");

    if (timerCerrar) {
      clearTimeout(timerCerrar);
      timerCerrar = null;
    }
  }

  // Abrir apenas carga la página
  if (ABRIR_INMEDIATO) abrirModal();

  // Cerrar con botón X
  btnClose.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    cerrarModal();
  });

  // Cerrar con click fuera
  modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrarModal();
  });

  // Cerrar con Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarModal();
  });
});
