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
      img: "img/manzanilla2.webp",
      img2: "img/congerdesign-chamomile-829220_1920.webp",
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
      img: "img/Borraja1.webp",
      img2: "img/sweyang-borage-3648231_1920.webp",
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
      img: "img/Calendula1.webp",
      img2: "img/zoosnow-calendula-3072786_1920.webp",
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
      img: "img/diente_de_leon.webp",
      img2: "img/diente_leon.webp",
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
      img: "img/Cola_caballo1.webp",
      img2: "img/cola_caballo.webp",
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
      img: "img/ortiga.webp",
      img2: "img/neelam279-nettle-4573932_1920.webp",
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
      img: "img/Hipericum perforatum.webp",
      img2: "img/geralt-ai-generated-8756079_1920.webp",
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
      img: "img/ruda1.webp",
      img2: "img/ruda.webp",
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
      img: "img/lavanda1.webp",
      img2: "img/lavanda.webp",
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
      img: "img/salvia1.webp",
      img2: "img/mariya_m-sage-5659856_1920.webp",
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
      category: "aceites",
      desc: "Prensado en frío, multiusos para piel y cabello.",
      price: "$420",
      img: "img/aceite_coco.webp",
      img2: "img/huyenxu94-coconut-oil-4497386_1920.webp",
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
      category: "aceites",
      desc: "Oleato corporal listo para masajes relajantes.",
      price: "$380",
      img: "img/aceite1.webp",
      img2: "img/aceite2.webp",
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
      category: "aceites",
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
      category: "jabones",
      desc: "Jabón artesanal enriquecido con plantas.",
      price: "$130",
      img: "img/jabon1.webp",
      img2: "img/silviarita-soap-2333391_1920.webp",
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
      category: "aceites",
      desc: "Mezcla rica para piel seca y post-estival.",
      price: "$400",
      img: "img/silviarita-oil-4262839_1920.webp",
      props: [
        "Calma la piel tirante y deshidratada.",
        "Masaje reparador de cuerpo completo.",
        "Aroma herbal tenue y reconfortante."
      ]
    },
    {
      id: "cons-026",
      name: "Cedrón",
      scientific: "Lippia citriodora",
      category: "digestivo",
      desc: "Hojas de cedrón para infusiones digestivas de aroma cítrico.",
      price: "$190",
      img: "img/Cedron.webp",
      img2: "img/cedron1.webp",
      props: [
        "Digestivo: calma el estómago después de comer.",
        "Relajante suave, ideal al atardecer.",
        "Aroma cítrico fresco para infusiones calientes o frías."
      ]
    },
    {
      id: "cons-027",
      name: "Ginkgo biloba",
      scientific: "Ginkgo biloba",
      category: "tratamientos",
      desc: "Hojas de ginkgo seleccionadas, aliadas de la concentración.",
      price: "$320",
      img: "img/Ginkgo biloba.webp",
      props: [
        "Tradicional para la memoria y la concentración.",
        "Ayuda a la circulación periférica.",
        "Hojas de cultivo ecológico secadas a la sombra."
      ]
    },
    {
      id: "cons-028",
      name: "Incienso",
      scientific: "Boswellia serrata",
      category: "aromaterapia",
      desc: "Resina de incienso para ahumar y crear ambientes de calma.",
      price: "$260",
      img: "img/Incienso.webp",
      props: [
        "Aroma cálido y profundo para meditar.",
        "Acompaña la limpieza de los espacios.",
        "Resina natural lista para brasero o carbón."
      ]
    },
    {
      id: "cons-029",
      name: "Kana",
      scientific: "Ahumado botánico artesanal",
      category: "aromaterapia",
      desc: "Kana, atado de hierbas aromáticas para quemas y ceremonias.",
      price: "$240",
      img: "img/kana.webp",
      props: [
        "Ahumado aromático para limpiar espacios.",
        "Aroma cálido que invita a la calma.",
        "Hecho a mano, listo para usar."
      ]
    },
    {
      id: "cons-030",
      name: "Marrubio",
      scientific: "Marrubium vulgare",
      category: "digestivo",
      desc: "Flor y hoja de marrubio para preparados digestivos.",
      price: "$180",
      img: "img/Manrrubio.webp",
      img2: "img/manrrubio1.webp",
      props: [
        "Digestivo amargo de uso tradicional.",
        "Acompaña el bienestar respiratorio.",
        "Planta silvestre del campo uruguayo."
      ]
    },
    {
      id: "cons-031",
      name: "Romero",
      scientific: "Rosmarinus officinalis",
      category: "tratamientos",
      desc: "Hojas de romero fresco secadas a la sombra.",
      price: "$200",
      img: "img/romero1.webp",
      props: [
        "Estimulante circulatorio en macerados.",
        "Colabora con la memoria y el ánimo.",
        "Aromática para cocinas y condimentos."
      ]
    },
    {
      id: "cons-032",
      name: "Crema de hierbas",
      scientific: "Fitocosmética artesanal",
      category: "cremas",
      desc: "Crema corporal artesanal con extractos de hierbas.",
      price: "$350",
      img: "img/crema.webp",
      img2: "img/crema1.webp",
      props: [
        "Hidrata y suaviza la piel seca.",
        "Elaborada con mantecas y aceites vegetales.",
        "Absorción rápida sin sensación grasa."
      ]
    },
    {
      id: "cons-033",
      name: "Loción de hierbas",
      scientific: "Fitocosmética artesanal",
      category: "locion",
      desc: "Loción fresca para el cuidado diario de la piel.",
      price: "$320",
      img: "img/locion1.webp",
      props: [
        "Tónica y refrescante, ideal después del baño.",
        "Calma rojeces e irritaciones leves.",
        "Aroma herbal delicado, muy suave."
      ]
    },
    {
      id: "cons-034",
      name: "Ungüento de hierbas",
      scientific: "Pomadas botánicas",
      category: "unguentos",
      desc: "Ungüento artesanal para pieles que piden mimo.",
      price: "$330",
      img: "img/unguento1.webp",
      props: [
        "Emoliente para zonas secas y agrietadas.",
        "Calma rozaduras e irritaciones.",
        "En envase de vidrio reutilizable."
      ]
    },
    {
      id: "cons-035",
      name: "Tintura madre",
      scientific: "Extractos hidroalcohólicos",
      category: "tinturas",
      desc: "Extracto concentrado de hierbas en gotas.",
      price: "$280",
      img: "img/tintura1.webp",
      props: [
        "Gotas concentradas de uso tradicional.",
        "Maceración lenta que concentra el principio activo.",
        "Presentación en gotero de vidrio."
      ]
    },
    {
      id: "cons-036",
      name: "Aceite relajante",
      scientific: "Oleato corporal relajante",
      category: "masajes",
      desc: "Oleato de hierbas para masajes de cuerpo completo.",
      price: "$390",
      img: "img/masajes.webp",
      props: [
        "Textura sedosa que desliza sin pegar.",
        "Aroma calmante que acompaña el masaje.",
        "Nutre la piel mientras relaja los músculos."
      ]
    }
  ];

if (typeof module !== "undefined" && module.exports){ module.exports = DORILA_PRODUCTS; }
if (typeof window !== "undefined"){ window.DORILA_PRODUCTS = DORILA_PRODUCTS; }
