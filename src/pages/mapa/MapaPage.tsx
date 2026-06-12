import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { obtenerPuntosCercanos } from '../../services/localizacionService'
import type { PuntoMapa } from '../../types'
import Navbar from '../../components/layout/Navbar'
import 'leaflet/dist/leaflet.css'

const CENTRO_DEFAULT: [number, number] = [-36.8201, -73.0444]
const RADIO_DEFAULT = 5000

const iconoRojo = L.divIcon({
  className: 'marcador-rojo',
  html: '<div style="background:#ef4444;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const iconoVerde = L.divIcon({
  className: 'marcador-verde',
  html: '<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

export default function MapaPage() {
  const [puntos, setPuntos] = useState<PuntoMapa[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [centro, setCentro] = useState<[number, number]>(CENTRO_DEFAULT)
  const [puntoSeleccionado, setPuntoSeleccionado] = useState<PuntoMapa | null>(null)
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
      const data = await obtenerPuntosCercanos(lat, lng, RADIO_DEFAULT)
      setPuntos(data)
      setError(null)
    } catch {
      setError('Error al cargar los reportes')
    } finally {
      setCargando(false)
    }
  }

  if (cargando) return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Cargando mapa...
      </div>
    </div>
  )

  if (error) return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-red-600">
        {error}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Contenido principal */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 130px)' }}>

        {/* Mapa */}
        <div className="flex-1 relative">
          {puntos.length === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white px-4 py-2 rounded shadow text-gray-500 text-sm">
              No hay reportes activos en tu zona
            </div>
          )}
          <MapContainer center={centro} zoom={13} className="h-full w-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap"
            />
            {puntos.map((punto) => (
              <Marker
                key={punto.id}
                position={[punto.latitud, punto.longitud]}
                icon={punto.tipo_reporte === 'PERDIDA' ? iconoRojo : iconoVerde}
                eventHandlers={{ click: () => setPuntoSeleccionado(punto) }}
              />
            ))}
          </MapContainer>
        </div>

        {/* Panel de detalle */}
        {puntoSeleccionado && (
          <div
            data-testid="panel-detalle"
            className="w-80 bg-white shadow-lg overflow-y-auto flex flex-col border-l border-gray-200"
          >
            {/* Foto */}
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
              {puntoSeleccionado.foto_url ? (
                <img
                  src={`${import.meta.env.VITE_MS_MASCOTAS_URL ?? 'http://localhost:3003'}${puntoSeleccionado.foto_url}`}
                  alt={puntoSeleccionado.nombre_mascota ?? 'Mascota'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-sm flex flex-col items-center gap-2">
                  <span className="text-4xl">🐾</span>
                  <span>Sin foto disponible</span>
                </div>
              )}
            </div>

            {/* Datos */}
            <div className="p-5 flex flex-col gap-3 flex-1">
              <div className="flex justify-between items-start">
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  puntoSeleccionado.tipo_reporte === 'PERDIDA'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {puntoSeleccionado.tipo_reporte}
                </span>
                <button
                  onClick={() => setPuntoSeleccionado(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Nombre</p>
                  <p className="font-semibold text-gray-800">
                    {puntoSeleccionado.nombre_mascota ?? 'Sin nombre'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Tipo de reporte</p>
                  <p className="text-gray-700">{puntoSeleccionado.tipo_reporte}</p>
                </div>

                {puntoSeleccionado.direccion_aproximada && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Ubicación</p>
                    <p className="text-gray-700 text-sm">{puntoSeleccionado.direccion_aproximada}</p>
                  </div>
                )}

                {puntoSeleccionado.descripcion && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Descripción</p>
                    <p className="text-gray-700 text-sm">{puntoSeleccionado.descripcion}</p>
                  </div>
                )}

                {puntoSeleccionado.codigo_chip && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Código de chip</p>
                    <p className="text-gray-700 text-sm font-mono">{puntoSeleccionado.codigo_chip}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate(`/reportes/${puntoSeleccionado.reporte_id}`)}
                className="mt-auto w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Ver reporte completo
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
