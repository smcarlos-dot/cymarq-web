import Link from 'next/link';
import LegalPage, { LegalList, LegalNote, LegalSection } from '@/components/LegalPage';
import { site } from '@/data/site';

const title = 'Política de privacidad';
const description =
  'Política de privacidad de CYMARQ: qué datos personales tratamos, incluida la información recibida a través de la integración con Instagram y Meta, con qué finalidad, cuánto tiempo los conservamos y cómo ejercer tus derechos.';

export const metadata = {
  title,
  description,
  alternates: {
    canonical: '/politica-de-privacidad/',
  },
  openGraph: {
    title: `${title} | CYMARQ`,
    description,
    url: '/politica-de-privacidad/',
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

export default function PoliticaDePrivacidadPage() {
  return (
    <LegalPage
      label="Legal"
      title={
        <>
          Política de <em className="text-gold">privacidad</em>
        </>
      }
      lead="Cómo tratamos la información personal en el sitio web de CYMARQ y en nuestra integración con Instagram y Meta."
      updatedAt="29 de julio de 2026"
    >
      <LegalSection id="responsable" title="1. Responsable del tratamiento">
        <p>
          <strong className="text-ink">CYMARQ</strong> es un estudio de arquitectura, diseño y
          construcción con actividad en Colombia y responsable del tratamiento de los datos
          personales descritos en este documento.
        </p>
        <LegalList>
          <li>
            Sitio web:{' '}
            <a href={site.url} className="link-underline text-ink">
              {site.url}
            </a>
          </li>
          <li>
            Correo para asuntos de privacidad y datos personales:{' '}
            <a href={`mailto:${site.privacyEmail}`} className="link-underline text-ink">
              {site.privacyEmail}
            </a>
          </li>
          <li>
            Cuenta profesional de Instagram: <strong className="text-ink">{site.instagramHandle}</strong>
          </li>
          <li>País de operación: {site.location}</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="alcance" title="2. Alcance de esta política">
        <p>
          Esta política aplica al sitio web {site.url} y a la interacción con CYMARQ a través de
          nuestra cuenta profesional de Instagram {site.instagramHandle}, incluida la integración
          técnica que hemos habilitado con la plataforma de Meta para recibir y atender mensajes y
          comentarios.
        </p>
        <p>
          No aplica al funcionamiento de Instagram, Facebook ni de ninguna otra plataforma de
          terceros. El uso que hagas de esas aplicaciones se rige por sus propias políticas de
          privacidad.
        </p>
      </LegalSection>

      <LegalSection id="informacion" title="3. Qué información tratamos">
        <p>
          <strong className="text-ink">3.1. Datos que nos facilitas directamente.</strong> Cuando nos
          escribes por correo electrónico, WhatsApp o los canales de contacto del sitio, tratamos los
          datos que decidas compartir: normalmente tu nombre, tu correo o teléfono, y la descripción
          de tu consulta o proyecto.
        </p>
        <p>
          <strong className="text-ink">3.2. Datos recibidos a través de la integración con
          Instagram.</strong> Cuando interactúas con {site.instagramHandle} (nos envías un mensaje
          directo, comentas una publicación o reaccionas a un mensaje), Meta nos remite una
          notificación con la información necesaria para atenderte:
        </p>
        <LegalList>
          <li>
            Un <strong className="text-ink">identificador de usuario asignado por Instagram</strong>{' '}
            (IGSID). Es un código específico para nuestra cuenta y no revela tu identidad fuera de
            ella.
          </li>
          <li>El contenido del mensaje o comentario que nos envías.</li>
          <li>
            Los archivos adjuntos que decidas enviarnos (imágenes, vídeos, audios o documentos).
          </li>
          <li>
            Metadatos técnicos del evento: identificador del mensaje, fecha y hora, tipo de
            interacción y si el mensaje fue editado o eliminado.
          </li>
          <li>Tu nombre de usuario o nombre público de Instagram, cuando la plataforma lo incluye.</li>
        </LegalList>
        <LegalNote>
          <strong>Lo que nunca recibimos.</strong> La integración no nos da acceso a tu contraseña,
          tu correo electrónico, tu número de teléfono, tu lista de seguidores o seguidos, tus
          mensajes con terceros, tu ubicación, tus datos de pago ni tu actividad fuera de nuestra
          cuenta.
        </LegalNote>
        <p>
          <strong className="text-ink">3.3. Datos de navegación.</strong> El sitio utiliza Google
          Analytics para obtener estadísticas agregadas de uso (páginas visitadas, tipo de
          dispositivo, procedencia aproximada). Esta herramienta emplea cookies y puede registrar una
          versión abreviada de tu dirección IP.
        </p>
      </LegalSection>

      <LegalSection id="finalidades" title="4. Para qué utilizamos la información">
        <LegalList>
          <li>Leer, gestionar y responder tus mensajes, comentarios y solicitudes.</li>
          <li>
            Elaborar propuestas, cotizaciones o información sobre nuestros servicios de arquitectura,
            diseño y construcción cuando así lo solicitas.
          </li>
          <li>Dar seguimiento a la relación comercial o profesional que se derive de tu consulta.</li>
          <li>Garantizar la seguridad, integridad y correcto funcionamiento de nuestros sistemas.</li>
          <li>Cumplir obligaciones legales, contables o contractuales aplicables.</li>
          <li>Medir de forma agregada y anónima el uso del sitio web.</li>
        </LegalList>
        <p>
          <strong className="text-ink">No vendemos, alquilamos ni cedemos tus datos personales</strong>{' '}
          a terceros con fines comerciales, ni los utilizamos para publicidad dirigida, ni construimos
          perfiles automatizados con ellos.
        </p>
      </LegalSection>

      <LegalSection id="legitimacion" title="5. Legitimación">
        <p>
          El tratamiento se basa en tu autorización, otorgada de forma libre y expresa al iniciar el
          contacto con nosotros por cualquiera de nuestros canales, así como en la ejecución de la
          relación precontractual o contractual que solicites y en el cumplimiento de nuestras
          obligaciones legales, conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 de Colombia.
        </p>
      </LegalSection>

      <LegalSection id="conservacion" title="6. Conservación de los datos">
        <LegalList>
          <li>
            <strong className="text-ink">Conversaciones de Instagram:</strong> permanecen alojadas en
            la infraestructura de Meta y sujetas a sus políticas. Accedemos a ellas para atenderte
            mientras la conversación siga siendo relevante.
          </li>
          <li>
            <strong className="text-ink">Registros técnicos del servidor:</strong> nuestro sistema
            genera registros operativos temporales que conserva nuestro proveedor de infraestructura
            durante un periodo breve y que se eliminan de forma automática. Estos registros contienen
            únicamente metadatos (tipo de evento e identificadores parcialmente enmascarados), nunca
            el contenido de los mensajes.
          </li>
          <li>
            <strong className="text-ink">Datos de contacto y propuestas:</strong> se conservan
            mientras dure la relación y, después, durante los plazos exigidos por la legislación
            aplicable en materia comercial, contable y de responsabilidad.
          </li>
        </LegalList>
        <p>
          Cuando los datos dejan de ser necesarios para las finalidades descritas y no existe una
          obligación legal de conservarlos, se eliminan.
        </p>
      </LegalSection>

      <LegalSection id="seguridad" title="7. Cómo protegemos la información">
        <LegalList>
          <li>Todo el sitio y sus comunicaciones se sirven cifrados mediante HTTPS.</li>
          <li>
            Las credenciales de la integración se almacenan como secretos cifrados en el entorno de
            servidor de nuestro proveedor de hosting. Nunca se incluyen en el código público del
            sitio, ni se envían al navegador, ni son accesibles desde el lado del cliente.
          </li>
          <li>
            Verificamos criptográficamente la autenticidad de cada notificación recibida de Meta,
            de modo que se rechaza cualquier petición que no provenga realmente de la plataforma.
          </li>
          <li>
            Aplicamos minimización de datos: los identificadores se enmascaran en los registros
            técnicos y el contenido de los mensajes no se escribe en ellos.
          </li>
          <li>El acceso a la cuenta y a las herramientas de gestión está restringido al equipo de CYMARQ.</li>
        </LegalList>
        <p>
          Ningún sistema es completamente infalible. Nos comprometemos a aplicar medidas razonables y
          proporcionales, y a informar de cualquier incidente de seguridad relevante conforme a la
          normativa aplicable.
        </p>
      </LegalSection>

      <LegalSection id="terceros" title="8. Servicios de terceros">
        <p>Para operar el sitio y nuestros canales de atención utilizamos los siguientes proveedores:</p>
        <LegalList>
          <li>
            <strong className="text-ink">Meta Platforms (Instagram y Facebook):</strong> plataforma de
            las cuentas sociales y de la integración de mensajería.
          </li>
          <li>
            <strong className="text-ink">Cloudflare:</strong> alojamiento, distribución y seguridad del
            sitio web.
          </li>
          <li>
            <strong className="text-ink">Google Analytics:</strong> estadísticas agregadas de uso del
            sitio.
          </li>
          <li>
            <strong className="text-ink">WhatsApp:</strong> canal de contacto directo, cuando eliges
            usarlo.
          </li>
        </LegalList>
        <p>
          Cada uno trata los datos conforme a sus propias políticas de privacidad. Algunos de estos
          proveedores están ubicados fuera de Colombia, por lo que el tratamiento puede implicar una
          transferencia internacional de datos hacia países que ofrecen niveles adecuados de
          protección o que aplican garantías contractuales equivalentes.
        </p>
      </LegalSection>

      <LegalSection id="derechos" title="9. Tus derechos">
        <p>
          Como titular de los datos, y conforme a la Ley 1581 de 2012, puedes en cualquier momento:
        </p>
        <LegalList>
          <li>Conocer, actualizar y rectificar tus datos personales.</li>
          <li>Solicitar prueba de la autorización otorgada.</li>
          <li>Ser informado sobre el uso que damos a tus datos.</li>
          <li>
            Revocar la autorización y solicitar la supresión de tus datos, cuando no exista un deber
            legal o contractual que lo impida.
          </li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio de Colombia.</li>
        </LegalList>
        <p>
          Para ejercerlos, escríbenos a{' '}
          <a href={`mailto:${site.privacyEmail}`} className="link-underline text-ink">
            {site.privacyEmail}
          </a>{' '}
          indicando tu solicitud y un medio de contacto. Atenderemos las consultas en un plazo máximo
          de diez (10) días hábiles y los reclamos en un plazo máximo de quince (15) días hábiles,
          prorrogables en los términos previstos por la ley cuando resulte necesario, informándote
          siempre del motivo de la prórroga.
        </p>
      </LegalSection>

      <LegalSection id="eliminacion" title="10. Eliminación de datos">
        <p>
          Si quieres que eliminemos la información asociada a tu interacción con nosotros a través de
          Instagram o Meta, hemos preparado una página con el procedimiento detallado:
        </p>
        <p>
          <Link href="/eliminacion-de-datos/" className="link-underline font-medium text-ink">
            Instrucciones de eliminación de datos →
          </Link>
        </p>
      </LegalSection>

      <LegalSection id="menores" title="11. Menores de edad">
        <p>
          Nuestros servicios y canales se dirigen a personas mayores de edad. No recopilamos de forma
          consciente datos de menores. Si detectamos que hemos recibido información de un menor sin la
          autorización de su representante legal, la eliminaremos.
        </p>
      </LegalSection>

      <LegalSection id="cambios" title="12. Cambios en esta política">
        <p>
          Podemos actualizar esta política para reflejar cambios legales, técnicos o en nuestros
          servicios. La versión vigente será siempre la publicada en esta página, con su fecha de
          última actualización. Te recomendamos revisarla periódicamente.
        </p>
      </LegalSection>

      <LegalSection id="contacto" title="13. Contacto">
        <p>
          Para cualquier duda sobre esta política o sobre el tratamiento de tus datos personales:
        </p>
        <LegalList>
          <li>
            Correo:{' '}
            <a href={`mailto:${site.privacyEmail}`} className="link-underline text-ink">
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
