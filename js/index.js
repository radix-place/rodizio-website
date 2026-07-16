(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-button");
  const navPanel = document.querySelector(".nav-panel");
  const navLinks = document.querySelectorAll(".nav-panel a");
  const year = document.getElementById("current-year");
  const reservationLinks = document.querySelectorAll("[data-reservation-link]");
  const floatingReservation = document.querySelector(".whatsapp-floating");
  const reservationHideZones = document.querySelectorAll("#contacto, #reserva-final, .site-footer");

  function closeMenu() {
    if (!menuButton || !navPanel) return;

    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menú");
    navPanel.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }

  function toggleMenu() {
    if (!menuButton || !navPanel) return;

    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Abrir menú" : "Cerrar menú");
    navPanel.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  }

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  if (menuButton) {
    menuButton.addEventListener("click", toggleMenu);
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeMenu();
  });

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }


  if (floatingReservation && "IntersectionObserver" in window) {
    const visibleZones = new Set();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleZones.add(entry.target);
        } else {
          visibleZones.delete(entry.target);
        }
      });

      floatingReservation.classList.toggle("is-hidden", visibleZones.size > 0);
    }, { threshold: 0.15 });

    reservationHideZones.forEach((zone) => observer.observe(zone));
  }

  reservationLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (typeof window.gtag === "function") {
        window.gtag("event", "click_reserva_whatsapp", {
          event_category: "conversion",
          event_label: link.textContent.trim()
        });
      }
    });
  });
})();
