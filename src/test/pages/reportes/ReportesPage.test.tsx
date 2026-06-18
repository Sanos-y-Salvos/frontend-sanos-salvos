import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import ReportesPage from '../../../pages/reportes/ReportesPage'

vi.mock('../../../services/reporteService', () => ({
  listarReportes: vi.fn(),
}))

import { listarReportes } from '../../../services/reporteService'

const mockReportes = [
  {
    id: 'reporte-1',
    nombreMascota: 'Firulais',
    especie: 'PERRO',
    color: 'café',
    tamanio: 'MEDIANO',
    tipo: 'PERDIDA',
    estado: 'EN_BUSQUEDA',
    fechaPublicacion: '2026-01-01T00:00:00.000Z',
    fechaActualizacion: '2026-01-01T00:00:00.000Z',
    ubicacionLatitud: -36.82,
    ubicacionLongitud: -73.04,
    usuarioId: 'usuario-1',
    fotos: [{ id: 'f1', nombreArchivo: 'foto.jpg', urlRelativa: '/uploads/foto.jpg' }],
    descripcion: 'Perro amigable',
  },
  {
    id: 'reporte-2',
    nombreMascota: 'Luna',
    especie: 'GATO',
    color: 'negro',
    tamanio: 'PEQUEÑO',
    tipo: 'ENCONTRADA',
    estado: 'EN_BUSQUEDA',
    fechaPublicacion: '2026-01-02T00:00:00.000Z',
    fechaActualizacion: '2026-01-02T00:00:00.000Z',
    ubicacionLatitud: -36.83,
    ubicacionLongitud: -73.05,
    usuarioId: 'usuario-2',
    fotos: [],
    descripcion: null,
  },
]

const renderConRouter = () =>
  render(
    <MemoryRouter>
      <ReportesPage />
    </MemoryRouter>
  )

describe('ReportesPage — Issue #8', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Grilla de tarjetas ───────────────────────────────────────────────────────

  it('muestra estado de carga mientras se obtienen los datos', () => {
    vi.mocked(listarReportes).mockReturnValue(new Promise(() => {}))
    renderConRouter()
    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  it('muestra una tarjeta por cada reporte activo', async () => {
    vi.mocked(listarReportes).mockResolvedValue(mockReportes)
    renderConRouter()
    await waitFor(() => {
      expect(screen.getAllByTestId('tarjeta-reporte')).toHaveLength(2)
    })
  })

  it('muestra el nombre de la mascota en cada tarjeta', async () => {
    vi.mocked(listarReportes).mockResolvedValue(mockReportes)
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByText('Firulais')).toBeInTheDocument()
      expect(screen.getByText('Luna')).toBeInTheDocument()
    })
  })

  it('muestra el color en cada tarjeta', async () => {
    vi.mocked(listarReportes).mockResolvedValue(mockReportes)
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByText(/café/i)).toBeInTheDocument()
    })
  })

  it('muestra la fecha de publicación en cada tarjeta', async () => {
    vi.mocked(listarReportes).mockResolvedValue(mockReportes)
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByText(/01-01-2026|1 de enero/i)).toBeInTheDocument()
    })
  })

  it('muestra la foto si el reporte tiene imágenes', async () => {
    vi.mocked(listarReportes).mockResolvedValue(mockReportes)
    renderConRouter()
    await waitFor(() => {
      const img = screen.getByRole('img', { name: /firulais/i })
      expect(img).toBeInTheDocument()
    })
  })

  it('muestra placeholder si el reporte no tiene fotos', async () => {
    vi.mocked(listarReportes).mockResolvedValue(mockReportes)
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByTestId('foto-placeholder')).toBeInTheDocument()
    })
  })

  // ── Badges ───────────────────────────────────────────────────────────────────

  it('muestra badge PERDIDA para reportes de pérdida', async () => {
    vi.mocked(listarReportes).mockResolvedValue(mockReportes)
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByTestId('badge-PERDIDA')).toBeInTheDocument()
    })
  })

  it('muestra badge ENCONTRADA para reportes de encuentro', async () => {
    vi.mocked(listarReportes).mockResolvedValue(mockReportes)
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByTestId('badge-ENCONTRADA')).toBeInTheDocument()
    })
  })

  // ── Sin resultados ───────────────────────────────────────────────────────────

  it('muestra mensaje cuando no hay reportes', async () => {
    vi.mocked(listarReportes).mockResolvedValue([])
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByText(/no hay reportes/i)).toBeInTheDocument()
    })
  })

  it('muestra error si el servicio falla', async () => {
    vi.mocked(listarReportes).mockRejectedValue(new Error('Error de red'))
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByText(/error al cargar/i)).toBeInTheDocument()
    })
  })

  // ── Filtros ───────────────────────────────────────────────────────────────────

  it('muestra un selector de filtro por tipo', async () => {
    vi.mocked(listarReportes).mockResolvedValue(mockReportes)
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByTestId('filtro-tipo')).toBeInTheDocument()
    })
  })

  it('muestra un selector de filtro por especie', async () => {
    vi.mocked(listarReportes).mockResolvedValue(mockReportes)
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByTestId('filtro-especie')).toBeInTheDocument()
    })
  })

  it('muestra un selector de filtro por color', async () => {
    vi.mocked(listarReportes).mockResolvedValue(mockReportes)
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByTestId('filtro-color')).toBeInTheDocument()
    })
  })

  it('filtra los reportes por tipo al seleccionar PERDIDA', async () => {
    vi.mocked(listarReportes).mockResolvedValue(mockReportes)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('tarjeta-reporte'))

    await userEvent.selectOptions(screen.getByTestId('filtro-tipo'), 'PERDIDA')

    await waitFor(() => {
      expect(screen.getAllByTestId('tarjeta-reporte')).toHaveLength(1)
      expect(screen.getByText('Firulais')).toBeInTheDocument()
      expect(screen.queryByText('Luna')).not.toBeInTheDocument()
    })
  })

  it('muestra mensaje sin resultados al filtrar sin coincidencias', async () => {
    vi.mocked(listarReportes).mockResolvedValue(mockReportes)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('tarjeta-reporte'))

    await userEvent.type(screen.getByTestId('filtro-color'), 'azul')

    await waitFor(() => {
      expect(screen.getByText(/no hay reportes/i)).toBeInTheDocument()
    })
  })

  // ── Navegación ────────────────────────────────────────────────────────────────

  it('cada tarjeta tiene un link al detalle del reporte', async () => {
    vi.mocked(listarReportes).mockResolvedValue(mockReportes)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('tarjeta-reporte'))

    const links = screen.getAllByRole('link', { name: /ver detalle|ver reporte/i })
    expect(links.length).toBeGreaterThan(0)
  })
})
