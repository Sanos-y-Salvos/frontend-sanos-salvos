import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PawPrint, Plus, Search, Filter, Loader2, AlertCircle, CalendarDays } from 'lucide-react'
import { listarReportes } from '../../services/reporteService'
import type { Reporte } from '../../types'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { useAuth } from '../../hooks/useAuth'

const MS_MASCOTAS_URL = import.meta.env.VITE_MS_MASCOTAS_URL ?? 'http://localhost:3003'
const TIPOS    = ['', 'PERDIDA', 'ENCONTRADA']
const ESPECIES = ['', 'PERRO', 'GATO', 'AVE', 'CONEJO', 'HAMSTER', 'REPTIL', 'OTRO']

const badgeClasses = (tipo: string) =>
  tipo === 'PERDIDA'
    ? 'bg-rose-100 text-rose-700 border border-rose-200'
    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'

export default function ReportesPage() {
  const { isAuthenticated } = useAuth()
  const [reportes, setReportes]       = useState<Reporte[]>([])
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [filtroTipo, setFiltroTipo]   = useState('')
  const [filtroEspecie, setFiltroEspecie] = useState('')
  const [filtroColor, setFiltroColor] = useState('')

  useEffect(() => {
    listarReportes()
      .then(setReportes)
      .catch(() => setError('Error al cargar los reportes'))
      .finally(() => setCargando(false))
  }, [])

  const filtrados = reportes.filter((r) => {
    if (filtroTipo    && r.tipo    !== filtroTipo)                             return false
    if (filtroEspecie && r.especie !== filtroEspecie)                         return false
    if (filtroColor   && !r.color.toLowerCase().includes(filtroColor.toLowerCase())) return false
    return true
  })

  const selectCls = 'border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all cursor-pointer hover:border-slate-300'

  if (cargando) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-sm">Cargando reportes...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-rose-600">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-5 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-display font-bold text-slate-900">Reportes de mascotas</h1>
            <p className="text-slate-500 text-sm mt-0.5">{filtrados.length} reporte{filtrados.length !== 1 ? 's' : ''} activo{filtrados.length !== 1 ? 's' : ''}</p>
          </div>
          {isAuthenticated && (
            <Link
              to="/reportes/nuevo"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Reportar mascota
            </Link>
          )}
        </div>

        {/* Filtros */}
        <div className="max-w-7xl mx-auto px-5 pb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-medium">Filtros:</span>
          </div>
          <select data-testid="filtro-tipo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={selectCls}>
            <option value="">Todos los tipos</option>
            {TIPOS.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select data-testid="filtro-especie" value={filtroEspecie} onChange={(e) => setFiltroEspecie(e.target.value)} className={selectCls}>
            <option value="">Todas las especies</option>
            {ESPECIES.filter(Boolean).map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              data-testid="filtro-color"
              type="text"
              placeholder="Color..."
              value={filtroColor}
              onChange={(e) => setFiltroColor(e.target.value)}
              className="border border-slate-200 hover:border-slate-300 rounded-xl pl-8 pr-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all w-36"
            />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-5 py-8">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <PawPrint className="w-8 h-8 text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="text-sm">No hay reportes que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtrados.map((reporte) => (
              <div
                key={reporte.id}
                data-testid="tarjeta-reporte"
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col group"
              >
                {/* Foto */}
                <div className="h-44 bg-slate-100 overflow-hidden flex items-center justify-center relative">
                  {reporte.fotos.length > 0 ? (
                    <img
                      src={`${MS_MASCOTAS_URL}${reporte.fotos[0].urlRelativa}`}
                      alt={reporte.nombreMascota}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div data-testid="foto-placeholder" className="flex flex-col items-center gap-2 text-slate-300">
                      <PawPrint className="w-10 h-10" strokeWidth={1} />
                      <span className="text-xs">Sin foto</span>
                    </div>
                  )}
                  {/* Badge sobre la imagen */}
                  <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClasses(reporte.tipo)}`}
                    data-testid={`badge-${reporte.tipo}`}>
                    {reporte.tipo}
                  </span>
                </div>

                {/* Contenido */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <h2 className="font-display font-bold text-slate-900 text-base leading-tight">{reporte.nombreMascota}</h2>
                  <div className="space-y-1 text-sm text-slate-500">
                    <p><span className="font-medium text-slate-700">Color:</span> {reporte.color}</p>
                    <p><span className="font-medium text-slate-700">Especie:</span> {reporte.especie}</p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-400">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(reporte.fechaPublicacion).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <Link
                    to={`/reportes/${reporte.id}`}
                    className="mt-auto text-center text-sm bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl transition-all font-medium active:scale-[0.98]"
                  >
                    Ver reporte
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
