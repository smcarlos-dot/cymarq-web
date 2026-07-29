import Link from 'next/link';
import LegalPage, { LegalList, LegalNote, LegalSection } from '@/components/LegalPage';
import { site } from '@/data/site';

const title = 'Eliminación de datos';
const description =
  'Cómo solicitar a CYMARQ la eliminación de los datos asociados a tu interacción a través de Instagram y Meta: procedimiento, plazos de respuesta y alternativas disponibles.';

const SUBJECT = 'Solicitud de eliminacion de datos - Instagram';

export const metadata = {
  title,
  description,
  alternates: {
    canonical: '/eliminacion-de-datos/',
  },
  openGraph: {
    title: `${title} | CYMARQ`,
    description,
    url: '/eliminacion-de-datos/',
    siteName: 'CYMARQ',
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: '/photos/edificio-cyma.webp',
        width: 1200,
        height: 630,
        alt: 'CYMARQ — Edificio CYMA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | CYMARQ`,
    description,
    images: ['/photos/edificio-cyma.webp'],
  },
};

export default function EliminacionDeDatosPage() {
  const mailto = `mailto:${site.privacyEmail}?subject=${encodeURIComponent(SUBJECT)}`;

  return (
    <LegalPage
      label="Legal"
      title={
        <>
          Eliminación de <em className="text-gold">datos</em>
        </>
      }
      lead="Cómo pedirnos que eliminemos la información asociada a tu interacción con CYMARQ a través de Instagram y Meta."
      updatedAt="29 de julio de 2026"
    >
      <LegalSection id="introduccion" title="1. Sobre esta página">
        <p>
          <strong className="text-ink">CYMARQ</strong> gestiona su cuenta profesional de Instagram{' '}
          <strong className="text-ink">{site.instagramHandle}</strong> mediante la integración oficial
          de Meta. Si has interactuado con nosotros por ese canal y quieres que eliminemos los datos
          asociados a esa interacción, aquí encontrarás el procedimiento exacto.
        </p>
        <p>
          Esta página complementa nuestra{' '}
          <Link href="/politica-de-privacidad/" className="link-underline font-medium text-ink">
            política de privacidad
          </Link>
          , donde se detalla qué información tratamos y con qué finalidad.
        </p>
      </LegalSection>

      <LegalSection id="que-datos" title="2. Qué datos podemos tener sobre ti">
        <p>Si nos has escrito o comentado a través de Instagram, la información asociada puede incluir:</p>
        <LegalList>
          <li>El identificador de usuario que Instagram asigna a tu cuenta frente a la nuestra (IGSID).</li>
          <li>Tu nombre de usuario o nombre público de Instagram.</li>
          <li>El contenido de los mensajes o comentarios que nos enviaste y sus archivos adjuntos.</li>
          <li>Metadatos técnicos del evento: identificador del mensaje, fecha y hora, y tipo de interacción.</li>
          <li>
            Cualquier dato de contacto adicional que nos hayas facilitado voluntariamente en la
            conversación (nombre, correo, teléfono, descripción de tu proyecto).
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="como-solicitar" title="3. Cómo solicitar la eliminación">
        <LegalNote>
          <strong>El procedimiento es manual y se gestiona por correo electrónico.</strong> CYMARQ no
          dispone actualmente de un formulario web ni de un mecanismo automático de eliminación. Toda
          solicitud se revisa y se ejecuta de forma manual por nuestro equipo.
        </LegalNote>
        <p>
          <strong className="text-ink">Paso 1.</strong> Envía un correo electrónico a{' '}
          <a href={mailto} className="link-underline text-ink">
            {site.privacyEmail}
          </a>
          .
        </p>
        <p>
          <strong className="text-ink">Paso 2.</strong> Escribe en el asunto:{' '}
          <span className="bg-mist px-2 py-1 font-sans text-[13px] text-ink">
            Solicitud de eliminación de datos — Instagram
          </span>
        </p>
        <p>
          <strong className="text-ink">Paso 3.</strong> Incluye en el mensaje la siguiente información,
          imprescindible para localizar tus datos y verificar que la solicitud es legítima:
        </p>
        <LegalList>
          <li>
            El <strong className="text-ink">nombre de usuario de Instagram</strong> desde el que
            interactuaste con nosotros.
          </li>
          <li>Una descripción breve de la interacción (por ejemplo, fecha aproximada o asunto tratado).</li>
          <li>Qué deseas exactamente: la eliminación total o la de un dato concreto.</li>
          <li>Un medio de contacto para confirmarte el resultado.</li>
        </LegalList>
        <p>
          <strong className="text-ink">Paso 4.</strong> Para confirmar que la cuenta es tuya, podemos
          pedirte que nos envíes también un mensaje directo desde esa misma cuenta de Instagram a{' '}
          {site.instagramHandle}. Es una verificación necesaria para evitar que un tercero solicite la
          eliminación de datos ajenos.
        </p>
        <p className="pt-2">
          <a href={mailto} className="btn-line text-ink">
            Escribir para solicitar la eliminación <span aria-hidden="true">→</span>
          </a>
        </p>
      </LegalSection>

      <LegalSection id="plazos" title="4. Qué ocurre después">
        <LegalList>
          <li>
            <strong className="text-ink">Acuse de recibo:</strong> confirmamos la recepción de tu
            solicitud, normalmente dentro de los cinco (5) días hábiles siguientes.
          </li>
          <li>
            <strong className="text-ink">Verificación:</strong> comprobamos tu identidad y localizamos
            la información asociada.
          </li>
          <li>
            <strong className="text-ink">Ejecución:</strong> eliminamos los datos que estén bajo
            nuestro control y que no debamos conservar por una obligación legal o contractual.
          </li>
          <li>
            <strong className="text-ink">Confirmación:</strong> te informamos por escrito de lo que se
            ha eliminado y, si procede, de lo que no ha podido eliminarse y por qué.
          </li>
        </LegalList>
        <p>
          Conforme a la Ley 1581 de 2012 de Colombia, atendemos las consultas en un máximo de diez
          (10) días hábiles y los reclamos en un máximo de quince (15) días hábiles, prorrogables en
          los términos previstos por la ley, informándote siempre del motivo.
        </p>
      </LegalSection>

      <LegalSection id="alternativas" title="5. Acciones que puedes realizar tú directamente">
        <p>
          Con independencia de tu solicitud, puedes actuar por tu cuenta desde la propia plataforma:
        </p>
        <LegalList>
          <li>
            <strong className="text-ink">Eliminar tus mensajes:</strong> en la conversación de
            Instagram, mantén pulsado el mensaje y elige la opción de eliminarlo o deshacer el envío.
          </li>
          <li>
            <strong className="text-ink">Eliminar tus comentarios:</strong> desliza sobre tu comentario
            en la publicación y elimínalo.
          </li>
          <li>
            <strong className="text-ink">Revisar tu actividad en Meta:</strong> desde la configuración
            de tu cuenta de Instagram o Facebook puedes consultar y gestionar las aplicaciones y sitios
            web conectados, y descargar o eliminar tu información en la sección de tu actividad.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="limites" title="6. Límites de lo que podemos eliminar">
        <p>Queremos ser transparentes sobre el alcance real de una solicitud de eliminación:</p>
        <LegalList>
          <li>
            <strong className="text-ink">Datos alojados en Meta.</strong> Las conversaciones y
            comentarios residen en la infraestructura de Instagram. CYMARQ puede eliminar su copia y
            dejar de tratarlos, pero la eliminación en los sistemas de Meta se rige por las políticas
            de esa compañía y debe gestionarse directamente con ella.
          </li>
          <li>
            <strong className="text-ink">Registros técnicos.</strong> Los registros operativos de
            nuestro proveedor de infraestructura se eliminan automáticamente tras un periodo breve.
            Contienen solo metadatos con identificadores enmascarados, nunca el contenido de los
            mensajes.
          </li>
          <li>
            <strong className="text-ink">Obligaciones legales.</strong> Si existe una relación
            contractual o comercial en curso, o un deber legal de conservación (contable, fiscal o de
            responsabilidad profesional), conservaremos únicamente los datos estrictamente necesarios
            durante el tiempo exigido, bloqueando el resto.
          </li>
          <li>
            <strong className="text-ink">Copias de seguridad.</strong> La eliminación puede tardar en
            propagarse a las copias de respaldo, que se sobrescriben en sus ciclos habituales.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="reclamacion" title="7. Si no estás conforme">
        <p>
          Si consideras que tu solicitud no ha sido atendida correctamente, puedes escribirnos de nuevo
          para que la revisemos y, en todo caso, presentar una reclamación ante la{' '}
          <strong className="text-ink">Superintendencia de Industria y Comercio</strong> de Colombia,
          autoridad de control en materia de protección de datos personales.
        </p>
      </LegalSection>

      <LegalSection id="contacto" title="8. Contacto">
        <LegalList>
          <li>
            Correo para solicitudes de eliminación:{' '}
            <a href={mailto} className="link-underline text-ink">
              {site.privacyEmail}
            </a>
          </li>
          <li>
            Instagram:{' '}
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline text-ink"
            >
              {site.instagramHandle}
            </a>
          </li>
          <li>
            Sitio web:{' '}
            <a href={site.url} className="link-underline text-ink">
              {site.url}
            </a>
          </li>
        </LegalList>
      </LegalSection>
    </LegalPage>
  );
}
