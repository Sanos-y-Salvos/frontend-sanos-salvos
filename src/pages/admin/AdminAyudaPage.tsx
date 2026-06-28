import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Loader2, Sparkles, GitBranch, X } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import BotonVolver from '../../components/layout/BotonVolver';
import responses from '../../data/admin-chatbot-responses.json';
import { FLOW_STEPS } from '../../data/adminChatbotFlows';

/* ── Tipos ── */
interface ChatMsg {
  role: 'bot' | 'user';
  text: string;
  id: number;
}
interface Intent { id: string; keywords: string[]; response: string; }

/* ── Motor Q&A ── */
const normalize = (s: string) =>
  s.toLowerCase()
   .normalize('NFD').replace(/[̀-ͯ]/g, '')
   .replace(/[^a-z0-9\s]/g, ' ');

function getQAResponse(input: string): string {
  const q = normalize(input);
  const words = q.split(/\s+/).filter(Boolean);
  let best: Intent | null = null;
  let bestScore = 0;

  for (const intent of responses as Intent[]) {
    if (!intent.keywords.length) continue;
    let score = 0;
    for (const kw of intent.keywords) {
      const normKw = normalize(kw);
      if (q.includes(normKw)) score += normKw.split(' ').length * 2;
      else for (const w of words) if (normKw.includes(w) && w.length > 3) score += 1;
    }
    if (score > bestScore) { bestScore = score; best = intent as Intent; }
  }

  if (!best || bestScore === 0) {
    return (responses as Intent[]).find(r => r.id === 'fallback')?.response
      ?? 'No encontré información sobre eso. Intenta reformular la pregunta.';
  }
  return best.response;
}

/* Palabras clave que inician el flujo guiado */
const FLOW_TRIGGERS = [
  'guiar', 'guia', 'guiame', 'caso sala', 'denuncia sala', 'sala reportada',
  'como actuar', 'proceder sala', 'que hago con', 'ayudarme con un caso',
];
function isFlowTrigger(input: string): boolean {
  const q = normalize(input);
  return FLOW_TRIGGERS.some(t => q.includes(normalize(t)));
}

/* ── Sugerencias iniciales ── */
const SUGERENCIAS = [
  { label: 'Guiarme en un caso de sala', isFlow: true },
  { label: '¿Cómo gestiono un ticket?', isFlow: false },
  { label: '¿Cuándo clausuro una sala?', isFlow: false },
  { label: '¿Cuáles son los roles?', isFlow: false },
  { label: '¿Cómo funciona el matching?', isFlow: false },
  { label: '¿Qué hago ante un fraude?', isFlow: false },
];

let msgId = 0;
const mkMsg = (role: 'bot' | 'user', text: string): ChatMsg => ({ role, text, id: msgId++ });

const INTRO = mkMsg('bot',
  'Hola, soy el asistente interno de Sanos y Salvos 🐾\n\n' +
  'Puedo ayudarte con:\n' +
  '• Preguntas sobre el sistema (tickets, usuarios, matching…)\n' +
  '• Guiarte paso a paso en cómo actuar ante distintos tipos de denuncias de salas\n\n' +
  '¿En qué te puedo ayudar hoy?'
);

/* ── Burbuja de chat ── */
const Bubble = ({ msg }: { msg: ChatMsg }) => {
  const esBot = msg.role === 'bot';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`flex gap-3 ${esBot ? '' : 'flex-row-reverse'}`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        esBot ? 'bg-teal-500/20 border border-teal-500/30' : 'bg-white/10 border border-white/10'
      }`}>
        {esBot ? <Bot className="w-3.5 h-3.5 text-teal-400" /> : <User className="w-3.5 h-3.5 text-slate-300" />}
      </div>
      <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
        esBot
          ? 'bg-white/5 border border-white/10 text-slate-200'
          : 'bg-teal-600/80 border border-teal-500/40 text-white'
      }`}>
        {msg.text}
      </div>
    </motion.div>
  );
};

/* ── Botones de opción del flujo ── */
const FlowOptions = ({
  options,
  onSelect,
}: {
  options: { label: string; next: string }[];
  onSelect: (opt: { label: string; next: string }) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col gap-2 pl-10"
  >
    {options.map(opt => (
      <button
        key={opt.label}
        onClick={() => onSelect(opt)}
        className="text-left text-sm px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-teal-500/10 hover:border-teal-500/30 hover:text-teal-300 transition-all cursor-pointer"
      >
        {opt.label}
      </button>
    ))}
  </motion.div>
);

/* ── Página principal ── */
const AdminAyudaPage = () => {
  const [messages, setMessages]     = useState<ChatMsg[]>([INTRO]);
  const [input, setInput]           = useState('');
  const [thinking, setThinking]     = useState(false);
  const [mostrarSugs, setMostrarSugs] = useState(true);
  const [flowStep, setFlowStep]     = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const inFlow = flowStep !== null;
  const currentStep = flowStep ? FLOW_STEPS[flowStep] : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking, flowStep]);

  /* ── Iniciar flujo guiado ── */
  const startFlow = () => {
    setMostrarSugs(false);
    setMessages(prev => [...prev, mkMsg('bot', FLOW_STEPS.selector.bot)]);
    setFlowStep('selector');
  };

  /* ── Manejar opción del flujo ── */
  const handleFlowOption = (opt: { label: string; next: string }) => {
    setMessages(prev => [...prev, mkMsg('user', opt.label)]);

    if (opt.next === 'EXIT_FLOW') {
      setFlowStep(null);
      setTimeout(() => {
        setMessages(prev => [...prev, mkMsg('bot', '¡Claro! Puedes escribir tu pregunta o usar las sugerencias de abajo.')]);
        setMostrarSugs(true);
      }, 300);
      return;
    }

    const nextId = opt.next === 'SELECTOR' ? 'selector' : opt.next;
    const nextStep = FLOW_STEPS[nextId];
    if (!nextStep) return;

    setThinking(true);
    setTimeout(() => {
      setMessages(prev => [...prev, mkMsg('bot', nextStep.bot)]);
      setFlowStep(nextId);
      setThinking(false);
    }, 400);
  };

  /* ── Enviar pregunta libre ── */
  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking || inFlow) return;

    setMostrarSugs(false);
    setMessages(prev => [...prev, mkMsg('user', trimmed)]);
    setInput('');
    setThinking(true);

    if (isFlowTrigger(trimmed)) {
      setTimeout(() => {
        setMessages(prev => [...prev, mkMsg('bot', FLOW_STEPS.selector.bot)]);
        setFlowStep('selector');
        setThinking(false);
      }, 400);
      return;
    }

    setTimeout(() => {
      setMessages(prev => [...prev, mkMsg('bot', getQAResponse(trimmed))]);
      setThinking(false);
    }, 480);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div className="min-h-screen flex flex-col admin-glass">
      <Navbar />

      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="px-6 lg:px-8 py-5">
          <BotonVolver ruta="/admin" texto="Panel de control" />
          <div className="flex items-center gap-3 mt-3">
            <div className="w-9 h-9 bg-teal-500/20 border border-teal-500/30 rounded-xl flex items-center justify-center">
              <Bot className="w-[18px] h-[18px] text-teal-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-white leading-tight">Asistente interno</h1>
              <p className="text-xs text-slate-400">Guía de procedimientos y consultas del sistema</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {inFlow && (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  <GitBranch className="w-3 h-3" />
                  Modo guiado
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-teal-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                En línea
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}

          {/* Opciones del flujo */}
          <AnimatePresence>
            {inFlow && !thinking && currentStep && (
              <FlowOptions options={currentStep.options} onSelect={handleFlowOption} />
            )}
          </AnimatePresence>

          {/* Sugerencias iniciales */}
          <AnimatePresence>
            {mostrarSugs && !inFlow && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex flex-wrap gap-2 pt-2"
              >
                {SUGERENCIAS.map(s => (
                  <button
                    key={s.label}
                    onClick={() => s.isFlow ? startFlow() : send(s.label)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                      s.isFlow
                        ? 'bg-teal-500/10 border-teal-500/30 text-teal-300 hover:bg-teal-500/20'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {s.isFlow && <GitBranch className="w-3 h-3" />}
                    {s.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Indicador "procesando" */}
          {thinking && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                <span className="text-xs text-slate-400">
                  {inFlow ? 'Preparando siguiente paso…' : 'Buscando respuesta…'}
                </span>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm px-6 lg:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          {inFlow ? (
            /* En modo guiado: solo mostrar botón de salida */
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Selecciona una opción arriba para continuar con la guía.
              </p>
              <button
                onClick={() => {
                  setFlowStep(null);
                  setMessages(prev => [...prev, mkMsg('bot', 'Guía cancelada. ¿En qué más puedo ayudarte?')]);
                  setMostrarSugs(true);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar guía
              </button>
            </div>
          ) : (
            /* Modo Q&A normal */
            <>
              <div className="flex gap-3 items-end">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Escribe tu pregunta… (Enter para enviar)"
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all resize-none"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                  onInput={e => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                  }}
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || thinking}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Shift + Enter para salto de línea · Escribe «guiarme» para iniciar el modo guiado
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAyudaPage;
