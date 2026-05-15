import { useNavigate } from 'react-router-dom';

interface Props {
    ruta?: string;
    texto?: string;
    onClick?: () => void;
}

const BotonVolver = ({ ruta, texto = '← Volver', onClick }: Props) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (ruta) {
            navigate(ruta);
        }
    };

    return (
        <button
            onClick={handleClick}
            className="text-gray-400 hover:text-gray-600 text-sm transition block mb-1"
        >
            {texto}
        </button>
    );
};

export default BotonVolver;