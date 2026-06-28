import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { ScrollText } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
    <h2 className="text-base font-display font-bold text-slate-900">{title}</h2>
    <div className="text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>
  </div>
);

const TerminosPage = () => (
  <div className="min-h-screen flex flex-col public-glass">
    <Navbar />

    <div className="bg-white border-b border-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <ScrollText className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
          </div>
          <span className="text-brand-600 text-sm font-semibold">Legal</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Términos y Condiciones de Uso</h1>
        <p className="text-slate-400 text-sm">Última actualización: junio de 2025 · Sanos y Salvos</p>
      </div>
    </div>

    <div className="flex-1 max-w-3xl mx-auto px-6 py-8 w-full space-y-4">

      <Section title="1. Aceptación de los Términos">
        <p>
          Al acceder y utilizar la plataforma Sanos y Salvos (en adelante, "la Plataforma"), usted acepta
          quedar vinculado por los presentes Términos y Condiciones de Uso. Si no está de acuerdo con
          alguna de estas condiciones, le rogamos que no utilice la Plataforma.
        </p>
      </Section>

      <Section title="2. Descripción del Servicio">
        <p>
          Sanos y Salvos es una plataforma digital chilena de carácter <strong>completamente gratuito</strong>,
          cuyo propósito es facilitar la publicación de reportes de mascotas perdidas o encontradas, con
          el fin de contribuir a su reencuentro con sus dueños.
        </p>
        <p>La Plataforma incluye las siguientes funciones:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Publicación y búsqueda de reportes de mascotas perdidas y encontradas.</li>
          <li>Geolocalización de reportes en un mapa interactivo.</li>
          <li>Sistema automático de emparejamiento de reportes compatibles.</li>
          <li>Mensajería privada entre usuarios con un match confirmado.</li>
          <li>Sistema de soporte y atención al usuario.</li>
        </ul>
      </Section>

      <Section title="3. Elegibilidad y Requisitos de Registro">
        <p>
          El uso de la Plataforma está reservado a personas naturales <strong>mayores de 18 años</strong> de
          edad, y a instituciones legalmente constituidas en Chile (veterinarias, municipalidades y
          organizaciones afines). Al registrarse, usted declara cumplir con este requisito.
        </p>
        <p>El usuario debe proporcionar información veraz, completa y actualizada, incluyendo:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Número de RUN válido (personas naturales), verificado mediante el algoritmo módulo 11.</li>
          <li>RUT institucional (para organizaciones).</li>
          <li>Correo electrónico y número de teléfono de contacto.</li>
        </ul>
        <p>
          El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de
          todas las actividades que ocurran bajo su cuenta.
        </p>
      </Section>

      <Section title="4. Uso Aceptable">
        <p>El usuario se compromete expresamente a:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Publicar únicamente reportes verídicos de mascotas perdidas o encontradas.</li>
          <li>No utilizar la Plataforma para fines fraudulentos, comerciales no autorizados o contrarios a la ley.</li>
          <li>Respetar a otros usuarios en las conversaciones de mensajería privada.</li>
          <li>No publicar contenido ofensivo, violento, discriminatorio o que vulnere derechos de terceros.</li>
          <li>No suplantar la identidad de otras personas o instituciones.</li>
          <li>No intentar acceder a sistemas, datos o cuentas de otros usuarios sin autorización.</li>
        </ul>
      </Section>

      <Section title="5. Publicación de Reportes">
        <p>
          Los reportes publicados deben corresponder a mascotas reales. Sanos y Salvos no se hace
          responsable de la veracidad de la información publicada por los usuarios. La Plataforma
          se reserva el derecho de remover reportes que incumplan los presentes Términos o las
          Normas de la Comunidad.
        </p>
        <p>
          Los reportes podrán cambiar de estado automáticamente o por intervención del equipo de
          soporte a: <strong>En búsqueda</strong>, <strong>Resuelto</strong>, <strong>Abandonado</strong> u <strong>Oculto</strong>.
        </p>
      </Section>

      <Section title="6. Mensajería Privada">
        <p>
          La mensajería privada se habilita cuando el sistema detecta una posible coincidencia entre
          un reporte de mascota perdida y uno de mascota encontrada. Los usuarios deben utilizar este
          canal con respeto y buena fe.
        </p>
        <p>
          La Plataforma puede intervenir, congelar o clausurar conversaciones ante denuncias fundadas
          de mal uso, acoso, amenazas u otra conducta contraria a las normas. Las conversaciones
          clausuradas son irreversibles y el historial queda disponible únicamente para el equipo
          de moderación.
        </p>
      </Section>

      <Section title="7. Contenido del Usuario">
        <p>
          Al publicar reportes, imágenes u otro contenido en la Plataforma, el usuario otorga a
          Sanos y Salvos una licencia no exclusiva, gratuita y revocable para mostrar dicho contenido
          dentro de la Plataforma con el único fin de prestar el servicio. El usuario declara que
          tiene los derechos necesarios sobre el contenido que publica.
        </p>
      </Section>

      <Section title="8. Suspensión y Cancelación de Cuentas">
        <p>Sanos y Salvos se reserva el derecho de suspender o eliminar cuentas que:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Proporcionen información falsa al momento del registro.</li>
          <li>Incumplan los presentes Términos o las Normas de la Comunidad.</li>
          <li>Sean reportadas reiteradamente por otros usuarios.</li>
          <li>Realicen actividades que perjudiquen la seguridad o integridad de la Plataforma.</li>
        </ul>
      </Section>

      <Section title="9. Propiedad Intelectual">
        <p>
          El diseño, código fuente, logotipos, nombre comercial y demás elementos de la Plataforma
          son propiedad de Sanos y Salvos. Queda prohibida su reproducción total o parcial sin
          autorización expresa y por escrito.
        </p>
      </Section>

      <Section title="10. Limitación de Responsabilidad">
        <p>
          Sanos y Salvos actúa exclusivamente como intermediario y <strong>no garantiza el reencuentro
          efectivo de mascotas</strong>. La Plataforma no se responsabiliza por acuerdos, transacciones
          o encuentros físicos entre usuarios realizados fuera de la misma, ni por los resultados
          de dichos encuentros.
        </p>
        <p>
          El servicio se ofrece "tal como está" y podría estar sujeto a interrupciones por
          mantenimiento o causas de fuerza mayor.
        </p>
      </Section>

      <Section title="11. Modificaciones a los Términos">
        <p>
          Sanos y Salvos podrá modificar los presentes Términos en cualquier momento. Los cambios
          serán notificados a los usuarios registrados y/o publicados en la Plataforma con al menos
          5 días de anticipación. El uso continuado de la Plataforma tras la publicación de los
          cambios implica la aceptación de los mismos.
        </p>
      </Section>

      <Section title="12. Ley Aplicable y Jurisdicción">
        <p>
          Los presentes Términos se rigen por la legislación de la República de Chile. Cualquier
          disputa derivada de su interpretación o cumplimiento será sometida a los tribunales
          ordinarios de justicia de la ciudad de Santiago, Chile.
        </p>
      </Section>

      <Section title="13. Contacto">
        <p>
          Para consultas relacionadas con estos Términos, puede escribirnos a:{' '}
          <a href="mailto:legal@sanosysalvos.cl" className="text-brand-600 hover:underline font-medium">
            legal@sanosysalvos.cl
          </a>
        </p>
      </Section>

    </div>
    <Footer />
  </div>
);

export default TerminosPage;
