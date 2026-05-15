import { useNavigate } from 'react-router-dom';

const Footer = () => {
    const navigate = useNavigate();

    return (
        <footer className="bg-gray-900 text-gray-400 py-12 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

                    {/* Marca */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">🐾</span>
                            <span className="font-bold text-white text-lg">Sanos y Salvos</span>
                        </div>
                        <p className="text-sm leading-relaxed">
                            Plataforma tecnológica para la localización y recuperación de mascotas perdidas en Chile.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-3 text-sm">Navegación</h3>
                        <ul className="space-y-2">
                            <li>
                                <button
                                    onClick={() => navigate('/')}
                                    className="text-sm hover:text-white transition"
                                >
                                    Inicio
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigate('/about')}
                                    className="text-sm hover:text-white transition"
                                >
                                    ¿Quiénes somos?
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigate('/registro')}
                                    className="text-sm hover:text-white transition"
                                >
                                    Registrarse
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-sm hover:text-white transition"
                                >
                                    Iniciar sesión
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div>
                        <h3 className="text-white font-semibold mb-3 text-sm">Plataforma</h3>
                        <ul className="space-y-2 text-sm">
                            <li>Disponible 24/7</li>
                            <li>Cobertura nacional</li>
                            <li>Gratuito para ciudadanos</li>
                            <li>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="hover:text-white transition"
                                >
                                    Soporte técnico →
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
                    <p className="text-xs">© 2026 Sanos y Salvos. Todos los derechos reservados.</p>
                    <p className="text-xs">Desarrollado por Beneventi · Moreno · Ruiz — DUOC UC</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;