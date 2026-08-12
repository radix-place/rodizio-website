const MODAL_AVISOS = {
  activa: true,

  /*
   * true  = muestra todos los avisos para hacer pruebas.
   * false = respeta fechas y frecuencia de visualización.
   */
  modoPrueba: true,

  // Tiempo antes de abrir el modal.
  retrasoApertura: 1200,

  // Tiempo de permanencia de cada aviso.
  duracionAviso: 4500,

  /*
   * true  = después del último aviso se cierra el modal.
   * false = vuelve al primer aviso.
   */
  cerrarAlFinal: true,

  avisos: [
    // =====================================================
    // CALI - TERREMOTO
    // =====================================================
    {
      id: "cali-terremoto-2026",

      activa: true,

      titulo: "Cali, estamos contigo",

      imagen: "imagenes/do_sul_cali_web_terremoto.webp",

      alt:
        "Mensaje de solidaridad de Do Sul Restaurante con Cali",

      ancho: 1080,
      alto: 1440,

      // null = la imagen es solamente informativa.
      enlace: null,

      /*
       * Opciones:
       * "siempre"
       * "sesion"
       * "diaria"
       * "unaVez"
       */
      frecuencia: "diaria",

      fechaInicio: "2026-08-12",
      fechaFin: "2026-08-31"
    },

    // =====================================================
    // HAPPY HOUR
    // =====================================================
    {
      id: "happy-hour-2x1",

      activa: true,

      titulo: "Happy Hour 2 por 1",

      imagen: "imagenes/promo2by2.png",

      alt:
        "Happy Hour 2 por 1 en cócteles seleccionados en Do Sul Restaurante",

      ancho: 1080,
      alto: 1350,

      enlace: null,

      frecuencia: "diaria",

      fechaInicio: "2026-07-16",
      fechaFin: "2026-12-31"
    }
  ]
};


document.addEventListener("DOMContentLoaded", () => {

  const modal =
    document.getElementById("promo-modal");

  const titulo =
    document.getElementById("promo-modal-title");

  const imagen =
    document.getElementById("promo-modal-image");

  const contenedorImagen =
    document.getElementById("promo-modal-link");

  const botonAnterior =
    document.querySelector("[data-promo-prev]");

  const botonSiguiente =
    document.querySelector("[data-promo-next]");

  const paginacion =
    document.getElementById("promo-modal-dots");

  const controlesCerrar =
    document.querySelectorAll("[data-promo-close]");


  // =======================================================
  // VERIFICAR ESTRUCTURA HTML
  // =======================================================

  if (
    !modal ||
    !titulo ||
    !imagen ||
    !contenedorImagen ||
    !botonAnterior ||
    !botonSiguiente ||
    !paginacion
  ) {
    console.error(
      "[Do Sul] Falta la estructura HTML del modal de avisos."
    );

    return;
  }


  if (!MODAL_AVISOS.activa) {
    return;
  }


  // =======================================================
  // DETERMINAR QUÉ AVISOS DEBEN MOSTRARSE
  // =======================================================

  const avisosDisponibles =
    MODAL_AVISOS.avisos.filter((aviso) => {

      if (!aviso.activa) {
        return false;
      }


      /*
       * En modo prueba ignoramos fechas
       * y frecuencia.
       */
      if (MODAL_AVISOS.modoPrueba) {
        return true;
      }


      return (
        avisoDentroDeFecha(aviso) &&
        debeMostrarse(aviso)
      );
    });


  /*
   * Si no hay ningún aviso disponible,
   * no abrimos el modal.
   */
  if (avisosDisponibles.length === 0) {
    return;
  }


  // =======================================================
  // ESTADO
  // =======================================================

  let indiceActual = 0;

  let temporizadorApertura = null;
  let temporizadorCambio = null;

  let ultimoElementoActivo = null;


  // =======================================================
  // PREPARAR MODAL
  // =======================================================

  crearPaginacion();

  mostrarAviso(0, false);

  precargarAvisos();


  // =======================================================
  // APERTURA
  // =======================================================

  temporizadorApertura =
    window.setTimeout(
      abrirModal,
      Math.max(
        0,
        MODAL_AVISOS.retrasoApertura
      )
    );


  function abrirModal() {

    ultimoElementoActivo =
      document.activeElement;


    modal.hidden = false;


    requestAnimationFrame(() => {

      modal.classList.add("is-visible");

      modal.setAttribute(
        "aria-hidden",
        "false"
      );

      document.body.classList.add(
        "promo-open"
      );


      const botonCerrar =
        modal.querySelector(
          ".promo-modal-close"
        );


      if (botonCerrar) {
        botonCerrar.focus();
      }


      registrarAvisoActual();

      programarCambioAutomatico();

    });
  }


  // =======================================================
  // CERRAR MODAL
  // =======================================================

  function cerrarModal() {

    if (modal.hidden) {
      return;
    }


    modal.classList.remove(
      "is-visible"
    );

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "promo-open"
    );


    if (temporizadorCambio) {

      window.clearTimeout(
        temporizadorCambio
      );

      temporizadorCambio = null;

    }


    if (temporizadorApertura) {

      window.clearTimeout(
        temporizadorApertura
      );

      temporizadorApertura = null;

    }


    window.setTimeout(() => {

      modal.hidden = true;

    }, 230);


    if (
      ultimoElementoActivo &&
      typeof ultimoElementoActivo.focus ===
        "function"
    ) {

      ultimoElementoActivo.focus();

    }
  }


  // =======================================================
  // MOSTRAR UN AVISO
  // =======================================================

  function mostrarAviso(
    nuevoIndice,
    registrar = true
  ) {

    indiceActual =
      (
        nuevoIndice +
        avisosDisponibles.length
      ) %
      avisosDisponibles.length;


    const aviso =
      avisosDisponibles[indiceActual];


    titulo.textContent =
      aviso.titulo ||
      "Aviso Do Sul";


    imagen.src =
      aviso.imagen;


    imagen.alt =
      aviso.alt ||
      "Aviso de Do Sul Restaurante";


    if (aviso.ancho) {
      imagen.width = aviso.ancho;
    }


    if (aviso.alto) {
      imagen.height = aviso.alto;
    }


    configurarEnlace(aviso);

    actualizarPaginacion();


    /*
     * Registrar únicamente cuando
     * el modal ya está visible.
     */
    if (
      registrar &&
      modal.classList.contains(
        "is-visible"
      )
    ) {

      registrarVisualizacion(aviso);

    }
  }


  // =======================================================
  // ENLACE OPCIONAL
  // =======================================================

  function configurarEnlace(aviso) {

    /*
     * Si posteriormente algún aviso debe
     * llevar a una página determinada,
     * basta con asignar una URL a enlace.
     */
    if (aviso.enlace) {

      contenedorImagen.href =
        aviso.enlace;

      contenedorImagen.target =
        aviso.target || "_blank";

      contenedorImagen.rel =
        "noopener noreferrer";


      contenedorImagen.removeAttribute(
        "aria-disabled"
      );

      contenedorImagen.removeAttribute(
        "tabindex"
      );


      contenedorImagen.setAttribute(
        "aria-label",
        aviso.ariaLabel ||
        aviso.titulo ||
        "Abrir aviso"
      );


      contenedorImagen.style.cursor =
        "pointer";


      return;
    }


    /*
     * Aviso informativo sin enlace.
     */
    contenedorImagen.removeAttribute(
      "href"
    );

    contenedorImagen.removeAttribute(
      "target"
    );

    contenedorImagen.removeAttribute(
      "rel"
    );

    contenedorImagen.removeAttribute(
      "aria-label"
    );


    contenedorImagen.setAttribute(
      "aria-disabled",
      "true"
    );

    contenedorImagen.setAttribute(
      "tabindex",
      "-1"
    );

    contenedorImagen.style.cursor =
      "default";
  }


  // =======================================================
  // IR A UN AVISO
  // =======================================================

  function irAlAviso(nuevoIndice) {

    mostrarAviso(
      nuevoIndice
    );

    programarCambioAutomatico();
  }


  // =======================================================
  // CAMBIO AUTOMÁTICO
  // =======================================================

  function programarCambioAutomatico() {

    if (temporizadorCambio) {

      window.clearTimeout(
        temporizadorCambio
      );

      temporizadorCambio = null;

    }


    if (
      MODAL_AVISOS.duracionAviso <= 0
    ) {
      return;
    }


    temporizadorCambio =
      window.setTimeout(() => {

        const esUltimo =
          indiceActual ===
          avisosDisponibles.length - 1;


        /*
         * Si estamos en el último aviso,
         * cerramos el modal.
         */
        if (
          esUltimo &&
          MODAL_AVISOS.cerrarAlFinal
        ) {

          cerrarModal();

          return;
        }


        /*
         * De lo contrario pasamos
         * al siguiente aviso.
         */
        irAlAviso(
          indiceActual + 1
        );

      }, MODAL_AVISOS.duracionAviso);
  }


  // =======================================================
  // PAGINACIÓN
  // =======================================================

  function crearPaginacion() {

    paginacion.innerHTML = "";


    const ocultarNavegacion =
      avisosDisponibles.length <= 1;


    botonAnterior.hidden =
      ocultarNavegacion;

    botonSiguiente.hidden =
      ocultarNavegacion;

    paginacion.hidden =
      ocultarNavegacion;


    if (ocultarNavegacion) {
      return;
    }


    avisosDisponibles.forEach(
      (aviso, indice) => {

        const boton =
          document.createElement(
            "button"
          );


        boton.type =
          "button";


        boton.className =
          "promo-modal-dot";


        boton.setAttribute(
          "aria-label",
          `Ver aviso ${indice + 1}: ${aviso.titulo}`
        );


        boton.dataset.indice =
          String(indice);


        boton.addEventListener(
          "click",
          () => {

            irAlAviso(indice);

          }
        );


        paginacion.appendChild(
          boton
        );

      }
    );
  }


  function actualizarPaginacion() {

    const puntos =
      paginacion.querySelectorAll(
        ".promo-modal-dot"
      );


    puntos.forEach(
      (punto, indice) => {

        const activo =
          indice === indiceActual;


        punto.classList.toggle(
          "is-active",
          activo
        );


        if (activo) {

          punto.setAttribute(
            "aria-current",
            "true"
          );

        } else {

          punto.removeAttribute(
            "aria-current"
          );

        }

      }
    );
  }


  // =======================================================
  // REGISTRAR VISUALIZACIÓN
  // =======================================================

  function registrarAvisoActual() {

    registrarVisualizacion(
      avisosDisponibles[indiceActual]
    );
  }


  function registrarVisualizacion(aviso) {

    /*
     * Durante las pruebas no guardamos
     * ninguna visualización.
     */
    if (MODAL_AVISOS.modoPrueba) {
      return;
    }


    const frecuencia =
      aviso.frecuencia ||
      "siempre";


    if (
      frecuencia === "sesion"
    ) {

      guardar(
        sessionStorage,
        claveAviso(
          aviso,
          "sesion"
        ),
        "true"
      );

    }


    if (
      frecuencia === "diaria"
    ) {

      guardar(
        localStorage,
        claveAviso(
          aviso,
          "fecha"
        ),
        obtenerFechaLocal()
      );

    }


    if (
      frecuencia === "unaVez"
    ) {

      guardar(
        localStorage,
        claveAviso(
          aviso,
          "visto"
        ),
        "true"
      );

    }
  }


  // =======================================================
  // DETERMINAR SI DEBE MOSTRARSE
  // =======================================================

  function debeMostrarse(aviso) {

    const frecuencia =
      aviso.frecuencia ||
      "siempre";


    if (
      frecuencia === "siempre"
    ) {

      return true;

    }


    if (
      frecuencia === "sesion"
    ) {

      return (
        leer(
          sessionStorage,
          claveAviso(
            aviso,
            "sesion"
          )
        ) !== "true"
      );

    }


    if (
      frecuencia === "diaria"
    ) {

      return (
        leer(
          localStorage,
          claveAviso(
            aviso,
            "fecha"
          )
        ) !==
        obtenerFechaLocal()
      );

    }


    if (
      frecuencia === "unaVez"
    ) {

      return (
        leer(
          localStorage,
          claveAviso(
            aviso,
            "visto"
          )
        ) !== "true"
      );

    }


    return true;
  }


  // =======================================================
  // FECHAS
  // =======================================================

  function avisoDentroDeFecha(aviso) {

    const hoy =
      obtenerFechaLocal();


    const inicio =
      aviso.fechaInicio ||
      "0000-01-01";


    const fin =
      aviso.fechaFin ||
      "9999-12-31";


    return (
      hoy >= inicio &&
      hoy <= fin
    );
  }


  // =======================================================
  // CLAVES DE LOCAL / SESSION STORAGE
  // =======================================================

  function claveAviso(
    aviso,
    tipo
  ) {

    return (
      `doSulAviso:` +
      `${aviso.id}:` +
      `${tipo}`
    );
  }


  // =======================================================
  // STORAGE SEGURO
  // =======================================================

  function guardar(
    storage,
    clave,
    valor
  ) {

    try {

      storage.setItem(
        clave,
        valor
      );

    } catch (error) {

      console.warn(
        "[Do Sul] No fue posible guardar la visualización.",
        error
      );

    }
  }


  function leer(
    storage,
    clave
  ) {

    try {

      return storage.getItem(
        clave
      );

    } catch (error) {

      console.warn(
        "[Do Sul] No fue posible consultar la visualización.",
        error
      );

      return null;

    }
  }


  // =======================================================
  // FECHA LOCAL
  // =======================================================

  function obtenerFechaLocal() {

    const ahora =
      new Date();


    const anio =
      ahora.getFullYear();


    const mes =
      String(
        ahora.getMonth() + 1
      ).padStart(
        2,
        "0"
      );


    const dia =
      String(
        ahora.getDate()
      ).padStart(
        2,
        "0"
      );


    return (
      `${anio}-${mes}-${dia}`
    );
  }


  // =======================================================
  // PRECARGAR IMÁGENES
  // =======================================================

  function precargarAvisos() {

    avisosDisponibles
      .slice(1)
      .forEach((aviso) => {

        const recurso =
          new Image();


        recurso.src =
          aviso.imagen;

      });
  }


  // =======================================================
  // CONTROLES
  // =======================================================

  botonAnterior.addEventListener(
    "click",
    () => {

      irAlAviso(
        indiceActual - 1
      );

    }
  );


  botonSiguiente.addEventListener(
    "click",
    () => {

      irAlAviso(
        indiceActual + 1
      );

    }
  );


  controlesCerrar.forEach(
    (control) => {

      control.addEventListener(
        "click",
        cerrarModal
      );

    }
  );


  // =======================================================
  // CLICK SOBRE LA IMAGEN
  // =======================================================

  contenedorImagen.addEventListener(
    "click",
    (evento) => {

      const aviso =
        avisosDisponibles[indiceActual];


      /*
       * Si el aviso es informativo,
       * la imagen no hace nada.
       */
      if (!aviso.enlace) {

        evento.preventDefault();
        evento.stopPropagation();

        return;

      }


      cerrarModal();

    }
  );


  // =======================================================
  // TECLADO
  // =======================================================

  document.addEventListener(
    "keydown",
    (evento) => {

      if (
        !modal.classList.contains(
          "is-visible"
        )
      ) {
        return;
      }


      if (
        evento.key === "Escape"
      ) {

        cerrarModal();

        return;

      }


      if (
        evento.key === "ArrowLeft" &&
        avisosDisponibles.length > 1
      ) {

        irAlAviso(
          indiceActual - 1
        );

        return;

      }


      if (
        evento.key === "ArrowRight" &&
        avisosDisponibles.length > 1
      ) {

        irAlAviso(
          indiceActual + 1
        );

      }

    }
  );


  // =======================================================
  // ERROR AL CARGAR UNA IMAGEN
  // =======================================================

  imagen.addEventListener(
    "error",
    () => {

      const aviso =
        avisosDisponibles[indiceActual];


      console.error(
        `[Do Sul] No se encontró la imagen: ${aviso.imagen}. ` +
        "Comprueba la carpeta, el nombre y las mayúsculas."
      );

    }
  );

});