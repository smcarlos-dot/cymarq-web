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
  location: 'Cúcuta, Norte de Santander, Colombia',
  seo: {
    title: 'CYMARQ | Diseñamos y construimos tu casa en Cúcuta',
    description:
      'Arquitectos en Cúcuta. Diseñamos tu vivienda y te dejamos recorrerla en 3D antes de iniciar la obra. Asesoría por WhatsApp para familias que ya tienen lote en Cúcuta y Norte de Santander.',
    keywords: [
      'Arquitectos en Cúcuta',
      'Diseño de casas en Cúcuta',
      'Construir casa en Cúcuta',
      'Planos de casa Cúcuta',
      'Diseño arquitectónico',
      'Construcción',
      'Remodelaciones',
      'Interventoría',
      'Licencias urbanísticas',
      'Diseño interior',
      'Renderizado 3D',
      'Renders',
      'Levantamientos arquitectónicos',
      'Presupuestos',
      'Consultoría',
      'Supervisión de obra',
      'Arquitectura Cúcuta',
      'Construcción en Cúcuta',
      'Diseño arquitectónico Norte de Santander',
      'CYMARQ',
    ],
  },
};

export const hero = {
  title: 'Antes de construir tu hogar, vívelo.',
  subtitle:
    'Diseñamos viviendas únicas en Cúcuta para familias que desean construir con la tranquilidad de haber recorrido cada espacio antes de iniciar la obra.',
  cta: 'Agenda una asesoría por WhatsApp',
  secondary: 'Ver proyectos',
  place: 'Atendemos proyectos en Cúcuta y Norte de Santander.',
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
      title: 'Visitamos tu lote.',
      text: 'Vamos al terreno: medidas reales, orientación del sol, accesos y normativa. Lo que se puede y lo que no, dicho con claridad desde el principio.',
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

export const services = [
  {
    title: 'Diseño arquitectónico',
    text: 'Propuestas contemporáneas y funcionales, pensadas para ser construidas, habitadas y disfrutadas durante muchos años.',
  },
  {
    title: 'Construcción',
    text: 'Ejecución de obra con conocimiento técnico y normativo, para que lo que se construya sea exactamente lo que aprobaste.',
  },
  {
    title: 'Remodelaciones',
    text: 'Transformamos espacios existentes en ambientes modernos, coherentes y adaptados a nuevas dinámicas de vida.',
  },
  {
    title: 'Interventoría',
    text: 'Control técnico, administrativo y financiero de proyectos para asegurar su correcta ejecución.',
  },
  {
    title: 'Licencias urbanísticas',
    text: 'Gestión y acompañamiento normativo conforme al POT, PBOT y reglamentos vigentes de cada municipio.',
  },
  {
    title: 'Diseño interior',
    text: 'Interiores con identidad y carácter, en equilibrio con la forma de vivir de cada familia.',
  },
  {
    title: 'Renderizado 3D',
    text: 'Visualización fotorrealista para que recorras cada espacio de tu casa antes de construirlo.',
  },
  {
    title: 'Levantamientos arquitectónicos',
    text: 'Registro preciso de edificaciones existentes como base técnica para diseño e intervención.',
  },
  {
    title: 'Presupuestos',
    text: 'Presupuestos detallados para que sepas cuánto cuesta tu casa antes de mover el primer bulto de cemento.',
  },
  {
    title: 'Consultoría',
    text: 'Asesoría técnica para entidades públicas y privadas en todas las etapas del proyecto.',
  },
  {
    title: 'Supervisión de obra',
    text: 'Acompañamiento permanente en obra para asegurar que lo construido sea fiel al diseño aprobado.',
  },
];

export const about = {
  intro:
    'En CYMARQ creemos que la arquitectura comienza escuchando. Cada familia vive de forma diferente y cada proyecto merece una solución única.',
  extra:
    'Nuestro trabajo consiste en comprender cómo quieres vivir para transformar esas ideas en espacios funcionales, estéticos y preparados para ser construidos con confianza.',
  team:
    'Somos un equipo interdisciplinario formado por un arquitecto y una ingeniera civil. Por eso el diseño y la viabilidad constructiva se resuelven en la misma mesa: lo que ves en pantalla es lo que se puede levantar en tu lote.',
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
  note: 'Te respondemos personalmente. Sin compromiso y sin costo la primera conversación.',
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
