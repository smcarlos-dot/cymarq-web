const WHATSAPP_NUMBER = '573223656579';

/**
 * Construye un enlace de WhatsApp con un mensaje ya escrito.
 * Cada CTA de la web usa el suyo, para que la conversación empiece
 * con contexto y no con un "Hola" en frío.
 */
export function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const whatsappMessages = {
  general: 'Hola CYMARQ, quiero información para diseñar y construir mi casa.',
  hero:
    'Hola CYMARQ, quiero agendar una asesoría. Tengo (o estoy por comprar) un lote y quiero construir mi casa.',
  proceso:
    'Hola CYMARQ, quiero saber cómo empezar el diseño de mi casa. ¿Me explican el proceso?',
  lote: 'Hola CYMARQ, ya tengo un lote y quiero comenzar a construir. ¿Podemos hablar?',
  servicios: 'Hola CYMARQ, quiero contarles qué necesito para mi proyecto.',
  licencias:
    'Hola CYMARQ, necesito tramitar una licencia de construcción en Cúcuta. ¿Me ayudan a revisar mi caso?',
  desenglobe:
    'Hola CYMARQ, quiero desenglobar (o subdividir) un lote en Cúcuta. ¿Me dicen si es viable?',
  reconocimiento:
    'Hola CYMARQ, tengo una construcción sin licencia y quiero legalizarla. ¿Me ayudan con el reconocimiento?',
  disenoArquitectonico:
    'Hola CYMARQ, quiero cotizar el diseño arquitectónico y los planos de mi proyecto.',
  disenoConstruccion:
    'Hola CYMARQ, quiero que diseñen y construyan mi proyecto. ¿Cómo empezamos?',
  usoDelSuelo:
    'Hola CYMARQ, quiero saber qué puedo construir en mi lote en Cúcuta. ¿Me revisan la norma del predio?',
  faq: 'Hola CYMARQ, leí sus preguntas frecuentes y quiero resolver mi caso concreto.',
  proyecto: (nombre) =>
    `Hola CYMARQ, vi el proyecto "${nombre}" en su web y me gustaría algo así para mi lote.`,
};

export const site = {
  name: 'CYMARQ',
  tagline: 'Arquitectura • Diseño • Construcción',
  url: 'https://www.cymarq.com.co',
  email: 'contacto@cymarq.com.co',
  // Canal para asuntos de privacidad, datos personales y solicitudes de
  // eliminación (el que figura en las páginas legales y ante Meta).
  privacyEmail: 'carloslassor@hotmail.com',
  instagramHandle: '@cymarq.obras',
  whatsapp: '+57 322 3656579',
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappLink: whatsappUrl(whatsappMessages.general),
  instagram: 'https://www.instagram.com/cymarq.obras/',
  facebook: 'https://www.facebook.com/cymarq.obras',
  linkedin: 'https://www.linkedin.com/in/carloslasso-arquitecto/',
  location: 'Cúcuta, Norte de Santander, Colombia',
  // Teléfono en formato E.164: es el que leen los datos estructurados y los
  // buscadores. El formato legible para personas vive en `whatsapp`.
  phoneE164: '+573223656579',
  /**
   * Fecha de la última revisión del contenido editorial (servicios y FAQ).
   * Alimenta `dateModified` en los datos estructurados y la línea visible de
   * "actualizado en". Se sube a mano al revisar los textos: es una afirmación
   * sobre el contenido, no sobre la fecha del último despliegue.
   */
  contentUpdated: '2026-09-20',
  /**
   * Una sola frase que define qué es CYMARQ. Se reutiliza en los datos
   * estructurados y en los textos de la web para que la descripción de la
   * entidad sea idéntica en todas partes.
   */
  entityDescription:
    'CYMARQ es una empresa de arquitectura, diseño y construcción que trabaja en Cúcuta y Norte de Santander. Diseña vivienda y proyectos comerciales, elabora planos arquitectónicos y acompaña los trámites urbanísticos: licencias de construcción, desenglobe y subdivisión de lotes, reconocimiento de construcciones y consultas de norma y uso del suelo.',
  /** Área de servicio. CYMARQ no publica oficina abierta al público. */
  serviceAreas: [
    { type: 'City', name: 'Cúcuta', containedIn: 'Norte de Santander, Colombia' },
    { type: 'City', name: 'Villa del Rosario', containedIn: 'Norte de Santander, Colombia' },
    { type: 'City', name: 'Los Patios', containedIn: 'Norte de Santander, Colombia' },
    { type: 'City', name: 'Tibú', containedIn: 'Norte de Santander, Colombia' },
    { type: 'AdministrativeArea', name: 'Norte de Santander, Colombia' },
  ],
  /** Temas sobre los que CYMARQ trabaja de verdad. No es una lista de keywords. */
  knowsAbout: [
    'Arquitectura',
    'Diseño arquitectónico',
    'Planos arquitectónicos',
    'Licencias de construcción',
    'Licencias urbanísticas',
    'Desenglobe de predios',
    'Subdivisión de lotes',
    'Reconocimiento de edificaciones',
    'Normativa urbanística y POT',
    'Uso del suelo',
    'Construcción de vivienda',
    'Remodelación y ampliación',
    'Interventoría y supervisión de obra',
    'Presupuestos de obra',
    'Renderizado y visualización 3D',
  ],
  /** Catálogo para `hasOfferCatalog`. `url` sólo cuando existe una página. */
  catalogo: [
    { name: 'Diseño arquitectónico', url: '/servicios/diseno-arquitectonico/' },
    { name: 'Planos arquitectónicos', url: '/servicios/diseno-arquitectonico/' },
    { name: 'Licencias de construcción', url: '/servicios/licencias-de-construccion/' },
    { name: 'Licencias urbanísticas', url: '/servicios/licencias-de-construccion/' },
    { name: 'Desenglobe y subdivisión de lotes', url: '/servicios/desenglobe-y-subdivision/' },
    {
      name: 'Reconocimiento y legalización de construcciones',
      url: '/servicios/reconocimiento-de-construcciones/',
    },
    { name: 'Diseño y construcción', url: '/servicios/diseno-y-construccion/' },
    { name: 'Remodelación y ampliación', url: '/servicios/diseno-y-construccion/' },
    { name: 'Consultoría urbanística y uso del suelo', url: '/servicios/licencias-de-construccion/' },
    { name: 'Interventoría y supervisión de obra', url: '/servicios/' },
    { name: 'Renderizado 3D y visualización', url: '/servicios/diseno-arquitectonico/' },
  ],
  seo: {
    title: 'Arquitectos en Cúcuta | Diseño, licencias y construcción — CYMARQ',
    description:
      'Arquitectos en Cúcuta. Diseño arquitectónico y planos, licencias de construcción, desenglobe de lotes, legalización de construcciones y obra, en Cúcuta y Norte de Santander.',
    keywords: [
      'arquitectos en Cúcuta',
      'arquitectura en Cúcuta',
      'diseño arquitectónico Cúcuta',
      'planos arquitectónicos Cúcuta',
      'licencia de construcción Cúcuta',
      'licencias urbanísticas Cúcuta',
      'desenglobe Cúcuta',
      'subdivisión de lotes Cúcuta',
      'reconocimiento de construcciones Cúcuta',
      'uso del suelo Cúcuta',
      'diseño y construcción Cúcuta',
      'remodelaciones Cúcuta',
      'CYMARQ',
    ],
  },
};

/**
 * Quién responde por el trabajo.
 *
 * Se publica el dato, no el documento: nombre, títulos, número de matrícula y
 * las entidades donde cualquiera puede verificarlos. Fuera quedan la cédula,
 * el teléfono personal y el resto de la hoja de vida, que no le sirven a nadie
 * en una web pública.
 *
 * Nota sobre la matrícula: el CPNAA la expide como "A21412021-<cédula>". Aquí
 * se publica sólo el número de matrícula, sin el sufijo, para no exponer un
 * documento de identidad en una página indexable.
 */
export const ceo = {
  nombre: 'Carlos Eduardo Lasso Ramírez',
  nombreCorto: 'Carlos Lasso',
  rol: 'Arquitecto y CEO de CYMARQ',
  jobTitle: 'CEO y director de proyectos',
  linkedin: 'https://www.linkedin.com/in/carloslasso-arquitecto/',
  bio: 'Arquitecto de la Universidad Francisco de Paula Santander y especialista en Interventoría de Obras Civiles. Antes de dedicarse por completo a CYMARQ trabajó en el área de control urbano de la Secretaría de Planeación de Tibú, verificando el cumplimiento de licencias, y en el Instituto Geográfico Agustín Codazzi en control de calidad catastral. Esa experiencia en el lado de la administración es la que hoy sostiene el trabajo de CYMARQ en licencias, desenglobe y norma urbanística: conocemos el trámite desde adentro.',
  titulos: [
    { titulo: 'Arquitecto', entidad: 'Universidad Francisco de Paula Santander', anio: 2021 },
    {
      titulo: 'Especialista en Interventoría de Obras Civiles',
      entidad: 'Universidad Francisco de Paula Santander',
      anio: 2026,
    },
    {
      titulo: 'Tecnólogo en Obras Civiles',
      entidad: 'Universidad Francisco de Paula Santander',
      anio: 2016,
    },
  ],
  credenciales: [
    {
      nombre: 'Matrícula profesional de arquitectura',
      numero: 'A21412021',
      entidad: 'Consejo Profesional Nacional de Arquitectura y sus Profesiones Auxiliares (CPNAA)',
      entidadCorta: 'CPNAA',
      url: 'https://cpnaa.gov.co/',
    },
    {
      nombre: 'Certificado de inscripción profesional',
      numero: '123864-0553316 NTS',
      entidad: 'Consejo Profesional Nacional de Ingeniería (COPNIA)',
      entidadCorta: 'COPNIA',
      url: 'https://www.copnia.gov.co/',
    },
  ],
};

export const hero = {
  title: 'Antes de construir tu hogar, vívelo.',
  subtitle:
    'Arquitectura, diseño y construcción en Cúcuta. Diseñamos tu proyecto, resolvemos la licencia y te dejamos recorrer cada espacio en 3D antes de iniciar la obra.',
  cta: 'Agenda una asesoría por WhatsApp',
  secondary: 'Ver proyectos',
  place: 'Cúcuta, su área metropolitana y Norte de Santander.',
};

/**
 * Segunda sección: el momento en el que está el cliente.
 * Habla de su problema, no de la empresa.
 */
export const momento = {
  label: 'El momento en el que estás',
  title:
    'Construir una casa es una de las decisiones más importantes de una familia.',
  intro: 'Después de comprar un lote aparecen cientos de preguntas:',
  questions: [
    '¿Cómo aprovechar el terreno?',
    '¿Cómo distribuir los espacios?',
    '¿Cómo evitar errores?',
    '¿Qué materiales elegir?',
    '¿Cómo asegurar que la inversión sea la correcta?',
  ],
  closing:
    'CYMARQ existe para responder todas esas preguntas antes de iniciar la construcción.',
  cta: 'Resolver mis dudas por WhatsApp',
};

/**
 * El proceso. Su función es quitar el miedo a lo desconocido:
 * quien no sabe por dónde empezar necesita ver el camino completo.
 */
export const proceso = {
  label: 'Cómo trabajamos',
  title: 'Así convertimos una idea en un hogar',
  intro:
    'Seis pasos. Ninguno empieza hasta que el anterior te deje tranquilo.',
  steps: [
    {
      title: 'Escuchamos tu idea.',
      text: 'Nos cuentas cómo vive tu familia, qué necesitan hoy y qué imaginan para dentro de diez años. Antes de dibujar, entendemos.',
    },
    {
      title: 'Conocemos tu lote.',
      text: 'Medidas reales, orientación del sol, accesos y normativa. Si estás en Cúcuta o cerca, vamos al terreno; si no, lo resolvemos con fotos, videos y los documentos del predio. Lo que se puede y lo que no, dicho con claridad desde el principio.',
    },
    {
      title: 'Diseñamos según tu forma de vivir.',
      text: 'Cada espacio responde a una rutina concreta de tu familia. No adaptamos una plantilla: partimos de cero contigo.',
    },
    {
      title: 'Visualizas cada espacio antes de construir.',
      text: 'Te entregamos el proyecto en 3D para que recorras tu casa: la fachada, la sala, tu habitación. La ves antes de que exista.',
    },
    {
      title: 'Ajustamos hasta que estés convencido.',
      text: 'Mover un muro en el modelo toma minutos. Moverlo en obra cuesta dinero. Ajustamos las veces que haga falta.',
    },
    {
      title: 'Construimos.',
      text: 'Con los planos, el presupuesto y las licencias en regla, la obra empieza sin sorpresas y con quien diseñó la casa encima de ella.',
    },
  ],
  cta: 'Quiero empezar por el paso 1',
};

/**
 * Servicios visibles en la home y en /servicios/.
 * `href` apunta a la página del servicio cuando existe; los que no tienen
 * página propia se explican dentro del hub /servicios/.
 */
export const services = [
  {
    title: 'Diseño arquitectónico',
    text: 'Proyectos de vivienda, comercio y espacio público diseñados desde cero, pensados para ser construidos y habitados durante muchos años.',
    href: '/servicios/diseno-arquitectonico/',
  },
  {
    title: 'Planos arquitectónicos',
    text: 'Planos de plantas, cortes, fachadas y detalles con la calidad técnica que exige una curaduría y que necesita un maestro en obra.',
    href: '/servicios/diseno-arquitectonico/',
  },
  {
    title: 'Licencias de construcción',
    text: 'Preparamos el proyecto y radicamos la licencia ante la curaduría urbana en obra nueva, ampliación, modificación y demolición.',
    href: '/servicios/licencias-de-construccion/',
  },
  {
    title: 'Desenglobe y subdivisión',
    text: 'Dividir un predio en varios lotes o unidades, con el estudio previo de norma y los planos que pide el trámite.',
    href: '/servicios/desenglobe-y-subdivision/',
  },
  {
    title: 'Reconocimiento y legalización',
    text: 'Construcciones levantadas sin licencia: levantamiento, revisión estructural y trámite de reconocimiento de la edificación.',
    href: '/servicios/reconocimiento-de-construcciones/',
  },
  {
    title: 'Uso del suelo y norma urbanística',
    text: 'Revisamos qué permite el POT en tu predio antes de que compres, diseñes o inviertas: uso, altura, aislamientos e índices.',
    href: '/servicios/licencias-de-construccion/#uso-del-suelo',
  },
  {
    title: 'Diseño y construcción',
    text: 'El proyecto completo con un solo responsable: quien diseñó la casa es quien la construye y responde por ella.',
    href: '/servicios/diseno-y-construccion/',
  },
  {
    title: 'Remodelaciones y ampliaciones',
    text: 'Transformamos espacios existentes y resolvemos el segundo piso o la ampliación, con el trámite que corresponda.',
    href: '/servicios/diseno-y-construccion/#remodelacion',
  },
  {
    title: 'Renderizado 3D',
    text: 'Visualización fotorrealista para que recorras cada espacio de tu proyecto antes de construirlo.',
    href: '/servicios/diseno-arquitectonico/#visualizacion',
  },
  {
    title: 'Levantamientos arquitectónicos',
    text: 'Registro preciso de edificaciones existentes como base técnica para diseñar, ampliar o legalizar.',
  },
  {
    title: 'Presupuestos',
    text: 'Presupuestos detallados para que sepas cuánto cuesta tu obra antes de mover el primer bulto de cemento.',
  },
  {
    title: 'Interventoría',
    text: 'Control técnico, administrativo y financiero de proyectos para asegurar su correcta ejecución.',
  },
  {
    title: 'Supervisión de obra',
    text: 'Acompañamiento permanente en obra para asegurar que lo construido sea fiel al diseño aprobado.',
  },
  {
    title: 'Diseño interior',
    text: 'Interiores con identidad y carácter, en equilibrio con la forma de vivir de cada familia.',
  },
];


export const about = {
  intro:
    'En CYMARQ creemos que la arquitectura comienza escuchando. Cada familia vive de forma diferente y cada proyecto merece una solución única.',
  extra:
    'Nuestro trabajo consiste en comprender cómo quieres vivir para transformar esas ideas en espacios funcionales, estéticos y preparados para ser construidos con confianza.',
  team:
    'CYMARQ es un equipo interdisciplinario que reúne arquitectura, ingeniería y gestión de obra. Por eso el diseño y la viabilidad constructiva se resuelven en la misma mesa: lo que ves en pantalla es lo que se puede levantar en tu lote.',
  manifesto: [
    'No diseñamos para lotes. Diseñamos para las personas que van a vivir en ellos.',
    'No vendemos renders. Vendemos la tranquilidad de construir la casa correcta.',
    'Ninguna familia debería construir una casa sin antes haberla vivido.',
  ],
  pillars: [
    {
      title: 'Comprender antes de diseñar',
      text: 'Primero escuchamos cómo vive tu familia: horarios, visitas, trabajo en casa, los niños, los años que vienen. El plano llega después de esa conversación.',
    },
    {
      title: 'Diseñamos para personas',
      text: 'Cada proyecto nace de una historia diferente. Ninguna de las casas que hemos diseñado se parece a otra, porque ninguna familia se parece a otra.',
    },
    {
      title: 'Visualiza antes de construir',
      text: 'Recorres tu proyecto en 3D antes de que empiece la obra. Decides con lo que ves, no con lo que te imaginas al mirar un plano.',
    },
    {
      title: 'Construye con certeza',
      text: 'Conocemos el terreno, la normativa local (POT, PBOT) y las condiciones reales de obra en Cúcuta y Norte de Santander. El diseño avanza sabiendo dónde se va a construir.',
    },
  ],
  mision:
    'Diseñamos espacios únicos que nacen de comprender a las personas, sus necesidades y su forma de vivir. Acompañamos a nuestros clientes desde la idea hasta la construcción, permitiéndoles visualizar, recorrer y perfeccionar cada proyecto antes de iniciar la obra, para que cada decisión se tome con confianza y cada espacio tenga un propósito.',
  vision:
    'Ser la empresa de arquitectura, diseño y construcción más reconocida del nororiente colombiano por la calidad de sus proyectos, la experiencia excepcional de sus clientes y la capacidad de transformar cada necesidad en un espacio único, funcional y pensado para quienes lo habitan.',
};

/** Cierre de la home. Su única función es abrir una conversación. */
export const finalCta = {
  label: 'Da el primer paso',
  title: '¿Ya tienes un lote y quieres comenzar a construir?',
  text: 'Agenda una asesoría con nuestro equipo y descubre cómo podemos ayudarte a diseñar un hogar pensado para tu familia antes de iniciar la construcción.',
  button: 'Hablar por WhatsApp',
  note: 'Te respondemos personalmente. Sin compromiso y sin costo.',
};

export const renderVideos = [
  {
    src: '/videos/proceso-constructivo-edificio-cyma.mp4',
    title: 'Proceso constructivo — Edificio CYMA',
    poster: '/videos/poster-proceso-constructivo-edificio-cyma.webp',
    vertical: true,
  },
  {
    src: '/videos/visualizacion-piscina.mp4',
    title: 'Visualización — Piscina',
    poster: '/videos/poster-visualizacion-piscina.webp',
    vertical: true,
  },
  {
    src: '/videos/visualizacion-vivienda-interior.mp4',
    title: 'Visualización — Vivienda interior',
    poster: '/videos/poster-visualizacion-vivienda-interior.webp',
    vertical: true,
  },
  {
    src: '/videos/visualizacion-habitacion.mp4',
    title: 'Visualización — Habitación',
    poster: '/videos/poster-visualizacion-habitacion.webp',
    vertical: true,
  },
];

export const renderPhotos = [
  { src: '/photos/edificio-cyma.webp', alt: 'Edificio CYMA', vertical: true },
  { src: '/photos/fachada.webp', alt: 'Fachada' },
  { src: '/photos/living.webp', alt: 'Living' },
  { src: '/photos/cocina.webp', alt: 'Cocina', vertical: true },
  { src: '/photos/piscina.webp', alt: 'Piscina' },
  { src: '/photos/habitacion-principal.webp', alt: 'Habitación principal' },
  { src: '/photos/edificio-espana.webp', alt: 'Edificio España' },
  { src: '/photos/sala-comedor.webp', alt: 'Sala comedor' },
  { src: '/photos/pen-house.webp', alt: 'Penthouse' },
  { src: '/photos/patio-interior-3.webp', alt: 'Patio interior' },
  { src: '/photos/living-v2.webp', alt: 'Living — vista alterna' },
  { src: '/photos/sala-de-estar.webp', alt: 'Sala de estar' },
  { src: '/photos/zona-social.webp', alt: 'Zona social' },
];
