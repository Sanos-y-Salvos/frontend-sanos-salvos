export interface FlowOption {
  label: string;
  next: string; // step ID | 'EXIT_FLOW' | 'SELECTOR'
}

export interface FlowStep {
  bot: string;
  options: FlowOption[];
}

export const FLOW_STEPS: Record<string, FlowStep> = {

  /* ── Selector de tipo de caso ─────────────────────────── */
  selector: {
    bot: 'Voy a guiarte paso a paso. ¿Qué tipo de denuncia estás revisando en esta sala?',
    options: [
      { label: 'Acoso o amenazas',              next: 'acoso_1' },
      { label: 'Extorsión / pedido de dinero',  next: 'extorsion_1' },
      { label: 'Contenido inapropiado',         next: 'contenido_1' },
      { label: 'Fraude o engaño',               next: 'fraude_1' },
      { label: 'Suplantación de identidad',     next: 'suplantacion_1' },
      { label: 'Sospecha de maltrato animal',   next: 'maltrato_1' },
    ],
  },

  /* ── ACOSO / AMENAZAS ─────────────────────────────────── */
  acoso_1: {
    bot: '¿Qué tipo de conducta contiene la sala?',
    options: [
      { label: 'Amenazas directas (daño físico, acecho, exponer info)', next: 'acoso_amenaza' },
      { label: 'Insultos u hostigamiento sin amenazas',                  next: 'acoso_hostigamiento' },
      { label: 'No estoy seguro, debo revisar más',                      next: 'acoso_revisar' },
    ],
  },

  acoso_revisar: {
    bot: 'Revisa el historial completo de la sala buscando:\n\n• Frases como «te voy a...», «sé dónde vives», «voy a publicar...»\n• Hostigamiento repetido a lo largo de la conversación\n• Cambio de tono agresivo\n\nUna vez revisado, ¿qué encontraste?',
    options: [
      { label: 'Hay amenazas directas',           next: 'acoso_amenaza' },
      { label: 'Hay insultos pero sin amenazas',  next: 'acoso_hostigamiento' },
      { label: 'No hay violación de normas',      next: 'no_violacion' },
    ],
  },

  acoso_amenaza: {
    bot: '⚠️ Amenazas directas — Acción inmediata:\n\n1. Clausura la sala desde el panel de moderación.\n2. Suspende la cuenta del agresor en «Gestión de Usuarios».\n3. Si hay amenazas de daño físico o acecho, recomienda al afectado denunciar a Carabineros (133) o PDI (134).\n4. Crea un ticket interno documentando el caso con capturas.',
    options: [
      { label: 'Hay también contenido inapropiado', next: 'contenido_1' },
      { label: 'Hay también extorsión',             next: 'extorsion_1' },
      { label: 'Caso gestionado',                   next: 'fin' },
    ],
  },

  acoso_hostigamiento: {
    bot: '¿Es la primera vez que este usuario incumple las normas, o hay un patrón reiterado?',
    options: [
      { label: 'Primera infracción',           next: 'acoso_primera' },
      { label: 'Ya tenía advertencias previas', next: 'acoso_reiterado' },
    ],
  },

  acoso_primera: {
    bot: '📋 Primera infracción — Advertencia formal:\n\n1. Congela la sala (si no está ya congelada).\n2. Envía una advertencia al usuario a través de un ticket.\n3. Restaura la sala si no hay más violaciones.\n\nSi el usuario reincide, aplica clausura directa sin advertencia adicional.',
    options: [
      { label: 'El usuario ya fue advertido antes', next: 'acoso_reiterado' },
      { label: 'Entendido, caso gestionado',        next: 'fin' },
    ],
  },

  acoso_reiterado: {
    bot: '🚫 Reincidencia — Sanción definitiva:\n\n1. Clausura la sala.\n2. Suspende o elimina la cuenta según la gravedad.\n3. Oculta los reportes de mascotas publicados por ese usuario.\n4. Documenta todo en un ticket interno.',
    options: [
      { label: 'Acciones completadas', next: 'fin' },
    ],
  },

  /* ── EXTORSIÓN ────────────────────────────────────────── */
  extorsion_1: {
    bot: '¿Cuál es la situación específica?',
    options: [
      { label: 'Pide dinero para devolver la mascota',                  next: 'extorsion_rescate' },
      { label: 'Pide recompensa a cambio de información',               next: 'extorsion_recompensa' },
      { label: 'Condiciona la devolución a favores u otro intercambio', next: 'extorsion_condicion' },
    ],
  },

  extorsion_rescate: {
    bot: '🚨 Rescate de mascota — Extorsión grave (posible delito):\n\n1. Clausura la sala inmediatamente.\n2. Suspende la cuenta del extorsionador.\n3. Oculta todos sus reportes publicados.\n4. Conserva el historial como evidencia — no lo elimines.\n5. Recomienda al afectado denunciar en PDI (134) o Carabineros (133).\n6. Crea un ticket interno documentando el caso.',
    options: [
      { label: 'Acciones completadas', next: 'fin' },
    ],
  },

  extorsion_recompensa: {
    bot: 'Una recompensa razonable y comunicada con respeto es una práctica habitual. ¿El monto es abusivo o el tono es amenazante?',
    options: [
      { label: 'No, parece una recompensa normal',          next: 'no_violacion' },
      { label: 'Sí, monto abusivo o tono amenazante',       next: 'extorsion_rescate' },
    ],
  },

  extorsion_condicion: {
    bot: '🚫 Condicionamiento inaceptable:\n\nCondicionar la devolución de una mascota a favores personales, encuentros o servicios es una infracción severa.\n\n1. Clausura la sala inmediatamente.\n2. Suspende la cuenta del usuario.\n3. Documenta en un ticket interno.\n4. Informa al afectado que puede denunciar a Carabineros (133).',
    options: [
      { label: 'Acciones completadas', next: 'fin' },
    ],
  },

  /* ── CONTENIDO INAPROPIADO ────────────────────────────── */
  contenido_1: {
    bot: '¿Qué tipo de contenido inapropiado contiene la sala?',
    options: [
      { label: 'Imágenes explícitas o violentas',    next: 'contenido_imagenes' },
      { label: 'Lenguaje ofensivo o insultos graves', next: 'acoso_hostigamiento' },
      { label: 'Spam o publicidad no autorizada',    next: 'contenido_spam' },
    ],
  },

  contenido_imagenes: {
    bot: '🚨 Imágenes explícitas o violentas — Tolerancia cero:\n\n1. Clausura la sala inmediatamente.\n2. Suspende la cuenta del usuario que las envió.\n3. Documenta el caso con capturas antes de actuar.\n4. Si las imágenes involucran menores de edad, reporta de inmediato al Ministerio Público.\n5. Crea un ticket interno urgente con todos los detalles.',
    options: [
      { label: 'Acciones completadas', next: 'fin' },
    ],
  },

  contenido_spam: {
    bot: '📢 Spam o publicidad no autorizada:\n\n1. Clausura la sala.\n2. Oculta los reportes de mascotas del usuario.\n3. Si tiene múltiples cuentas haciendo lo mismo, solicita eliminarlas todas.\n4. Documenta en un ticket.',
    options: [
      { label: 'Acciones completadas', next: 'fin' },
    ],
  },

  /* ── FRAUDE / ENGAÑO ──────────────────────────────────── */
  fraude_1: {
    bot: '¿Cuál es la naturaleza del fraude?',
    options: [
      { label: 'Intenta reclamar una mascota que no le pertenece', next: 'fraude_reclamar' },
      { label: 'Publicó información falsa sobre la mascota',        next: 'fraude_info' },
      { label: 'Usa la plataforma para capturar datos de usuarios', next: 'fraude_datos' },
    ],
  },

  fraude_reclamar: {
    bot: '⚠️ Reclamación fraudulenta:\n\n1. Suspende la cuenta sospechosa temporalmente.\n2. Congela la sala — no la clausures aún hasta tener más evidencia.\n3. Solicita al denunciante evidencia adicional (fotos, documentos veterinarios, historial médico).\n4. Contacta al dueño legítimo si puedes identificarlo.\n5. Si la evidencia es concluyente, clausura y suspende definitivamente.\n\nEn caso de duda, prioriza conservar la evidencia antes de actuar.',
    options: [
      { label: 'Hay evidencia concluyente, clausuro', next: 'fraude_reclamar_fin' },
      { label: 'Aún no hay evidencia suficiente',     next: 'fin' },
    ],
  },

  fraude_reclamar_fin: {
    bot: '✅ Con evidencia concluyente:\n\n1. Clausura la sala.\n2. Suspende o elimina la cuenta del fraudulento.\n3. Oculta sus reportes.\n4. Documenta todo en un ticket interno.',
    options: [
      { label: 'Acciones completadas', next: 'fin' },
    ],
  },

  fraude_info: {
    bot: '¿El usuario ya tenía advertencias previas por publicaciones falsas?',
    options: [
      { label: 'Primera vez',              next: 'fraude_info_primera' },
      { label: 'Ya tenía advertencias',   next: 'fraude_info_reiterado' },
    ],
  },

  fraude_info_primera: {
    bot: '📋 Primera infracción:\n\n1. Oculta el reporte falso.\n2. Envía una advertencia formal al usuario vía ticket.\n\nSi reincide, la siguiente acción será la suspensión de cuenta sin advertencia.',
    options: [
      { label: 'Entendido, caso gestionado', next: 'fin' },
    ],
  },

  fraude_info_reiterado: {
    bot: '🚫 Reincidencia en publicaciones falsas:\n\n1. Oculta todos sus reportes.\n2. Suspende la cuenta.\n3. Documenta en un ticket interno.',
    options: [
      { label: 'Acciones completadas', next: 'fin' },
    ],
  },

  fraude_datos: {
    bot: '🚨 Captura de datos de usuario — Infracción grave (Ley 19.628):\n\n1. Clausura la sala inmediatamente.\n2. Suspende la cuenta del agresor.\n3. Notifica al usuario afectado que puede ejercer sus derechos contactando legal@sanosysalvos.cl.\n4. Documenta el caso — puede derivar en denuncia ante la Subsecretaría del Interior.\n5. Crea un ticket interno con toda la evidencia.',
    options: [
      { label: 'Acciones completadas', next: 'fin' },
    ],
  },

  /* ── SUPLANTACIÓN DE IDENTIDAD ────────────────────────── */
  suplantacion_1: {
    bot: '¿A quién está suplantando el usuario?',
    options: [
      { label: 'A otro usuario real de la plataforma',          next: 'suplantacion_usuario' },
      { label: 'A una veterinaria o municipalidad',             next: 'suplantacion_institucion' },
      { label: 'Al equipo de Sanos y Salvos (staff)',           next: 'suplantacion_staff' },
    ],
  },

  suplantacion_usuario: {
    bot: '🚫 Suplantación de usuario:\n\n1. Suspende la cuenta del suplantador.\n2. Si puedes identificar al usuario real afectado, notifícalo.\n3. Clausura la sala si hubiera conversación bajo esa identidad falsa.\n4. Documenta el caso en un ticket interno.',
    options: [
      { label: 'Acciones completadas', next: 'fin' },
    ],
  },

  suplantacion_institucion: {
    bot: '🚫 Suplantación de institución:\n\n1. Suspende la cuenta inmediatamente.\n2. Oculta los reportes publicados bajo esa identidad falsa.\n3. Clausura las salas relacionadas.\n4. Si la institución real existe en la plataforma, notifícala por ticket.\n5. Documenta el caso.',
    options: [
      { label: 'Acciones completadas', next: 'fin' },
    ],
  },

  suplantacion_staff: {
    bot: '🚨 Suplantación del equipo de Sanos y Salvos — Máxima prioridad:\n\nEsto puede generar daño reputacional grave y confundir a los usuarios.\n\n1. Suspende la cuenta inmediatamente.\n2. Clausura todas las salas donde operó bajo esa identidad.\n3. Oculta todos sus reportes.\n4. Escala el caso a legal@sanosysalvos.cl para evaluar acciones legales.\n5. Si hay usuarios que fueron engañados, notifícalos.',
    options: [
      { label: 'Acciones completadas', next: 'fin' },
    ],
  },

  /* ── MALTRATO ANIMAL ──────────────────────────────────── */
  maltrato_1: {
    bot: '¿Qué indicios de maltrato detectaste en la sala?',
    options: [
      { label: 'Mensajes que describen o confiesan maltrato',             next: 'maltrato_confesion' },
      { label: 'Imágenes de animales en malas condiciones o con maltrato', next: 'maltrato_imagenes' },
      { label: 'Patrón sospechoso (venta, intercambio, abandono)',         next: 'maltrato_sospecha' },
    ],
  },

  maltrato_confesion: {
    bot: '🚨 Confesión de maltrato — Denuncia obligatoria (Ley 21.020):\n\n⚠️ No elimines los mensajes — son evidencia judicial.\n\n1. Clausura la sala y suspende la cuenta inmediatamente.\n2. Conserva el historial completo.\n3. Reporta a la SEREMI de Salud de la región correspondiente.\n4. Informa a Carabineros (133) o PDI (134) si hay urgencia.\n5. Crea un ticket interno urgente documentando todo.',
    options: [
      { label: 'Acciones completadas', next: 'fin' },
    ],
  },

  maltrato_imagenes: {
    bot: '🚨 Imágenes de maltrato animal:\n\n⚠️ No elimines las imágenes — son evidencia.\n\n1. Documenta y descarga las imágenes antes de actuar.\n2. Clausura la sala y suspende la cuenta.\n3. Reporta a SEREMI de Salud y Carabineros (133).\n4. Crea un ticket interno urgente.',
    options: [
      { label: 'Acciones completadas', next: 'fin' },
    ],
  },

  maltrato_sospecha: {
    bot: '¿Tienes evidencia concreta (mensajes, fotos) o es solo una sospecha por el patrón?',
    options: [
      { label: 'Hay evidencia concreta', next: 'maltrato_confesion' },
      { label: 'Solo sospecha, sin evidencia clara', next: 'maltrato_vigilar' },
    ],
  },

  maltrato_vigilar: {
    bot: '📋 Sospecha sin evidencia — Monitoreo activo:\n\n1. Registra tu sospecha en un ticket interno.\n2. Congela la sala preventivamente si lo consideras necesario.\n3. Monitorea la actividad del usuario.\n\nEn caso de duda, prioriza el bienestar del animal. Si el patrón continúa, actúa con suspensión y denuncia.',
    options: [
      { label: 'Entendido, voy a monitorear', next: 'fin' },
    ],
  },

  /* ── ESTADOS FINALES ──────────────────────────────────── */
  fin: {
    bot: '✅ Caso gestionado correctamente.\n\nRecuerda documentar siempre las acciones tomadas en un ticket interno para mantener el registro de moderación.\n\n¿Qué quieres hacer ahora?',
    options: [
      { label: 'Revisar otro caso de sala', next: 'SELECTOR' },
      { label: 'Tengo otra pregunta',       next: 'EXIT_FLOW' },
    ],
  },

  no_violacion: {
    bot: '✅ Sin infracción detectada.\n\nAcciones recomendadas:\n1. Restaura la sala desde el panel de administración.\n2. El sistema enviará automáticamente un mensaje a los participantes.\n3. Si el reporte parece malintencionado (usado para hostigar al otro usuario), regístralo en un ticket.\n\n¿Qué quieres hacer ahora?',
    options: [
      { label: 'Revisar otro caso de sala', next: 'SELECTOR' },
      { label: 'Tengo otra pregunta',       next: 'EXIT_FLOW' },
    ],
  },
};
