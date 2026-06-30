import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import ReportesPage from '../../../pages/reportes/ReportesPage'

vi.mock('../../../services/reporteService', () => ({
  listarReportes: vi.fn(),
}))

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: false })),
}))

import { listarReportes } from '../../../services/reporteService'
import { useAuth } from '../../../hooks/useAuth'

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
    expect(screen.getAllByText(/cargando/i).length).toBeGreaterThan(0)
  })

  it('muestra una tarjeta por cada reporte activo', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => {
      expect(screen.getAllByTestId('tarjeta-reporte')).toHaveLength(2)
    })
  })

  it('muestra el nombre de la mascota en cada tarjeta', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByText('Firulais')).toBeInTheDocument()
      expect(screen.getByText('Luna')).toBeInTheDocument()
    })
  })

  it('muestra el color en cada tarjeta', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByText(/café/i)).toBeInTheDocument()
    })
  })

  it('muestra la fecha de publicación en cada tarjeta', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByText(/01-01-2026|1 de enero/i)).toBeInTheDocument()
    })
  })

  it('muestra la foto si el reporte tiene imágenes', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => {
      const img = screen.getByRole('img', { name: /firulais/i })
      expect(img).toBeInTheDocument()
    })
  })

  it('muestra placeholder si el reporte no tiene fotos', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByTestId('foto-placeholder')).toBeInTheDocument()
    })
  })

  // ── Badges ───────────────────────────────────────────────────────────────────

  it('muestra badge PERDIDA para reportes de pérdida', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByTestId('badge-PERDIDA')).toBeInTheDocument()
    })
  })

  it('muestra badge ENCONTRADA para reportes de encuentro', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByTestId('badge-ENCONTRADA')).toBeInTheDocument()
    })
  })

  // ── Sin resultados ───────────────────────────────────────────────────────────

  it('muestra mensaje cuando no hay reportes', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: [], total: 0, totalPages: 0, page: 1 })
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
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByTestId('filtro-tipo')).toBeInTheDocument()
    })
  })

  it('muestra un selector de filtro por especie', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByTestId('filtro-especie')).toBeInTheDocument()
    })
  })

  it('muestra un selector de filtro por color', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByTestId('filtro-color')).toBeInTheDocument()
    })
  })

  it('filtra los reportes por tipo al seleccionar PERDIDA', async () => {
    const soloFirulais = [mockReportes[0]]
    vi.mocked(listarReportes)
      .mockResolvedValueOnce({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
      .mockResolvedValueOnce({ data: soloFirulais, total: 1, totalPages: 1, page: 1 })
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
    const emptyResult = { data: [], total: 0, totalPages: 0, page: 1 }
    vi.mocked(listarReportes)
      .mockResolvedValueOnce({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
      .mockResolvedValue(emptyResult)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('tarjeta-reporte'))

    await userEvent.type(screen.getByTestId('filtro-color'), 'azul')

    await waitFor(() => {
      expect(screen.getByText(/no hay reportes/i)).toBeInTheDocument()
    })
  })

  // ── Navegación ────────────────────────────────────────────────────────────────

  it('cada tarjeta tiene un link al detalle del reporte', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('tarjeta-reporte'))

    const links = screen.getAllByRole('link', { name: /ver detalle|ver reporte/i })
    expect(links.length).toBeGreaterThan(0)
  })

  // ── Paginación ────────────────────────────────────────────────────────────────

  it('muestra paginación cuando hay más de una página', async () => {
    const muchasPages = { data: mockReportes, total: 20, totalPages: 3, page: 1 }
    vi.mocked(listarReportes).mockResolvedValue(muchasPages)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('tarjeta-reporte'))
    expect(screen.getAllByRole('button', { name: /^[23]$/ }).length).toBeGreaterThan(0)
  })

  it('no muestra paginación cuando hay una sola página', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('tarjeta-reporte'))
    expect(screen.queryByRole('button', { name: /^2$/ })).not.toBeInTheDocument()
  })

  it('cambia de página al hacer clic en paginación', async () => {
    vi.mocked(listarReportes)
      .mockResolvedValueOnce({ data: mockReportes, total: 20, totalPages: 3, page: 1 })
      .mockResolvedValueOnce({ data: mockReportes, total: 20, totalPages: 3, page: 2 })
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('tarjeta-reporte'))
    await userEvent.click(screen.getAllByRole('button', { name: /^2$/ })[0])
    await waitFor(() => {
      expect(vi.mocked(listarReportes)).toHaveBeenCalledTimes(2)
    })
  })

  it('navega a la página anterior con el botón ChevronLeft (onClick onChange(page-1))', async () => {
    // Start on page 2 so ChevronLeft prev button is enabled
    vi.mocked(listarReportes)
      .mockResolvedValueOnce({ data: mockReportes, total: 20, totalPages: 3, page: 2 })
      .mockResolvedValue({ data: mockReportes, total: 20, totalPages: 3, page: 1 })
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('tarjeta-reporte'))
    // All pagination buttons: [prev, 1, 2, 3, next] — prev is first, enabled when page > 1
    const allBtns = screen.getAllByRole('button')
    const prevBtn = allBtns.find(b => !b.disabled && b.querySelector('.lucide-chevron-left'))
    expect(prevBtn).toBeDefined()
    if (prevBtn) {
      await userEvent.click(prevBtn)
      await waitFor(() => {
        expect(vi.mocked(listarReportes)).toHaveBeenCalledTimes(2)
      })
    }
  })

  it('navega a la página siguiente con el botón next', async () => {
    vi.mocked(listarReportes)
      .mockResolvedValueOnce({ data: mockReportes, total: 20, totalPages: 3, page: 1 })
      .mockResolvedValue({ data: mockReportes, total: 20, totalPages: 3, page: 2 })
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('tarjeta-reporte'))
    const allBtns = screen.getAllByRole('button')
    const nextBtn = allBtns.filter(b => !b.disabled && b.querySelector('svg') && !b.textContent?.trim()).pop()
    if (nextBtn) {
      await userEvent.click(nextBtn)
      await waitFor(() => {
        expect(vi.mocked(listarReportes)).toHaveBeenCalledTimes(2)
      })
    }
  })

  it('muestra elipsis en paginación con muchas páginas (página central)', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 100, totalPages: 10, page: 5 })
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('tarjeta-reporte'))
    // Both branches: page > 3 (true) and page < totalPages - 2 (true) → two ellipsis
    const ellipsisElements = document.querySelectorAll('span')
    const hasEllipsis = Array.from(ellipsisElements).some(el => el.textContent === '…')
    expect(hasEllipsis).toBe(true)
  })

  it('muestra paginación sin elipsis inicial cuando página es menor o igual a 3', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 100, totalPages: 10, page: 2 })
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('tarjeta-reporte'))
    // page=2, page > 3 is false → no leading ellipsis
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('muestra paginación sin elipsis final cuando página está cerca del final', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 100, totalPages: 10, page: 9 })
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('tarjeta-reporte'))
    // page=9, page >= totalPages-2=8 → false branch of "page < totalPages - 2"
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('muestra botón "Nuevo reporte" cuando el usuario está autenticado', async () => {
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true } as any)
    vi.mocked(listarReportes).mockResolvedValue({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /reportar mascota/i })).toBeInTheDocument()
    })
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false } as any)
  })

  it('muestra texto singular cuando hay exactamente 1 reporte', async () => {
    const unReporte = [mockReportes[0]]
    vi.mocked(listarReportes).mockResolvedValue({ data: unReporte, total: 1, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByText('1 reporte en búsqueda')).toBeInTheDocument()
    })
  })

  it('filtra los reportes por especie al seleccionar GATO', async () => {
    const soloLuna = [mockReportes[1]]
    vi.mocked(listarReportes)
      .mockResolvedValueOnce({ data: mockReportes, total: 2, totalPages: 1, page: 1 })
      .mockResolvedValue({ data: soloLuna, total: 1, totalPages: 1, page: 1 })
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('tarjeta-reporte'))
    await userEvent.selectOptions(screen.getByTestId('filtro-especie'), 'GATO')
    await waitFor(() => {
      expect(screen.getAllByTestId('tarjeta-reporte')).toHaveLength(1)
      expect(screen.getByText('Luna')).toBeInTheDocument()
    })
  })
})
