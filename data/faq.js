/**
 * Preguntas frecuentes sobre arquitectura y trámites urbanísticos en Cúcuta.
 *
 * Cada respuesta está escrita para poder leerse sola: empieza respondiendo,
 * después explica cuándo aplica y qué puede cambiar el resultado. Esa forma
 * sirve igual a una persona que llega desde Google y a un sistema que
 * necesita citar una respuesta completa sin recorrer toda la página.
 *
 * Formato de cada entrada:
 *   id     — ancla de la pregunta (se enlaza desde las páginas de servicio)
 *   q      — la pregunta, tal como la escribe la gente
 *   a      — párrafos de la respuesta
 *   list   — lista opcional { title, items }
 *   a2     — párrafos de cierre, después de la lista
 *   links  — enlaces al servicio de CYMARQ y, cuando aplica, a fuente oficial
 *
 * Regla de contenido: no se publican precios, plazos ni exigencias concretas
 * que no puedan sostenerse. Cuando la respuesta depende del predio o de la
 * norma aplicable, la respuesta lo dice en lugar de inventar una cifra.
 */

const SERVICIO_LICENCIAS = {
  href: '/servicios/licencias-de-construccion/',
  label: 'Licencias de construcción en Cúcuta',
};
const SERVICIO_DESENGLOBE = {
  href: '/servicios/desenglobe-y-subdivision/',
  label: 'Desenglobe y subdivisión de lotes',
};
const SERVICIO_RECONOCIMIENTO = {
  href: '/servicios/reconocimiento-de-construcciones/',
  label: 'Reconocimiento y legalización de construcciones',
};
const SERVICIO_DISENO = {
  href: '/servicios/diseno-arquitectonico/',
  label: 'Diseño arquitectónico y planos',
};
const SERVICIO_CONSTRUCCION = {
  href: '/servicios/diseno-y-construccion/',
  label: 'Diseño y construcción',
};
const USO_DEL_SUELO = {
  href: '/servicios/licencias-de-construccion/#uso-del-suelo',
  label: 'Estudio de norma y uso del suelo',
};

const ALCALDIA_USO_SUELO = {
  href: 'https://cucuta.gov.co/consulta-uso-de-suelos/',
  label: 'Consulta de uso de suelos — Alcaldía de Cúcuta',
  external: true,
};
const CURADURIA_1 = {
  href: 'https://curaduriaunocucuta.org/',
  label: 'Curaduría Urbana N.º 1 de Cúcuta',
  external: true,
};
const CURADURIA_2 = {
  href: 'https://curaduria2cucuta.com/',
  label: 'Curaduría Urbana N.º 2 de Cúcuta',
  external: true,
};
const DECRETO_1077 = {
  href: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=77216',
  label: 'Decreto 1077 de 2015 — norma nacional de licencias urbanísticas',
  external: true,
};

export const faqCategories = [
  {
    id: 'licencias-de-construccion',
    title: 'Licencias de construcción',
    intro:
      'Qué obras necesitan licencia en Cúcuta, ante quién se tramita, qué documentos se piden y qué determina lo que cuesta y lo que demora.',
    service: SERVICIO_LICENCIAS,
    questions: [
      {
        id: 'necesito-licencia-de-construccion-en-cucuta',
        q: '¿Necesito licencia de construcción en Cúcuta?',
        a: [
          'Sí, en la gran mayoría de los casos. En Colombia toda obra que construya, amplíe, adecúe, modifique, refuerce, demuela o cierre una edificación necesita una licencia urbanística expedida antes de empezar. En Cúcuta esa licencia la expiden los curadores urbanos del municipio.',
          'No requieren licencia los trabajos de mantenimiento y acabados que no alteran la estructura, ni aumentan el área construida, ni cambian el uso: pintar, cambiar enchapes, reparar una cubierta existente, sustituir carpintería o renovar redes internas sin intervenir muros estructurales.',
          'La frontera entre "remodelación" y "obra que requiere licencia" no siempre es evidente. Si tu obra toca muros estructurales, abre vanos, suma metros, cierra un patio o convierte una vivienda en un local, ya no es mantenimiento. Antes de contratar una cuadrilla, conviene revisar en qué modalidad cae la obra.',
        ],
        links: [SERVICIO_LICENCIAS, DECRETO_1077],
      },
      {
        id: 'cuanto-cuesta-una-licencia-de-construccion-en-cucuta',
        q: '¿Cuánto cuesta una licencia de construcción en Cúcuta?',
        a: [
          'No hay una tarifa única. El costo de una licencia se divide siempre en dos partes distintas, y confundirlas es el origen de casi todos los malentendidos.',
          'La primera son las expensas de la curaduría urbana —en Cúcuta, la Curaduría 1 o la 2, según el reparto—: un valor reglado por la norma nacional, que no fija el curador a su criterio. Se calcula con una fórmula que depende del área que se va a intervenir, del uso, del estrato del predio y del presupuesto estimado de la obra. Dos proyectos del mismo tamaño pueden pagar expensas distintas si tienen usos o estratos diferentes.',
          'La segunda son los honorarios del equipo técnico: el diseño arquitectónico, los planos, el diseño estructural, el estudio de suelos y los demás estudios que exija el proyecto, más el acompañamiento del trámite. Eso depende del alcance que contrates.',
          'Por eso una cifra dada por teléfono, sin ver el predio ni el alcance, no sirve para presupuestar. Con la nomenclatura del predio, el área que quieres construir y el uso previsto, se puede estimar con un orden de magnitud real.',
        ],
        links: [SERVICIO_LICENCIAS, CURADURIA_1, CURADURIA_2],
      },
      {
        id: 'como-sacar-una-licencia-de-construccion-en-cucuta',
        q: '¿Cómo sacar una licencia de construcción en Cúcuta?',
        a: [
          'El trámite se radica ante una curaduría urbana de Cúcuta y sigue siempre el mismo recorrido, aunque cambie el tamaño del proyecto.',
        ],
        list: {
          title: 'El recorrido, paso a paso',
          items: [
            'Verificar la norma del predio: qué uso permite, cuánta altura, qué aislamientos y qué índices de ocupación y construcción aplican.',
            'Reunir la documentación del inmueble: certificado de tradición y libertad reciente, escritura y documento de identidad del propietario.',
            'Desarrollar el proyecto: planos arquitectónicos firmados por arquitecto con matrícula, más los estudios técnicos que exija el caso (estructural, suelos, hidrosanitario, eléctrico).',
            'Diligenciar el Formulario Único Nacional y radicar ante la curaduría que corresponda por reparto.',
            'Atender la revisión: si el curador formula observaciones, hay un plazo para corregir y volver a radicar.',
            'Pagar las expensas y recibir la resolución que otorga la licencia.',
            'Esperar la ejecutoria del acto administrativo: la obra puede iniciar cuando la licencia queda en firme.',
          ],
        },
        a2: [
          'El punto donde más proyectos se atrasan no es la curaduría: es llegar a radicar con un proyecto que no cumple la norma del predio. Revisar la norma primero ahorra meses.',
        ],
        links: [SERVICIO_LICENCIAS, CURADURIA_1, CURADURIA_2],
      },
      {
        id: 'requisitos-licencia-de-construccion',
        q: '¿Qué requisitos necesito para una licencia de construcción?',
        a: [
          'Los requisitos se agrupan en tres bloques: los del predio, los del solicitante y los del proyecto. Los dos primeros los aporta el propietario; el tercero lo produce el equipo técnico.',
        ],
        list: {
          title: 'Lo que normalmente se exige',
          items: [
            'Certificado de tradición y libertad del predio, expedido recientemente.',
            'Copia de la escritura pública del inmueble.',
            'Documento de identidad del propietario, y poder cuando el trámite lo adelanta un tercero.',
            'Formulario Único Nacional para la solicitud de licencias, debidamente diligenciado.',
            'Planos arquitectónicos (plantas, cortes, fachadas, localización) firmados por arquitecto con matrícula profesional vigente.',
            'Proyecto estructural y memorias de cálculo firmados por ingeniero civil, conforme a la NSR-10.',
            'Estudio geotécnico o de suelos, según la magnitud del proyecto.',
            'Diseños hidrosanitarios y eléctricos cuando el proyecto lo requiera.',
          ],
        },
        a2: [
          'La lista exacta depende de la modalidad de licencia y del tipo de proyecto: no es lo mismo un cerramiento que una obra nueva de tres niveles. Antes de reunir papeles, conviene confirmar qué modalidad aplica a tu caso.',
        ],
        links: [SERVICIO_LICENCIAS, DECRETO_1077],
      },
      {
        id: 'cuanto-demora-una-licencia-de-construccion',
        q: '¿Cuánto demora una licencia de construcción?',
        a: [
          'Hay que contar dos tiempos separados, y casi siempre el primero pesa más que el segundo.',
          'El primero es el tiempo de preparación del proyecto: diseñar, coordinar los estudios técnicos y dejar el expediente completo. Depende del tamaño del proyecto y, sobre todo, de la rapidez con la que el propietario tome decisiones sobre el diseño.',
          'El segundo es el tiempo de la curaduría. La norma nacional fija plazos para la revisión, que pueden ampliarse cuando el expediente es complejo. Ese reloj se reinicia cada vez que el curador formula observaciones y el solicitante debe corregir: por eso un proyecto bien armado desde el principio se demora menos, aunque el plazo legal sea el mismo.',
          'En la práctica es más realista pensar en meses que en semanas, y planear la compra de materiales y el inicio de obra en función de la ejecutoria de la licencia y no de la fecha de radicación.',
        ],
        links: [SERVICIO_LICENCIAS],
      },
      {
        id: 'licencia-para-construir-un-segundo-piso',
        q: '¿Necesito licencia para construir un segundo piso?',
        a: [
          'Sí. Levantar un segundo piso aumenta el área construida, así que corresponde a una licencia de construcción en modalidad de ampliación. No es una obra menor ni un asunto de mantenimiento.',
          'Antes del trámite hay dos preguntas que deciden si el proyecto es viable. La primera es normativa: si la norma urbanística del predio permite esa altura en esa zona, con los aislamientos y retrocesos que exija. La segunda es estructural: si la cimentación y la estructura existentes soportan el peso adicional, o si hace falta reforzarlas.',
          'Esa segunda pregunta la resuelve un ingeniero civil con un estudio del estado real de lo construido. En viviendas levantadas por etapas, sin planos ni diseño estructural previo, es frecuente que el segundo piso exija reforzamiento. Descubrirlo antes de diseñar evita rehacer el proyecto entero.',
        ],
        links: [SERVICIO_LICENCIAS, SERVICIO_CONSTRUCCION],
      },
      {
        id: 'licencia-para-ampliar-mi-casa',
        q: '¿Necesito licencia para ampliar mi casa?',
        a: [
          'Sí. Cualquier obra que sume metros cuadrados construidos —una habitación nueva, cerrar un patio, una terraza cubierta, un apartamento sobre el garaje— es una ampliación y requiere licencia de construcción previa.',
          'Lo que decide si la ampliación es posible no es el tamaño de la obra sino la norma del predio: el índice de ocupación limita cuánto del lote puede quedar cubierto, el índice de construcción limita el total de metros construidos, y los aislamientos definen cuánto hay que dejar libre contra los linderos.',
          'Es común que una familia diseñe la ampliación primero y descubra después que invade un aislamiento obligatorio. Revisar la norma antes de dibujar cuesta muy poco comparado con demoler lo construido.',
        ],
        links: [SERVICIO_LICENCIAS, USO_DEL_SUELO],
      },
      {
        id: 'licencia-para-remodelar-una-vivienda',
        q: '¿Necesito licencia para remodelar una vivienda?',
        a: [
          'Depende de qué entiendas por remodelar. Si la obra se limita a acabados y mantenimiento —pintura, pisos, enchapes, cambio de aparatos sanitarios, carpintería, reparaciones— no requiere licencia.',
          'Si la obra cambia la distribución interna, interviene muros estructurales, abre o cierra vanos, modifica la fachada o cambia el uso del inmueble, entonces sí: corresponde a una licencia de construcción en modalidad de adecuación o modificación, según el caso.',
          'Y si además suma área construida, ya no es una remodelación sino una ampliación, que es otra modalidad. Como los tres casos se parecen desde afuera pero se tramitan distinto, conviene definir la modalidad antes de empezar la obra y no después de que un inspector la visite.',
        ],
        links: [SERVICIO_LICENCIAS, SERVICIO_CONSTRUCCION],
      },
      {
        id: 'que-pasa-si-construyo-sin-licencia',
        q: '¿Qué pasa si construyo sin licencia?',
        a: [
          'Construir sin licencia es una infracción urbanística. La autoridad municipal de control urbano puede imponer multas y, cuando lo construido no se ajusta a la norma, ordenar la demolición total o parcial de la obra a costa del propietario.',
        ],
        list: {
          title: 'Las consecuencias que más golpean en la práctica',
          items: [
            'Multas y actuaciones de control urbano, que no desaparecen con el tiempo.',
            'Orden de demolición de lo construido en contra de la norma.',
            'Dificultad para incorporar la construcción en la escritura y en el folio de matrícula inmobiliaria.',
            'Problemas para acceder a crédito hipotecario o para vender: el inmueble aparece como lote o con un área construida menor a la real.',
            'Inconvenientes con conexiones definitivas de servicios públicos y con seguros.',
          ],
        },
        a2: [
          'Cuando la obra ya está hecha existe una salida legal: el reconocimiento de la edificación, que declara la existencia de lo construido si cumple las condiciones que exige la norma. No siempre procede, pero es el camino correcto para regularizar.',
        ],
        links: [SERVICIO_RECONOCIMIENTO, SERVICIO_LICENCIAS],
      },
      {
        id: 'cuanto-cobra-un-arquitecto-por-tramitar-una-licencia',
        q: '¿Cuánto cobra un arquitecto por tramitar una licencia?',
        a: [
          'Depende sobre todo del alcance que se contrate, y conviene aclararlo antes de comparar propuestas porque rara vez comparan lo mismo.',
        ],
        list: {
          title: 'Lo que hace variar el honorario',
          items: [
            'Si se contrata solo la gestión del trámite o también el diseño y los planos del proyecto.',
            'El área a intervenir y el número de niveles.',
            'La modalidad: obra nueva, ampliación, modificación, demolición o reconocimiento.',
            'Los estudios técnicos que exija el proyecto y si se coordinan dentro del mismo contrato.',
            'El estado de la documentación del predio al iniciar.',
          ],
        },
        a2: [
          'Las expensas de la curaduría son un valor aparte, que paga el propietario y que no hace parte de los honorarios profesionales. Una propuesta seria las presenta como un rubro separado y estimado, no escondido dentro de un precio global.',
        ],
        links: [SERVICIO_LICENCIAS],
      },
    ],
  },
  {
    id: 'desenglobe-y-subdivision',
    title: 'Desenglobe y subdivisión de lotes',
    intro:
      'Dividir un predio tiene una parte urbanística y una parte registral. Aquí está la diferencia, lo que se necesita y qué determina si tu lote se puede dividir.',
    service: SERVICIO_DESENGLOBE,
    questions: [
      {
        id: 'como-hacer-un-desenglobe-en-cucuta',
        q: '¿Cómo hacer un desenglobe en Cúcuta?',
        a: [
          'Un desenglobe se hace en tres etapas encadenadas, y saltarse el orden es el error más caro.',
        ],
        list: {
          title: 'Las tres etapas',
          items: [
            'Etapa urbanística: se verifica que la norma permita dividir el predio y se tramita la licencia de subdivisión ante una curaduría urbana de Cúcuta, con los planos correspondientes.',
            'Etapa notarial: con la licencia en firme se otorga la escritura pública de desenglobe ante notaría.',
            'Etapa registral y catastral: la escritura se registra en la Oficina de Registro de Instrumentos Públicos, que abre una matrícula inmobiliaria por cada nuevo predio, y después se actualiza la información catastral.',
          ],
        },
        a2: [
          'Hasta que no se abren las nuevas matrículas, los lotes resultantes no existen como inmuebles independientes: no se pueden vender por separado ni hipotecar por separado. Por eso vale la pena empezar por confirmar la viabilidad normativa antes de prometerle un lote a nadie.',
        ],
        links: [SERVICIO_DESENGLOBE, CURADURIA_1, CURADURIA_2],
      },
      {
        id: 'cuanto-cuesta-un-desenglobe',
        q: '¿Cuánto cuesta un desenglobe?',
        a: [
          'El costo total se reparte entre cuatro frentes distintos, y ninguno de ellos tiene una tarifa fija que se pueda anunciar de antemano.',
        ],
        list: {
          title: 'De qué se compone el costo',
          items: [
            'Expensas de la curaduría urbana por la licencia de subdivisión, calculadas con la fórmula que fija la norma nacional.',
            'Honorarios profesionales: estudio de viabilidad, levantamiento topográfico y planos de subdivisión.',
            'Gastos notariales de la escritura de desenglobe, que dependen del avalúo del inmueble.',
            'Derechos e impuesto de registro ante la Oficina de Registro de Instrumentos Públicos.',
          ],
        },
        a2: [
          'El número de lotes resultantes y el avalúo del predio son las dos variables que más mueven la cifra. Con el certificado de tradición y el área del predio se puede estimar cada rubro con seriedad.',
        ],
        links: [SERVICIO_DESENGLOBE],
      },
      {
        id: 'requisitos-para-desenglobar-un-lote',
        q: '¿Qué requisitos necesito para desenglobar un lote?',
        a: [
          'La licencia de subdivisión, que es la puerta de entrada del proceso, se radica con documentación del predio y con los planos de la división propuesta.',
        ],
        list: {
          title: 'Documentación habitual',
          items: [
            'Certificado de tradición y libertad del predio, expedido recientemente.',
            'Copia de la escritura pública y documento de identidad del propietario.',
            'Formulario Único Nacional de solicitud de licencia.',
            'Levantamiento topográfico del predio, con áreas y linderos reales.',
            'Plano de la subdivisión propuesta, firmado por profesional competente.',
            'Paz y salvo del impuesto predial.',
          ],
        },
        a2: [
          'Antes de reunir todo eso conviene resolver una pregunta previa: si la norma urbanística admite la división que quieres hacer. Radicar una subdivisión que no cumple el área o el frente mínimo solo produce un rechazo y la pérdida de las expensas.',
        ],
        links: [SERVICIO_DESENGLOBE, USO_DEL_SUELO],
      },
      {
        id: 'diferencia-entre-desenglobe-y-subdivision',
        q: '¿Cuál es la diferencia entre desenglobe y subdivisión?',
        a: [
          'Son dos actos distintos, de dos autoridades distintas, y uno habilita al otro.',
          'La subdivisión es el acto urbanístico: la licencia con la que el curador urbano autoriza dividir un predio en varios, verificando que cada lote resultante cumpla la norma en área, frente, acceso y uso.',
          'El desenglobe es el acto registral: la operación por la que, tras la escritura pública, la Oficina de Registro de Instrumentos Públicos cierra parcialmente el folio original y abre una matrícula inmobiliaria nueva para cada predio resultante.',
          'En el lenguaje corriente la gente dice "desenglobe" para referirse a todo el proceso, y no está mal como forma de hablar. Lo importante es saber que no basta con ir a la notaría: sin la licencia de subdivisión previa, el registro no abre las matrículas.',
        ],
        links: [SERVICIO_DESENGLOBE],
      },
      {
        id: 'puedo-dividir-mi-lote-en-dos',
        q: '¿Puedo dividir mi lote en dos?',
        a: [
          'Depende de la norma que aplique a tu predio, no del tamaño que a uno le parezca razonable. La respuesta se decide comparando los dos lotes resultantes con lo que exige el Plan de Ordenamiento Territorial para esa zona.',
        ],
        list: {
          title: 'Lo que se revisa para responder',
          items: [
            'Área mínima de lote exigida en la zona donde está el predio.',
            'Frente mínimo sobre vía pública de cada lote resultante.',
            'Que cada lote tenga acceso directo a vía pública: un lote que queda encerrado no se aprueba.',
            'El tratamiento urbanístico y el uso asignado a la zona.',
            'Si el predio está en suelo urbano, de expansión o rural, porque las reglas cambian.',
            'Si sobre el predio hay afectaciones: ronda hídrica, amenaza, retiros de infraestructura.',
          ],
        },
        a2: [
          'Esa revisión se hace con la nomenclatura o la cédula catastral del predio y no toma mucho tiempo. Es lo primero que conviene hacer, antes de contratar topografía o de firmar una promesa de venta.',
        ],
        links: [SERVICIO_DESENGLOBE, USO_DEL_SUELO],
      },
      {
        id: 'puedo-dividir-un-terreno-en-tres-partes',
        q: '¿Puedo dividir un terreno en tres partes?',
        a: [
          'Las reglas son las mismas que para dividir en dos, pero el margen se estrecha: cada uno de los tres lotes tiene que cumplir por su cuenta el área mínima, el frente mínimo y el acceso a vía pública.',
          'Hay además un umbral que sorprende a mucha gente. Cuando la división exige abrir vías internas, ceder áreas para espacio público o dotar de redes de servicios a los nuevos lotes, el proyecto deja de ser una subdivisión simple y pasa a tratarse como una urbanización o una parcelación, con un trámite bastante más exigente.',
          'Por eso la pregunta útil no es "¿puedo dividir en tres?" sino "¿qué figura corresponde a la división que quiero hacer?". Eso se resuelve revisando el predio contra la norma antes de invertir en planos.',
        ],
        links: [SERVICIO_DESENGLOBE, USO_DEL_SUELO],
      },
      {
        id: 'area-minima-para-subdividir-un-lote',
        q: '¿Cuál es el área mínima para subdividir un lote?',
        a: [
          'No existe un número único que sirva para toda Cúcuta. El área mínima de lote la fija el Plan de Ordenamiento Territorial y cambia según la zona, el tratamiento urbanístico y el uso asignado al sector.',
          'Dos predios ubicados a pocas cuadras pueden tener exigencias distintas si pertenecen a zonas normativas diferentes. Por eso una cifra que alguien escuchó de un vecino no sirve como referencia para un trámite.',
          'En suelo rural la lógica es otra: además de la norma municipal hay restricciones de orden nacional para la división de predios rurales, entre ellas la extensión mínima asociada a la Unidad Agrícola Familiar. Un lote rural que en área parece dividirse sin problema puede no poder dividirse legalmente.',
          'La forma de saberlo es consultar la norma específica del predio, con la nomenclatura o la cédula catastral en la mano.',
        ],
        links: [SERVICIO_DESENGLOBE, ALCALDIA_USO_SUELO],
      },
      {
        id: 'necesito-licencia-para-dividir-un-lote',
        q: '¿Necesito licencia para dividir un lote?',
        a: [
          'Sí. Dividir un predio requiere licencia de subdivisión, expedida por un curador urbano o por la autoridad municipal competente según el caso. Es un trámite independiente de la licencia de construcción, aunque a veces se gestionen en paralelo.',
          'La norma nacional contempla algunos supuestos en los que la división material de un predio no requiere esa licencia, como cuando la ordena una sentencia judicial en firme o cuando responde a la adquisición de inmuebles por parte de entidades públicas. Son excepciones puntuales, no la regla general.',
          'Si lo que quieres es vender una parte del lote, hipotecarla por separado o dejarle un pedazo a cada hijo, necesitas que existan matrículas inmobiliarias independientes, y para llegar ahí hay que pasar por la licencia.',
        ],
        links: [SERVICIO_DESENGLOBE, DECRETO_1077],
      },
      {
        id: 'necesito-arquitecto-para-un-desenglobe',
        q: '¿Necesito arquitecto para hacer un desenglobe?',
        a: [
          'Sí, necesitas un profesional con matrícula. Los planos de subdivisión que se radican ante la curaduría deben ir firmados por un profesional competente —arquitecto o ingeniero, según el caso—, porque el trámite es técnico y no meramente documental.',
          'Pero el valor de tener un profesional desde el principio no está en la firma. Está en el estudio previo: confirmar si la división que tienes en mente cumple área mínima, frente, acceso y uso antes de que gastes en topografía, expensas y notaría.',
          'La mayoría de subdivisiones que se caen no se caen por un plano mal dibujado. Se caen porque nadie revisó la norma antes de dibujar.',
        ],
        links: [SERVICIO_DESENGLOBE],
      },
      {
        id: 'documentos-para-subdividir-un-predio',
        q: '¿Qué documentos necesito para subdividir un predio?',
        a: [
          'La documentación se arma en dos bloques: la que acredita el predio y la que describe la división propuesta.',
        ],
        list: {
          title: 'Del predio',
          items: [
            'Certificado de tradición y libertad reciente.',
            'Escritura pública del inmueble.',
            'Documento de identidad del propietario, y poder si actúa un tercero.',
            'Paz y salvo del impuesto predial.',
          ],
        },
        a2: [
          'Del proyecto de división: el levantamiento topográfico con áreas y linderos reales, el plano de subdivisión propuesto firmado por profesional competente y el Formulario Único Nacional diligenciado. Según el predio, la curaduría puede pedir documentos adicionales, por ejemplo cuando hay servidumbres, afectaciones viales o condiciones ambientales.',
          'Si el predio proviene de una sucesión, tiene varios propietarios o arrastra diferencias entre el área escriturada y el área real, eso se resuelve antes de radicar. Es el tipo de detalle que detiene un trámite durante meses.',
        ],
        links: [SERVICIO_DESENGLOBE],
      },
    ],
  },
  {
    id: 'legalizacion-y-reconocimiento',
    title: 'Legalización y reconocimiento de construcciones',
    intro:
      'Qué hacer cuando la casa ya está construida y nunca tuvo licencia: cómo funciona el reconocimiento de edificaciones y qué se necesita para regularizar.',
    service: SERVICIO_RECONOCIMIENTO,
    questions: [
      {
        id: 'como-legalizar-una-casa-construida-sin-licencia',
        q: '¿Cómo legalizar una casa construida sin licencia?',
        a: [
          'El camino se llama reconocimiento de la existencia de la edificación. Es un trámite ante curaduría urbana en el que la autoridad declara formalmente que una construcción levantada sin licencia existe, tras verificar que cumple el uso previsto por la norma urbanística vigente y que lleva construida el tiempo mínimo que exige la reglamentación.',
          'El expediente se arma con el levantamiento arquitectónico de lo realmente construido, un peritaje técnico sobre el estado de la edificación firmado por ingeniero civil, la documentación del predio y la prueba de la fecha en que terminó la construcción.',
          'Si el peritaje concluye que la edificación no cumple las condiciones de sismorresistencia aplicables, el acto de reconocimiento puede imponer obras de reforzamiento estructural. No es un obstáculo del trámite: es la razón de fondo por la que existe.',
          'No todas las construcciones se pueden reconocer. Si la edificación ocupa una zona de protección, una ronda hídrica, un área de amenaza o desarrolla un uso que la norma no permite en esa zona, el reconocimiento no procede y hay que evaluar alternativas.',
        ],
        links: [SERVICIO_RECONOCIMIENTO, DECRETO_1077],
      },
      {
        id: 'como-legalizar-una-construccion-antigua',
        q: '¿Cómo legalizar una construcción antigua?',
        a: [
          'Por la misma vía: el reconocimiento de edificaciones. La antigüedad, lejos de ser un problema, suele ser justamente lo que permite el trámite, porque la norma exige que la construcción esté terminada desde hace un tiempo mínimo antes de solicitarlo.',
          'La dificultad real en construcciones antiguas es probatoria y técnica. Hay que demostrar desde cuándo existe la edificación —recibos de servicios públicos, información catastral, aerofotografías, registros históricos— y hay que evaluar una estructura de la que casi nunca existen planos ni memorias de cálculo.',
          'Por eso el peritaje estructural pesa más que en cualquier otro trámite: un ingeniero tiene que valorar lo que hay, a veces con ensayos, y decir si cumple, si necesita reforzamiento o si no es viable. Ese diagnóstico conviene tenerlo antes de radicar.',
        ],
        links: [SERVICIO_RECONOCIMIENTO],
      },
      {
        id: 'que-es-el-reconocimiento-de-una-edificacion',
        q: '¿Qué es el reconocimiento de una edificación?',
        a: [
          'Es el acto administrativo mediante el cual el curador urbano —o la autoridad municipal competente— declara la existencia de una construcción que se ejecutó sin licencia. En la práctica, es el equivalente a la licencia para algo que ya está construido.',
          'Para que proceda, la norma exige que la edificación cumpla el uso previsto por las normas urbanísticas vigentes y que esté terminada desde un tiempo mínimo antes de la solicitud. El acto que lo otorga también fija, cuando corresponde, las obras de adecuación o reforzamiento estructural necesarias para cumplir la normativa de sismorresistencia.',
          'Es importante no confundirlo con la legalización urbanística de barrios o asentamientos, que es otra figura distinta, de escala urbana, que adelanta el municipio sobre desarrollos completos y no sobre una casa en particular.',
        ],
        links: [SERVICIO_RECONOCIMIENTO, DECRETO_1077],
      },
      {
        id: 'legalizar-una-casa-construida-hace-varios-anos',
        q: '¿Puedo legalizar una casa construida hace varios años?',
        a: [
          'Sí, y ese es precisamente el supuesto que contempla la figura: el reconocimiento está pensado para construcciones terminadas hace tiempo, no para obras recién hechas o en curso.',
          'Lo que hay que demostrar es la fecha de terminación. Sirven como prueba los recibos antiguos de servicios públicos, la información catastral del predio, las aerofotografías del sector y otros documentos que permitan fechar la construcción. Entre más ordenado esté ese respaldo, más fluido es el trámite.',
          'Lo que no depende de la antigüedad es el cumplimiento del uso: si hoy la norma no permite ese uso en esa zona, el hecho de que la casa lleve veinte años ahí no basta por sí solo. Esa es la primera verificación que conviene hacer.',
        ],
        links: [SERVICIO_RECONOCIMIENTO, USO_DEL_SUELO],
      },
      {
        id: 'cuanto-cuesta-legalizar-una-construccion',
        q: '¿Cuánto cuesta legalizar una construcción?',
        a: [
          'El costo tiene tres componentes, y el tercero es el que puede cambiar el orden de magnitud de todo el proceso.',
        ],
        list: {
          title: 'De qué depende',
          items: [
            'Expensas de la curaduría por el trámite de reconocimiento, calculadas según la norma nacional a partir del área y las condiciones del inmueble.',
            'Honorarios técnicos: levantamiento arquitectónico de lo construido, peritaje estructural y gestión del trámite.',
            'Obras de reforzamiento estructural, si el peritaje concluye que la edificación las necesita. Ese rubro puede ser el más alto de todos y no se conoce hasta tener el diagnóstico.',
          ],
        },
        a2: [
          'Por eso lo sensato es empezar por una evaluación preliminar: revisar la norma del predio y el estado de la construcción antes de comprometerse con el trámite completo. Sirve para saber si el reconocimiento procede y con qué exigencias.',
        ],
        links: [SERVICIO_RECONOCIMIENTO],
      },
      {
        id: 'requisitos-para-legalizar-una-casa',
        q: '¿Qué requisitos necesito para legalizar una casa?',
        a: [
          'El expediente de reconocimiento combina documentos del predio con documentos técnicos sobre lo construido.',
        ],
        list: {
          title: 'Lo que normalmente se necesita',
          items: [
            'Certificado de tradición y libertad y escritura pública del inmueble.',
            'Documento de identidad del propietario y poder si aplica.',
            'Formulario Único Nacional diligenciado.',
            'Levantamiento arquitectónico de la edificación tal como está construida, firmado por arquitecto.',
            'Peritaje técnico sobre el estado de la edificación, firmado por ingeniero civil.',
            'Prueba de la fecha de terminación de la obra.',
            'Paz y salvo del impuesto predial.',
          ],
        },
        a2: [
          'La lista concreta depende del área y las condiciones de la edificación: una vivienda de un piso y un edificio de varios niveles no se evalúan igual. Conviene confirmar el alcance del peritaje antes de contratarlo.',
        ],
        links: [SERVICIO_RECONOCIMIENTO],
      },
      {
        id: 'puedo-vender-una-casa-que-no-tiene-licencia',
        q: '¿Puedo vender una casa que no tiene licencia?',
        a: [
          'Se puede vender el inmueble, porque lo que se transfiere es el derecho de propiedad sobre el predio. El problema es otro: si la construcción nunca se incorporó jurídicamente, el folio de matrícula y la escritura no reflejan lo que realmente hay.',
          'Eso tiene efectos muy concretos. El comprador que necesite crédito hipotecario se encuentra con que el banco avalúa y financia lo que figura registrado, no lo que ve en la visita. El precio termina negociándose a la baja. Y cualquier comprador informado pedirá un descuento por el riesgo de una construcción no regularizada.',
          'Si la venta está prevista, adelantar el reconocimiento antes de salir al mercado suele recuperar con creces lo que cuesta el trámite.',
        ],
        links: [SERVICIO_RECONOCIMIENTO],
      },
      {
        id: 'escriturar-una-construccion-no-legalizada',
        q: '¿Puedo escriturar una construcción que no está legalizada?',
        a: [
          'Hay que separar dos cosas. Escriturar el predio y transferir la propiedad es una operación que se puede hacer. Otra cosa es incorporar la construcción al folio: declarar que sobre ese lote existe una edificación, con su área y sus características.',
          'Para esa declaración de construcción o de mejora normalmente se exige el soporte urbanístico correspondiente: la licencia de construcción o, cuando la obra se hizo sin ella, el acto de reconocimiento. Sin ese respaldo, la construcción no queda reflejada en el registro.',
          'El efecto se ve después: el inmueble figura como lote o con un área construida menor a la real, y eso afecta su valor, su asegurabilidad y las posibilidades de financiación. Antes de firmar promesa de compraventa vale la pena revisar el certificado de tradición y compararlo con lo que hay en el sitio.',
        ],
        links: [SERVICIO_RECONOCIMIENTO],
      },
      {
        id: 'como-saber-si-una-construccion-esta-legalizada',
        q: '¿Cómo saber si una construcción está legalizada?',
        a: [
          'Hay tres verificaciones que, juntas, dan una respuesta confiable.',
        ],
        list: {
          title: 'Cómo comprobarlo',
          items: [
            'Revisar el certificado de tradición y libertad: si la construcción fue incorporada, suele haber anotaciones de declaración de construcción, licencia o reconocimiento.',
            'Consultar en las curadurías urbanas de Cúcuta si existe licencia o acto de reconocimiento para ese predio.',
            'Comparar el área construida que registra la información catastral con el área que realmente existe en el sitio. Una diferencia grande es la señal más frecuente de construcción no regularizada.',
          ],
        },
        a2: [
          'Si vas a comprar, esta revisión se hace antes de firmar la promesa, no después. Es rápida y evita heredar un problema que después cuesta mucho más resolver.',
        ],
        links: [SERVICIO_RECONOCIMIENTO, CURADURIA_1, CURADURIA_2],
      },
      {
        id: 'legalizar-segundo-piso-sin-licencia',
        q: '¿Puedo legalizar un segundo piso construido sin licencia?',
        a: [
          'Sí, por la vía del reconocimiento, siempre que se cumplan dos condiciones que hay que verificar en ese orden.',
          'La primera es normativa: que la norma urbanística del predio permita esa altura en esa zona, con los aislamientos y demás exigencias aplicables. Si la zona admite solo un nivel, el segundo piso no se puede reconocer tal como está.',
          'La segunda es estructural: un ingeniero civil debe evaluar si la cimentación y la estructura soportan lo construido conforme a la normativa de sismorresistencia. En segundos pisos levantados sin diseño estructural previo es frecuente que se requiera reforzamiento, y el acto de reconocimiento lo exigirá.',
          'Empezar por la verificación normativa evita pagar un peritaje para una construcción que, por norma, no era reconocible.',
        ],
        links: [SERVICIO_RECONOCIMIENTO, USO_DEL_SUELO],
      },
    ],
  },
  {
    id: 'uso-del-suelo-y-normativa',
    title: 'Uso del suelo y normativa urbanística',
    intro:
      'Qué permite el POT en tu predio: uso, altura, cuánto se puede ocupar y cuánto se puede construir. Es la pregunta que debería ir antes de cualquier diseño.',
    service: USO_DEL_SUELO,
    questions: [
      {
        id: 'como-saber-el-uso-del-suelo-de-un-predio-en-cucuta',
        q: '¿Cómo saber el uso del suelo de un predio en Cúcuta?',
        a: [
          'Hay tres niveles de consulta, de menos a más formal, y conviene saber cuál necesitas.',
        ],
        list: {
          title: 'Las tres vías',
          items: [
            'La consulta de uso de suelos que ofrece la Alcaldía de Cúcuta, útil como orientación inicial sobre la zona en la que está el predio.',
            'El certificado de uso de suelos que expide la Secretaría de Planeación Municipal, que es el documento formal cuando se necesita acreditar el uso ante un tercero, por ejemplo para una matrícula de comercio.',
            'El concepto de norma urbanística ante una curaduría urbana, que es el que sirve como base técnica para diseñar y para tramitar una licencia.',
          ],
        },
        a2: [
          'Para cualquiera de los tres hace falta identificar bien el predio: nomenclatura, cédula catastral o número de matrícula inmobiliaria. Con eso, la revisión de la norma aplicable es un trabajo concreto y acotado.',
        ],
        links: [ALCALDIA_USO_SUELO, USO_DEL_SUELO],
      },
      {
        id: 'que-uso-del-suelo-tiene-mi-lote',
        q: '¿Qué uso del suelo tiene mi lote?',
        a: [
          'El uso lo asigna el Plan de Ordenamiento Territorial según la zona en la que se encuentre el predio, y no se puede deducir mirando lo que hay alrededor. Que en la cuadra haya locales no significa que tu lote tenga uso comercial.',
          'El POT clasifica primero el suelo —urbano, de expansión urbana, rural, suburbano, de protección— y después asigna a cada zona un uso principal y unos usos complementarios, restringidos o prohibidos. Un mismo sector puede admitir vivienda y comercio de escala menor, pero no un uso industrial o una actividad de alto impacto.',
          'Para saber cuál te aplica hay que ubicar el predio en la cartografía del POT y contrastar con la ficha normativa de esa zona. Con la nomenclatura o la cédula catastral se puede hacer esa verificación de forma concreta.',
        ],
        links: [USO_DEL_SUELO, ALCALDIA_USO_SUELO],
      },
      {
        id: 'que-puedo-construir-en-mi-lote',
        q: '¿Qué puedo construir en mi lote?',
        a: [
          'La respuesta sale de cruzar varias variables que la norma define para la zona donde está tu predio. Ninguna se puede suponer.',
        ],
        list: {
          title: 'Lo que define lo que cabe en tu lote',
          items: [
            'El uso permitido: vivienda unifamiliar, bifamiliar, multifamiliar, comercio, servicios, uso mixto.',
            'El índice de ocupación: qué porcentaje del lote puede quedar cubierto en primer piso.',
            'El índice de construcción: cuántos metros cuadrados totales se pueden construir en relación con el área del lote.',
            'La altura máxima permitida, medida en pisos o en metros.',
            'Los aislamientos y retrocesos: cuánto hay que dejar libre contra linderos y contra la vía.',
            'Las exigencias de estacionamientos y, según el uso, de áreas comunes.',
            'Las afectaciones que pesen sobre el predio: rondas hídricas, amenaza, retiros de infraestructura, proyectos viales.',
          ],
        },
        a2: [
          'Ese conjunto de datos es el punto de partida de cualquier diseño serio. Diseñar antes de tenerlo es la causa más común de proyectos que hay que rehacer al llegar a la curaduría.',
        ],
        links: [USO_DEL_SUELO, SERVICIO_DISENO],
      },
      {
        id: 'cuantos-pisos-puedo-construir',
        q: '¿Cuántos pisos puedo construir en mi lote?',
        a: [
          'La altura máxima la fija la norma para la zona donde está el predio, y puede expresarse en número de pisos o en metros. No es una decisión del propietario ni del diseñador.',
          'Además del tope, hay condiciones que en la práctica reducen la altura aprovechable: los aislamientos posteriores y laterales que crecen con la altura, los retrocesos contra la vía, y en algunos casos la relación entre la altura permitida y el ancho de la vía a la que da el predio.',
          'También cuenta lo estructural. Si ya hay una construcción y se quiere crecer en altura, hay que verificar que la cimentación y la estructura existentes lo soporten, o prever el reforzamiento. Son dos preguntas distintas —lo que la norma permite y lo que la estructura aguanta— y las dos tienen que responderse antes de diseñar.',
        ],
        links: [USO_DEL_SUELO, SERVICIO_LICENCIAS],
      },
      {
        id: 'cuanto-puedo-construir-en-mi-terreno',
        q: '¿Cuánto puedo construir en mi terreno?',
        a: [
          'Lo definen dos índices que la norma asigna a cada zona, y conviene entender la diferencia porque se confunden con frecuencia.',
          'El índice de ocupación limita la huella: qué proporción del lote puede quedar cubierta por la construcción en primer piso. Si tu lote tiene 200 m² y el índice de ocupación es 0,7, la huella máxima sería de 140 m².',
          'El índice de construcción limita el total: cuántos metros cuadrados construidos se admiten en relación con el área del lote, sumando todos los niveles. Con un índice de construcción de 2,0 sobre ese mismo lote de 200 m², el total construible sería de 400 m².',
          'Sobre ese resultado todavía operan los aislamientos, la altura máxima y las exigencias de estacionamientos, que suelen recortar el área realmente aprovechable. Por eso el área construible real se calcula con la norma del predio en la mano, no con una regla general.',
        ],
        links: [USO_DEL_SUELO, SERVICIO_DISENO],
      },
      {
        id: 'que-es-el-pot-de-cucuta',
        q: '¿Qué es el POT de Cúcuta?',
        a: [
          'El Plan de Ordenamiento Territorial es el instrumento con el que un municipio ordena su territorio: clasifica el suelo, asigna usos, define alturas, índices y aislamientos, señala las zonas de protección y establece los tratamientos urbanísticos de cada sector. Su marco general es la Ley 388 de 1997.',
          'En San José de Cúcuta el POT fue adoptado mediante el Acuerdo 083 de 2001 y ha tenido ajustes posteriores. El municipio ha adelantado procesos de revisión de ese plan, de modo que antes de tomar decisiones sobre un predio conviene verificar cuál es la versión vigente y qué normas complementarias aplican.',
          'En términos prácticos, el POT es la razón por la que dos lotes del mismo tamaño en barrios distintos admiten proyectos completamente diferentes. Es el primer documento que se consulta antes de comprar un lote, diseñar o invertir.',
        ],
        links: [USO_DEL_SUELO, ALCALDIA_USO_SUELO],
      },
      {
        id: 'que-norma-urbanistica-aplica-a-mi-predio',
        q: '¿Cómo saber qué norma urbanística aplica a mi predio?',
        a: [
          'El procedimiento tiene tres pasos: ubicar el predio en la cartografía del POT, identificar la zona y el tratamiento urbanístico que le corresponden, y leer la ficha normativa de esa zona, que es donde están los usos, los índices, la altura y los aislamientos.',
          'La vía formal, cuando el objetivo es diseñar y tramitar una licencia, es solicitar el concepto de norma urbanística ante una curaduría urbana de Cúcuta. Ese documento es el que sirve de base técnica y el que un proyecto debe cumplir.',
          'Hay un matiz que conviene tener presente: la norma cambia. Un concepto de hace años puede no reflejar la reglamentación vigente. Si vas a tomar una decisión de inversión, verifica la vigencia de la información con la que estás trabajando.',
        ],
        links: [USO_DEL_SUELO, CURADURIA_1, CURADURIA_2],
      },
      {
        id: 'puedo-construir-un-local-comercial-en-mi-lote',
        q: '¿Puedo construir un local comercial en mi lote?',
        a: [
          'Depende de si la zona admite uso comercial y de qué escala de comercio admite. La norma no distingue solo entre "comercio sí" y "comercio no": clasifica el comercio por escala e impacto, y una zona residencial puede permitir un comercio de barrio y prohibir uno de mayor magnitud.',
          'Además del uso hay condiciones que suelen decidir la viabilidad: exigencias de estacionamientos, área mínima, accesos, manejo de cargue y descargue, y en ciertas actividades requisitos ambientales o sanitarios específicos.',
          'Y hay dos trámites que no son el mismo. El uso del suelo dice si la actividad se puede desarrollar allí; la licencia de construcción autoriza la obra. Para abrir el establecimiento después hacen falta los requisitos propios de la actividad comercial.',
        ],
        links: [USO_DEL_SUELO, SERVICIO_LICENCIAS],
      },
      {
        id: 'puedo-convertir-una-vivienda-en-un-negocio',
        q: '¿Puedo convertir una vivienda en un negocio?',
        a: [
          'Es un cambio de uso, y requiere dos cosas: que la norma del predio permita esa actividad en esa zona, y una licencia de construcción en la modalidad que corresponda —normalmente adecuación o modificación— cuando la conversión implique obras.',
          'Lo primero es la consulta de uso del suelo. Si la zona no admite la actividad, el proyecto se detiene ahí y no hay obra que lo resuelva. Si la admite, se revisa la escala permitida y las condiciones asociadas.',
          'Después vienen las exigencias de la propia actividad: estacionamientos, accesibilidad, condiciones de seguridad y los permisos del negocio. Si el inmueble está sometido a propiedad horizontal, además hay que revisar el reglamento, que puede restringir usos distintos al residencial aunque la norma municipal los permita.',
        ],
        links: [USO_DEL_SUELO, SERVICIO_LICENCIAS],
      },
      {
        id: 'puedo-construir-apartamentos-en-mi-lote',
        q: '¿Cómo saber si puedo construir apartamentos en mi lote?',
        a: [
          'Hay que verificar, en este orden, si la norma del predio admite vivienda multifamiliar y con qué condiciones.',
        ],
        list: {
          title: 'Lo que hay que revisar',
          items: [
            'Que el uso residencial multifamiliar esté permitido en esa zona.',
            'La altura máxima y el índice de construcción, que determinan cuántas unidades caben.',
            'El área mínima de lote y el frente exigido para ese tipo de desarrollo.',
            'La exigencia de estacionamientos por unidad de vivienda y de visitantes.',
            'Las áreas comunes, aislamientos y condiciones de iluminación y ventilación de cada unidad.',
            'La capacidad de las redes de servicios públicos del sector.',
          ],
        },
        a2: [
          'Si el proyecto va a venderse por unidades, además hay que prever el sometimiento a propiedad horizontal, que es un trámite propio con su reglamento y su registro. Un estudio previo de viabilidad responde cuántas unidades son realmente construibles antes de invertir en diseño.',
        ],
        links: [USO_DEL_SUELO, SERVICIO_DISENO],
      },
    ],
  },
  {
    id: 'diseno-y-construccion',
    title: 'Diseño arquitectónico y construcción',
    intro:
      'Qué incluye un diseño arquitectónico, qué planos hacen falta para construir y de qué depende lo que cuesta diseñar y construir en Cúcuta.',
    service: SERVICIO_DISENO,
    questions: [
      {
        id: 'cuanto-cuesta-disenar-una-casa-en-cucuta',
        q: '¿Cuánto cuesta diseñar una casa en Cúcuta?',
        a: [
          'El diseño de una vivienda en Cúcuta no tiene una tarifa de lista, porque lo que se contrata bajo la palabra "diseño" varía enormemente de una propuesta a otra.',
        ],
        list: {
          title: 'Lo que hace variar el valor',
          items: [
            'El área y el número de niveles del proyecto.',
            'El alcance: solo el diseño arquitectónico, o el paquete técnico completo con estructural, hidrosanitario y eléctrico.',
            'La complejidad del lote: topografía, forma irregular, condiciones de la norma.',
            'Si hay una construcción existente que condiciona el proyecto.',
            'Si se incluyen renders y recorrido 3D.',
            'Si se incluye la gestión de la licencia de construcción.',
          ],
        },
        a2: [
          'Al comparar dos propuestas, lo determinante no es el número sino qué entregables incluye cada una. Una propuesta más económica que no incluye el proyecto estructural no es más económica: es otro alcance. Con el área aproximada, el número de niveles y la ubicación del lote se puede preparar una propuesta concreta.',
        ],
        links: [SERVICIO_DISENO],
      },
      {
        id: 'cuanto-cobra-un-arquitecto-por-disenar-una-casa',
        q: '¿Cuánto cobra un arquitecto por diseñar una casa?',
        a: [
          'En Colombia se usan tres formas de cobrar el diseño arquitectónico, y cada una se ajusta mejor a un tipo de proyecto.',
        ],
        list: {
          title: 'Las tres modalidades habituales',
          items: [
            'Por metro cuadrado de área a diseñar: la más común en vivienda, porque es fácil de entender y de comparar.',
            'Como porcentaje del valor estimado de la obra: habitual en proyectos de mayor escala.',
            'Suma fija por un alcance definido: útil cuando los entregables están muy delimitados desde el principio.',
          ],
        },
        a2: [
          'Cualquiera de las tres es válida. Lo que importa es que el contrato diga con claridad qué entregables incluye, cuántas rondas de ajuste están contempladas, en qué formatos se entrega y si la gestión de la licencia va incluida o se cotiza aparte. Ahí es donde aparecen después las diferencias de expectativas.',
        ],
        links: [SERVICIO_DISENO],
      },
      {
        id: 'cuanto-cuesta-hacer-los-planos-de-una-casa',
        q: '¿Cuánto cuesta hacer los planos de una casa?',
        a: [
          'Depende de qué juego de planos necesites, y ahí hay una diferencia grande que conviene aclarar antes de pedir una cotización.',
          'Un juego arquitectónico básico —plantas, cortes, fachadas, localización— sirve para entender el proyecto y para orientar una obra sencilla. Un paquete completo para radicar licencia incluye además el proyecto estructural con memorias de cálculo, el estudio de suelos y los diseños hidrosanitarios y eléctricos, cada uno firmado por el profesional competente.',
          'El segundo cuesta bastante más que el primero, porque involucra a varios profesionales y una coordinación entre disciplinas. Pedir "los planos" sin especificar cuál de los dos lleva a comparar cotizaciones que no son comparables.',
          'Si el objetivo es construir con licencia, el paquete completo no es opcional: es lo que exige el trámite.',
        ],
        links: [SERVICIO_DISENO, SERVICIO_LICENCIAS],
      },
      {
        id: 'quien-hace-planos-arquitectonicos-en-cucuta',
        q: '¿Quién hace planos arquitectónicos en Cúcuta?',
        a: [
          'Los planos arquitectónicos que se radican ante una curaduría deben estar firmados por un arquitecto con matrícula profesional vigente. Los planos y memorias estructurales los firma un ingeniero civil, también con matrícula vigente. No es un formalismo: sin esas firmas el expediente no se puede radicar.',
          'CYMARQ elabora planos arquitectónicos para vivienda, proyectos comerciales y edificaciones de uso mixto en Cúcuta y Norte de Santander, y coordina los estudios técnicos que exige cada proyecto para dejar el paquete listo para licencia.',
          'Si vas a contratar a alguien, verifica la matrícula profesional y pide ver proyectos anteriores. Un plano bonito que no cumple la norma del predio no sirve para tramitar nada.',
        ],
        links: [SERVICIO_DISENO, SERVICIO_LICENCIAS],
      },
      {
        id: 'que-incluye-un-diseno-arquitectonico',
        q: '¿Qué incluye un diseño arquitectónico?',
        a: [
          'Un proceso de diseño completo recorre cuatro etapas, aunque no todos los contratos las incluyan todas.',
        ],
        list: {
          title: 'Las etapas del diseño',
          items: [
            'Programa arquitectónico: definir con el cliente qué espacios necesita, cómo se relacionan y qué prioridades tiene, cruzado con lo que permite la norma del predio.',
            'Anteproyecto: las primeras propuestas de distribución, volumen y fachada, para tomar decisiones antes de entrar en detalle.',
            'Proyecto arquitectónico: el desarrollo definitivo, con plantas, cortes, fachadas, cubiertas y detalles constructivos.',
            'Coordinación técnica: ajustar el proyecto con los diseños estructural, hidrosanitario y eléctrico para que todo encaje antes de construir.',
          ],
        },
        a2: [
          'A eso pueden sumarse la visualización 3D y los renders, que permiten recorrer los espacios antes de construirlos, y la preparación del expediente para la licencia. Lo importante es que el contrato diga cuáles de estas etapas están incluidas.',
        ],
        links: [SERVICIO_DISENO],
      },
      {
        id: 'que-planos-necesito-para-construir-una-casa',
        q: '¿Qué planos necesito para construir una casa?',
        a: [
          'Para construir con licencia hace falta un conjunto de documentos técnicos, no solo los planos arquitectónicos.',
        ],
        list: {
          title: 'El paquete técnico',
          items: [
            'Planos arquitectónicos: plantas, cortes, fachadas, localización y detalles, firmados por arquitecto.',
            'Proyecto estructural con memorias de cálculo, firmado por ingeniero civil y conforme a la NSR-10.',
            'Estudio geotécnico o de suelos, según la magnitud del proyecto.',
            'Diseño hidrosanitario: acueducto, alcantarillado y aguas lluvias.',
            'Diseño eléctrico conforme a la reglamentación técnica aplicable.',
            'Diseño de gas, cuando el proyecto lo contemple.',
          ],
        },
        a2: [
          'El alcance exacto depende del tamaño y el uso del proyecto. Lo que no cambia es que estos diseños deben estar coordinados entre sí: la mayoría de los sobrecostos en obra nacen de planos que no conversaron entre ellos.',
        ],
        links: [SERVICIO_DISENO, SERVICIO_LICENCIAS],
      },
      {
        id: 'cuanto-cuesta-construir-una-casa-en-cucuta',
        q: '¿Cuánto cuesta construir una casa en Cúcuta?',
        a: [
          'No publicamos una cifra porque cualquier número dado sin ver el proyecto resulta engañoso: en Cúcuta, el mismo metro cuadrado puede costar muy distinto según decisiones que se toman en el diseño.',
        ],
        list: {
          title: 'Lo que más mueve el costo',
          items: [
            'El nivel de acabados, que es la variable con mayor rango de todas.',
            'El sistema constructivo elegido.',
            'La topografía del lote y el tipo de cimentación que exija el estudio de suelos.',
            'El número de niveles y la complejidad de la estructura.',
            'Las instalaciones: aire acondicionado, redes especiales, piscina, ascensor.',
            'El precio de materiales y mano de obra en el momento de ejecutar.',
          ],
        },
        a2: [
          'La forma seria de responder esta pregunta es un presupuesto detallado a partir de un proyecto definido: cantidades de obra, precios unitarios y análisis por capítulos. Ese documento sirve para decidir, para financiar y para controlar la obra mientras avanza.',
        ],
        links: [SERVICIO_CONSTRUCCION],
      },
      {
        id: 'cuanto-cuesta-construir-una-casa-por-metro-cuadrado',
        q: '¿Cuánto cuesta construir una casa por metro cuadrado?',
        a: [
          'El valor por metro cuadrado es una referencia útil para comparar proyectos, pero solo tiene sentido cuando se dice a qué nivel de acabados corresponde. Entre una vivienda de acabados básicos y una de acabados altos el rango se amplía muchísimo, y los dos números serían igual de "verdaderos".',
          'Hay además costos que el valor por metro cuadrado suele esconder: la cimentación cuando el suelo es malo, los movimientos de tierra en lotes con pendiente, las redes externas, los diseños y los trámites. Comparar por metro cuadrado dos propuestas que incluyen cosas distintas lleva a elegir mal.',
          'Por eso preferimos entregar un presupuesto por capítulos sobre un proyecto definido. Se puede comparar, se puede ajustar y no sorprende a mitad de obra.',
        ],
        links: [SERVICIO_CONSTRUCCION],
      },
      {
        id: 'cuanto-cuesta-remodelar-una-casa',
        q: '¿Cuánto cuesta remodelar una casa?',
        a: [
          'Una remodelación es más difícil de presupuestar que una obra nueva, porque parte de algo que ya existe y que casi nunca está documentado.',
        ],
        list: {
          title: 'De qué depende',
          items: [
            'El alcance: si es solo cambio de acabados o si se modifica la distribución.',
            'Si hay que intervenir muros estructurales, lo que exige revisión y diseño estructural.',
            'El estado de las redes hidrosanitarias y eléctricas existentes, que muchas veces hay que renovar por completo.',
            'Las demoliciones, el retiro de escombros y la protección de lo que se conserva.',
            'Si la obra requiere licencia y, por tanto, diseño y trámite previos.',
          ],
        },
        a2: [
          'La recomendación práctica es empezar por un levantamiento de lo existente y un diagnóstico antes de definir el alcance. En remodelaciones, lo que aparece al abrir un muro es la principal fuente de sobrecostos, y un buen diagnóstico previo reduce bastante esa incertidumbre.',
        ],
        links: [SERVICIO_CONSTRUCCION],
      },
      {
        id: 'como-contratar-un-arquitecto-en-cucuta',
        q: '¿Cómo contratar un arquitecto en Cúcuta?',
        a: [
          'Antes de contratar a un arquitecto en Cúcuta hay cinco cosas que conviene verificar, y ninguna requiere conocimientos técnicos.',
        ],
        list: {
          title: 'Antes de contratar',
          items: [
            'Matrícula profesional vigente del arquitecto y de los demás profesionales que firmarán los diseños.',
            'Portafolio de proyectos propios: no renders sueltos, sino proyectos con su contexto y su historia.',
            'Un alcance escrito: qué entregables, en qué formatos y en qué plazos.',
            'Cuántas rondas de ajustes están incluidas y qué pasa si se piden más.',
            'Si la gestión de la licencia y los estudios técnicos están incluidos o se cotizan aparte.',
          ],
        },
        a2: [
          'Y una recomendación de fondo: la primera conversación debería servir para que el arquitecto entienda cómo vives, no para que te muestre un catálogo de casas. Si la propuesta llega antes que las preguntas, es mala señal.',
        ],
        links: [SERVICIO_DISENO, SERVICIO_CONSTRUCCION],
      },
    ],
  },
];

/** Todas las preguntas en una sola lista, para el JSON-LD y para buscar por id. */
export const faqAll = faqCategories.flatMap((c) =>
  c.questions.map((q) => ({ ...q, category: c.id, categoryTitle: c.title })),
);

/**
 * Versión en texto llano de una respuesta, para `FAQPage`.
 * Recoge exactamente lo que se ve en pantalla: párrafos, lista y cierre.
 */
export function faqPlainAnswer(item) {
  const parts = [...(item.a || [])];
  if (item.list) {
    // El rótulo de la lista se ve en pantalla, así que también va en el
    // dato estructurado: lo que se marca debe ser lo que se lee.
    if (item.list.title) parts.push(`${item.list.title}:`);
    parts.push(item.list.items.join(' '));
  }
  if (item.a2) parts.push(...item.a2);
  return parts.join(' ');
}

export function faqById(id) {
  return faqAll.find((q) => q.id === id);
}

/** Preguntas que se enlazan desde una página de servicio. */
export function faqLinksFor(ids) {
  return ids.map((id) => faqById(id)).filter(Boolean);
}
