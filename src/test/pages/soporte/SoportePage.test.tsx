import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SoportePage from '../../../pages/soporte/SoportePage';

const mockNavigate = vi.fn();
let mockIsAuthenticated = true;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => <div {...p}>{children}</div>,
    button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../../components/layout/Navbar', () => ({ default: () => <nav>Navbar</nav> }));
vi.mock('../../../components/layout/Footer', () => ({ default: () => <footer>Footer</footer> }));

const renderPage = () =>
  render(<MemoryRouter><SoportePage /></MemoryRouter>);

describe('SoportePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
  });

  it('renders support page header', () => {
    renderPage();
    expect(screen.getByText('¿En qué podemos ayudarte?')).toBeInTheDocument();
  });

  it('shows create ticket button', () => {
    renderPage();
    expect(screen.getByText('Crear ticket de soporte')).toBeInTheDocument();
  });

  it('shows "Mis tickets" button when authenticated', () => {
    renderPage();
    expect(screen.getByText('Mis tickets')).toBeInTheDocument();
  });

  it('does NOT show "Mis tickets" button when unauthenticated', () => {
    mockIsAuthenticated = false;
    renderPage();
    expect(screen.queryByText('Mis tickets')).not.toBeInTheDocument();
  });

  it('navigates to /tickets/nuevo when Crear ticket is clicked', () => {
    renderPage();
    fireEvent.click(screen.getByText('Crear ticket de soporte'));
    expect(mockNavigate).toHaveBeenCalledWith('/tickets/nuevo');
  });

  it('navigates to /tickets when Mis tickets is clicked', () => {
    renderPage();
    fireEvent.click(screen.getByText('Mis tickets'));
    expect(mockNavigate).toHaveBeenCalledWith('/tickets');
  });

  it('renders the virtual assistant section', () => {
    renderPage();
    expect(screen.getByText('Asistente virtual disponible')).toBeInTheDocument();
  });

  it('renders commitment guarantees', () => {
    renderPage();
    expect(screen.getByText('Respuesta rápida')).toBeInTheDocument();
    expect(screen.getByText('Soporte seguro')).toBeInTheDocument();
    expect(screen.getByText('Atención real')).toBeInTheDocument();
  });

  it('renders Centro de ayuda label', () => {
    renderPage();
    expect(screen.getByText('Centro de ayuda')).toBeInTheDocument();
  });
});
