import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { crearReporte } from '../../services/reporteService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';

const ESPECIES = ['PERRO', 'GATO', 'AVE', 'CONEJO', 'HAMSTER', 'REPTIL', 'OTRO'];
const TAMANIOS = ['PEQUEÑO', 'MEDIANO', 'GRANDE'];
const TIPOS = ['PERDIDA', 'ENCONTRADA'];

const CENTRO_DEFAULT: [number, number] = [-36.8201, -73.0444];

const iconoMarcador = L.divIcon({
  className: 'marcador-azul',
  html: '<div style="background:#2563eb;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const obtenerDireccionAproximada = async (lat: number, lng: number): Promise<string> => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
  );
  if (!res.ok) throw new Error('reverse geocoding failed');
  const data = await res.json();
  return data.display_name ?? '';
};

interface SelectorUbicacionProps {
  posicion: [number, number] | null;
  onSeleccionar: (lat: number, lng: number) => void;
}

const SelectorUbicacion = ({ posicion, onSeleccionar }: SelectorUbicacionProps) => {
  useMapEvents({
    click: (e) => onSeleccionar(e.latlng.lat, e.latlng.lng),
  });
  return posicion ? <Marker position={posicion} icon={iconoMarcador} /> : null;
};

const NuevoReportePage = () => {
  const navigate = useNavigate();

  const [nombreMascota, setNombreMascota] = useState('');
  const [especie, setEspecie] = useState('');
  const [color, setColor] = useState('');
  const [tamanio, setTamanio] = useState('');
  const [tipo, setTipo] = useState('');
  const [posicion, setPosicion] = useState<[number, number] | null>(null);
  const [centroMapa, setCentroMapa] = useState<[number, number]>(CENTRO_DEFAULT);
  const [direccionReferencia, setDireccionReferencia] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotos, setFotos] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);

  const seleccionarUbicacion = (lat: number, lng: number) => {
    setPosicion([lat, lng]);
    setBuscandoDireccion(true);
    obtenerDireccionAproximada(lat, lng)
      .then((direccion) => direccion && setDireccionReferencia(direccion))
      .catch(() => {})
      .finally(() => setBuscandoDireccion(false));
  };

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }
    setObteniendoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCentroMapa(coords);
        seleccionarUbicacion(coords[0], coords[1]);
        setObteniendoUbicacion(false);
      },
      () => {
        setError('No se pudo obtener tu ubicación. Selecciónala en el mapa.');
        setObteniendoUbicacion(false);
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!posicion) {
      setError('Selecciona la ubicación en el mapa');
      return;
    }
    const [lat, lng] = posicion;

    setLoading(true);
    try {
      const reporte = await crearReporte({
        nombreMascota,
        especie,
        color,
        tamanio,
        tipo,
        ubicacionLatitud: lat,
        ubicacionLongitud: lng,
        direccionReferencia: direccionReferencia || undefined,
        descripcion: descripcion || undefined,
        fotos,
      });
      navigate(`/reportes/${reporte.id}`);
    } catch {
      setError('Error al crear el reporte. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formValido = nombreMascota.trim() && especie && color.trim() && tamanio && tipo && posicion;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="p-8">
            <BotonVolver ruta="/reportes" texto="← Volver" />
            <h1 className="text-xl font-bold text-gray-800 mb-1">Reportar mascota</h1>
            <p className="text-sm text-gray-500 mb-6">
              Completa los datos para publicar el reporte de una mascota perdida o encontrada.
            </p>

            {error && <Alert variant="error" className="mb-4">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label={<>Tipo de reporte <span className="text-red-500">*</span></>}
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                required
              >
                <option value="">Selecciona una opción</option>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{t === 'PERDIDA' ? 'Mascota perdida' : 'Mascota encontrada'}</option>
                ))}
              </Select>

              <Input
                label={<>Nombre de la mascota <span className="text-red-500">*</span></>}
                type="text"
                value={nombreMascota}
                onChange={(e) => setNombreMascota(e.target.value)}
                placeholder="Ej: Firulais"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label={<>Especie <span className="text-red-500">*</span></>}
                  value={especie}
                  onChange={(e) => setEspecie(e.target.value)}
                  required
                >
                  <option value="">Selecciona</option>
                  {ESPECIES.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </Select>

                <Select
                  label={<>Tamaño <span className="text-red-500">*</span></>}
                  value={tamanio}
                  onChange={(e) => setTamanio(e.target.value)}
                  required
                >
                  <option value="">Selecciona</option>
                  {TAMANIOS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>

              <Input
                label={<>Color <span className="text-red-500">*</span></>}
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ej: Marrón con manchas blancas"
                required
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Ubicación <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={usarMiUbicacion}
                    disabled={obteniendoUbicacion}
                    className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    {obteniendoUbicacion ? 'Obteniendo...' : '📍 Usar mi ubicación'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-2">Haz clic en el mapa para marcar el lugar.</p>
                <div className="h-56 rounded-lg overflow-hidden border border-gray-300">
                  <MapContainer center={centroMapa} zoom={13} className="h-full w-full">
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="© OpenStreetMap"
                    />
                    <SelectorUbicacion posicion={posicion} onSeleccionar={seleccionarUbicacion} />
                  </MapContainer>
                </div>
                {posicion && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    {posicion[0].toFixed(5)}, {posicion[1].toFixed(5)}
                  </p>
                )}
              </div>

              <Input
                label={buscandoDireccion ? 'Dirección de referencia (buscando...)' : 'Dirección de referencia'}
                type="text"
                value={direccionReferencia}
                onChange={(e) => setDireccionReferencia(e.target.value)}
                placeholder="Ej: Cerca de Plaza de Armas"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles adicionales: collar, comportamiento, chip, etc."
                  rows={4}
                  maxLength={1000}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fotos (máx. 5)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={(e) => setFotos(Array.from(e.target.files ?? []).slice(0, 5))}
                  className="w-full text-sm text-gray-600"
                />
                {fotos.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{fotos.length} foto(s) seleccionada(s)</p>
                )}
              </div>

              <Button type="submit" disabled={loading || !formValido} fullWidth className="py-3">
                {loading ? 'Publicando reporte...' : 'Publicar reporte'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NuevoReportePage;
