import Link from 'next/link';
import LegalPage, { LegalList, LegalNote, LegalSection } from '@/components/LegalPage';
import { site } from '@/data/site';

const title = 'Términos y condiciones';
const description =
  'Términos y condiciones de uso del sitio web de CYMARQ y de sus canales de contacto, incluida la interacción a través de servicios externos como Meta e Instagram.';

export const metadata = {
  title,
  description,
  alternates: {
    canonical: '/terminos-y-condiciones/',
  },
  openGraph: {
    title: `${title} | CYMARQ`,
    description,
    url: '/terminos-y-condiciones/',
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

export default function TerminosYCondicionesPage() {
  return (
    <LegalPage
      label="Legal"
      title={
        <>
          Términos y <em className="text-gold">condiciones</em>
        </>
      }
      lead="Condiciones de uso del sitio web de CYMARQ, de sus contenidos y de los canales de contacto asociados."
      updatedAt="29 de julio de 2026"
    >
      <LegalSection id="objeto" title="1. Objeto y aceptación">
        <p>
          Estos términos regulan el acceso y uso del sitio web{' '}
          <a href={site.url} className="link-underline text-ink">
            {site.url}
          </a>
          , titularidad de <strong className="text-ink">CYMARQ</strong>, estudio de arquitectura,
          diseño y construcción con actividad en {site.location}.
        </p>
        <p>
          Al navegar por el sitio o contactarnos por cualquiera de nuestros canales, aceptas estas
          condiciones en su totalidad. Si no estás de acuerdo con ellas, te pedimos que no utilices el
          sitio.
        </p>
      </LegalSection>

      <LegalSection id="uso" title="2. Uso del sitio">
        <p>Al utilizar este sitio te comprometes a:</p>
        <LegalList>
          <li>Hacer un uso lícito, adecuado y conforme a estos términos y a la legislación vigente.</li>
          <li>No introducir ni difundir contenidos ilícitos, ofensivos, difamatorios o engañosos.</li>
          <li>
            No intentar acceder sin autorización a sistemas, endpoints o áreas restringidas, ni
            realizar acciones que comprometan la seguridad, la disponibilidad o la integridad del
            sitio.
          </li>
          <li>
            No emplear medios automatizados para extraer, copiar o reproducir masivamente los
            contenidos.
          </li>
          <li>Proporcionar información veraz cuando nos contactes.</li>
        </LegalList>
      </LegalSection>

      <LegalSection id="contenidos" title="3. Naturaleza de los contenidos">
        <p>
          La información publicada en este sitio —incluidos textos, imágenes, renders, vídeos,
          visualizaciones tridimensionales y descripciones de proyectos— tiene carácter{' '}
          <strong className="text-ink">informativo y divulgativo</strong>.
        </p>
        <LegalList>
          <li>
            No constituye una oferta comercial vinculante, ni un presupuesto, ni un compromiso de
            contratación.
          </li>
          <li>
            No sustituye la asesoría técnica, arquitectónica, estructural, jurídica ni normativa
            aplicable a un caso concreto.
          </li>
          <li>
            Los proyectos mostrados son referencias del trabajo realizado. Sus características,
            acabados, dimensiones y plazos corresponden a cada encargo específico y no son
            extrapolables a otros.
          </li>
          <li>
            Las imágenes y renders son representaciones de intención de diseño y pueden diferir del
            resultado construido.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="propiedad" title="4. Propiedad intelectual">
        <p>
          Todos los contenidos del sitio —diseño, marca, logotipo, textos, fotografías, renders,
          modelos tridimensionales, planos, vídeos y código— son titularidad de CYMARQ o de sus
          respectivos autores, y están protegidos por la normativa colombiana e internacional sobre
          derechos de autor y propiedad industrial.
        </p>
        <p>
          Queda prohibida su reproducción, distribución, comunicación pública, transformación o
          cualquier otro uso, total o parcial, sin autorización previa y por escrito de CYMARQ. Se
          permite la cita puntual con fines informativos siempre que se atribuya expresamente la
          autoría y se enlace a este sitio.
        </p>
      </LegalSection>

      <LegalSection id="servicios" title="5. Contratación de servicios">
        <p>
          La prestación efectiva de servicios de arquitectura, diseño, construcción, interventoría,
          consultoría o cualquier otro ofrecido por CYMARQ se formaliza siempre mediante una propuesta
          u oferta específica y su correspondiente contrato, en el que se detallan el alcance, los
          entregables, los plazos, las condiciones económicas y las responsabilidades de cada parte.
        </p>
        <p>
          Ninguna comunicación mantenida a través del sitio web, Instagram, WhatsApp o correo
          electrónico constituye por sí sola la formalización de un encargo profesional.
        </p>
      </LegalSection>

      <LegalSection id="canales" title="6. Canales de contacto e integración con Meta e Instagram">
        <p>
          CYMARQ atiende consultas a través de correo electrónico, WhatsApp y su cuenta profesional de
          Instagram <strong className="text-ink">{site.instagramHandle}</strong>. Para gestionar los
          mensajes y comentarios recibidos en Instagram utilizamos la integración oficial que Meta
          pone a disposición de las cuentas profesionales.
        </p>
        <LegalList>
          <li>
            El uso de Instagram, Facebook o WhatsApp se rige adicionalmente por los términos y
            políticas propios de Meta Platforms, que aceptas frente a dicha compañía y sobre los que
            CYMARQ no tiene control.
          </li>
          <li>
            Las respuestas se atienden en horario laboral y no son inmediatas. Estos canales{' '}
            <strong className="text-ink">no deben utilizarse para urgencias</strong> ni para
            comunicaciones que requieran constancia formal.
          </li>
          <li>
            Por limitaciones propias de la plataforma de Meta, la respuesta a un mensaje directo debe
            producirse dentro de una ventana temporal determinada desde su recepción. Si ese plazo
            expira, puede ser necesario que reinicies la conversación.
          </li>
          <li>
            La disponibilidad de esta integración depende de servicios de terceros y puede verse
            interrumpida o modificada sin previo aviso.
          </li>
        </LegalList>
        <LegalNote>
          Te recomendamos no enviar por estos canales información sensible, credenciales, datos
          bancarios ni documentación confidencial. Para ese tipo de información utilizaremos siempre
          un medio acordado previamente contigo.
        </LegalNote>
      </LegalSection>

      <LegalSection id="enlaces" title="7. Enlaces y servicios de terceros">
        <p>
          El sitio puede contener enlaces a plataformas externas. CYMARQ no controla dichos sitios ni
          responde por sus contenidos, sus prácticas de privacidad ni por los daños que pudieran
          derivarse de su uso. La inclusión de un enlace no implica recomendación ni vínculo alguno
          con su titular.
        </p>
      </LegalSection>

      <LegalSection id="disponibilidad" title="8. Disponibilidad y modificaciones">
        <p>
          CYMARQ procura mantener el sitio accesible y actualizado, pero no garantiza su
          disponibilidad ininterrumpida ni la ausencia de errores. Nos reservamos el derecho de
          modificar, suspender o retirar, total o parcialmente y sin previo aviso, los contenidos, la
          estructura o los servicios del sitio, así como de actualizar estos términos.
        </p>
        <p>
          La versión vigente será siempre la publicada en esta página, con su fecha de última
          actualización.
        </p>
      </LegalSection>

      <LegalSection id="responsabilidad" title="9. Limitación de responsabilidad">
        <p>
          En la máxima medida permitida por la ley, CYMARQ no será responsable de los daños o
          perjuicios derivados de:
        </p>
        <LegalList>
          <li>
            Decisiones adoptadas exclusivamente sobre la base de la información publicada en el sitio,
            sin la asesoría profesional correspondiente.
          </li>
          <li>Interrupciones, fallos técnicos o indisponibilidad del sitio o de servicios de terceros.</li>
          <li>
            El uso indebido del sitio por parte de terceros, o la presencia de elementos dañinos
            introducidos por estos.
          </li>
          <li>Contenidos alojados en plataformas externas enlazadas desde el sitio.</li>
        </LegalList>
        <p>
          Nada en estos términos excluye la responsabilidad que resulte inderogable conforme a la
          legislación aplicable.
        </p>
      </LegalSection>

      <LegalSection id="datos" title="10. Protección de datos personales">
        <p>
          El tratamiento de datos personales se rige por nuestra{' '}
          <Link href="/politica-de-privacidad/" className="link-underline font-medium text-ink">
            política de privacidad
          </Link>
          . Si deseas solicitar la eliminación de tus datos, consulta las{' '}
          <Link href="/eliminacion-de-datos/" className="link-underline font-medium text-ink">
            instrucciones de eliminación de datos
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="ley" title="11. Legislación aplicable y jurisdicción">
        <p>
          Estos términos se rigen por la legislación de la República de Colombia. Cualquier
          controversia derivada de su interpretación o aplicación se someterá a los jueces y
          tribunales competentes de Colombia, sin perjuicio de los derechos que la normativa de
          protección al consumidor reconozca al usuario.
        </p>
      </LegalSection>

      <LegalSection id="contacto" title="12. Contacto">
        <LegalList>
          <li>
            Correo general:{' '}
            <a href={`mailto:${site.email}`} className="link-underline text-ink">
              {site.email}
            </a>
          </li>
          <li>
            Asuntos legales y de privacidad:{' '}
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
        </LegalList>
      </LegalSection>
    </LegalPage>
  );
}
