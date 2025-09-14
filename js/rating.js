// /js/rating.js
(function(){
  const menu = {
    "Platos": ["Carne", "Pasta", "Pollo", "Mariscos / Pescado", "Fast food"],
    "Cocteles": ["Coctel"],
    "Bebidas": ["Jugos", "Sodas"],
    "Postres": ["Postre"]
  };

  const items = {
    "Carne": ["Rodizio", "Rodizio Premium", "Picanha (300g)", "Picanha (400g)",
      "New York Steak", "Rib Eye", "Morillo", "Churrasco", "Baby Beef",
      "Lomo en Salsa de trufa Negra", "Filet Mignon"],
    "Pasta": ["Pasta Fruto del Mar", "Pasta de Trufa (Pollo)", "Pasta de Trufa (Carne)"],
    "Pollo": ["File de Frango"],
    "Mariscos / Pescado": ["Ceviche de Pulpo", "Ceviche de Panceta", "Salmón a la Parrilla", "Salmón Fruto del Mar", "Langostinos Do Sul", "Langostinos al Ajillo"],
    "Fast food": ["Hamburguesa Clásica", "Hamburguesa Jack Daniels", "Hamburguesa Jack Daniels Doble"],
    "Coctel": ["Burbujeante de Cereza","Amargor de Vodka","Caricia Añeja","Secreto de la Tierra","Brisa Tequilera",
      "Arrechera","Guarito Sour","La Verde","Mar Morado","White Anis Negroni","Mint Julep","Paloma","Mojito Clásico",
      "Caipiroska","Negroni","Aperol Spritz","Campari Spritz","French 75","Mimosa","Caipiriña","Black Russian",
      "White Russian","Orgasmo Múltiple","El Padrino","La Madrina","Mojito Fresa","Mojito Maracuyá","Mojito Agras",
      "SAndría Espumosa (Copa)","Sangría Espumosa (Jarra)","Moscow Mule","Mexican Mule","Mezcal Mule",
      "Mojito Ron viejo de Caldas","Mojito La Hechicera","Mojito Zapaca 23","Sangría (COPA)","Sangría (Media Jarra)",
      "Sangría (Jarra)","Samba (Copa)","Samba (Media Jarra)","Samba (Jarra)","Negroni Clásico","Negroni Mezcal",
      "Negroni White","Martini Tanqueray","Martini Bombay","Martini Hendrick's","Martini Monkey 47","Martini Absolut",
      "Vordka Martini Lemon Drop","Vodka Martini Grey Goose","Whisky Sour","Pisco Sour","Amaretto Sour","Tequila Sour",
      "Vodka Sour","Piña Colada Tradicional","Piña Colada La Hechicera","Piña Colada Zacapa 23"],
    "Jugos": ["Jugos en agua", "Jugos en leche", "Limonada Natural", "Limonada de coco", "Limonada de cereza", "Limonada de mango viche"],
    "Postre": ["Postre de Natas", "Esponjado de Maracuyá", "Bola de Helado", "Flan de Caramelo"],
    "Sodas": ["Soda Italiana"]
  };

  let calificacionSeleccionada = 0;

  // Exponer funciones globales porque las llamas desde atributos onclick del HTML
  window.mostrarModal = function(){ document.getElementById("modalFormulario").style.display = "block"; };
  window.cerrarModal  = function(){ document.getElementById("modalFormulario").style.display = "none";  };

  window.cargarSubcategorias = function(){
    const cat = document.getElementById('categoria').value;
    const sub = document.getElementById('subcategoria');
    sub.innerHTML = '<option value="">Selecciona una subcategoría</option>';
    document.getElementById('item').innerHTML = '<option value="">Selecciona un ítem</option>';
    document.getElementById('calificacion').innerHTML = '';
    if (!cat || !menu[cat]) return;
    menu[cat].forEach(s => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      sub.appendChild(opt);
    });
  };

  window.cargarItems = function(){
    const subcat = document.getElementById('subcategoria').value;
    const itm = document.getElementById('item');
    itm.innerHTML = '<option value="">Selecciona un ítem</option>';
    document.getElementById('calificacion').innerHTML = '';
    if (!subcat || !items[subcat]) return;
    items[subcat].forEach(i => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = i;
      itm.appendChild(opt);
    });
  };

  window.mostrarCalificacion = function(){
    const cont = document.getElementById('calificacion');
    cont.innerHTML = '<label>Calificación:</label><br>' +
      [1,2,3,4,5].map(n => `<span class='estrella' onclick='seleccionarCalificacion(${n})' id='estrella-${n}'>★</span>`).join('');
    actualizarEstrellas();
  };

  window.seleccionarCalificacion = function(n){
    calificacionSeleccionada = n;
    actualizarEstrellas();
  };

  function actualizarEstrellas(){
    for (let i = 1; i <= 5; i++){
      const estrella = document.getElementById(`estrella-${i}`);
      if (estrella) estrella.classList.toggle('activa', i <= calificacionSeleccionada);
    }
  }

  window.enviarFormulario = function(){
    const categoria    = document.getElementById('categoria').value;
    const subcategoria = document.getElementById('subcategoria').value;
    const nombre       = document.getElementById('item').value;
    const comentario   = document.getElementById('comentario').value;
    const calificacion = calificacionSeleccionada;

    if (!nombre || calificacion < 1) {
      alert('Por favor selecciona un ítem y una calificación.');
      return;
    }

    const boton = document.getElementById("boton-enviar");
    boton.disabled = true;

    let dots = 0;
    boton.textContent = "Enviando";
    const animacion = setInterval(() => {
      dots = (dots + 1) % 4;
      boton.textContent = "Enviando" + ".".repeat(dots);
    }, 500);

    const formData = new FormData();
    formData.append("categoria", categoria);
    formData.append("subcategoria", subcategoria);
    formData.append("nombre", nombre);
    formData.append("calificacion", calificacion);
    formData.append("comentario", comentario);

    fetch("https://script.google.com/macros/s/AKfycbwxLQBpsoX5zkMyrDCqZFvbS7ZAT7Z01ySyN483CBqI1xxe0zT5MdTvPOMD00aA7SGi/exec", {
      method: "POST",
      body: formData
    })
    .then(r => r.json())
    .then(data => {
      clearInterval(animacion);
      boton.disabled = false;
      boton.textContent = "Enviar";
      if (data.status === "ok") {
        alert("✅ ¡Gracias por tu calificación!");
        window.cerrarModal();
      } else {
        alert("❌ Error al registrar: " + (data.mensaje || ''));
      }
    })
    .catch(err => {
      clearInterval(animacion);
      boton.disabled = false;
      boton.textContent = "Enviar";
      console.error("❌ Error al enviar:", err);
      alert("❌ No se pudo conectar con el servidor. Inténtalo más tarde.");
    });
  };
})();
