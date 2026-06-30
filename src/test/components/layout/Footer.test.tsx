import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../../../components/layout/Footer';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

let mockIsAdminMode = false;
vi.mock('../../../context/AdminModeContext', () => ({
  useAdminMode: () => ({ isAdminMode: mockIsAdminMode }),
}));

const renderFooter = () => render(<MemoryRouter><Footer /></MemoryRouter>);

describe('Footer', () => {
  beforeEach(() => {
    mockIsAdminMode = false;
    mockNavigate.mockClear();
  });

  it('renders brand name', () => {
    renderFooter();
    expect(screen.getByText('Sanos y Salvos')).toBeInTheDocument();
  });

  it('renders platform links', () => {
    renderFooter();
    expect(screen.getByText('Reportes')).toBeInTheDocument();
    expect(screen.getByText('Mapa interactivo')).toBeInTheDocument();
    expect(screen.getByText('Soporte')).toBeInTheDocument();
    expect(screen.getByText('Quiénes somos')).toBeInTheDocument();
  });

  it('renders account links', () => {
    renderFooter();
    expect(screen.getByText('Registrarse')).toBeInTheDocument();
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
  });

  it('renders legal links', () => {
    renderFooter();
    expect(screen.getByText('Términos y Condiciones')).toBeInTheDocument();
    expect(screen.getByText('Privacidad')).toBeInTheDocument();
    expect(screen.getByText('Normas de la Comunidad')).toBeInTheDocument();
  });

  it('navigates when Reportes link is clicked', () => {
    renderFooter();
    fireEvent.click(screen.getByText('Reportes'));
    expect(mockNavigate).toHaveBeenCalledWith('/reportes');
  });

  it('navigates when Términos y Condiciones is clicked', () => {
    renderFooter();
    fireEvent.click(screen.getByText('Términos y Condiciones'));
    expect(mockNavigate).toHaveBeenCalledWith('/terminos');
  });

  it('navigates to /login when Iniciar sesión is clicked', () => {
    renderFooter();
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('returns null when isAdminMode is true', () => {
    mockIsAdminMode = true;
    const { container } = renderFooter();
    expect(container.firstChild).toBeNull();
  });

  it('shows copyright text', () => {
    renderFooter();
    expect(screen.getByText(/2026 Sanos y Salvos/)).toBeInTheDocument();
  });
});
