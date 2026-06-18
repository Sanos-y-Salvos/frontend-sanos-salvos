import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarReportes } from '../../services/reporteService'
import type { Reporte } from '../../types'
import Navbar from '../../components/layout/Navbar'

const MS_MASCOTAS_URL = import.meta.env.VITE_MS_MASCOTAS_URL ?? 'http://localhost:3003'

const TIPOS = ['', 'PERDIDA', 'ENCONTRADA']
const ESPECIES = ['', 'PERRO', 'GATO', 'AVE', 'CONEJO', 'HAMSTER', 'REPTIL', 'OTRO']

export default function ReportesPage() {
  const [reportes, setReportes] = useState<Reporte[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEspecie, setFiltroEspecie] = useState('')
  const [filtroColor, setFiltroColor] = useState('')

  useEffect(() => {
    listarReportes()
      .then(setReportes)
      .catch(() => setError('Error al cargar los reportes'))
      .finally(() => setCargando(false))
  }, [])

  const reportesFiltrados = reportes.filter((r) => {
    if (filtroTipo && r.tipo !== filtroTipo) return false
    if (filtroEspecie && r.especie !== filtroEspecie) return false
    if (filtroColor && !r.color.toLowerCase().includes(filtroColor.toLowerCase())) return false
    return true
  })

  if (cargando) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Cargando reportes...
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-red-600">{error}</div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Reportes de mascotas</h1>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            data-testid="filtro-tipo"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
          >
            <option value="">Todos los tipos</option>
            {TIPOS.filter(Boolean).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            data-testid="filtro-especie"
            value={filtroEspecie}
            onChange={(e) => setFiltroEspecie(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
          >
            <option value="">Todas las especies</option>
            {ESPECIES.filter(Boolean).map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>

          <input
            data-testid="filtro-color"
            type="text"
            placeholder="Filtrar por color..."
            value={filtroColor}
            onChange={(e) => setFiltroColor(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
          />
        </div>

        {/* Grilla */}
        {reportesFiltrados.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No hay reportes que coincidan con los filtros aplicados
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {reportesFiltrados.map((reporte) => (
              <div
                key={reporte.id}
                data-testid="tarjeta-reporte"
                className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden flex flex-col"
              >
                {/* Foto */}
                <div className="h-48 bg-gray-100 overflow-hidden flex items-center justify-center">
                  {reporte.fotos.length > 0 ? (
                    <img
                      src={`${MS_MASCOTAS_URL}${reporte.fotos[0].urlRelativa}`}
                      alt={reporte.nombreMascota}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div data-testid="foto-placeholder" className="text-gray-400 flex flex-col items-center gap-1">
                      <span className="text-4xl">🐾</span>
                      <span className="text-xs">Sin foto</span>
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-bold text-gray-800 text-lg leading-tight">
                      {reporte.nombreMascota}
                    </h2>
                    <span
                      data-testid={`badge-${reporte.tipo}`}
                      className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${
                        reporte.tipo === 'PERDIDA'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {reporte.tipo}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Color:</span> {reporte.color}</p>
                    <p><span className="font-medium">Especie:</span> {reporte.especie}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(reporte.fechaPublicacion).toLocaleDateString('es-CL')}
                    </p>
                  </div>

                  <Link
                    to={`/reportes/${reporte.id}`}
                    className="mt-auto text-center text-sm bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Ver reporte
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
