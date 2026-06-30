import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Alert from '../../../components/ui/Alert';

describe('Alert', () => {
  it('renders error variant with message', () => {
    render(<Alert variant="error">Error message</Alert>);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders success variant', () => {
    render(<Alert variant="success">Success!</Alert>);
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('renders info variant', () => {
    render(<Alert variant="info">Info text</Alert>);
    expect(screen.getByText('Info text')).toBeInTheDocument();
  });

  it('renders warning variant', () => {
    render(<Alert variant="warning">Warning text</Alert>);
    expect(screen.getByText('Warning text')).toBeInTheDocument();
  });

  it('applies error classes', () => {
    const { container } = render(<Alert variant="error">Err</Alert>);
    expect(container.firstChild).toHaveClass('bg-rose-50');
  });

  it('applies success classes', () => {
    const { container } = render(<Alert variant="success">OK</Alert>);
    expect(container.firstChild).toHaveClass('bg-emerald-50');
  });

  it('applies info classes', () => {
    const { container } = render(<Alert variant="info">Info</Alert>);
    expect(container.firstChild).toHaveClass('bg-brand-50');
  });

  it('applies warning classes', () => {
    const { container } = render(<Alert variant="warning">Warn</Alert>);
    expect(container.firstChild).toHaveClass('bg-amber-50');
  });

  it('applies extra className', () => {
    const { container } = render(<Alert variant="info" className="mt-4">Info</Alert>);
    expect(container.firstChild).toHaveClass('mt-4');
  });

  it('renders children as ReactNode', () => {
    render(<Alert variant="info"><strong>Bold</strong> text</Alert>);
    expect(screen.getByText('Bold')).toBeInTheDocument();
  });
});
