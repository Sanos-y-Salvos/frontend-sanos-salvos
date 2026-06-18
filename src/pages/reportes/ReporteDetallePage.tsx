import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { obtenerReporte } from '../../services/reporteService';
import type { Reporte } from '../../types';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';

const MS_MASCOTAS_URL = import.meta.env.VITE_MS_MASCOTAS_URL ?? 'http://localhost:3003';

const ReporteDetallePage = () => {
  const { id } = useParams<{ id: string }>();
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    obtenerReporte(id)
      .then(setReporte)
      .catch(() => setError('No se pudo cargar el reporte. Es posible que no exista o ya no esté disponible.'))
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <BotonVolver ruta="/reportes" texto="← Volver a reportes" />

          {cargando && (
            <div className="text-center text-gray-500 py-16">Cargando reporte...</div>
          )}

          {!cargando && error && <Alert variant="error">{error}</Alert>}

          {!cargando && !error && reporte && (
            <Card className="overflow-hidden">
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
                {reporte.fotos.length > 0 ? (
                  <img
                    src={`${MS_MASCOTAS_URL}${reporte.fotos[0].urlRelativa}`}
                    alt={reporte.nombreMascota}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center gap-2">
                    <span className="text-5xl">🐾</span>
                    <span className="text-sm">Sin foto disponible</span>
                  </div>
                )}
              </div>

              {reporte.fotos.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50 border-b border-gray-100">
                  {reporte.fotos.map((foto) => (
                    <img
                      key={foto.id}
                      src={`${MS_MASCOTAS_URL}${foto.urlRelativa}`}
                      alt={reporte.nombreMascota}
                      className="w-20 h-20 rounded-lg object-cover shrink-0"
                    />
                  ))}
                </div>
              )}

              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-2xl font-bold text-gray-800">{reporte.nombreMascota}</h1>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${
                      reporte.tipo === 'PERDIDA'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {reporte.tipo}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Especie</p>
                    <p className="text-gray-700 font-medium">{reporte.especie}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Tamaño</p>
                    <p className="text-gray-700 font-medium">{reporte.tamanio}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Color</p>
                    <p className="text-gray-700 font-medium">{reporte.color}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Estado</p>
                    <p className="text-gray-700 font-medium">{reporte.estado}</p>
                  </div>
                  {reporte.codigoChip && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Código de chip</p>
                      <p className="text-gray-700 font-mono">{reporte.codigoChip}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Publicado</p>
                    <p className="text-gray-700 font-medium">
                      {new Date(reporte.fechaPublicacion).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>

                {reporte.direccionReferencia && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Ubicación de referencia</p>
                    <p className="text-gray-700 text-sm">{reporte.direccionReferencia}</p>
                  </div>
                )}

                {reporte.descripcion && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Descripción</p>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{reporte.descripcion}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Coordenadas</p>
                  <p className="text-gray-700 text-sm font-mono">
                    {reporte.ubicacionLatitud.toFixed(5)}, {reporte.ubicacionLongitud.toFixed(5)}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ReporteDetallePage;
