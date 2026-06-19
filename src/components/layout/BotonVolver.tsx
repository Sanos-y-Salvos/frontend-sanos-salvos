import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  ruta?: string;
  texto?: string;
  onClick?: () => void;
}

const BotonVolver = ({ ruta, texto = 'Volver', onClick }: Props) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick();
    else if (ruta) navigate(ruta);
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-slate-400 hover:text-brand-600 text-sm transition-colors duration-200"
    >
      <ArrowLeft className="w-4 h-4" />
      {texto}
    </button>
  );
};

export default BotonVolver;
