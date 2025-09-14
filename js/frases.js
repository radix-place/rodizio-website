// /js/frases.js
document.addEventListener("DOMContentLoaded", () => {
  const frases = [
    {
      titulo: "Descubre el mejor sabor de la ciudad",
      parrafo: "Déjate seducir por aromas intensos, texturas perfectas y cortes que se deshacen en tu boca."
    },
    {
      titulo: "Discover the finest flavor in town",
      parrafo: "Let yourself be seduced by rich aromas, perfect textures, and cuts that melt in your mouth."
    }
  ];

  let index = 0;
  const titulo = document.getElementById("titulo-dinamico");
  const parrafo = document.getElementById("parrafo-dinamico");

  setInterval(() => {
    index = (index + 1) % frases.length;
    titulo.style.opacity = 0;
    parrafo.style.opacity = 0;
    setTimeout(() => {
      titulo.textContent = frases[index].titulo;
      parrafo.textContent = frases[index].parrafo;
      titulo.style.opacity = 1;
      parrafo.style.opacity = 1;
    }, 700);
  }, 10000);
});
