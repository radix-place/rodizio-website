(function () {
  "use strict";

  const languageButtons = document.querySelectorAll("[data-language]");
  const translatable = document.querySelectorAll("[data-es]");
  const categoryLinks = document.querySelectorAll("[data-category-link]");
  const categories = document.querySelectorAll(".menu-category");
  const search = document.getElementById("menu-search");
  const noResults = document.getElementById("menu-no-results");

  function replaceVisibleText(element, text) {
    const childElements = Array.from(element.children);
    const directTextNodes = Array.from(element.childNodes).filter(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );

    if (childElements.length === 0) {
      element.textContent = text;
      return;
    }

    if (directTextNodes.length > 0) {
      directTextNodes[0].textContent = `${text} `;
      directTextNodes.slice(1).forEach((node) => {
        node.textContent = " ";
      });
      return;
    }

    const nestedText = childElements.find((child) =>
      child.matches("strong, em")
    );

    if (nestedText) nestedText.textContent = text;
  }

  function setLanguage(language) {
    document.documentElement.lang = language;

    translatable.forEach((element) => {
      const value = element.dataset[language];
      if (typeof value === "string") replaceVisibleText(element, value);
    });

    languageButtons.forEach((button) => {
      const active = button.dataset.language === language;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (search) {
      search.placeholder = language === "es"
        ? search.dataset.placeholderEs
        : search.dataset.placeholderEn;
    }
  }

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.language));
  });

  categoryLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      const category = document.querySelector(id);
      if (!category) return;

      event.preventDefault();
      category.open = true;
      category.scrollIntoView({ behavior: "smooth", block: "start" });

      if (typeof window.gtag === "function") {
        window.gtag("event", "click_menu_categoria", {
          event_category: "menu",
          event_label: category.id
        });
      }
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        categoryLinks.forEach((link) => {
          link.classList.toggle(
            "is-active",
            link.getAttribute("href") === `#${entry.target.id}`
          );
        });
      });
    }, { rootMargin: "-35% 0px -55%", threshold: 0 });

    categories.forEach((category) => observer.observe(category));
  }

  function normalize(value) {
    return value
      .toLocaleLowerCase("es")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function filterMenu() {
    if (!search) return;
    const query = normalize(search.value.trim());
    let totalVisible = 0;

    categories.forEach((category) => {
      const items = category.querySelectorAll(".item-carta, .fila-destilado");
      let visibleInCategory = 0;

      items.forEach((item) => {
        const haystack = normalize([
          item.textContent,
          ...Array.from(item.querySelectorAll("[data-es], [data-en]")).flatMap((el) => [el.dataset.es || "", el.dataset.en || ""])
        ].join(" "));

        const visible = !query || haystack.includes(query);
        item.hidden = !visible;
        if (visible) visibleInCategory += 1;
      });

      const categoryTitle = normalize(category.querySelector(".category-title")?.textContent || "");
      const categoryVisible = !query || visibleInCategory > 0 || categoryTitle.includes(query);
      category.hidden = !categoryVisible;

      if (query && categoryVisible) category.open = true;
      if (categoryVisible) totalVisible += visibleInCategory;
    });

    if (noResults) noResults.hidden = !query || totalVisible > 0;
  }

  if (search) search.addEventListener("input", filterMenu);
  setLanguage("es");
})();
