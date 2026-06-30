import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import MapaPage from '../../../pages/mapa/MapaPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mapa-contenedor">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, eventHandlers, icon }: {
    children: React.ReactNode
    eventHandlers?: { click?: () => void }
    icon?: { options?: { className?: string } }
  }) => (
    <div
      data-testid="marcador"
      data-icon-class={icon?.options?.className}
      onClick={eventHandlers?.click}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => ({ setView: vi.fn() }),
  divIcon: ({ className, html }: { className: string; html?: string }) => ({
    options: {
      className: html?.includes('f43f5e') ? 'rojo' : html?.includes('10b981') ? 'verde' : className,
    },
  }),
}))

vi.mock('leaflet', () => ({
  default: {
    divIcon: ({ className, html }: { className: string; html?: string }) => ({
      options: {
        className: html?.includes('f43f5e') ? 'rojo' : html?.includes('10b981') ? 'verde' : className,
      },
    }),
  },
}))

vi.mock('../../../services/localizacionService', () => ({
  obtenerPuntosCercanos: vi.fn(),
}))

import { obtenerPuntosCercanos } from '../../../services/localizacionService'

const mockPuntos = [
  {
    id: 'uuid-1',
    reporte_id: 'reporte-uuid-1',
    tipo_reporte: 'PERDIDA',
    nombre_mascota: 'Firulais',
    especie: 'PERRO',
    latitud: -36.826992,
    longitud: -73.049771,
    direccion_aproximada: 'Concepción, Chile',
    descripcion: 'Cerca del parque',
    codigo_chip: null,
    foto_url: 'http://localhost:3003/uploads/foto1.jpg',
  },
  {
    id: 'uuid-2',
    reporte_id: 'reporte-uuid-2',
    tipo_reporte: 'ENCONTRADA',
    nombre_mascota: 'Luna',
    especie: 'GATO',
    latitud: -36.830000,
    longitud: -73.055000,
    direccion_aproximada: 'San Pedro, Chile',
    descripcion: null,
    codigo_chip: null,
    foto_url: null,
  },
]

const renderConRouter = () =>
  render(
    <MemoryRouter>
      <MapaPage />
    </MemoryRouter>
  )

describe('MapaPage', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((success) =>
          success({ coords: { latitude: -36.826992, longitude: -73.049771 } })
        ),
      },
      configurable: true,
    })
  })

  // ── Layout ───────────────────────────────────────────────────────────────────

  it('muestra el Navbar', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })

  it('renderiza el contenedor del mapa', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByTestId('mapa-contenedor')).toBeInTheDocument()
    })
  })

  // ── Marcadores con color ─────────────────────────────────────────────────────

  it('usa icono rojo para reportes PERDIDA', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => {
      const marcadores = screen.getAllByTestId('marcador')
      const perdida = marcadores.find(m => m.dataset.iconClass?.includes('rojo'))
      expect(perdida).toBeInTheDocument()
    })
  })

  it('usa icono verde para reportes ENCONTRADA', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => {
      const marcadores = screen.getAllByTestId('marcador')
      const encontrada = marcadores.find(m => m.dataset.iconClass?.includes('verde'))
      expect(encontrada).toBeInTheDocument()
    })
  })

  // ── Mapa ─────────────────────────────────────────────────────────────────────

  it('muestra un marcador por cada reporte activo', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => {
      expect(screen.getAllByTestId('marcador')).toHaveLength(2)
    })
  })

  it('muestra mensaje cuando no hay reportes en la zona', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue([])
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByText(/no hay reportes/i)).toBeInTheDocument()
    })
  })

  it('llama al servicio de localización al montar el componente', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => {
      expect(obtenerPuntosCercanos).toHaveBeenCalledTimes(1)
    })
  })

  it('muestra error si el servicio falla', async () => {
    vi.mocked(obtenerPuntosCercanos).mockRejectedValue(new Error('Error de red'))
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByText(/error al cargar/i)).toBeInTheDocument()
    })
  })

  // ── Panel de detalle ────────────────────────────────────────────────────────

  it('no muestra panel de detalle al cargar sin selección', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    expect(screen.queryByTestId('panel-detalle')).not.toBeInTheDocument()
  })

  it('muestra panel de detalle al hacer clic en un marcador', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[0])
    await waitFor(() => {
      expect(screen.getByTestId('panel-detalle')).toBeInTheDocument()
    })
  })

  it('muestra el nombre de la mascota en el panel de detalle', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[0])
    await waitFor(() => {
      expect(screen.getByTestId('panel-detalle')).toHaveTextContent('Firulais')
    })
  })

  it('muestra el tipo de reporte en el panel de detalle', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[0])
    await waitFor(() => {
      expect(screen.getByTestId('panel-detalle')).toHaveTextContent('PERDIDA')
    })
  })

  it('muestra la ubicación en el panel de detalle', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[0])
    await waitFor(() => {
      expect(screen.getByTestId('panel-detalle')).toHaveTextContent('Concepción, Chile')
    })
  })

  it('muestra la descripción en el panel de detalle', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[0])
    await waitFor(() => {
      expect(screen.getByTestId('panel-detalle')).toHaveTextContent('Cerca del parque')
    })
  })

  it('muestra la foto si está disponible', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[0])
    await waitFor(() => {
      const img = screen.getByRole('img', { name: /firulais/i })
      expect(img).toBeInTheDocument()
    })
  })

  it('muestra placeholder si no hay foto', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[1])
    await waitFor(() => {
      expect(screen.getByTestId('panel-detalle')).toHaveTextContent(/sin foto/i)
    })
  })

  it('muestra link para ver el reporte completo', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[0])
    await waitFor(() => {
      expect(screen.getByText(/ver reporte/i)).toBeInTheDocument()
    })
  })
  it('cierra el panel al hacer clic en el botón ✕', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[0])
    await waitFor(() => {
      expect(screen.getByTestId('panel-detalle')).toBeInTheDocument()
    })
    const panel = screen.getByTestId('panel-detalle')
    await userEvent.click(within(panel).getAllByRole('button')[0])
    await waitFor(() => {
      expect(screen.queryByTestId('panel-detalle')).not.toBeInTheDocument()
    })
  })

  it('muestra la etiqueta PERDIDA en el panel del reporte perdido', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[0])
    await waitFor(() => {
      expect(screen.getByTestId('panel-detalle')).toHaveTextContent('PERDIDA')
    })
  })

  it('muestra la etiqueta ENCONTRADA en el panel del reporte encontrado', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[1])
    await waitFor(() => {
      expect(screen.getByTestId('panel-detalle')).toHaveTextContent('ENCONTRADA')
    })
  })

  it('muestra la especie en el panel de detalle', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[0])
    await waitFor(() => {
      expect(screen.getByTestId('panel-detalle')).toHaveTextContent('PERRO')
    })
  })

  it('navega al reporte completo al hacer clic en el botón del panel', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[0])
    await waitFor(() => screen.getByTestId('panel-detalle'))
    await userEvent.click(screen.getByRole('button', { name: /ver reporte completo/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/reportes/reporte-uuid-1')
  })

  it('usa coordenadas por defecto cuando la geolocalización falla', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((_success, error) => error(new Error('denied'))),
      },
      configurable: true,
    })
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => {
      expect(vi.mocked(obtenerPuntosCercanos)).toHaveBeenCalled()
    })
  })

  it('usa nombre alternativo "Mascota" cuando nombre_mascota es null en foto alt', async () => {
    const puntoSinNombre = [{ ...mockPuntos[0], nombre_mascota: null, foto_url: '/uploads/f.jpg' }]
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(puntoSinNombre)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[0])
    await waitFor(() => {
      expect(screen.getByTestId('panel-detalle')).toHaveTextContent('Sin nombre')
    })
  })

  it('usa VITE_MS_MASCOTAS_URL de env cuando está definida', async () => {
    vi.stubEnv('VITE_MS_MASCOTAS_URL', 'http://custom-server:4000')
    const puntoConFoto = [{ ...mockPuntos[0], foto_url: '/uploads/foto1.jpg' }]
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(puntoConFoto)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[0])
    await waitFor(() => {
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', 'http://custom-server:4000/uploads/foto1.jpg')
    })
    vi.unstubAllEnvs()
  })

  it('muestra "Sin foto" cuando el marcador seleccionado no tiene foto', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(mockPuntos)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    // Click second marker (uuid-2 has foto_url: null)
    await userEvent.click(screen.getAllByTestId('marcador')[1])
    await waitFor(() => {
      expect(screen.getByTestId('panel-detalle')).toHaveTextContent('Sin foto')
    })
  })

  it('muestra texto en singular con exactamente 1 reporte activo', async () => {
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue([mockPuntos[0]])
    renderConRouter()
    await waitFor(() => {
      expect(screen.getByText(/1 reporte activo/i)).toBeInTheDocument()
    })
  })

  it('muestra código chip cuando el punto tiene código chip', async () => {
    const puntoConChip = [{ ...mockPuntos[0], codigo_chip: 'CHIP-123' }]
    vi.mocked(obtenerPuntosCercanos).mockResolvedValue(puntoConChip)
    renderConRouter()
    await waitFor(() => screen.getAllByTestId('marcador'))
    await userEvent.click(screen.getAllByTestId('marcador')[0])
    await waitFor(() => {
      expect(screen.getByTestId('panel-detalle')).toHaveTextContent('CHIP-123')
    })
  })

})
