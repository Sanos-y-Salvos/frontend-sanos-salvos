import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, PawPrint } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ticketService } from '../services/ticketService';

interface Mensaje {
  tipo: 'usuario' | 'bot';
  texto: string;
}

const BotMessage = ({ texto }: { texto: string }) => {
  const lines = texto.split('\n').filter((l, i, arr) => !(l === '' && arr[i - 1] === ''));
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line === '') return <div key={i} className="h-1" />;
        const stepMatch = line.match(/^(\d+)\.\s+(.+)/);
        if (stepMatch) {
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-brand-100 text-brand-700 rounded-full text-xs flex items-center justify-center font-bold mt-0.5">
                {stepMatch[1]}
              </span>
              <span className="text-slate-700 text-sm leading-snug">{stepMatch[2]}</span>
            </div>
          );
        }
        return <p key={i} className="text-sm text-slate-700 leading-snug">{line}</p>;
      })}
    </div>
  );
};

const ChatbotWidget = () => {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { tipo: 'bot', texto: '¡Hola! Soy el asistente de Sanos y Salvos. ¿En qué puedo ayudarte?' }
  ]);
  const [pregunta, setPregunta] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (abierto) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, abierto]);

  const handleEnviar = async () => {
    const texto = pregunta.trim();
    if (!texto || loading) return;
    setPregunta('');
    setMensajes(prev => [...prev, { tipo: 'usuario', texto }]);
    setLoading(true);
    try {
      const respuesta = await ticketService.preguntarChatbot(texto);
      setMensajes(prev => [...prev, { tipo: 'bot', texto: respuesta }]);
    } catch {
      setMensajes(prev => [...prev, { tipo: 'bot', texto: 'Lo siento, no pude procesar tu consulta en este momento.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-80 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100"
            style={{ height: '440px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Asistente</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <p className="text-brand-100 text-xs">En línea</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAbierto(false)}
                className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-slate-50">
              {mensajes.map((m, i) => (
                <div key={i} className={`flex ${m.tipo === 'usuario' ? 'justify-end' : 'justify-start'} gap-2`}>
                  {m.tipo === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <PawPrint className="w-3 h-3 text-brand-600" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 ${
                    m.tipo === 'usuario'
                      ? 'bg-brand-600 text-white text-sm rounded-br-sm'
                      : 'bg-white shadow-sm border border-slate-100 rounded-bl-sm'
                  }`}>
                    {m.tipo === 'bot' ? <BotMessage texto={m.texto} /> : m.texto}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <PawPrint className="w-3 h-3 text-brand-600" />
                  </div>
                  <div className="bg-white shadow-sm border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
                placeholder="Escribe tu consulta..."
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all"
                disabled={loading}
              />
              <button
                onClick={handleEnviar}
                disabled={loading || !pregunta.trim()}
                className="bg-brand-600 text-white p-2 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante */}
      <motion.button
        onClick={() => setAbierto(!abierto)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-amber-500 hover:bg-amber-400 text-white rounded-full shadow-lg shadow-amber-500/40 flex items-center justify-center transition-colors"
        title="Asistente de soporte"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={abierto ? 'close' : 'open'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {abierto ? <X className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default ChatbotWidget;
