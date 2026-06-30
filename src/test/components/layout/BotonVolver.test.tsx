import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BotonVolver from '../../../components/layout/BotonVolver';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderBtn = (props = {}) =>
  render(<MemoryRouter><BotonVolver {...props} /></MemoryRouter>);

describe('BotonVolver', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders default text "Volver"', () => {
    renderBtn();
    expect(screen.getByRole('button', { name: /Volver/i })).toBeInTheDocument();
  });

  it('renders custom text', () => {
    renderBtn({ texto: 'Regresar' });
    expect(screen.getByRole('button', { name: /Regresar/i })).toBeInTheDocument();
  });

  it('navigates to ruta when clicked without onClick prop', () => {
    renderBtn({ ruta: '/dashboard' });
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('calls onClick prop when provided', () => {
    const handler = vi.fn();
    renderBtn({ onClick: handler });
    fireEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalled();
  });

  it('calls onClick and does not navigate when onClick is provided', () => {
    const handler = vi.fn();
    renderBtn({ ruta: '/somewhere', onClick: handler });
    fireEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when neither ruta nor onClick provided', () => {
    renderBtn();
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
