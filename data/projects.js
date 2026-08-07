export const projects = [
  {
    slug: 'casa-moderna-con-patio-cubierto',
    name: 'Casa Moderna con Patio Cubierto',
    short: 'Vivienda contemporánea organizada en torno a la luz natural y un patio cubierto para la vida familiar.',
    location: 'Tibú, Norte de Santander, Colombia',
    year: 2025,
    status: 'Proyecto diseñado – No construido',
    type: 'Vivienda unifamiliar',
    area: '220 m² construidos · Lote 128 m²',
    services: ['Diseño arquitectónico', 'Planos arquitectónicos', 'Renderizado y visualización'],
    description: [
      'La Casa Moderna con Patio Cubierto es una propuesta residencial concebida para una familia que buscaba una vivienda contemporánea, funcional y adaptada a sus necesidades cotidianas. El programa incorpora espacios amplios de integración social, una oficina para el trabajo desde casa y una sala de televisión como área de encuentro familiar.',
      'Uno de los principales retos consistió en desarrollar el diseño sobre una edificación parcialmente construida en obra negra, adaptando la propuesta a condiciones preexistentes sin sacrificar la funcionalidad, la estética ni la coherencia espacial.',
      'El patio cubierto responde a la necesidad de contar con un espacio exterior protegido y seguro, que permita disfrutar de las actividades familiares con mayor privacidad y confort. El lenguaje arquitectónico se caracteriza por líneas limpias y una composición contemporánea que transmite elegancia, calidez y equilibrio.',
    ],
    concept: ['Funcionalidad de los espacios', 'Aprovechamiento de la iluminación natural', 'Integración entre áreas privadas y sociales'],
    categories: ['Vivienda unifamiliar'],
    story: {
      contexto:
        'Una familia en Tibú con un lote de 128 m² y una edificación ya iniciada en obra negra.',
      problema:
        'Querían una casa contemporánea con espacios sociales amplios, oficina para trabajar desde casa y sala de televisión, pero no se podía empezar de cero: había que partir de lo ya construido.',
      solucion:
        'Adaptamos el diseño a la estructura preexistente sin sacrificar la distribución, y organizamos la casa alrededor de un patio cubierto que le da a la familia un exterior protegido y privado.',
      resultado:
        '220 m² construidos, de líneas limpias, con luz natural en las áreas sociales y un patio que funciona como corazón de la vida familiar.',
    },
    sensations: ['Calidez', 'Elegancia', 'Confort', 'Iluminación natural', 'Amplitud visual'],
    cover: '/projects/casa-moderna-con-patio-cubierto/fachada.webp',
    gallery: [
      '/projects/casa-moderna-con-patio-cubierto/fachada.webp',
      '/projects/casa-moderna-con-patio-cubierto/sala.webp',
      '/projects/casa-moderna-con-patio-cubierto/sala-comedor.webp',
      '/projects/casa-moderna-con-patio-cubierto/patio-interno.webp',
      '/projects/casa-moderna-con-patio-cubierto/habitcion-1.webp',
      '/projects/casa-moderna-con-patio-cubierto/habitacion-2.webp',
    ],
    video: 'https://youtu.be/Wyi-HZCtkdg',
    // Modelo 3D interactivo (opcional en cada proyecto).
    // El GLB sólo se descarga cuando el visitante pulsa "Explorar modelo 3D".
    model3d: {
      src: '/models/casa-prueba.glb',
      poster: '/projects/casa-moderna-con-patio-cubierto/fachada.webp',
      fileLabel: 'GLB · 11,4 MB',
    },
    featured: false,
  },
  {
    slug: 'vivienda-unifamiliar',
    name: 'Vivienda Unifamiliar',
    short: 'Vivienda de dos niveles con jardín interior como punto articulador entre luz, vegetación y vida familiar.',
    location: 'Cúcuta, Norte de Santander, Colombia',
    year: 2023,
    status: 'Proyecto diseñado – No construido',
    type: 'Vivienda unifamiliar',
    area: '190 m² construidos · Lote 118 m²',
    services: ['Diseño arquitectónico', 'Planos arquitectónicos', 'Renderizado y visualización'],
    description: [
      'Propuesta residencial de dos niveles concebida para una familia moderna, integrando espacios de convivencia, áreas privadas y ambientes flexibles que se adaptan a diferentes dinámicas de vida.',
      'El proyecto incorpora estudio, sala de televisión, áreas sociales integradas, patio posterior y balcones, buscando que cada ambiente mantenga una relación directa con la iluminación natural y la ventilación cruzada.',
      'El jardín interior se convierte en el punto articulador de la vivienda, aportando luz, vegetación y una sensación permanente de conexión entre interior y exterior.',
    ],
    concept: ['Aprovechamiento de la iluminación natural', 'Integración visual entre los espacios', 'Flexibilidad y funcionalidad para la vida familiar'],
    categories: ['Vivienda unifamiliar'],
    story: {
      contexto:
        'Un lote de 118 m² en Cúcuta para una familia que necesitaba dos niveles.',
      problema:
        'En un lote estrecho es difícil que todas las habitaciones tengan luz y ventilación sin quitarle espacio a las áreas sociales.',
      solucion:
        'Un jardín interior articula toda la vivienda: lleva luz y ventilación cruzada al centro de la casa y conecta visualmente los dos niveles.',
      resultado:
        '190 m² con estudio, sala de televisión, áreas sociales integradas, patio posterior y balcones, todos con relación directa con la luz natural.',
    },
    sensations: ['Elegancia', 'Calidez', 'Iluminación natural', 'Confort', 'Amplitud visual', 'Conexión con la naturaleza'],
    cover: '/projects/vivienda-unifamiliar/1.webp',
    gallery: [
      '/projects/vivienda-unifamiliar/1.webp',
      '/projects/vivienda-unifamiliar/2.webp',
      '/projects/vivienda-unifamiliar/3.webp',
    ],
    video: 'https://youtu.be/y4fkopbCVrc',
    featured: false,
  },
  {
    slug: 'casa-con-patio-interior-en-tibu',
    name: 'Casa con Patio Interior en Tibú',
    short: 'Reinterpretación de la vivienda tropical: un patio de doble altura como corazón bioclimático de la casa.',
    location: 'Campo Dos, Tibú, Norte de Santander',
    year: 2025,
    status: 'Proyecto diseñado – No construido',
    type: 'Vivienda unifamiliar',
    area: 'Tres niveles · Terraza habitable',
    services: ['Diseño arquitectónico', 'Planos arquitectónicos', 'Modelado y renders'],
    description: [
      'La Casa con Patio Interior en Tibú nace de la idea de reinterpretar la vivienda tropical mediante un espacio central abierto que organiza toda la distribución de la casa. El patio interior de doble altura permite que la luz natural y la vegetación ingresen al corazón de la vivienda.',
      'La distribución incorpora áreas sociales amplias, cuatro habitaciones, espacios complementarios y una terraza multifuncional con zona BBQ y gimnasio, pensada para la vida familiar y el disfrute al aire libre.',
      'El patio interior no solo funciona como elemento estético, sino como un regulador ambiental que mejora el confort térmico y genera una experiencia espacial única.',
    ],
    concept: ['Arquitectura bioclimática', 'Integración entre naturaleza y espacio construido', 'Iluminación y ventilación natural', 'Espacios de encuentro alrededor del patio central'],
    categories: ['Vivienda unifamiliar'],
    story: {
      contexto:
        'Campo Dos, Tibú: clima cálido y una familia que necesitaba tres niveles, cuatro habitaciones y espacio para reunirse.',
      problema:
        'En clima tropical, una casa grande se vuelve calurosa y oscura en su centro si la ventilación no se resuelve desde el diseño.',
      solucion:
        'Un patio interior de doble altura organiza toda la distribución y actúa como regulador ambiental: por ahí entran la luz, el aire y la vegetación.',
      resultado:
        'Tres niveles con áreas sociales amplias, cuatro habitaciones y una terraza multifuncional con zona BBQ y gimnasio, con mejor confort térmico y una experiencia espacial propia.',
    },
    sensations: ['Calidez', 'Tranquilidad', 'Conexión con la naturaleza', 'Amplitud espacial', 'Elegancia contemporánea', 'Bienestar ambiental'],
    cover: '/projects/casa-con-patio-interior-en-tibu/patio-interior.webp',
    gallery: [
      '/projects/casa-con-patio-interior-en-tibu/patio-interior.webp',
      '/projects/casa-con-patio-interior-en-tibu/patio-interior-2.webp',
      '/projects/casa-con-patio-interior-en-tibu/patio-interior-3.webp',
      '/projects/casa-con-patio-interior-en-tibu/sala.webp',
      '/projects/casa-con-patio-interior-en-tibu/living.webp',
      '/projects/casa-con-patio-interior-en-tibu/comerdor-cocina.webp',
      '/projects/casa-con-patio-interior-en-tibu/habitacion.webp',
      '/projects/casa-con-patio-interior-en-tibu/azotea.webp',
      '/projects/casa-con-patio-interior-en-tibu/azotea-2.webp',
    ],
    video: 'https://youtu.be/J3prUb1ejBs',
    featured: true,
  },
  {
    slug: 'edificacion-de-uso-mixto',
    name: 'Edificación de Uso Mixto',
    short: 'Comercio, vivienda y terraza social con jacuzzi en un mismo inmueble urbano de líneas limpias.',
    location: 'Colombia',
    year: 2022,
    status: 'Proyecto en etapa de diseño',
    type: 'Uso mixto — comercial y residencial',
    area: '198,89 m² construidos · Lote 9,00 × 22,50 m',
    services: ['Diseño arquitectónico', 'Planos arquitectónicos', 'Renderizado y visualización'],
    description: [
      'La propuesta surge de la necesidad de combinar actividades comerciales y vivienda en un mismo predio, optimizando el aprovechamiento del suelo urbano y permitiendo que el propietario desarrolle actividades económicas sin renunciar a la comodidad de un hogar contemporáneo.',
      'El primer nivel se destina a dos locales comerciales independientes, oficina administrativa y garaje. El segundo alberga la vivienda principal con espacios sociales abiertos, tres habitaciones y un jardín interior que aporta iluminación y ventilación natural.',
      'La cubierta se transforma en una terraza habitable con áreas de descanso, zona verde y jacuzzi. La volumetría contemporánea se caracteriza por líneas limpias, grandes superficies acristaladas y un juego de volúmenes con identidad propia.',
    ],
    concept: ['Integración entre vivienda y actividad comercial', 'Flexibilidad funcional', 'Aprovechamiento de la iluminación natural', 'Espacios de bienestar y esparcimiento'],
    categories: ['Uso mixto', 'Comercial'],
    story: {
      contexto:
        'Un lote urbano de 9,00 × 22,50 m de un propietario que quería vivir y generar ingresos en el mismo predio.',
      problema:
        'Combinar comercio y vivienda sin que la actividad económica le quitara comodidad ni privacidad al hogar.',
      solucion:
        'Primer nivel para dos locales independientes, oficina y garaje; segundo nivel para la vivienda con jardín interior; y la cubierta convertida en terraza habitable con zona verde y jacuzzi.',
      resultado:
        '198,89 m² construidos que rentan y se habitan a la vez, con las dos vidas claramente separadas.',
    },
    sensations: ['Modernidad', 'Flexibilidad', 'Bienestar', 'Amplitud', 'Identidad urbana'],
    cover: '/projects/edificacion-de-uso-mixto/fachada.webp',
    gallery: [
      '/projects/edificacion-de-uso-mixto/fachada.webp',
      '/projects/edificacion-de-uso-mixto/cocina.webp',
      '/projects/edificacion-de-uso-mixto/habitacion.webp',
      '/projects/edificacion-de-uso-mixto/closet.webp',
      '/projects/edificacion-de-uso-mixto/bano.webp',
      '/projects/edificacion-de-uso-mixto/azotea.webp',
    ],
    video: 'https://youtu.be/94-1895IRF4',
    featured: true,
  },
  {
    slug: 'ferreagro-el-trigal',
    name: 'Ferreagro El Trigal',
    short: 'Renovación integral de fachada comercial: arquitectura al servicio de la identidad de marca.',
    location: 'Tibú, Norte de Santander',
    year: 2025,
    status: 'Diseñado – En ejecución',
    type: 'Remodelación comercial',
    area: 'Fachada e imagen corporativa',
    services: ['Diseño arquitectónico', 'Diseño de fachada', 'Renderizado y visualización'],
    description: [
      'FERREAGRO EL TRIGAL es un proyecto de renovación arquitectónica concebido para fortalecer la identidad corporativa de una agro-ferretería mediante una intervención integral de fachada y la reorganización de sus espacios de atención al público.',
      'La intervención comprende la modernización del frente comercial, la incorporación de nuevos materiales y acabados, iluminación arquitectónica LED y el desarrollo de una imagen institucional coherente con la marca.',
      'Una gran franja superior en color verde corporativo alberga el nombre de la empresa y su logotipo con letras corpóreas iluminadas, convirtiéndose en un elemento icónico y de alta visibilidad dentro del entorno urbano de Tibú.',
    ],
    concept: ['Fortalecimiento de la identidad de marca', 'Modernización de la imagen comercial', 'Visibilidad desde el espacio público', 'Arquitectura y estrategia empresarial'],
    categories: ['Remodelación', 'Comercial', 'En ejecución'],
    story: {
      contexto:
        'Una agro-ferretería en Tibú cuya fachada no comunicaba lo que la empresa era.',
      problema:
        'El negocio pasaba desapercibido en su entorno urbano y los espacios de atención al público estaban mal organizados.',
      solucion:
        'Renovación integral de fachada con nuevos materiales, acabados e iluminación LED, reorganización de la atención al público y una gran franja superior en verde corporativo con letras corpóreas iluminadas.',
      resultado:
        'Un frente comercial reconocible desde la calle y coherente con la marca. Actualmente en ejecución.',
    },
    sensations: ['Identidad', 'Modernidad', 'Visibilidad', 'Funcionalidad'],
    cover: '/projects/ferreagro-el-trigal/render-fachada-1.webp',
    gallery: [
      '/projects/ferreagro-el-trigal/render-fachada-1.webp',
      '/projects/ferreagro-el-trigal/render-fachada-2.webp',
      '/projects/ferreagro-el-trigal/fachada.webp',
    ],
    video: 'https://youtu.be/RLnhYRwZuo0',
    featured: false,
  },
  {
    slug: 'estacion-de-servicio',
    name: 'Estación de Servicio',
    short: 'Diseño integral de una EDS con criterios de seguridad, eficiencia operativa e infraestructura técnica.',
    location: 'Barrio Santander, Tibú, Norte de Santander',
    year: 2021,
    status: 'Diseñado',
    type: 'Infraestructura — EDS',
    area: 'Lote 3.259,46 m² · Canopy 166,28 m²',
    services: ['Diseño arquitectónico', 'Diseño técnico e infraestructura', 'Planos y detalles estructurales'],
    description: [
      'El proyecto corresponde al diseño integral de una Estación de Servicio (EDS) concebida para atender la demanda de combustibles en el municipio de Tibú, incorporando criterios de funcionalidad, seguridad y eficiencia operativa.',
      'La propuesta incluye islas de abastecimiento, tanques subterráneos de 10.353 galones para gasolina y ACPM, edificaciones administrativas, cafetería, baterías sanitarias, zonas de descarga y circulación vehicular.',
      'El diseño técnico contempla pozos de monitoreo, sistemas de contención de derrames, trampa de grasas, redes de aguas lluvias y el sistema estructural para el canopy metálico.',
    ],
    concept: ['Seguridad operacional', 'Fluidez en la circulación vehicular', 'Separación de áreas administrativas y operativas', 'Integración paisajística y mejoramiento urbano'],
    categories: ['Comercial', 'Infraestructura'],
    story: {
      contexto:
        'Un lote de 3.259,46 m² en el barrio Santander de Tibú, para atender la demanda de combustible del municipio.',
      problema:
        'Una estación de servicio exige resolver a la vez seguridad, circulación vehicular e infraestructura técnica enterrada, sin margen de error normativo.',
      solucion:
        'Diseño integral: islas de abastecimiento, tanques subterráneos de 10.353 galones, canopy metálico de 166,28 m², pozos de monitoreo, contención de derrames, trampa de grasas y redes de aguas lluvias.',
      resultado:
        'Áreas administrativas y operativas separadas, circulación fluida y toda la infraestructura técnica resuelta en planos y detalles estructurales.',
    },
    sensations: ['Eficiencia', 'Seguridad', 'Orden', 'Modernidad'],
    cover: '/projects/estacion-de-servicio/1.webp',
    gallery: [
      '/projects/estacion-de-servicio/1.webp',
      '/projects/estacion-de-servicio/2.webp',
      '/projects/estacion-de-servicio/3.webp',
      '/projects/estacion-de-servicio/4.webp',
    ],
    video: 'https://youtu.be/exRW5b1Gtsg',
    featured: false,
  },
  {
    slug: 'parque-recreativo-e-inclusivo',
    name: 'Parque Recreativo e Inclusivo',
    short: 'Espacio público con accesibilidad universal: juegos, zonas biosaludables y senderos para toda la comunidad.',
    location: 'La Gabarra, Tibú, Norte de Santander',
    year: 2023,
    status: 'Diseñado',
    type: 'Espacio público — paisajismo',
    area: '701,44 m²',
    services: ['Diseño arquitectónico', 'Diseño paisajístico', 'Renderizado y visualización'],
    description: [
      'El proyecto consiste en el diseño de un Parque Recreativo e Inclusivo orientado a fortalecer la integración social, el deporte, la recreación y el sano esparcimiento de la comunidad del corregimiento de La Gabarra.',
      'La propuesta fue concebida bajo criterios de accesibilidad universal, inclusión y sostenibilidad: juegos infantiles, espacios para adultos, zonas biosaludables, plazoletas de descanso, senderos peatonales y accesos para personas con movilidad reducida.',
      'La composición espacial se desarrolla alrededor de una plazoleta central con banca circular y vegetación nativa, articulando las zonas recreativas mediante senderos curvos que funcionan también como pista recreativa y de patinaje.',
    ],
    concept: ['Accesibilidad universal', 'Integración social y convivencia', 'Fomento de la actividad física', 'Identidad urbana y sentido de pertenencia'],
    categories: ['Espacio público'],
    story: {
      contexto:
        'El corregimiento de La Gabarra, en Tibú, y 701,44 m² de espacio público por intervenir.',
      problema:
        'La comunidad no tenía un lugar de encuentro que pudieran usar por igual niños, adultos y personas con movilidad reducida.',
      solucion:
        'Diseño con accesibilidad universal alrededor de una plazoleta central con banca circular y vegetación nativa, conectada por senderos curvos que sirven también de pista recreativa y de patinaje.',
      resultado:
        'Juegos infantiles, zonas biosaludables, plazoletas de descanso y accesos para movilidad reducida integrados en un mismo recorrido.',
    },
    sensations: ['Inclusión', 'Comunidad', 'Recreación', 'Bienestar'],
    cover: '/projects/parque-recreativo-e-inclusivo/1.webp',
    gallery: [
      '/projects/parque-recreativo-e-inclusivo/1.webp',
      '/projects/parque-recreativo-e-inclusivo/2.webp',
      '/projects/parque-recreativo-e-inclusivo/3.webp',
      '/projects/parque-recreativo-e-inclusivo/4.webp',
      '/projects/parque-recreativo-e-inclusivo/5.webp',
    ],
    video: 'https://youtu.be/RSaKk0GCPBw',
    featured: false,
  },
  {
    slug: 'parque-petrolea',
    name: 'Parque Petrolea',
    short: 'Un parque temático donde el mobiliario urbano narra la identidad petrolera de la región.',
    location: 'Vereda Petrolea, Tibú, Norte de Santander',
    year: 2021,
    status: 'Diseñado',
    type: 'Espacio público — parque recreo-deportivo',
    area: 'Parque 956 m² · Predio 2.658,81 m²',
    services: ['Diseño arquitectónico', 'Diseño urbanístico', 'Renderizado y visualización'],
    description: [
      'El proyecto corresponde al Mejoramiento y Mantenimiento del Parque Recreo-Deportivo de Petrolea, concebido como un espacio de integración social, recreación, deporte y fortalecimiento de la identidad cultural de la región.',
      'El concepto nace de la principal riqueza natural de la zona: el petróleo. El diseño toma como inspiración las torres de extracción y el sistema de transporte de crudo, traduciéndolos en mobiliario urbano, senderos y elementos arquitectónicos con formas de balancines y tuberías metálicas.',
      'Tres plazoletas de integración conectadas por senderos semicirculares articulan zonas de juegos, áreas verdes, una zona comercial de 107,20 m² y la integración con la iglesia y el polideportivo existentes.',
    ],
    concept: ['Identidad petrolera como narrativa espacial', 'Integración social y comunitaria', 'Recorrido temático entre plazoletas', 'Impulso al desarrollo económico local'],
    categories: ['Espacio público'],
    story: {
      contexto:
        'La vereda Petrolea, en Tibú: un predio de 2.658,81 m² donde ya existían la iglesia y el polideportivo.',
      problema:
        'Había que mejorar un parque deteriorado y, al mismo tiempo, darle una identidad que la comunidad reconociera como propia.',
      solucion:
        'El mobiliario urbano y los senderos toman la forma de balancines y tuberías metálicas: la historia petrolera de la zona se convierte en el propio espacio público.',
      resultado:
        '956 m² de parque con tres plazoletas conectadas por senderos semicirculares, zona comercial de 107,20 m² e integración con la iglesia y el polideportivo existentes.',
    },
    sensations: ['Identidad', 'Encuentro', 'Recreación', 'Pertenencia'],
    cover: '/projects/parque-petrolea/1.webp',
    gallery: [
      '/projects/parque-petrolea/1.webp',
      '/projects/parque-petrolea/2.webp',
      '/projects/parque-petrolea/3.webp',
      '/projects/parque-petrolea/4.webp',
      '/projects/parque-petrolea/5.webp',
    ],
    video: 'https://youtu.be/31wF_yZ0fJk',
    featured: false,
  },
  {
    slug: 'edificio-cyma',
    name: 'Edificio CYMA',
    short: 'Uso mixto en cuatro niveles: concreto aparente, vidrio y jardines verticales en un lenguaje sobrio y atemporal.',
    location: 'Colombia',
    year: 2025,
    status: 'Diseñado',
    type: 'Uso mixto — comercial y residencial multifamiliar',
    area: '864 m² construidos · Lote 216 m²',
    services: ['Diseño arquitectónico', 'Planos arquitectónicos', 'Modelado y visualización 3D'],
    description: [
      'El Edificio CYMA es un proyecto de arquitectura contemporánea de uso mixto, concebido para integrar un espacio comercial en primer nivel y seis apartamentos residenciales en los niveles superiores, bajo un lenguaje arquitectónico sobrio, elegante y funcional.',
      'La propuesta se desarrolla sobre un lote de 216 m² con 864 m² construidos en cuatro niveles. Prioriza la iluminación natural, la ventilación cruzada y la relación visual con el espacio urbano mediante amplias fachadas acristaladas y balcones corridos.',
      'La materialidad combina concreto aparente, vidrio templado, aluminio anodizado, acabados en madera, iluminación arquitectónica integrada y jardines verticales. La fachada se compone de líneas horizontales y volúmenes limpios que aportan ligereza visual.',
    ],
    concept: ['Flexibilidad funcional', 'Optimización del área construida', 'Aprovechamiento de la iluminación natural', 'Eficiencia espacial y confort'],
    categories: ['Uso mixto', 'Comercial'],
    story: {
      contexto:
        'Un lote de 216 m² para un proyecto que debía combinar comercio abajo y vivienda arriba.',
      problema:
        'Sacar el máximo de un lote pequeño sin que los apartamentos perdieran luz, ventilación ni relación con la calle.',
      solucion:
        'Cuatro niveles con 864 m² construidos: local comercial en planta baja y seis apartamentos arriba, con fachadas acristaladas, balcones corridos y ventilación cruzada.',
      resultado:
        'Concreto aparente, vidrio templado, aluminio, madera y jardines verticales en un lenguaje sobrio que no envejece con las modas.',
    },
    sensations: ['Sobriedad', 'Elegancia', 'Ligereza', 'Atemporalidad'],
    cover: '/photos/edificio-cyma.webp',
    gallery: [
      '/photos/edificio-cyma.webp',
      '/projects/edificio-cyma/edificio-cyma.webp',
      '/projects/edificio-cyma/3-1.webp',
      '/projects/edificio-cyma/5053dd42-92cc-4d83-b027-6b7d7d79468e.webp',
    ],
    video: 'https://youtu.be/2BFJljFhKiI',
    featured: true,
  },
  {
    slug: 'restaurante-rancho-texas',
    name: 'Restaurante Rancho Texas',
    short: 'Arquitectura comercial temática: la estética del oeste americano reinterpretada en clave contemporánea.',
    location: 'Colombia',
    year: 2025,
    status: 'Diseñado',
    type: 'Arquitectura comercial — restaurante temático',
    area: 'Salón, terraza, cocina industrial y áreas de apoyo',
    services: ['Diseño arquitectónico integral', 'Diseño de interiores', 'Modelado y visualización 3D'],
    description: [
      'Restaurante Rancho Texas es un proyecto de arquitectura comercial concebido bajo un concepto inspirado en la estética del oeste americano, combinando elementos rústicos y contemporáneos para crear una experiencia gastronómica única.',
      'La propuesta reinterpreta la arquitectura tradicional de los ranchos texanos mediante materiales naturales, acabados rústicos, espacios abiertos, iluminación cálida e integración entre áreas interiores y exteriores.',
      'La materialidad incluye madera natural, piedra, estructura metálica, concreto arquitectónico, ladrillo aparente e iluminación decorativa cálida, con una distribución funcional orientada a la operación gastronómica y la experiencia del usuario.',
    ],
    concept: ['Identidad de marca', 'Experiencia del usuario', 'Confort ambiental', 'Funcionalidad operativa'],
    categories: ['Comercial'],
    story: {
      contexto:
        'Un restaurante temático que necesitaba que su arquitectura contara la marca, no solo la decorara.',
      problema:
        'El concepto del oeste americano corría el riesgo de quedarse en ambientación superficial en lugar de convertirse en experiencia.',
      solucion:
        'Reinterpretamos la arquitectura de los ranchos texanos con madera natural, piedra, estructura metálica, ladrillo aparente e iluminación cálida, integrando salón, terraza y cocina industrial.',
      resultado:
        'Un local donde la distribución responde a la operación gastronómica y la materialidad sostiene la identidad de la marca.',
    },
    sensations: ['Tradición', 'Confort', 'Autenticidad', 'Calidez'],
    cover: '/projects/restaurante-rancho-texas/r-1-photo.webp',
    gallery: [
      '/projects/restaurante-rancho-texas/r-1-photo.webp',
      '/projects/restaurante-rancho-texas/r-2-photo.webp',
      '/projects/restaurante-rancho-texas/r-3-photo.webp',
      '/projects/restaurante-rancho-texas/r-5-photo.webp',
      '/projects/restaurante-rancho-texas/r-7-photo.webp',
      '/projects/restaurante-rancho-texas/r-8-photo.webp',
      '/projects/restaurante-rancho-texas/r-11-foto.webp',
      '/projects/restaurante-rancho-texas/r-13-foto.webp',
    ],
    video: null,
    featured: true,
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

/**
 * Categorías visibles del portafolio, en el orden en que se muestran.
 * "Vivienda unifamiliar" va primero: es lo que busca quien acaba de
 * comprar un lote para su casa. Sólo se listan las que tienen proyectos.
 */
const CATEGORY_ORDER = [
  'Vivienda unifamiliar',
  'Uso mixto',
  'Comercial',
  'Remodelación',
  'Espacio público',
  'Infraestructura',
  'En ejecución',
];

export const projectCategories = CATEGORY_ORDER.filter((c) =>
  projects.some((p) => p.categories?.includes(c)),
);

export function getProject(slug) {
  return projects.find((p) => p.slug === slug);
}

export function getAdjacentProjects(slug) {
  const i = projects.findIndex((p) => p.slug === slug);
  return {
    prev: projects[(i - 1 + projects.length) % projects.length],
    next: projects[(i + 1) % projects.length],
  };
}
