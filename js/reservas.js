// js/reservas.js
(function(){
  const modal = document.getElementById("modal-reservas");
  const btnCerrar = document.getElementById("cerrar-modal-reservas");

  function abrirModalReservas(){ if (modal) modal.style.display = "flex"; }
  function cerrarModalReservas(){ if (modal) modal.style.display = "none"; }

  // Exponer porque el menú usa onclick
  window.abrirModalReservas  = abrirModalReservas;
  window.cerrarModalReservas = cerrarModalReservas;

  // Respaldo: engancha el link "Reservas" del navbar por data-action o por texto
  document.querySelectorAll('a[href="#"]').forEach(a => {
    if (/reservas/i.test(a.textContent || "")) {
      a.addEventListener("click", (e) => { e.preventDefault(); abrirModalReservas(); });
    }
  });

  window.reservarPorWhatsapp = function(){
    cerrarModalReservas();
    if (typeof gtag === "function") {
      gtag('event', 'click_reserva_whatsapp', {
        'event_category': 'conversion',
        'event_label': 'Reserva Modal WhatsApp'
      });
    }
    setTimeout(() => {
      window.open("https://wa.me/573159267529?text=Hola%2C%20quiero%20hacer%20una%20reserva%20en%20Rodizio%20Do%20Sul%20para%20hoy", "_blank");
    }, 400);
  };

  if (btnCerrar) btnCerrar.addEventListener("click", cerrarModalReservas);
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModalReservas(); });
})();
