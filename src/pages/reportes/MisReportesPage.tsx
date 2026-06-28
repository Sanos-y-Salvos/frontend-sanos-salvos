import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PawPrint, Plus, Filter, Loader2, AlertCircle,
  CalendarDays, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { listarReportes } from '../../services/reporteService'
import type { Reporte } from '../../types'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import BotonVolver from '../../components/layout/BotonVolver'
import { useAuth } from '../../hooks/useAuth'

const MS_MASCOTAS_URL = import.meta.env.VITE_MS_MASCOTAS_URL ?? 'http://localhost:3003'
const PAGE_SIZE = 12

const TIPOS    = ['PERDIDA', 'ENCONTRADA']
const ESPECIES = ['PERRO', 'GATO', 'AVE', 'CONEJO', 'HAMSTER', 'REPTIL', 'OTRO']
const ESTADOS  = ['EN_BUSQUEDA', 'EMPAREJADO', 'RESUELTO', 'ABANDONADO', 'OCULTO']

const estadoConfig: Record<string, { label: string; cls: string }> = {
  EN_BUSQUEDA: { label: 'En búsqueda', cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
  EMPAREJADO:  { label: 'Emparejado',  cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
  RESUELTO:    { label: 'Resuelto',    cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  ABANDONADO:  { label: 'Abandonado',  cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
  OCULTO:      { label: 'Oculto',      cls: 'bg-rose-100 text-rose-700 border border-rose-200' },
}

const tipoCls = (tipo: string) =>
  tipo === 'PERDIDA'
    ? 'bg-rose-100 text-rose-700 border border-rose-200'
    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'

function Paginacion({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null

  const pages: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
  }

  const btn = 'w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors'
  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className={`${btn} border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed`}>
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
          : <button key={p} onClick={() => onChange(p as number)}
              className={`${btn} ${p === page ? 'bg-slate-900 text-white border border-slate-900' : 'border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
              {p}
            </button>
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className={`${btn} border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed`}>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function MisReportesPage() {
  const { user } = useAuth()

  const [reportes, setReportes]     = useState<Reporte[]>([])
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]             = useState(1)
  const [cargando, setCargando]     = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const [filtroTipo, setFiltroTipo]       = useState('')
  const [filtroEstado, setFiltroEstado]   = useState('')
  const [filtroEspecie, setFiltroEspecie] = useState('')

  const cargar = (p: number) => {
    if (!user?.credential_id) return
    setCargando(true)
    setError(null)
    listarReportes({
      usuarioId: user.credential_id,
      tipo:    filtroTipo    || undefined,
      estado:  filtroEstado  || undefined,
      especie: filtroEspecie || undefined,
      page:    p,
      limit:   PAGE_SIZE,
    })
      .then((res) => {
        setReportes(res.data)
        setTotal(res.total)
        setTotalPages(res.totalPages)
        setPage(res.page)
      })
      .catch(() => setError('Error al cargar tus reportes'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar(1) }, [filtroTipo, filtroEstado, filtroEspecie, user?.credential_id])

  const cambiarPagina = (p: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    cargar(p)
  }

  const selectCls = 'border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all cursor-pointer hover:border-slate-300'

  return (
    <div className="min-h-screen flex flex-col public-glass">
      <Navbar />

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-5 pt-5 pb-0">
          <BotonVolver ruta="/perfil" texto="Volver al perfil" />
        </div>
        <div className="max-w-7xl mx-auto px-5 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-display font-bold text-slate-900">Mis reportes</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {cargando ? 'Cargando…' : `${total} reporte${total !== 1 ? 's' : ''} publicado${total !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            to="/reportes/nuevo"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Nuevo reporte
          </Link>
        </div>

        {/* Filtros */}
        <div className="max-w-7xl mx-auto px-5 pb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-medium">Filtros:</span>
          </div>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className={selectCls}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{estadoConfig[e]?.label ?? e}</option>)}
          </select>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className={selectCls}>
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filtroEspecie} onChange={e => setFiltroEspecie(e.target.value)} className={selectCls}>
            <option value="">Todas las especies</option>
            {ESPECIES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-5 py-8">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <p className="text-sm">Cargando tus reportes...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-rose-500">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">{error}</p>
          </div>
        ) : reportes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <PawPrint className="w-8 h-8 text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="text-sm">
              {filtroEstado || filtroTipo || filtroEspecie
                ? 'No hay reportes que coincidan con los filtros'
                : 'Aún no has creado ningún reporte'}
            </p>
            {!filtroEstado && !filtroTipo && !filtroEspecie && (
              <Link
                to="/reportes/nuevo"
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Crear primer reporte
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {reportes.map((reporte) => {
                const estado = estadoConfig[reporte.estado] ?? { label: reporte.estado, cls: 'bg-slate-100 text-slate-600 border border-slate-200' }
                return (
                  <div
                    key={reporte.id}
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
                        <div className="flex flex-col items-center gap-2 text-slate-300">
                          <PawPrint className="w-10 h-10" strokeWidth={1} />
                          <span className="text-xs">Sin foto</span>
                        </div>
                      )}
                      <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${tipoCls(reporte.tipo)}`}>
                        {reporte.tipo}
                      </span>
                      <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${estado.cls}`}>
                        {estado.label}
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
                )
              })}
            </div>
            <Paginacion page={page} totalPages={totalPages} onChange={cambiarPagina} />
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
