import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Input from '../../../components/ui/Input';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input id="name" label="Nombre" />);
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(<Input error="Campo requerido" />);
    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
  });

  it('applies error border class when error present', () => {
    render(<Input error="Error" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-rose-400');
  });

  it('does not show error message when no error', () => {
    render(<Input />);
    expect(screen.queryByText('Campo requerido')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<Input icon={<span data-testid="icon">✉</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies pl-10 class when icon provided', () => {
    render(<Input icon={<span>✉</span>} />);
    expect(screen.getByRole('textbox')).toHaveClass('pl-10');
  });

  it('calls onChange when user types', () => {
    const handler = vi.fn();
    render(<Input onChange={handler} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    expect(handler).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('passes placeholder prop', () => {
    render(<Input placeholder="Escribe aquí" />);
    expect(screen.getByPlaceholderText('Escribe aquí')).toBeInTheDocument();
  });

  it('renders password type input', () => {
    render(<Input type="password" />);
    const input = document.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
  });

  it('applies extra className', () => {
    render(<Input className="custom" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom');
  });

  it('associates label with input via id', () => {
    render(<Input id="email" label="Email" />);
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'email');
  });
});
