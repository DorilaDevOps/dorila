"use strict";

/* =====================================================================
   DORILA — recetas_.js
   Datos semilla y respaldo de la comunidad «Recetas de persona a persona».
   Las recetas publicadas desde el panel de administración viven en Netlify
   Blobs; este archivo permite que la sección tenga contenido inicial y que
   el administrador descargue una copia estática de lo publicado.
   ===================================================================== */

(function(root, categories, recipes){
  var data = { categories: categories, recipes: recipes };
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  if (root){
    root.DORILA_RECIPE_CATEGORIES = categories;
    root.DORILA_COMMUNITY_SEED_RECIPES = recipes;
  }
})(typeof window !== "undefined" ? window : null, [
  "Descanso y relajación",
  "Digestivo",
  "Circulación",
  "Defensas",
  "Articular y muscular",
  "Urinario y renal",
  "Hepático",
  "Respiratorio",
  "Energía y vitalidad",
  "Aromaterapia y bienestar sensorial",
  "Bienestar femenino",
  "Equilibrio emocional",
  "Bienestar integral y autocuidado",
  "Otros tratamientos"
], [
  {
    id: "rc-seed-manzanilla",
    status: "published",
    category: "Digestivo",
    author: { name: "Ana Pereyra", nationality: "Uruguaya", city: "Salto" },
    ingredients: [
      "1 cucharada de flores secas de manzanilla",
      "250 ml de agua recién hervida",
      "1 cucharadita de miel de campo (opcional)"
    ],
    steps: [
      "Colocá las flores de manzanilla en una taza de cerámica.",
      "Verte el agua caliente y tapá la taza con un plato.",
      "Dejá reposar de 5 a 7 minutos, colá y endulzá si lo deseás.",
      "Tomá la infusión tibia, sin apurarte, después de la comida."
    ],
    story: "Mi abuela preparaba esta infusión después del almuerzo familiar. La taza tapada era parte del ritual: decía que así se quedaban las propiedades y el aroma. Hoy la preparo cuando necesito bajar el ritmo y acompañar la digestión.",
    precautions: "No usar en personas alérgicas a la familia Asteraceae. Consultá antes de usar si estás embarazada, en período de lactancia o tomás medicación. No reemplaza la consulta médica.",
    noKnownPrecautions: false,
    publishedAt: "2025-08-12T10:00:00.000Z"
  },
  {
    id: "rc-seed-tilo-relax",
    status: "published",
    category: "Descanso y relajación",
    author: { name: "Marcos Silva", nationality: "Uruguayo", city: "Canelones" },
    ingredients: [
      "1 cucharada de flores secas de tilo",
      "1 rodaja fina de limón",
      "250 ml de agua caliente"
    ],
    steps: [
      "Poné las flores de tilo en una taza y agregá la rodaja de limón.",
      "Verte el agua caliente y dejá reposar tapado durante 8 minutos.",
      "Colá y tomá la infusión tibia, preferentemente al final del día.",
      "Guardá el resto en un termo y consumilo dentro de las 12 horas."
    ],
    story: "Empecé a preparar esta infusión en las noches de invierno, cuando el trabajo me dejaba la cabeza dando vueltas. El aroma del tilo y el gesto de preparar la taza se volvieron una señal de que era momento de descansar.",
    precautions: "El tilo puede producir somnolencia. No consumir antes de conducir o manejar maquinaria. Consultá si estás embarazada, en lactancia o tomás sedantes.",
    noKnownPrecautions: false,
    publishedAt: "2025-09-03T18:30:00.000Z"
  },
  {
    id: "rc-seed-lavanda-sensorial",
    status: "published",
    category: "Aromaterapia y bienestar sensorial",
    author: { name: "Lucía Fernández", nationality: "Uruguaya", city: "Montevideo" },
    ingredients: [
      "1 puñado de flores secas de lavanda",
      "1 tela de algodón de 20 x 20 cm",
      "1 trozo de cinta de algodón",
      "3 gotas de aceite esencial de lavanda (opcional, diluidas)"
    ],
    steps: [
      "Colocá las flores secas en el centro de la tela.",
      "Juntá las puntas y atá el saquito con la cinta, sin apretar demasiado.",
      "Si usás aceite esencial, agregá las gotas sobre las flores antes de cerrar.",
      "Ubicá el saquito cerca de la cama o en un cajón; renová el aroma cada pocas semanas."
    ],
    story: "Hice este saquito por primera vez para un regalo de cumpleaños. Me gustó la idea de un aroma suave que acompañara el descanso sin invadir el ambiente. Hoy lo preparo con lavanda que cosecho en casa y lo guardo en frascos de vidrio.",
    precautions: "No colocar el saquito sobre la piel ni cerca de bebés, mascotas o personas con alergias respiratorias. El aceite esencial debe estar bien diluido y no se ingiere. Consultá ante cualquier duda.",
    noKnownPrecautions: false,
    publishedAt: "2025-10-21T12:15:00.000Z"
  }
]);
