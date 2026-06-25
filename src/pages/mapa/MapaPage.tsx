import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, X, MapPin, PawPrint, Cpu, ArrowRight } from 'lucide-react'
import { obtenerPuntosCercanos } from '../../services/localizacionService'
import type { PuntoMapa } from '../../types'
import Navbar from '../../components/layout/Navbar'
import 'leaflet/dist/leaflet.css'

const CENTRO_DEFAULT: [number, number] = [-36.8201, -73.0444]
const RADIO_DEFAULT = 5000

const iconoRojo = L.divIcon({
  className: '',
  html: '<div style="background:#f43f5e;width:14px;height:14px;border-radius:50%;border:2.5px solid white;box-shadow:0 1px 6px rgba(0,0,0,.35)"></div>',
  iconSize: [14, 14], iconAnchor: [7, 7],
})
const iconoVerde = L.divIcon({
  className: '',
  html: '<div style="background:#10b981;width:14px;height:14px;border-radius:50%;border:2.5px solid white;box-shadow:0 1px 6px rgba(0,0,0,.35)"></div>',
  iconSize: [14, 14], iconAnchor: [7, 7],
})

const badgeCls = (tipo: string) =>
  tipo === 'PERDIDA'
    ? 'bg-rose-100 text-rose-700 border border-rose-200'
    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'

const Field = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-slate-700 text-sm">{value}</p>
    </div>
  ) : null

export default function MapaPage() {
  const [puntos, setPuntos]       = useState<PuntoMapa[]>([])
  const [error, setError]         = useState<string | null>(null)
  const [cargando, setCargando]   = useState(true)
  const [centro, setCentro]       = useState<[number, number]>(CENTRO_DEFAULT)
  const [seleccionado, setSeleccionado] = useState<PuntoMapa | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setCentro(coords)
        cargarPuntos(coords[0], coords[1])
      },
      () => cargarPuntos(CENTRO_DEFAULT[0], CENTRO_DEFAULT[1])
    )
  }, [])

  const cargarPuntos = async (lat: number, lng: number) => {
    try {
      setCargando(true)
      setPuntos(await obtenerPuntosCercanos(lat, lng, RADIO_DEFAULT))
      setError(null)
    } catch {
      setError('Error al cargar los reportes')
    } finally {
      setCargando(false)
    }
  }

  if (cargando) return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-sm">Cargando mapa...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-rose-600">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Leyenda */}
      <div className="bg-white border-b border-slate-100 px-5 py-2.5 flex items-center gap-5">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white shadow-sm" />
          <span className="text-xs text-slate-600 font-medium">Perdida</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm" />
          <span className="text-xs text-slate-600 font-medium">Encontrada</span>
        </div>
        <span className="text-xs text-slate-400 ml-auto">{puntos.length} reporte{puntos.length !== 1 ? 's' : ''} activo{puntos.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 112px)' }}>

        {/* Mapa */}
        <div className="flex-1 relative">
          {puntos.length === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm border border-slate-200 shadow px-4 py-2 rounded-xl text-slate-500 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              No hay reportes activos en tu zona
            </div>
          )}
          <MapContainer center={centro} zoom={13} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            {puntos.map((punto) => (
              <Marker
                key={punto.id}
                position={[punto.latitud, punto.longitud]}
                icon={punto.tipo_reporte === 'PERDIDA' ? iconoRojo : iconoVerde}
                eventHandlers={{ click: () => setSeleccionado(punto) }}
              />
            ))}
          </MapContainer>
        </div>

        {/* Panel detalle */}
        {seleccionado && (
          <div
            data-testid="panel-detalle"
            className="w-80 bg-white border-l border-slate-100 shadow-xl flex flex-col overflow-hidden"
          >
            {/* Foto */}
            <div className="w-full h-44 bg-slate-100 flex items-center justify-center overflow-hidden relative flex-shrink-0">
              {seleccionado.foto_url ? (
                <img
                  src={`${import.meta.env.VITE_MS_MASCOTAS_URL ?? 'http://localhost:3003'}${seleccionado.foto_url}`}
                  alt={seleccionado.nombre_mascota ?? 'Mascota'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <PawPrint className="w-10 h-10" strokeWidth={1} />
                  <span className="text-xs">Sin foto</span>
                </div>
              )}
              <button
                onClick={() => setSeleccionado(null)}
                className="absolute top-3 right-3 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 shadow transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <span className={`absolute bottom-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeCls(seleccionado.tipo_reporte)}`}>
                {seleccionado.tipo_reporte}
              </span>
            </div>

            {/* Datos */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <h3 className="font-display font-bold text-slate-900 text-lg">
                {seleccionado.nombre_mascota ?? 'Sin nombre'}
              </h3>

              <div className="space-y-3">
                <Field label="Especie"      value={seleccionado.especie} />
                <Field label="Descripción"  value={seleccionado.descripcion} />
                <Field label="Ubicación"    value={seleccionado.direccion_aproximada} />
                {seleccionado.codigo_chip && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">Código chip</p>
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-700 text-sm font-mono">{seleccionado.codigo_chip}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => navigate(`/reportes/${seleccionado.reporte_id}`)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl transition-all text-sm font-medium active:scale-[0.98]"
              >
                Ver reporte completo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
