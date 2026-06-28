import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { ShieldCheck } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
    <h2 className="text-base font-display font-bold text-slate-900">{title}</h2>
    <div className="text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>
  </div>
);

const PrivacidadPage = () => (
  <div className="min-h-screen flex flex-col public-glass">
    <Navbar />

    <div className="bg-white border-b border-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
          </div>
          <span className="text-brand-600 text-sm font-semibold">Legal</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Política de Privacidad</h1>
        <p className="text-slate-400 text-sm">Última actualización: junio de 2025 · Sanos y Salvos</p>
      </div>
    </div>

    <div className="flex-1 max-w-3xl mx-auto px-6 py-8 w-full space-y-4">

      <Section title="1. Responsable del Tratamiento">
        <p>
          Sanos y Salvos es responsable del tratamiento de los datos personales recopilados a través
          de la Plataforma, de conformidad con la <strong>Ley N° 19.628 sobre Protección de la Vida Privada</strong>{' '}
          de la República de Chile y sus modificaciones vigentes.
        </p>
        <p>
          Correo de contacto para materias de privacidad:{' '}
          <a href="mailto:legal@sanosysalvos.cl" className="text-brand-600 hover:underline font-medium">
            legal@sanosysalvos.cl
          </a>
        </p>
      </Section>

      <Section title="2. Datos que Recopilamos">
        <p>Al registrarse y utilizar la Plataforma, podemos recopilar las siguientes categorías de datos:</p>

        <div className="space-y-3 mt-1">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="font-semibold text-slate-700 mb-1">Datos de identificación</p>
            <p>Nombre y apellidos, correo electrónico, número de teléfono, RUN (personas naturales) o RUT (instituciones), región y comuna de residencia.</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="font-semibold text-slate-700 mb-1">Datos de ubicación</p>
            <p>Coordenadas geográficas aproximadas asociadas a los reportes de mascotas publicados por el usuario.</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="font-semibold text-slate-700 mb-1">Imágenes y archivos</p>
            <p>Fotografías de mascotas cargadas en reportes, imágenes de perfil e imágenes compartidas voluntariamente en conversaciones privadas.</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="font-semibold text-slate-700 mb-1">Datos de uso</p>
            <p>Registros de acceso, actividad en la Plataforma, tickets de soporte enviados e interacciones con el sistema.</p>
          </div>
        </div>
      </Section>

      <Section title="3. Finalidad del Tratamiento">
        <p>Los datos personales se utilizan exclusivamente para:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Gestionar la cuenta y autenticar al usuario en la Plataforma.</li>
          <li>Publicar y gestionar reportes de mascotas perdidas y encontradas.</li>
          <li>Calcular coincidencias entre reportes y notificar a los usuarios involucrados.</li>
          <li>Facilitar la comunicación entre usuarios mediante mensajería privada.</li>
          <li>Prestar el servicio de soporte y atender solicitudes de los usuarios.</li>
          <li>Garantizar la seguridad, integridad y moderación de la Plataforma.</li>
          <li>Cumplir con obligaciones legales aplicables.</li>
        </ul>
        <p className="font-medium text-slate-700">
          Sanos y Salvos no utiliza los datos personales con fines publicitarios ni los cede a terceros
          con propósitos comerciales.
        </p>
      </Section>

      <Section title="4. Base Legal del Tratamiento">
        <p>El tratamiento de datos personales se basa en:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>El <strong>consentimiento</strong> del usuario al aceptar esta Política al momento del registro.</li>
          <li>La <strong>ejecución del contrato</strong> de prestación de servicios que implica el uso de la Plataforma.</li>
          <li>El <strong>cumplimiento de obligaciones legales</strong> aplicables a la Plataforma.</li>
        </ul>
      </Section>

      <Section title="5. Comunicación de Datos a Terceros">
        <p>Sanos y Salvos no vende ni transfiere datos personales a terceros. Podrá compartirlos únicamente en los siguientes casos:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Con <strong>proveedores de servicios técnicos</strong> (alojamiento, correo electrónico transaccional) bajo estrictas condiciones de confidencialidad y únicamente en la medida necesaria para prestar el servicio.</li>
          <li>Cuando sea <strong>requerido por autoridad judicial o administrativa</strong> competente conforme a la legislación chilena vigente.</li>
        </ul>
      </Section>

      <Section title="6. Almacenamiento y Seguridad">
        <p>
          Los datos son almacenados en servidores seguros. Aplicamos medidas técnicas y organizativas
          razonables para proteger la información contra accesos no autorizados, pérdida, alteración
          o destrucción, incluyendo cifrado de contraseñas, tokens de acceso de corta duración y
          control de acceso por roles.
        </p>
        <p>
          No obstante, ningún sistema de seguridad es infalible. En caso de una brecha de seguridad
          que afecte datos personales, notificaremos a los usuarios afectados en el menor plazo posible.
        </p>
      </Section>

      <Section title="7. Plazo de Conservación">
        <p>
          Los datos personales se conservan mientras la cuenta del usuario esté activa en la Plataforma.
          Al solicitar la eliminación de la cuenta, los datos serán suprimidos en un plazo máximo de
          30 días, salvo aquellos que deban conservarse por obligación legal o para la resolución de
          disputas pendientes.
        </p>
      </Section>

      <Section title="8. Derechos del Titular de los Datos">
        <p>Conforme a la Ley N° 19.628, usted tiene los siguientes derechos respecto de sus datos personales:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          {[
            { nombre: 'Acceso', desc: 'Solicitar información sobre los datos que tenemos de usted.' },
            { nombre: 'Rectificación', desc: 'Corregir datos inexactos, incompletos o desactualizados.' },
            { nombre: 'Cancelación', desc: 'Solicitar la supresión de sus datos cuando ya no sean necesarios.' },
            { nombre: 'Oposición', desc: 'Oponerse al tratamiento en casos justificados por ley.' },
          ].map((d) => (
            <div key={d.nombre} className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold text-slate-700 text-xs uppercase tracking-wide mb-1">{d.nombre}</p>
              <p className="text-slate-500">{d.desc}</p>
            </div>
          ))}
        </div>
        <p>
          Para ejercer cualquiera de estos derechos, escríbanos a:{' '}
          <a href="mailto:legal@sanosysalvos.cl" className="text-brand-600 hover:underline font-medium">
            legal@sanosysalvos.cl
          </a>{' '}
          indicando su nombre, RUN y el derecho que desea ejercer. Responderemos en un plazo máximo de 15 días hábiles.
        </p>
      </Section>

      <Section title="9. Cookies y Almacenamiento Local">
        <p>
          La Plataforma utiliza <strong>localStorage</strong> del navegador para conservar el token de
          sesión del usuario entre visitas. No utilizamos cookies de rastreo publicitario, ni
          compartimos datos de navegación con redes de publicidad de ningún tipo.
        </p>
      </Section>

      <Section title="10. Transferencia Internacional de Datos">
        <p>
          Los datos pueden ser procesados en servidores ubicados fuera de Chile en el marco de la
          prestación de servicios técnicos (por ejemplo, servicios de correo transaccional o
          almacenamiento en la nube). En tales casos, exigimos contractualmente a los proveedores
          estándares de seguridad equivalentes a los exigidos por la legislación chilena.
        </p>
      </Section>

      <Section title="11. Cambios a esta Política">
        <p>
          Esta Política podrá actualizarse periódicamente para reflejar cambios en nuestras prácticas
          o en la legislación aplicable. Notificaremos cambios relevantes a través de la Plataforma
          o por correo electrónico con al menos 5 días de anticipación.
        </p>
      </Section>

      <Section title="12. Contacto">
        <p>
          Para cualquier consulta o reclamo relacionado con el tratamiento de sus datos personales,
          contáctenos en:{' '}
          <a href="mailto:legal@sanosysalvos.cl" className="text-brand-600 hover:underline font-medium">
            legal@sanosysalvos.cl
          </a>
        </p>
      </Section>

    </div>
    <Footer />
  </div>
);

export default PrivacidadPage;
