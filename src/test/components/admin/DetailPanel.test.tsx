import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DetailPanel from '../../../components/admin/DetailPanel';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, ...p }: any) => <div onClick={onClick} {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const renderPanel = (isOpen: boolean, onClose = vi.fn(), props: Record<string, any> = {}) =>
  render(
    <DetailPanel isOpen={isOpen} onClose={onClose} title="Test Panel" {...props}>
      <p>Panel content</p>
    </DetailPanel>
  );

describe('DetailPanel', () => {
  it('renders nothing when closed', () => {
    renderPanel(false);
    expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
  });

  it('renders children when open', () => {
    renderPanel(true);
    expect(screen.getByText('Panel content')).toBeInTheDocument();
    expect(screen.getByText('Test Panel')).toBeInTheDocument();
  });

  it('shows subtitle when provided', () => {
    renderPanel(true, vi.fn(), { subtitle: 'My Subtitle' });
    expect(screen.getByText('My Subtitle')).toBeInTheDocument();
  });

  it('shows loading spinner instead of children when loading=true', () => {
    renderPanel(true, vi.fn(), { loading: true });
    expect(screen.getByText('Cargando registros...')).toBeInTheDocument();
    expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    renderPanel(true, onClose);
    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed while open', () => {
    const onClose = vi.fn();
    renderPanel(true, onClose);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose for non-Escape keys', () => {
    const onClose = vi.fn();
    renderPanel(true, onClose);
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('removes keydown listener after panel closes', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <DetailPanel isOpen={true} onClose={onClose} title="Test">
        <p>content</p>
      </DetailPanel>
    );
    rerender(
      <DetailPanel isOpen={false} onClose={onClose} title="Test">
        <p>content</p>
      </DetailPanel>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('stopPropagation on panel click prevents backdrop close', () => {
    const onClose = vi.fn();
    renderPanel(true, onClose);
    const panelDiv = document.querySelector('.max-w-2xl') as HTMLElement;
    expect(panelDiv).toBeTruthy();
    fireEvent.click(panelDiv);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    renderPanel(true, onClose);
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
