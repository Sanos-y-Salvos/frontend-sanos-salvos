import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  loading?: boolean;
  children: React.ReactNode;
}

const DetailPanel = ({ isOpen, onClose, title, subtitle, loading, children }: DetailPanelProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 px-6 py-5 border-b border-slate-100 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-display font-bold text-slate-900 leading-tight">{title}</h2>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                  <p className="text-sm">Cargando registros...</p>
                </div>
              ) : (
                children
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DetailPanel;
