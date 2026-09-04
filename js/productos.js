/* DORILA - catalogo de productos. Fuente unica de datos.
   Editá esta lista y corré "node tools/generate.js" para regenerar las fichas. */
var DORILA_PRODUCTS = [
    {
      id: "cons-001",
      name: "Manzanilla",
      scientific: "Matricaria chamomilla",
      category: "digestivo",
      desc: "Flor entera de cosecha propia para infusiones suaves.",
      price: "$180",
      img: "img/congerdesign-chamomile-829220_1920.webp",
      props: [
        "Digestiva: alivia cólicos y digestiones pesadas.",
        "Relajante suave que acompaña el descanso.",
        "Calma la piel sensible y las irritaciones leves."
      ]
    },
    {
      id: "cons-002",
      name: "Menta piperita",
      scientific: "Mentha x piperita",
      category: "digestivo",
      desc: "Hojas secas de aroma intenso, ideal después de comer.",
      price: "$150",
      img: "img/congerdesign-herbs-5140701_1920.webp",
      props: [
        "Carminativa: reduce gases e hinchazón abdominal.",
        "Refrescante y estimulante de la digestión.",
        "Aporta frescura y sensación de vitalidad."
      ]
    },
    {
      id: "cons-003",
      name: "Hierbabuena",
      scientific: "Mentha spicata",
      category: "digestivo",
      desc: "Hierbabuena fresca secada a la sombra, muy versátil.",
      price: "$140",
      img: "img/congerdesign-herbs-5140754_1920.webp",
      props: [
        "Aperitiva y digestiva estimulante.",
        "Alivia náuseas y malestar estomacal.",
        "Ideal como infusión después de comidas abundantes."
      ]
    },
    {
      id: "cons-004",
      name: "Borraja",
      scientific: "Borago officinalis",
      category: "tratamientos",
      desc: "Flor y hoja de borraja para depuración de temporada.",
      price: "$200",
      img: "img/sweyang-borage-3648231_1920.webp",
      props: [
        "Depurativa y diurética suave.",
        "Tradicional para calmar la tos y las vías respiratorias.",
        "Rica en minerales que sostienen el organismo."
      ]
    },
    {
      id: "cons-005",
      name: "Caléndula",
      scientific: "Calendula officinalis",
      category: "tratamientos",
      desc: "Pétalos dorados para ungüentos y piel delicada.",
      price: "$220",
      img: "img/zoosnow-calendula-3072786_1920.webp",
      img2: "img/hans-daisies-324403_1920.webp",
      props: [
        "Emoliente y regeneradora de la piel.",
        "Ayuda en heridas leves y rozaduras.",
        "Antiinflamatoria de uso tópico tradicional."
      ]
    },
    {
      id: "cons-006",
      name: "Diente de león",
      scientific: "Taraxacum officinale",
      category: "digestivo",
      desc: "Raíz y hoja seca, clásico de la limpieza de temporada.",
      price: "$190",
      img: "img/hans-daisies-324403_1920.webp",
      props: [
        "Depurador del hígado y la vesícula.",
        "Digestivo y ligeramente diurético.",
        "Acompaña dietas de desintoxicación."
      ]
    },
    {
      id: "cons-007",
      name: "Cola de caballo",
      scientific: "Equisetum arvense",
      category: "tratamientos",
      desc: "Tallos ricos en silicio, cosecha controlada.",
      price: "$210",
      img: "img/cola_caballo.webp",
      props: [
        "Diurética suave, tradicional en vías urinarias.",
        "Rica en silicio, colabora con uñas y cabello.",
        "Recuperadora del tejido conectivo."
      ]
    },
    {
      id: "cons-008",
      name: "Ortiga verde",
      scientific: "Urtica dioica",
      category: "tratamientos",
      desc: "Hojas recolectadas con guantes, secado lento.",
      price: "$205",
      img: "img/neelam279-nettle-4573932_1920.webp",
      props: [
        "Depurativa y remineralizante.",
        "Tradicional para alergias de primavera.",
        "Fortalece cabello, uñas y piel."
      ]
    },
    {
      id: "cons-009",
      name: "Hierba de San Juan",
      scientific: "Hypericum perforatum",
      category: "descanso",
      desc: "Flores de sol, útiles para el ánimo en invierno.",
      price: "$260",
      img: "img/geralt-ai-generated-8756079_1920.webp",
      props: [
        "Tradicional para el equilibrio del ánimo.",
        "Calma la nerviosidad diaria.",
        "Aceite de maceración para pieles sensibles."
      ]
    },
    {
      id: "cons-010",
      name: "Agripalma",
      scientific: "Leonurus cardiaca",
      category: "descanso",
      desc: "Flor y hoja para momentos de mucha tensión.",
      price: "$230",
      img: "img/couleur-motherwort-3566879_1920.webp",
      props: [
        "Relajante del sistema nervioso.",
        "Acompaña el descanso en noches agitadas.",
        "Tradicional para el corazón nervioso."
      ]
    },
    {
      id: "cons-011",
      name: "Ruda",
      scientific: "Ruta graveolens",
      category: "tratamientos",
      desc: "Ramo tradicional para rituales de limpieza y energías.",
      price: "$170",
      img: "img/ruda.webp",
      props: [
        "Repelente natural de insectos.",
        "Uso tradicional en limpiezas energéticas.",
        "Amarga, digestiva en dosis mínimas."
      ]
    },
    {
      id: "cons-012",
      name: "Lavanda",
      scientific: "Lavandula angustifolia",
      category: "aromaterapia",
      desc: "Flores perfumadas para saquitos, baños y difusores.",
      price: "$240",
      img: "img/lavanda.webp",
      props: [
        "Calmante y relajante, favorece el sueño.",
        "Perfecta para aromaterapia y baños relajantes.",
        "Aleja las polillas de roperos y cajones."
      ]
    },
    {
      id: "cons-013",
      name: "Lavanda real",
      scientific: "Lavandula x intermedia",
      category: "aromaterapia",
      desc: "Aceite esencial puro, destilado a vapor.",
      price: "$520",
      img: "img/googlerankfaster-lavender-5562278_1920.webp",
      props: [
        "Relajante profundo para noches de descanso.",
        "Antiséptica y cicatrizante en uso tópico diluido.",
        "Balancea el ánimo en difusor."
      ]
    },
    {
      id: "cons-014",
      name: "Lavanda dulce",
      scientific: "Lavandula latifolia",
      category: "belleza",
      desc: "Agua floral para calmar y perfumar la piel.",
      price: "$360",
      img: "img/nennieinszweidrei-lavender-10382822_1920.webp",
      props: [
        "Tónica facial suave después de la limpieza.",
        "Calma rojeces e irritaciones.",
        "Aromática suave para almohadas y textil."
      ]
    },
    {
      id: "cons-015",
      name: "Salvia común",
      scientific: "Salvia officinalis",
      category: "belleza",
      desc: "Hojas que armonizan el cabello y la boca.",
      price: "$190",
      img: "img/mariya_m-sage-5659856_1920.webp",
      props: [
        "Tradicional para el cuidado del cuero cabelludo.",
        "Enjuague bucal natural antiséptico.",
        "Regula la transpiración excesiva."
      ]
    },
    {
      id: "cons-016",
      name: "Salvia adivina",
      scientific: "Salvia divinorum",
      category: "aromaterapia",
      desc: "Ramo ceremonial, uso ritual y espiritual.",
      price: "$480",
      img: "img/mariya_m-sage-5659856_1920.webp",
      props: [
        "Ahumada para limpiar espacios.",
        "Aroma profundo y balsámico.",
        "Uso ceremonial ancestral."
      ]
    },
    {
      id: "cons-017",
      name: "Agua de hidrosol",
      scientific: "Distilados de plantas",
      category: "belleza",
      desc: "Hidrosol de hierbas para piel y ambiente.",
      price: "$340",
      img: "img/xaviervandeputte0-hydrosol-939216_1920.webp",
      props: [
        "Rociador facial hidratante y refrescante.",
        "Tónico natural sin alcohol.",
        "Aroma suave para ambientar habitaciones."
      ]
    },
    {
      id: "cons-018",
      name: "Aceite de coco virgen",
      scientific: "Cocos nucifera",
      category: "belleza",
      desc: "Prensado en frío, multiusos para piel y cabello.",
      price: "$420",
      img: "img/huyenxu94-coconut-oil-4497386_1920.webp",
      props: [
        "Hidratante profundo para piel seca.",
        "Acondiciona el cabello y doma el frizz.",
        "Base ideal para masajes corporales."
      ]
    },
    {
      id: "cons-019",
      name: "Mezcla aceites esenciales",
      scientific: "Blends botánicos",
      category: "aromaterapia",
      desc: "Combinación de esencias para difusor y cuerpo.",
      price: "$460",
      img: "img/emilytrue-essential-oils-1256362_1920.webp",
      props: [
        "Ambienta y armoniza cualquier espacio.",
        "Relajante o energizante según el blend.",
        "Mezcla con aceite base para masaje."
      ]
    },
    {
      id: "cons-020",
      name: "Esencia de aromaterapia",
      scientific: "Esencias botánicas puras",
      category: "aromaterapia",
      desc: "Muestra de esencias para conocer tu favorita.",
      price: "$290",
      img: "img/monicore-essential-oils-2385087_1920.webp",
      props: [
        "Ideal para descubrir perfiles aromáticos.",
        "Usada en difusor de cañas o ultrasónico.",
        "Concentrada: dos o tres gotas alcanzan."
      ]
    },
    {
      id: "cons-021",
      name: "Aceite para masajes",
      scientific: "Oleatos vegetales macerados",
      category: "masajes",
      desc: "Oleato corporal listo para masajes relajantes.",
      price: "$380",
      img: "img/olgavolkovitskaia-massage-7441858_1920.webp",
      props: [
        "Desliza sin dejar la piel pegajosa.",
        "Aromas calmantes que acompañan el masaje.",
        "Nutre la piel mientras relaja los músculos."
      ]
    },
    {
      id: "cons-022",
      name: "Espátulas y dulces relajación",
      scientific: "Ritual de descanso",
      category: "masajes",
      desc: "Kit de bienestar para tu próxima sesión.",
      price: "$300",
      img: "img/kitirina-relax-9847243_1920.webp",
      props: [
        "Crea el clima perfecto para un masaje.",
        "Colabora con la calma del cuerpo entero.",
        "Ritual sensorial de aromas suaves."
      ]
    },
    {
      id: "cons-023",
      name: "Aceite de oliva macerado",
      scientific: "Olea europaea",
      category: "masajes",
      desc: "Maceración de hierbas en aceite de oliva.",
      price: "$350",
      img: "img/pau_noia0-olive-850336_1920.webp",
      props: [
        "Emoliente excelente para masajes.",
        "Rico en ácidos grasos que nutren la piel.",
        "Tradicional en ungüentos caseros."
      ]
    },
    {
      id: "cons-024",
      name: "Jabón de hierbas",
      scientific: "Saponificados botánicos",
      category: "belleza",
      desc: "Jabón artesanal enriquecido con plantas.",
      price: "$130",
      img: "img/silviarita-soap-2333391_1920.webp",
      props: [
        "Limpieza suave respetando la barrera cutánea.",
        "Vegano, sin jabón detergente agresivo.",
        "Perfumado con esencias naturales."
      ]
    },
    {
      id: "cons-025",
      name: "Aceite corporal nutriz",
      scientific: "Oleato de caléndula y oliva",
      category: "masajes",
      desc: "Mezcla rica para piel seca y post-estival.",
      price: "$400",
      img: "img/silviarita-oil-4262839_1920.webp",
      props: [
        "Calma la piel tirante y deshidratada.",
        "Masaje reparador de cuerpo completo.",
        "Aroma herbal tenue y reconfortante."
      ]
    }
  ];

if (typeof module !== "undefined" && module.exports){ module.exports = DORILA_PRODUCTS; }
if (typeof window !== "undefined"){ window.DORILA_PRODUCTS = DORILA_PRODUCTS; }
