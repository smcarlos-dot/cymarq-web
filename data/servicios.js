/**
 * Contenido de las páginas de servicio.
 *
 * Son cinco páginas, no cincuenta: cada una responde a una intención de
 * búsqueda distinta y tiene contenido propio. No hay páginas por barrio ni
 * variantes de la misma página cambiando una palabra.
 *
 * Cada servicio declara:
 *   respuesta  — el bloque de arriba, autocontenido: responde la pregunta
 *                principal en tres o cuatro frases, sin que haga falta leer
 *                el resto de la página
 *   secciones  — el desarrollo, con anclas propias
 *   proceso    — cómo trabaja CYMARQ ese servicio
 *   incluye    — entregables concretos
 *   faq        — ids de /preguntas-frecuentes/ que se enlazan desde aquí
 *   related    — otras páginas del sitio, para que no haya callejones
 *   schema     — datos para el nodo `Service` de Schema.org
 */

export const servicios = [
  {
    slug: 'licencias-de-construccion',
    nav: 'Licencias de construcción',
    orden: 1,
    title: 'Licencia de construcción en Cúcuta | Trámite ante curaduría — CYMARQ',
    description:
      'Tramitamos licencias de construcción en Cúcuta ante curaduría urbana: obra nueva, ampliación, modificación y demolición. Estudio previo de norma y uso del suelo del predio.',
    h1: 'Licencias de construcción en Cúcuta',
    lead: 'Preparamos el proyecto, reunimos los estudios técnicos y radicamos la licencia ante la curaduría urbana. Empezando por lo que casi nadie revisa a tiempo: qué permite la norma en tu predio.',
    cover: '/photos/servicios/planos-arquitectonicos-licencia.webp',
    coverSize: { width: 1600, height: 900 },
    coverAlt:
      'Planos arquitectónicos desplegados sobre una mesa de dibujo, con escalímetro y compás',
    respuesta: {
      title: 'En resumen',
      text: 'CYMARQ tramita licencias de construcción en Cúcuta y Norte de Santander ante las curadurías urbanas del municipio. El servicio cubre las modalidades de obra nueva, ampliación, adecuación, modificación, reforzamiento estructural, demolición y cerramiento, e incluye el estudio previo de la norma urbanística del predio, el proyecto arquitectónico, la coordinación de los estudios técnicos que exija el caso y el acompañamiento del trámite hasta que la licencia quede en firme. El costo se compone de dos partes separadas: las expensas de la curaduría, que fija la norma nacional, y los honorarios del equipo técnico.',
    },
    secciones: [
      {
        id: 'cuando-se-necesita',
        title: 'Qué obras necesitan licencia',
        body: [
          'En Colombia, toda obra que cree, amplíe, adecúe, modifique, refuerce, demuela o cierre una edificación requiere una licencia urbanística expedida antes de empezar. En Cúcuta la expiden los curadores urbanos, que son particulares con función pública y a quienes corresponde verificar que el proyecto cumpla las normas urbanísticas y de construcción.',
          'Quedan fuera los trabajos de mantenimiento y acabados que no alteran la estructura, no suman área y no cambian el uso. Todo lo demás tiene una modalidad de licencia asociada, y acertar con la modalidad desde el principio es la mitad del trabajo.',
        ],
        list: {
          title: 'Modalidades que tramitamos',
          items: [
            'Obra nueva: construir en un lote sin edificación, o en uno donde se demolió lo existente.',
            'Ampliación: sumar área construida a una edificación existente, como un segundo piso o una habitación nueva.',
            'Adecuación y modificación: cambiar la distribución, intervenir muros estructurales o cambiar el uso del inmueble.',
            'Reforzamiento estructural: intervenir la estructura para cumplir la normativa de sismorresistencia.',
            'Demolición, total o parcial.',
            'Cerramiento de un predio no construido.',
            'Restauración, en inmuebles con valor patrimonial.',
          ],
        },
      },
      {
        id: 'uso-del-suelo',
        title: 'Antes de la licencia: la norma y el uso del suelo',
        body: [
          'La pregunta que decide un proyecto no es cuánto cuesta la licencia. Es qué permite la norma en ese predio concreto. El Plan de Ordenamiento Territorial asigna a cada zona un uso, una altura máxima, unos índices de ocupación y construcción, unos aislamientos y unas exigencias de estacionamientos. Dos lotes del mismo tamaño en barrios distintos admiten proyectos completamente diferentes.',
          'Por eso el primer trabajo que hacemos no es dibujar: es revisar el predio contra la norma aplicable. Con la nomenclatura o la cédula catastral se puede establecer qué es viable antes de que inviertas en diseño, en topografía o —peor— en una promesa de compraventa.',
          'Ese estudio previo también sirve a quien está evaluando comprar un lote. Saber cuántos metros son realmente construibles y qué usos admite la zona cambia por completo el análisis de una inversión.',
        ],
        list: {
          title: 'Qué revisamos en el estudio de norma',
          items: [
            'Clasificación del suelo y tratamiento urbanístico de la zona.',
            'Usos permitidos, complementarios, restringidos y prohibidos.',
            'Índice de ocupación e índice de construcción.',
            'Altura máxima, aislamientos y retrocesos.',
            'Exigencias de estacionamientos y áreas libres.',
            'Afectaciones sobre el predio: rondas hídricas, amenaza, retiros viales o de infraestructura.',
          ],
        },
      },
      {
        id: 'requisitos',
        title: 'Qué se necesita para radicar',
        body: [
          'El expediente tiene dos mitades. Una la aporta el propietario y es documental: certificado de tradición y libertad reciente, escritura pública, documento de identidad, paz y salvo predial y el Formulario Único Nacional diligenciado.',
          'La otra la produce el equipo técnico: planos arquitectónicos firmados por arquitecto con matrícula, proyecto estructural y memorias de cálculo firmados por ingeniero civil conforme a la NSR-10, estudio de suelos según la magnitud del proyecto y los diseños hidrosanitarios y eléctricos cuando el caso lo requiera.',
          'La lista exacta depende de la modalidad y del tipo de proyecto. Un cerramiento y una obra nueva de tres niveles no piden lo mismo, y confirmar la modalidad antes de reunir papeles evita trabajo perdido.',
        ],
      },
      {
        id: 'costos-y-tiempos',
        title: 'Qué determina el costo y el tiempo',
        body: [
          'El costo de una licencia son dos cosas distintas que conviene no mezclar. Las expensas de la curaduría son un valor reglado por la norma nacional: se calculan con una fórmula que depende del área a intervenir, el uso, el estrato del predio y el presupuesto estimado de la obra. No las fija el curador a su criterio ni las cobra el arquitecto. Los honorarios profesionales son la otra parte y dependen del alcance que se contrate.',
          'Con los tiempos pasa algo parecido: hay un tiempo de preparación del proyecto y un tiempo de revisión en la curaduría. La norma fija plazos para el segundo, pero el reloj se reinicia cada vez que hay observaciones que corregir. Un expediente bien armado no acorta el plazo legal; evita las vueltas.',
          'No publicamos cifras porque una cifra dada sin ver el predio ni el alcance no sirve para presupuestar. Con la nomenclatura del predio, el área que quieres construir y el uso previsto, podemos estimar cada rubro con un orden de magnitud real.',
        ],
      },
      {
        id: 'sin-licencia',
        title: 'Si la obra ya se hizo sin licencia',
        body: [
          'Construir sin licencia es una infracción urbanística: puede derivar en multas y, cuando lo construido no se ajusta a la norma, en orden de demolición. En la práctica, el golpe más frecuente llega después, cuando la construcción no puede incorporarse a la escritura ni al folio de matrícula y eso bloquea una venta o un crédito hipotecario.',
          'Para ese caso existe una figura distinta a la licencia: el reconocimiento de la existencia de la edificación. Tiene sus propias condiciones y su propio trámite, y lo explicamos aparte.',
        ],
      },
    ],
    proceso: {
      title: 'Cómo lo trabajamos',
      steps: [
        {
          title: 'Estudio de norma',
          text: 'Revisamos el predio contra la norma urbanística aplicable y te decimos qué es viable antes de diseñar nada.',
        },
        {
          title: 'Proyecto y estudios técnicos',
          text: 'Desarrollamos el proyecto arquitectónico y coordinamos los estudios que exija el caso, para que los diseños lleguen coherentes entre sí.',
        },
        {
          title: 'Radicación',
          text: 'Diligenciamos el Formulario Único Nacional y radicamos ante la curaduría que corresponda por reparto.',
        },
        {
          title: 'Observaciones y expedición',
          text: 'Atendemos los requerimientos del curador hasta la expedición de la licencia y su ejecutoria.',
        },
      ],
    },
    incluye: {
      title: 'Qué entregamos',
      items: [
        'Estudio de la norma urbanística aplicable al predio.',
        'Proyecto arquitectónico y planos firmados por arquitecto con matrícula.',
        'Coordinación de los estudios técnicos exigidos por el proyecto.',
        'Diligenciamiento del Formulario Único Nacional.',
        'Radicación y seguimiento del trámite ante la curaduría urbana.',
        'Atención de las observaciones hasta la expedición de la licencia.',
      ],
    },
    faq: [
      'necesito-licencia-de-construccion-en-cucuta',
      'como-sacar-una-licencia-de-construccion-en-cucuta',
      'cuanto-cuesta-una-licencia-de-construccion-en-cucuta',
      'requisitos-licencia-de-construccion',
      'cuanto-demora-una-licencia-de-construccion',
      'licencia-para-construir-un-segundo-piso',
      'que-pasa-si-construyo-sin-licencia',
      'que-puedo-construir-en-mi-lote',
    ],
    oficial: {
      title: 'Dónde se tramita en Cúcuta',
      text: 'Las licencias urbanísticas en San José de Cúcuta las expiden los curadores urbanos del municipio. La consulta de uso de suelos la ofrece la Alcaldía.',
      links: [
        { href: 'https://curaduriaunocucuta.org/', label: 'Curaduría Urbana N.º 1 de Cúcuta' },
        { href: 'https://curaduria2cucuta.com/', label: 'Curaduría Urbana N.º 2 de Cúcuta' },
        {
          href: 'https://cucuta.gov.co/consulta-uso-de-suelos/',
          label: 'Consulta de uso de suelos — Alcaldía de Cúcuta',
        },
        {
          href: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=77216',
          label: 'Decreto 1077 de 2015 — norma nacional de licencias urbanísticas',
        },
      ],
    },
    related: [
      'reconocimiento-de-construcciones',
      'desenglobe-y-subdivision',
      'diseno-arquitectonico',
    ],
    cta: {
      title: '¿Quieres saber si tu proyecto es viable?',
      text: 'Cuéntanos dónde está el predio y qué quieres construir. Revisamos la norma y te decimos qué se puede hacer antes de que gastes en diseño.',
      button: 'Consultar mi licencia por WhatsApp',
      message: 'licencias',
    },
    schema: {
      serviceType: 'Trámite de licencias urbanísticas',
      alternateName: [
        'Licencia de construcción en Cúcuta',
        'Licencias urbanísticas Cúcuta',
        'Trámite de licencias ante curaduría urbana',
      ],
      catalog: [
        'Licencia de construcción en modalidad de obra nueva',
        'Licencia de construcción en modalidad de ampliación',
        'Licencia de construcción en modalidad de adecuación y modificación',
        'Licencia de demolición',
        'Licencia de cerramiento',
        'Estudio de norma urbanística y uso del suelo',
      ],
    },
  },

  {
    slug: 'desenglobe-y-subdivision',
    nav: 'Desenglobe y subdivisión',
    orden: 2,
    title: 'Desenglobe y subdivisión de lotes en Cúcuta | CYMARQ',
    description:
      'Desenglobe y subdivisión de lotes en Cúcuta: estudio de viabilidad según el POT, licencia de subdivisión, planos y acompañamiento hasta abrir las nuevas matrículas.',
    h1: 'Desenglobe y subdivisión de lotes en Cúcuta',
    lead: 'Dividir un predio tiene una parte urbanística y una parte registral. Nos encargamos de la primera y acompañamos la segunda, empezando por confirmar si la división que tienes en mente es viable.',
    cover: '/photos/servicios/lotes-urbanos-subdivision.webp',
    coverSize: { width: 1600, height: 900 },
    coverAlt:
      'Vista aérea de lotes urbanos delimitados por muros y vías, en el borde de una ciudad',
    respuesta: {
      title: 'En resumen',
      text: 'Dividir un lote en Cúcuta exige primero una licencia de subdivisión, expedida por un curador urbano, que verifica que cada lote resultante cumpla el área mínima, el frente mínimo, el acceso a vía pública y el uso que le asigna el POT. Con esa licencia en firme se otorga la escritura pública de desenglobe y se registra en la Oficina de Registro de Instrumentos Públicos, que abre una matrícula inmobiliaria por cada predio nuevo. Hasta que no se abren esas matrículas, los lotes no existen como inmuebles independientes y no se pueden vender ni hipotecar por separado. CYMARQ hace el estudio de viabilidad, los planos y la gestión de la licencia.',
    },
    secciones: [
      {
        id: 'desenglobe-o-subdivision',
        title: 'Desenglobe y subdivisión no son lo mismo',
        body: [
          'Son dos actos distintos, ante dos autoridades distintas, y uno habilita al otro. La subdivisión es el acto urbanístico: la licencia con la que el curador autoriza dividir el predio, después de verificar que cada lote resultante cumple la norma. El desenglobe es el acto registral: la operación por la que el registro cierra parcialmente el folio original y abre una matrícula nueva para cada predio.',
          'En la conversación corriente la gente dice "desenglobe" para todo el proceso, y está bien como forma de hablar. Lo que importa saber es que no se puede empezar por la notaría: sin licencia de subdivisión previa, el registro no abre las matrículas.',
        ],
      },
      {
        id: 'viabilidad',
        title: 'Lo primero es saber si se puede',
        body: [
          'No todo lote se puede dividir, y el tamaño no es el único criterio. La norma exige que cada predio resultante cumpla por su cuenta un área mínima y un frente mínimo sobre vía pública, y que tenga acceso directo a esa vía: un lote que queda encerrado detrás de otro no se aprueba.',
          'Esos mínimos los fija el POT y cambian de una zona a otra. Dos predios a pocas cuadras pueden tener exigencias distintas si pertenecen a zonas normativas diferentes, así que una cifra que alguien escuchó de un vecino no sirve como referencia.',
          'En suelo rural la lógica es otra. Además de la norma municipal operan restricciones de orden nacional para la división de predios rurales, entre ellas la extensión mínima asociada a la Unidad Agrícola Familiar. Un lote rural que en área parece dividirse sin problema puede no poder dividirse legalmente.',
          'Hay además un umbral que sorprende: si la división exige abrir vías internas, ceder áreas para espacio público o dotar de redes a los nuevos lotes, el proyecto deja de ser una subdivisión y pasa a tratarse como urbanización o parcelación, con un trámite bastante más exigente.',
        ],
        list: {
          title: 'Lo que revisamos en el estudio de viabilidad',
          items: [
            'Área mínima de lote y frente mínimo exigidos en la zona.',
            'Acceso directo a vía pública de cada lote resultante.',
            'Clasificación del suelo: urbano, de expansión o rural.',
            'Tratamiento urbanístico y usos asignados a la zona.',
            'Afectaciones sobre el predio: rondas, amenaza, retiros viales o de infraestructura.',
            'Diferencias entre el área escriturada, el área catastral y el área real del predio.',
          ],
        },
      },
      {
        id: 'proceso-completo',
        title: 'Las tres etapas del proceso',
        body: [
          'Un desenglobe completo recorre tres etapas encadenadas, y saltarse el orden es el error más caro que se puede cometer.',
          'La etapa urbanística termina con la licencia de subdivisión en firme. La etapa notarial es la escritura pública de desenglobe. La etapa registral y catastral es el registro de esa escritura, la apertura de las nuevas matrículas inmobiliarias y la actualización de la información catastral de cada predio.',
          'Nosotros nos ocupamos de la primera —estudio, planos y trámite— y acompañamos las dos siguientes para que la información técnica llegue coherente a la notaría y al registro. Las diferencias entre lo que dice la escritura y lo que dice el plano son la causa más habitual de que un desenglobe se detenga.',
        ],
      },
      {
        id: 'documentos',
        title: 'Qué documentos se necesitan',
        body: [
          'Del predio: certificado de tradición y libertad reciente, escritura pública, documento de identidad del propietario, poder si actúa un tercero y paz y salvo del impuesto predial.',
          'Del proyecto de división: levantamiento topográfico con áreas y linderos reales, plano de subdivisión propuesto firmado por profesional competente y Formulario Único Nacional diligenciado. Según el predio, la curaduría puede pedir documentos adicionales, por ejemplo cuando hay servidumbres o condiciones ambientales.',
          'Si el predio proviene de una sucesión, tiene varios propietarios o arrastra diferencias entre el área escriturada y el área real, eso se resuelve antes de radicar. Es el tipo de detalle que detiene un trámite durante meses.',
        ],
      },
    ],
    proceso: {
      title: 'Cómo lo trabajamos',
      steps: [
        {
          title: 'Estudio de viabilidad',
          text: 'Revisamos el predio contra la norma y te decimos en cuántos lotes se puede dividir, si es que se puede.',
        },
        {
          title: 'Levantamiento y planos',
          text: 'Levantamiento topográfico del predio y plano de la subdivisión propuesta, con áreas y linderos reales.',
        },
        {
          title: 'Licencia de subdivisión',
          text: 'Radicación ante la curaduría urbana y atención de las observaciones hasta la expedición.',
        },
        {
          title: 'Escritura y registro',
          text: 'Acompañamos la escritura de desenglobe y el registro, hasta que se abran las nuevas matrículas.',
        },
      ],
    },
    incluye: {
      title: 'Qué entregamos',
      items: [
        'Estudio de viabilidad normativa de la división propuesta.',
        'Levantamiento topográfico del predio.',
        'Plano de subdivisión firmado por profesional competente.',
        'Radicación y gestión de la licencia de subdivisión.',
        'Acompañamiento técnico en la etapa notarial y registral.',
      ],
    },
    faq: [
      'como-hacer-un-desenglobe-en-cucuta',
      'diferencia-entre-desenglobe-y-subdivision',
      'puedo-dividir-mi-lote-en-dos',
      'area-minima-para-subdividir-un-lote',
      'cuanto-cuesta-un-desenglobe',
      'documentos-para-subdividir-un-predio',
      'necesito-licencia-para-dividir-un-lote',
    ],
    oficial: {
      title: 'Dónde se tramita en Cúcuta',
      text: 'La licencia de subdivisión la expiden los curadores urbanos. La apertura de matrículas inmobiliarias corresponde a la Oficina de Registro de Instrumentos Públicos, y la actualización catastral al gestor catastral competente.',
      links: [
        { href: 'https://curaduriaunocucuta.org/', label: 'Curaduría Urbana N.º 1 de Cúcuta' },
        { href: 'https://curaduria2cucuta.com/', label: 'Curaduría Urbana N.º 2 de Cúcuta' },
        { href: 'https://www.igac.gov.co/', label: 'Instituto Geográfico Agustín Codazzi (IGAC)' },
      ],
    },
    related: ['licencias-de-construccion', 'diseno-arquitectonico', 'reconocimiento-de-construcciones'],
    cta: {
      title: '¿Tu lote se puede dividir?',
      text: 'Con la nomenclatura o la cédula catastral del predio revisamos la norma y te decimos si la división que tienes en mente es viable.',
      button: 'Consultar mi desenglobe por WhatsApp',
      message: 'desenglobe',
    },
    schema: {
      serviceType: 'Subdivisión de predios y desenglobe',
      alternateName: [
        'Desenglobe de lotes en Cúcuta',
        'Subdivisión de predios Cúcuta',
        'Licencia de subdivisión',
      ],
      catalog: [
        'Estudio de viabilidad de subdivisión',
        'Levantamiento topográfico',
        'Plano de subdivisión',
        'Licencia de subdivisión ante curaduría urbana',
        'Acompañamiento en escritura de desenglobe y registro',
      ],
    },
  },

  {
    slug: 'reconocimiento-de-construcciones',
    nav: 'Reconocimiento y legalización',
    orden: 3,
    title: 'Legalizar una casa sin licencia en Cúcuta | Reconocimiento — CYMARQ',
    description:
      'Reconocimiento de edificaciones en Cúcuta: cómo legalizar una casa o un segundo piso construidos sin licencia. Levantamiento arquitectónico, peritaje estructural y trámite ante curaduría urbana.',
    h1: 'Reconocimiento y legalización de construcciones en Cúcuta',
    lead: 'Cuando la casa ya está construida y nunca tuvo licencia, el camino no es una licencia: es el reconocimiento de la edificación. Evaluamos si procede y llevamos el trámite.',
    cover: '/photos/servicios/construccion-existente-reconocimiento.webp',
    coverSize: { width: 1600, height: 900 },
    coverAlt:
      'Vivienda consolidada de ladrillo y concreto con un segundo piso añadido posteriormente',
    respuesta: {
      title: 'En resumen',
      text: 'El reconocimiento de la existencia de la edificación es el trámite con el que una curaduría urbana declara formalmente que una construcción levantada sin licencia existe. Para que proceda, la norma exige que la edificación cumpla el uso previsto por las normas urbanísticas vigentes y que esté terminada desde un tiempo mínimo antes de la solicitud. El expediente se arma con el levantamiento arquitectónico de lo realmente construido, un peritaje estructural firmado por ingeniero civil y la prueba de la fecha de terminación. Si la edificación no cumple las condiciones de sismorresistencia aplicables, el acto de reconocimiento puede exigir obras de reforzamiento. CYMARQ evalúa la viabilidad, prepara el expediente y lleva el trámite en Cúcuta y Norte de Santander.',
    },
    secciones: [
      {
        id: 'que-es',
        title: 'Qué es el reconocimiento de una edificación',
        body: [
          'Es el acto administrativo mediante el cual el curador urbano —o la autoridad municipal competente— declara la existencia de una construcción que se ejecutó sin licencia. Dicho de forma directa: es el equivalente a la licencia, pero para algo que ya está construido.',
          'No hay que confundirlo con la legalización urbanística de barrios o asentamientos, que es una figura distinta, de escala urbana, que adelanta el municipio sobre desarrollos completos y no sobre una casa en particular.',
          'Tampoco es un trámite automático. La norma pone condiciones, y la primera de todas es que el uso de la edificación sea compatible con lo que la norma urbanística vigente permite en esa zona. Si no lo es, la antigüedad de la construcción no basta por sí sola.',
        ],
      },
      {
        id: 'cuando-procede',
        title: 'Cuándo procede y cuándo no',
        body: [
          'Procede cuando la edificación cumple el uso previsto por las normas urbanísticas vigentes y lleva terminada el tiempo mínimo que exige la reglamentación. Esa fecha de terminación hay que probarla, y ahí sirven los recibos antiguos de servicios públicos, la información catastral, las aerofotografías del sector y otros documentos que permitan fechar la obra.',
          'No procede —o se complica mucho— cuando la construcción ocupa una zona de protección, una ronda hídrica o un área de amenaza, cuando invade espacio público o predios vecinos, o cuando desarrolla un uso que la norma no permite en ese sector.',
          'Por eso el orden importa: primero se verifica la norma, después se contrata el peritaje. Al revés se corre el riesgo de pagar un estudio estructural para una construcción que, por norma, no era reconocible.',
        ],
      },
      {
        id: 'estructura',
        title: 'El peritaje estructural es la parte que decide',
        body: [
          'El expediente incluye un peritaje técnico sobre el estado de la edificación, firmado por ingeniero civil. En construcciones levantadas por etapas, sin planos ni diseño estructural previo, ese estudio es el que revela si lo que hay soporta lo que hay.',
          'Si el peritaje concluye que la edificación no cumple las condiciones de sismorresistencia aplicables, el acto de reconocimiento puede imponer obras de adecuación o reforzamiento estructural. Eso no es un obstáculo del trámite: es su razón de fondo. Una casa reconocida es una casa que alguien verificó que no se va a caer.',
          'También es el rubro que más puede mover el costo total del proceso, y no se conoce hasta tener el diagnóstico. Por eso proponemos siempre una evaluación preliminar antes de comprometerse con el trámite completo.',
        ],
      },
      {
        id: 'por-que-importa',
        title: 'Por qué conviene regularizar',
        body: [
          'Mientras la construcción no esté respaldada por una licencia o un acto de reconocimiento, normalmente no puede incorporarse al folio de matrícula inmobiliaria. El inmueble sigue figurando como lote, o con un área construida menor a la real.',
          'Las consecuencias aparecen en el peor momento. Un comprador con crédito hipotecario descubre que el banco financia lo que figura registrado, no lo que ve en la visita. Una sucesión se complica. Una venta se negocia a la baja por el riesgo de una construcción no regularizada.',
          'Si hay una venta prevista, adelantar el reconocimiento antes de salir al mercado suele recuperar con creces lo que cuesta el trámite.',
        ],
        list: {
          title: 'Casos que atendemos con más frecuencia',
          items: [
            'Vivienda construida por etapas, sin licencia, a lo largo de varios años.',
            'Segundo piso levantado sobre una casa que sí tenía licencia del primero.',
            'Construcción heredada, de la que no existe ningún soporte documental.',
            'Inmueble que se quiere vender y cuyo certificado de tradición no refleja lo construido.',
            'Ampliaciones ejecutadas sin trámite que hoy bloquean una escritura.',
          ],
        },
      },
    ],
    proceso: {
      title: 'Cómo lo trabajamos',
      steps: [
        {
          title: 'Evaluación preliminar',
          text: 'Revisamos la norma del predio y las condiciones de la construcción para decir si el reconocimiento es viable, antes de gastar en estudios.',
        },
        {
          title: 'Levantamiento arquitectónico',
          text: 'Medimos y dibujamos la edificación tal como está construida, que es lo que se somete al trámite.',
        },
        {
          title: 'Peritaje estructural',
          text: 'Un ingeniero civil evalúa el estado de la estructura y determina si se requiere reforzamiento.',
        },
        {
          title: 'Trámite ante curaduría',
          text: 'Radicamos el expediente completo y atendemos las observaciones hasta la expedición del acto de reconocimiento.',
        },
      ],
    },
    incluye: {
      title: 'Qué entregamos',
      items: [
        'Evaluación preliminar de viabilidad del reconocimiento.',
        'Levantamiento arquitectónico de la edificación existente.',
        'Coordinación del peritaje técnico estructural.',
        'Armado del expediente y prueba de la fecha de terminación.',
        'Radicación y gestión del trámite ante la curaduría urbana.',
        'Proyecto de reforzamiento estructural, cuando el peritaje lo exija.',
      ],
    },
    faq: [
      'como-legalizar-una-casa-construida-sin-licencia',
      'que-es-el-reconocimiento-de-una-edificacion',
      'legalizar-segundo-piso-sin-licencia',
      'requisitos-para-legalizar-una-casa',
      'cuanto-cuesta-legalizar-una-construccion',
      'puedo-vender-una-casa-que-no-tiene-licencia',
      'como-saber-si-una-construccion-esta-legalizada',
    ],
    oficial: {
      title: 'Marco normativo y entidades',
      text: 'El reconocimiento de edificaciones está regulado en la norma nacional de licencias urbanísticas y se tramita ante las curadurías urbanas del municipio.',
      links: [
        {
          href: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=77216',
          label: 'Decreto 1077 de 2015 — reconocimiento de edificaciones',
        },
        { href: 'https://curaduriaunocucuta.org/', label: 'Curaduría Urbana N.º 1 de Cúcuta' },
        { href: 'https://curaduria2cucuta.com/', label: 'Curaduría Urbana N.º 2 de Cúcuta' },
      ],
    },
    related: ['licencias-de-construccion', 'diseno-y-construccion', 'desenglobe-y-subdivision'],
    cta: {
      title: '¿Tu construcción se puede legalizar?',
      text: 'Cuéntanos dónde está el inmueble, qué se construyó y desde cuándo. Hacemos la evaluación preliminar y te decimos si el reconocimiento procede.',
      button: 'Consultar mi caso por WhatsApp',
      message: 'reconocimiento',
    },
    schema: {
      serviceType: 'Reconocimiento de edificaciones',
      alternateName: [
        'Legalizar una casa sin licencia en Cúcuta',
        'Reconocimiento de construcciones Cúcuta',
        'Legalización de construcciones',
      ],
      catalog: [
        'Evaluación de viabilidad de reconocimiento',
        'Levantamiento arquitectónico de edificación existente',
        'Peritaje técnico estructural',
        'Trámite de reconocimiento ante curaduría urbana',
        'Proyecto de reforzamiento estructural',
      ],
    },
  },

  {
    slug: 'diseno-arquitectonico',
    nav: 'Diseño arquitectónico',
    orden: 4,
    title: 'Diseño arquitectónico y planos en Cúcuta | CYMARQ',
    description:
      'Diseño arquitectónico y planos en Cúcuta para vivienda, comercio y uso mixto: anteproyecto, proyecto, coordinación técnica y recorrido 3D antes de construir.',
    h1: 'Diseño arquitectónico y planos en Cúcuta',
    lead: 'Proyectos que nacen de entender cómo vive o cómo trabaja quien los va a usar, y que llegan a la obra con los planos coordinados y la norma resuelta.',
    cover: '/photos/servicios/maqueta-diseno-arquitectonico.webp',
    coverSize: { width: 1600, height: 900 },
    coverAlt:
      'Maqueta de estudio en cartón de una vivienda contemporánea, iluminada con luz cálida rasante',
    respuesta: {
      title: 'En resumen',
      text: 'CYMARQ diseña vivienda unifamiliar y multifamiliar, locales y proyectos comerciales y edificaciones de uso mixto en Cúcuta y Norte de Santander. El proceso recorre el programa arquitectónico, el anteproyecto, el proyecto arquitectónico definitivo y la coordinación con los diseños estructural, hidrosanitario y eléctrico, hasta dejar el paquete de planos listo para radicar la licencia de construcción. Los planos arquitectónicos van firmados por arquitecto con matrícula profesional vigente, que es lo que exige una curaduría. Antes de dibujar se revisa la norma del predio, porque es la que define cuánto y qué se puede construir.',
    },
    secciones: [
      {
        id: 'como-disenamos',
        title: 'El diseño empieza con preguntas, no con propuestas',
        body: [
          'La primera conversación no es para mostrar un catálogo de casas. Es para entender cómo vive una familia: los horarios, las visitas, si alguien trabaja desde casa, los niños, los años que vienen. En proyectos comerciales la pregunta cambia de contenido pero no de naturaleza: cómo funciona el negocio, qué recorridos hace la gente, qué hay que ver desde la calle.',
          'De ahí sale el programa arquitectónico, que es la lista de lo que el proyecto tiene que resolver, cruzada con lo que la norma del predio permite. Es el documento que evita que se diseñe algo imposible o algo que no responde a nadie.',
          'Cada proyecto de nuestro portafolio salió de una conversación distinta. Por eso ninguno se parece a otro: ninguna familia y ningún negocio se parecen a otro.',
        ],
      },
      {
        id: 'etapas',
        title: 'Las etapas del diseño',
        body: [
          'Un proceso de diseño completo recorre cuatro etapas. Saber cuáles incluye un contrato es lo que permite comparar dos propuestas: es frecuente que dos cotizaciones con números muy distintos estén hablando de alcances muy distintos.',
        ],
        list: {
          title: 'De la idea al paquete técnico',
          items: [
            'Programa arquitectónico: qué espacios se necesitan, cómo se relacionan y qué permite la norma del predio.',
            'Anteproyecto: primeras propuestas de distribución, volumen y fachada, para decidir antes de entrar en detalle.',
            'Proyecto arquitectónico: desarrollo definitivo con plantas, cortes, fachadas, cubiertas y detalles constructivos.',
            'Coordinación técnica: ajustar el proyecto con los diseños estructural, hidrosanitario y eléctrico para que todo encaje antes de construir.',
          ],
        },
      },
      {
        id: 'planos',
        title: 'Qué planos hacen falta para construir',
        body: [
          'Un juego arquitectónico básico —plantas, cortes, fachadas, localización— sirve para entender el proyecto y para orientar una obra sencilla. Pero para radicar una licencia hace falta bastante más.',
          'El paquete completo incluye los planos arquitectónicos firmados por arquitecto con matrícula, el proyecto estructural con memorias de cálculo firmado por ingeniero civil conforme a la NSR-10, el estudio de suelos según la magnitud del proyecto y los diseños hidrosanitarios y eléctricos. Cuando el proyecto contempla gas, también ese diseño.',
          'Lo que decide la calidad de ese paquete no es cada plano por separado: es que estén coordinados entre sí. La mayoría de los sobrecostos que aparecen en obra nacen de diseños que nunca conversaron entre ellos.',
        ],
      },
      {
        id: 'visualizacion',
        title: 'Ver la casa antes de que exista',
        body: [
          'Entregamos el proyecto en 3D para que puedas recorrerlo: la fachada, la sala, tu habitación. No es un adorno comercial. Es la forma de que tomes decisiones sobre algo que puedes ver, en lugar de sobre un plano que hay que saber leer.',
          'El valor práctico está en el momento del cambio. Mover un muro en el modelo toma minutos; moverlo en obra cuesta dinero y tiempo. Ajustamos las veces que haga falta mientras el proyecto todavía es un archivo.',
          'En proyectos comerciales cumple otra función: permite mostrar el local o el edificio a socios, arrendatarios o entidades financieras antes de que exista.',
        ],
      },
    ],
    proceso: {
      title: 'Cómo lo trabajamos',
      steps: [
        {
          title: 'Escuchamos y revisamos la norma',
          text: 'Entendemos qué necesitas y confirmamos qué permite el POT en tu predio. Las dos cosas antes de dibujar.',
        },
        {
          title: 'Anteproyecto',
          text: 'Propuestas de distribución y volumen, para decidir lo importante mientras cambiar todavía es barato.',
        },
        {
          title: 'Proyecto y visualización 3D',
          text: 'Desarrollo definitivo del proyecto y recorrido en 3D, para ajustar hasta que estés convencido.',
        },
        {
          title: 'Paquete técnico',
          text: 'Coordinación con los diseños técnicos y entrega de los planos listos para tramitar la licencia.',
        },
      ],
    },
    incluye: {
      title: 'Qué entregamos',
      items: [
        'Programa arquitectónico y estudio de la norma aplicable al predio.',
        'Anteproyecto con propuestas de distribución y volumen.',
        'Proyecto arquitectónico: plantas, cortes, fachadas, cubiertas y detalles.',
        'Planos firmados por arquitecto con matrícula profesional vigente.',
        'Coordinación con los diseños estructural, hidrosanitario y eléctrico.',
        'Renders y recorrido 3D del proyecto.',
      ],
    },
    faq: [
      'que-incluye-un-diseno-arquitectonico',
      'cuanto-cuesta-disenar-una-casa-en-cucuta',
      'cuanto-cobra-un-arquitecto-por-disenar-una-casa',
      'quien-hace-planos-arquitectonicos-en-cucuta',
      'que-planos-necesito-para-construir-una-casa',
      'cuanto-cuesta-hacer-los-planos-de-una-casa',
      'como-contratar-un-arquitecto-en-cucuta',
    ],
    related: ['diseno-y-construccion', 'licencias-de-construccion', 'desenglobe-y-subdivision'],
    cta: {
      title: '¿Quieres cotizar el diseño de tu proyecto?',
      text: 'Con el área aproximada, el número de niveles y la ubicación del lote podemos preparar una propuesta concreta, con los entregables detallados.',
      button: 'Cotizar mi diseño por WhatsApp',
      message: 'disenoArquitectonico',
    },
    schema: {
      serviceType: 'Diseño arquitectónico',
      alternateName: [
        'Diseño arquitectónico en Cúcuta',
        'Planos arquitectónicos Cúcuta',
        'Arquitectos en Cúcuta',
      ],
      catalog: [
        'Diseño arquitectónico de vivienda',
        'Diseño arquitectónico comercial y de uso mixto',
        'Planos arquitectónicos para licencia de construcción',
        'Anteproyecto arquitectónico',
        'Renderizado y recorrido 3D',
        'Levantamiento arquitectónico',
      ],
    },
  },

  {
    slug: 'diseno-y-construccion',
    nav: 'Diseño y construcción',
    orden: 5,
    title: 'Diseño y construcción en Cúcuta | Obra, remodelación y ampliación — CYMARQ',
    description:
      'Diseño y construcción en Cúcuta con un solo responsable: proyecto, presupuesto, licencia y obra. Vivienda nueva, remodelaciones y ampliaciones, con supervisión de quien diseñó el proyecto.',
    h1: 'Diseño y construcción en Cúcuta',
    lead: 'El proyecto completo con un solo responsable: quien diseñó la casa es quien la construye y quien responde por ella. Sin que tengas que coordinar a tres equipos que no se hablan.',
    cover: '/photos/servicios/estructura-obra-construccion.webp',
    coverSize: { width: 1600, height: 900 },
    coverAlt:
      'Estructura de concreto reforzado con muros de ladrillo de una vivienda en construcción',
    respuesta: {
      title: 'En resumen',
      text: 'CYMARQ ofrece diseño y construcción como un solo contrato en Cúcuta y Norte de Santander: proyecto arquitectónico, estudios técnicos, presupuesto detallado, trámite de la licencia y ejecución de la obra con supervisión permanente. El servicio cubre obra nueva de vivienda, proyectos comerciales, remodelaciones y ampliaciones. El presupuesto se entrega por capítulos, con cantidades de obra y precios unitarios sobre un proyecto ya definido, no como un valor por metro cuadrado que esconde lo que no incluye.',
    },
    secciones: [
      {
        id: 'un-solo-responsable',
        title: 'Por qué diseñar y construir con el mismo equipo',
        body: [
          'Cuando el diseño, la licencia y la obra están en manos distintas, los problemas aparecen en las costuras. El plano no contempla algo que en obra no se puede hacer; el maestro interpreta a su manera un detalle que nadie le explicó; el presupuesto no coincide con lo que realmente había que construir. Y cuando algo sale mal, cada parte señala a la otra.',
          'Trabajar con un solo responsable elimina esa zona gris. Quien diseñó el proyecto es quien lo presupuesta, quien lo tramita y quien está en obra cuando hay que decidir. Las decisiones se toman con el proyecto completo en la cabeza, no con el pedazo que a cada quien le tocó.',
          'Nuestro equipo reúne arquitectura e ingeniería civil, así que el diseño y la viabilidad constructiva se resuelven en la misma mesa. Lo que ves en pantalla es lo que se puede levantar en tu lote.',
        ],
      },
      {
        id: 'presupuesto',
        title: 'El presupuesto, antes de mover el primer bulto',
        body: [
          'No publicamos un valor por metro cuadrado porque una cifra sin contexto resulta engañosa. El mismo metro cuadrado cuesta muy distinto según el nivel de acabados, el sistema constructivo, la cimentación que exija el estudio de suelos, la topografía del lote y las instalaciones que lleve el proyecto.',
          'Además, el valor por metro cuadrado suele esconder rubros que después aparecen: movimientos de tierra, redes externas, diseños y trámites. Comparar por metro cuadrado dos propuestas que incluyen cosas distintas lleva a elegir mal.',
          'Lo que entregamos es un presupuesto por capítulos sobre un proyecto definido: cantidades de obra, precios unitarios y análisis por partidas. Ese documento sirve para decidir, para gestionar financiación y para controlar la obra mientras avanza, porque permite comparar lo ejecutado contra lo previsto.',
        ],
      },
      {
        id: 'remodelacion',
        title: 'Remodelaciones y ampliaciones',
        body: [
          'Una remodelación es más difícil de presupuestar que una obra nueva, porque parte de algo que ya existe y que casi nunca está documentado. Por eso empezamos por un levantamiento de lo existente y un diagnóstico, antes de definir el alcance.',
          'Lo que aparece al abrir un muro es la principal fuente de sobrecostos en este tipo de obra: redes hidrosanitarias que hay que renovar por completo, estructuras que no son lo que parecían, humedades que venían de atrás. Un buen diagnóstico previo no elimina esa incertidumbre, pero la reduce bastante.',
          'Hay además una pregunta que decide el orden del trabajo: si la obra requiere licencia. Cambiar acabados no la requiere; cambiar la distribución, intervenir muros estructurales, modificar la fachada, cambiar el uso o sumar área, sí. Resolver esa pregunta al principio evita tener que parar la obra a mitad de camino.',
        ],
      },
      {
        id: 'obra',
        title: 'Cómo se maneja la obra',
        body: [
          'La obra empieza cuando hay tres cosas resueltas: los planos coordinados, el presupuesto aprobado y la licencia en firme. Empezar sin alguna de las tres es la forma más común de que un proyecto se salga de control.',
          'Durante la ejecución hacemos supervisión permanente para que lo construido sea fiel al diseño aprobado, con control de avance y de cantidades contra el presupuesto. Para clientes que ya tienen constructor y solo necesitan ese control, ofrecemos interventoría y supervisión de obra como servicio independiente.',
        ],
      },
    ],
    proceso: {
      title: 'Cómo lo trabajamos',
      steps: [
        {
          title: 'Proyecto y norma',
          text: 'Diseño arquitectónico y estudios técnicos, sobre la norma verificada del predio.',
        },
        {
          title: 'Presupuesto detallado',
          text: 'Cantidades de obra y precios unitarios por capítulos, para que sepas cuánto cuesta antes de empezar.',
        },
        {
          title: 'Licencia',
          text: 'Radicamos y gestionamos la licencia de construcción hasta que quede en firme.',
        },
        {
          title: 'Obra y supervisión',
          text: 'Ejecución con control de avance y de cantidades, y con quien diseñó el proyecto encima de la obra.',
        },
      ],
    },
    incluye: {
      title: 'Qué entregamos',
      items: [
        'Proyecto arquitectónico y estudios técnicos coordinados.',
        'Presupuesto detallado por capítulos, con cantidades y precios unitarios.',
        'Gestión de la licencia de construcción.',
        'Ejecución de obra con control de avance y de cantidades.',
        'Supervisión permanente y entrega del proyecto terminado.',
        'Interventoría y supervisión como servicio independiente, si ya tienes constructor.',
      ],
    },
    faq: [
      'cuanto-cuesta-construir-una-casa-en-cucuta',
      'cuanto-cuesta-construir-una-casa-por-metro-cuadrado',
      'cuanto-cuesta-remodelar-una-casa',
      'licencia-para-remodelar-una-vivienda',
      'licencia-para-ampliar-mi-casa',
      'licencia-para-construir-un-segundo-piso',
    ],
    related: ['diseno-arquitectonico', 'licencias-de-construccion', 'reconocimiento-de-construcciones'],
    cta: {
      title: '¿Ya tienes un lote y quieres construir?',
      text: 'Cuéntanos dónde está el predio y qué tienes en mente. Revisamos la norma, definimos el alcance y preparamos una propuesta.',
      button: 'Hablar de mi obra por WhatsApp',
      message: 'disenoConstruccion',
    },
    schema: {
      serviceType: 'Diseño y construcción de edificaciones',
      alternateName: [
        'Diseño y construcción en Cúcuta',
        'Construcción de casas en Cúcuta',
        'Remodelaciones y ampliaciones Cúcuta',
      ],
      catalog: [
        'Construcción de vivienda',
        'Remodelación de vivienda',
        'Ampliación de edificaciones',
        'Presupuestos de obra',
        'Interventoría',
        'Supervisión de obra',
      ],
    },
  },
];

export function getServicio(slug) {
  return servicios.find((s) => s.slug === slug);
}

export function servicioPath(slug) {
  return `/servicios/${slug}/`;
}

/** Los servicios en el orden en que se muestran en el hub y en el menú. */
export const serviciosOrdenados = [...servicios].sort((a, b) => a.orden - b.orden);
