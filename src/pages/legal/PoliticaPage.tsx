import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Users } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
    <h2 className="text-base font-display font-bold text-slate-900">{title}</h2>
    <div className="text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>
  </div>
);

const PoliticaPage = () => (
  <div className="min-h-screen flex flex-col public-glass">
    <Navbar />

    <div className="bg-white border-b border-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
          </div>
          <span className="text-brand-600 text-sm font-semibold">Legal</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Normas de la Comunidad</h1>
        <p className="text-slate-400 text-sm">Última actualización: junio de 2025 · Sanos y Salvos</p>
      </div>
    </div>

    <div className="flex-1 max-w-3xl mx-auto px-6 py-8 w-full space-y-4">

      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
        <p className="text-sm text-brand-800 leading-relaxed">
          Sanos y Salvos es una comunidad creada con un propósito claro: ayudar a reunir mascotas
          perdidas con sus familias. Para que eso sea posible, necesitamos que cada persona que
          forma parte de esta plataforma actúe con honestidad, respeto y empatía. Estas normas
          definen lo que esperamos de todos nuestros usuarios.
        </p>
      </div>

      <Section title="1. Veracidad en los Reportes">
        <p>
          Cada reporte publicado en Sanos y Salvos debe corresponder a una situación real.
          Publicar reportes falsos, duplicados o con información engañosa perjudica directamente
          a quienes buscan a sus mascotas y sobrecarga el sistema de emparejamiento.
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>No inventes reportes de mascotas que no existen.</li>
          <li>No publiques el mismo reporte más de una vez.</li>
          <li>Actualiza el estado del reporte cuando la mascota sea encontrada o el caso se resuelva.</li>
          <li>Usa fotos reales y actuales de la mascota.</li>
        </ul>
      </Section>

      <Section title="2. Respeto en la Mensajería Privada">
        <p>
          La mensajería privada existe para que dos personas puedan coordinar el reencuentro de
          una mascota de manera segura. Es un espacio de colaboración, no de confrontación.
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Trata a la otra persona con respeto y cordialidad en todo momento.</li>
          <li>No envíes mensajes intimidantes, amenazantes o acosadores.</li>
          <li>No compartas contenido inapropiado, ofensivo o de índole sexual.</li>
          <li>Si compartes imágenes, asegúrate de que sean relevantes para la situación (fotos de la mascota, lugar de encuentro, etc.).</li>
          <li>No solicites dinero ni realices transacciones comerciales a través de la plataforma.</li>
        </ul>
      </Section>

      <Section title="3. Prohibición de Conductas Fraudulentas">
        <p>
          Está estrictamente prohibido utilizar la Plataforma para engañar, extorsionar o explotar
          a otros usuarios. Conductas como las siguientes resultarán en la suspensión permanente de la cuenta:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Reclamar una mascota que no te pertenece.</li>
          <li>Pedir recompensas excesivas o condicionar la devolución al pago de dinero.</li>
          <li>Suplantar la identidad de otra persona, veterinaria o institución.</li>
          <li>Usar la plataforma para obtener datos personales de otros usuarios con fines distintos al reencuentro de mascotas.</li>
        </ul>
      </Section>

      <Section title="4. Contenido Permitido">
        <p>Todo el contenido publicado en Sanos y Salvos debe cumplir los siguientes criterios:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          {[
            { label: 'Permitido', items: ['Fotos reales de la mascota', 'Descripción honesta del animal', 'Información de contacto propia', 'Imágenes del lugar donde fue vista'], color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
            { label: 'No permitido', items: ['Imágenes violentas o de maltrato animal', 'Contenido sexualmente explícito', 'Propaganda política o religiosa', 'Publicidad o promoción de servicios'], color: 'bg-red-50 border-red-100', text: 'text-red-700' },
          ].map((col) => (
            <div key={col.label} className={`rounded-xl border p-4 ${col.color}`}>
              <p className={`font-semibold text-xs uppercase tracking-wide mb-2 ${col.text}`}>{col.label}</p>
              <ul className="space-y-1">
                {col.items.map((item) => (
                  <li key={item} className="text-slate-600 flex items-start gap-1.5">
                    <span className={`mt-0.5 font-bold ${col.text}`}>{col.label === 'Permitido' ? '✓' : '✗'}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="5. Moderación y Denuncias">
        <p>
          Sanos y Salvos cuenta con un equipo de moderación que revisa las denuncias realizadas
          por los usuarios. Si una conversación te hace sentir inseguro/a o detectas un comportamiento
          contrario a estas normas, puedes reportar la sala de chat directamente desde la conversación.
        </p>
        <p>
          Nuestro equipo evaluará cada reporte y podrá tomar las siguientes acciones según la
          gravedad de la situación:
        </p>
        <div className="space-y-2 mt-1">
          {[
            { accion: 'Advertencia', desc: 'Notificación al usuario sobre su conducta.' },
            { accion: 'Congelamiento de sala', desc: 'La conversación se pausa mientras se investiga el reporte.' },
            { accion: 'Clausura de sala', desc: 'La conversación se cierra definitivamente. El historial queda disponible solo para el equipo de soporte.' },
            { accion: 'Suspensión de cuenta', desc: 'El acceso del usuario es bloqueado temporalmente.' },
            { accion: 'Eliminación de cuenta', desc: 'La cuenta es removida permanentemente de la Plataforma.' },
          ].map((item) => (
            <div key={item.accion} className="flex gap-3 bg-slate-50 rounded-xl p-3">
              <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-700">{item.accion}</p>
                <p className="text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="6. Bienestar Animal">
        <p>
          Sanos y Salvos promueve activamente el bienestar y la protección de los animales. Cualquier
          indicio de maltrato, abandono intencional o tráfico de animales detectado en la Plataforma
          será reportado a las autoridades competentes y resultará en la suspensión inmediata
          de la cuenta involucrada.
        </p>
      </Section>

      <Section title="7. Seguridad en los Encuentros">
        <p>
          Si coordinaste el reencuentro de una mascota a través de la Plataforma, te recomendamos:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Realizar el intercambio en un lugar público y concurrido.</li>
          <li>Ir acompañado/a por otra persona de confianza.</li>
          <li>Verificar la identidad de la otra persona antes del encuentro.</li>
          <li>Solicitar fotos adicionales de la mascota si tienes dudas sobre su identidad.</li>
          <li>Nunca transferir dinero por adelantado.</li>
        </ul>
        <p>
          Sanos y Salvos no se responsabiliza por los encuentros físicos entre usuarios. Ante
          cualquier situación de riesgo, contacta a Carabineros de Chile al <strong>133</strong>.
        </p>
      </Section>

      <Section title="8. Cumplimiento y Sanciones">
        <p>
          El incumplimiento de estas Normas podrá derivar en acciones disciplinarias que van desde
          la advertencia hasta la eliminación permanente de la cuenta, a sola decisión del equipo
          de moderación de Sanos y Salvos, sin perjuicio de las acciones legales que correspondan.
        </p>
        <p>
          Las decisiones del equipo de moderación son definitivas. Si crees que una sanción fue
          aplicada por error, puedes apelar enviando un correo a:{' '}
          <a href="mailto:legal@sanosysalvos.cl" className="text-brand-600 hover:underline font-medium">
            legal@sanosysalvos.cl
          </a>
        </p>
      </Section>

    </div>
    <Footer />
  </div>
);

export default PoliticaPage;
