import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, MapPin, Camera, FileText, Loader2,
  Navigation, CheckCircle, PawPrint, Cpu,
} from 'lucide-react';
import { crearReporte } from '../../services/reporteService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';

const ESPECIES = ['PERRO', 'GATO', 'AVE', 'CONEJO', 'HAMSTER', 'REPTIL', 'OTRO'];
const TAMANIOS = ['PEQUEÑO', 'MEDIANO', 'GRANDE'];
const CENTRO_DEFAULT: [number, number] = [-36.8201, -73.0444];

const iconoMarcador = L.divIcon({
  className: '',
  html: '<div style="background:#0d9488;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',
  iconSize: [16, 16], iconAnchor: [8, 8],
});

const obtenerDireccionAproximada = async (lat: number, lng: number): Promise<string> => {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`);
  if (!res.ok) throw new Error('reverse geocoding failed');
  const data = await res.json();
  return data.display_name ?? '';
};

const SelectorUbicacion = ({ posicion, onSeleccionar }: { posicion: [number, number] | null; onSeleccionar: (lat: number, lng: number) => void }) => {
  useMapEvents({ click: (e) => onSeleccionar(e.latlng.lat, e.latlng.lng) });
  return posicion ? <Marker position={posicion} icon={iconoMarcador} /> : null;
};

const SectionTitle = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 pt-1">
    <div className="w-0.5 h-4 bg-brand-500 rounded-full" />
    <Icon className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{children}</h2>
  </div>
);

const Req = () => <span className="text-rose-400 ml-0.5">*</span>;

const TIPOS = [
  { value: 'PERDIDA',    label: 'Mascota perdida',    desc: 'La mascota se perdió y la estoy buscando',      color: 'border-rose-300 bg-rose-50',   active: 'border-rose-400 bg-rose-50',   dot: 'bg-rose-500'    },
  { value: 'ENCONTRADA', label: 'Mascota encontrada', desc: 'Encontré una mascota y busco a su dueño',       color: 'border-emerald-300 bg-emerald-50', active: 'border-emerald-400 bg-emerald-50', dot: 'bg-emerald-500' },
];

const NuevoReportePage = () => {
  const navigate = useNavigate();

  const [nombreMascota, setNombreMascota]       = useState('');
  const [especie, setEspecie]                   = useState('');
  const [color, setColor]                       = useState('');
  const [tamanio, setTamanio]                   = useState('');
  const [tipo, setTipo]                         = useState('');
  const [posicion, setPosicion]                 = useState<[number, number] | null>(null);
  const [centroMapa, setCentroMapa]             = useState<[number, number]>(CENTRO_DEFAULT);
  const [direccionReferencia, setDireccionReferencia] = useState('');
  const [codigoChip, setCodigoChip]             = useState('');
  const [descripcion, setDescripcion]           = useState('');
  const [fotos, setFotos]                       = useState<File[]>([]);

  const [loading, setLoading]                         = useState(false);
  const [error, setError]                             = useState('');
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const [buscandoDireccion, setBuscandoDireccion]     = useState(false);

  const seleccionarUbicacion = (lat: number, lng: number) => {
    setPosicion([lat, lng]);
    setBuscandoDireccion(true);
    obtenerDireccionAproximada(lat, lng)
      .then((d) => d && setDireccionReferencia(d))
      .catch(() => {})
      .finally(() => setBuscandoDireccion(false));
  };

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) { setError('Tu navegador no soporta geolocalización'); return; }
    setObteniendoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCentroMapa(coords);
        seleccionarUbicacion(coords[0], coords[1]);
        setObteniendoUbicacion(false);
      },
      () => { setError('No se pudo obtener tu ubicación. Selecciónala en el mapa.'); setObteniendoUbicacion(false); }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!posicion) { setError('Selecciona la ubicación en el mapa'); return; }
    const [lat, lng] = posicion;
    setLoading(true);
    try {
      const reporte = await crearReporte({ nombreMascota, especie, color, tamanio, tipo, ubicacionLatitud: lat, ubicacionLongitud: lng, codigoChip: codigoChip.trim() || undefined, direccionReferencia: direccionReferencia || undefined, descripcion: descripcion || undefined, fotos });
      navigate(`/reportes/${reporte.id}`);
    } catch {
      setError('Error al crear el reporte. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formValido = nombreMascota.trim() && especie && color.trim() && tamanio && tipo && posicion;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-lg mx-auto px-6 py-6">
          <BotonVolver ruta="/reportes" texto="Volver a reportes" />
          <div className="flex items-center gap-3 mt-3">
            <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-slate-900">Nuevo reporte</h1>
              <p className="text-xs text-slate-500">Campos con <span className="text-rose-400">*</span> son obligatorios</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-lg mx-auto space-y-4"
        >
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Alert variant="error">{error}</Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Tipo de reporte */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-sm font-medium text-slate-700 mb-3">Tipo de reporte <Req /></p>
              <div className="grid grid-cols-2 gap-3">
                {TIPOS.map(({ value, label, desc, dot }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTipo(value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                      tipo === value
                        ? value === 'PERDIDA' ? 'border-rose-400 bg-rose-50' : 'border-emerald-400 bg-emerald-50'
                        : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                      <span className={`text-sm font-semibold ${
                        tipo === value
                          ? value === 'PERDIDA' ? 'text-rose-700' : 'text-emerald-700'
                          : 'text-slate-600'
                      }`}>{label}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Datos de la mascota */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <SectionTitle icon={PawPrint}>Datos de la mascota</SectionTitle>
              <Input
                label={<>Nombre de la mascota <Req /></>}
                type="text" value={nombreMascota}
                onChange={(e) => setNombreMascota(e.target.value)}
                placeholder="Ej: Firulais" required
              />
              <div className="grid grid-cols-2 gap-3">
                <Select label={<>Especie <Req /></>} value={especie} onChange={(e) => setEspecie(e.target.value)} required>
                  <option value="">Selecciona</option>
                  {ESPECIES.map((e) => <option key={e} value={e}>{e}</option>)}
                </Select>
                <Select label={<>Tamaño <Req /></>} value={tamanio} onChange={(e) => setTamanio(e.target.value)} required>
                  <option value="">Selecciona</option>
                  {TAMANIOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <Input
                label={<>Color <Req /></>}
                type="text" value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ej: Marrón con manchas blancas" required
              />
              <div className="flex flex-col gap-1">
                <Input
                  label="Código de chip"
                  icon={<Cpu className="w-4 h-4" />}
                  type="text" value={codigoChip}
                  onChange={(e) => setCodigoChip(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  placeholder="15 dígitos (opcional)"
                  maxLength={15}
                />
                <p className="text-xs text-slate-400 pl-1">
                  Si la mascota tiene microchip, ingrésalo. Una coincidencia de chip genera match automático.
                </p>
              </div>
            </div>

            {/* Ubicación */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <SectionTitle icon={MapPin}>Ubicación <Req /></SectionTitle>
                <button
                  type="button"
                  onClick={usarMiUbicacion}
                  disabled={obteniendoUbicacion}
                  className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50 transition-colors"
                >
                  {obteniendoUbicacion
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Obteniendo...</>
                    : <><Navigation className="w-3.5 h-3.5" /> Usar mi ubicación</>
                  }
                </button>
              </div>
              <p className="text-xs text-slate-400">Haz clic en el mapa para marcar el lugar exacto.</p>
              <div className="h-56 rounded-xl overflow-hidden border border-slate-200">
                <MapContainer center={centroMapa} zoom={13} className="h-full w-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                  <SelectorUbicacion posicion={posicion} onSeleccionar={seleccionarUbicacion} />
                </MapContainer>
              </div>
              {posicion && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-mono">{posicion[0].toFixed(5)}, {posicion[1].toFixed(5)}</span>
                </div>
              )}
              <Input
                label={buscandoDireccion ? 'Dirección de referencia (buscando...)' : 'Dirección de referencia'}
                icon={<MapPin className="w-4 h-4" />}
                type="text" value={direccionReferencia}
                onChange={(e) => setDireccionReferencia(e.target.value)}
                placeholder="Ej: Cerca de Plaza de Armas"
              />
            </div>

            {/* Descripción y fotos */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <SectionTitle icon={FileText}>Detalles adicionales</SectionTitle>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Collar, comportamiento, chip, señas particulares..."
                  rows={4} maxLength={1000}
                  className="w-full border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all resize-none"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-1.5">Fotos <span className="text-slate-400 font-normal text-xs">(máx. 5)</span></p>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-xl p-5 cursor-pointer transition-colors group">
                  <div className="w-9 h-9 bg-slate-100 group-hover:bg-brand-50 rounded-full flex items-center justify-center transition-colors">
                    <Camera className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
                  </div>
                  {fotos.length > 0
                    ? <p className="text-sm text-brand-600 font-medium">{fotos.length} foto{fotos.length > 1 ? 's' : ''} seleccionada{fotos.length > 1 ? 's' : ''}</p>
                    : <>
                        <p className="text-sm text-slate-500">Haz clic para subir fotos</p>
                        <p className="text-xs text-slate-400">PNG, JPG, WEBP</p>
                      </>
                  }
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => setFotos(Array.from(e.target.files ?? []).slice(0, 5))}
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formValido}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Publicando reporte...</>
                : <><ClipboardList className="w-4 h-4" /> Publicar reporte</>
              }
            </button>
          </form>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default NuevoReportePage;
