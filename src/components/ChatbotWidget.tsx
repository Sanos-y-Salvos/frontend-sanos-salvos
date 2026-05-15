import { useState, useRef, useEffect } from 'react';
import { ticketService } from '../services/ticketService';

interface Mensaje {
  tipo: 'usuario' | 'bot';
  texto: string;
}

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

      {/* Panel de chat */}
      {abierto && (
        <div className="w-80 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100" style={{ height: '420px' }}>
          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm">🤖</div>
              <div>
                <p className="text-white text-sm font-semibold">Asistente</p>
                <p className="text-blue-200 text-xs">En línea</p>
              </div>
            </div>
            <button onClick={() => setAbierto(false)} className="text-white hover:text-blue-200 transition text-lg leading-none">✕</button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  m.tipo === 'usuario'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white shadow text-gray-700 rounded-bl-none'
                }`}>
                  {m.texto}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white shadow rounded-xl rounded-bl-none px-3 py-2 text-sm text-gray-400">
                  Escribiendo...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
              placeholder="Escribe tu consulta..."
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleEnviar}
              disabled={loading || !pregunta.trim()}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition hover:scale-105 active:scale-95"
        title="Asistente de soporte"
      >
        {abierto ? '✕' : '🤖'}
      </button>
    </div>
  );
};

export default ChatbotWidget;
