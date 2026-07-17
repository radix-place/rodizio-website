const PROMOCION = {
  activa: true,
  modoPrueba: true,

  imagen: "imagenes/promo2by2.png",

  enlace:
    "https://wa.me/573159267529?text=Hola%2C%20quisiera%20reservar%20una%20mesa%20y%20consultar%20la%20promoci%C3%B3n%202x1%20en%20c%C3%B3cteles.",

  retrasoApertura: 800,
  cierreAutomatico: 12000,

  frecuencia: "diaria",

  fechaInicio: "2026-07-16",
  fechaFin: "2026-12-31"
};

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("promo-modal");
  const imagen = document.getElementById("promo-modal-image");
  const enlace = document.getElementById("promo-modal-link");
  const controlesCerrar = document.querySelectorAll("[data-promo-close]");

  if (!modal || !imagen || !enlace) {
    console.error("[Do Sul] Falta la estructura HTML del modal.");
    return;
  }

  if (!PROMOCION.activa) return;
  if (!PROMOCION.modoPrueba && !promocionDentroDeFecha()) return;
  if (!PROMOCION.modoPrueba && !debeMostrarse()) return;

  imagen.src = PROMOCION.imagen;
  enlace.href = PROMOCION.enlace;

  imagen.addEventListener("error", () => {
    console.error(
      `[Do Sul] No se encontró la imagen: ${PROMOCION.imagen}. ` +
      "Comprueba la carpeta, el nombre y las mayúsculas."
    );
  });

  let temporizadorApertura = null;
  let temporizadorCierre = null;
  let ultimoElementoActivo = null;

  function abrirModal() {
    ultimoElementoActivo = document.activeElement;

    modal.hidden = false;

    requestAnimationFrame(() => {
      modal.classList.add("is-visible");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("promo-open");

      const botonCerrar = modal.querySelector(".promo-modal-close");
      if (botonCerrar) botonCerrar.focus();

      if (!PROMOCION.modoPrueba) registrarVisualizacion();

      if (PROMOCION.cierreAutomatico > 0) {
        temporizadorCierre = window.setTimeout(
          cerrarModal,
          PROMOCION.cierreAutomatico
        );
      }
    });
  }

  function cerrarModal() {
    if (modal.hidden) return;

    modal.classList.remove("is-visible");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("promo-open");

    if (temporizadorCierre) {
      window.clearTimeout(temporizadorCierre);
      temporizadorCierre = null;
    }

    window.setTimeout(() => {
      modal.hidden = true;
    }, 230);

    if (
      ultimoElementoActivo &&
      typeof ultimoElementoActivo.focus === "function"
    ) {
      ultimoElementoActivo.focus();
    }
  }

  controlesCerrar.forEach((control) => {
    control.addEventListener("click", cerrarModal);
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") cerrarModal();
  });

  enlace.addEventListener("click", () => {
    cerrarModal();

    if (typeof gtag === "function") {
      gtag("event", "click_promocion", {
        event_category: "promocion",
        event_label: "Happy Hour 2x1"
      });
    }
  });

  temporizadorApertura = window.setTimeout(
    abrirModal,
    Math.max(0, PROMOCION.retrasoApertura)
  );

  function promocionDentroDeFecha() {
    const hoy = obtenerFechaLocal();
    const inicio = PROMOCION.fechaInicio || "0000-01-01";
    const fin = PROMOCION.fechaFin || "9999-12-31";
    return hoy >= inicio && hoy <= fin;
  }

  function debeMostrarse() {
    if (PROMOCION.frecuencia === "siempre") return true;

    if (PROMOCION.frecuencia === "sesion") {
      return sessionStorage.getItem("doSulPromocionVista") !== "true";
    }

    if (PROMOCION.frecuencia === "diaria") {
      return localStorage.getItem("doSulPromocionFecha") !== obtenerFechaLocal();
    }

    return true;
  }

  function registrarVisualizacion() {
    if (PROMOCION.frecuencia === "sesion") {
      sessionStorage.setItem("doSulPromocionVista", "true");
    }

    if (PROMOCION.frecuencia === "diaria") {
      localStorage.setItem("doSulPromocionFecha", obtenerFechaLocal());
    }
  }

  function obtenerFechaLocal() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
  }
});
