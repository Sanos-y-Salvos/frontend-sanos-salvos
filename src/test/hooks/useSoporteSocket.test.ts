import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSoporteSocket } from '../../hooks/useSoporteSocket';

vi.mock('../../utils/storage', () => ({
  storage: { getAccessToken: vi.fn() },
}));

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  disconnect: vi.fn(),
};
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

import { io } from 'socket.io-client';
import { storage } from '../../utils/storage';
const mockIo = vi.mocked(io);
const mockStorage = vi.mocked(storage);

describe('useSoporteSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.emit.mockImplementation(() => {});
    mockSocket.on.mockImplementation(() => {});
    mockSocket.disconnect.mockImplementation(() => {});
  });

  it('does not connect when ticketId is null', () => {
    mockStorage.getAccessToken.mockReturnValue('token');
    renderHook(() => useSoporteSocket(null, vi.fn()));
    expect(mockIo).not.toHaveBeenCalled();
  });

  it('does not connect when no access token', () => {
    mockStorage.getAccessToken.mockReturnValue(null);
    renderHook(() => useSoporteSocket('tk1', vi.fn()));
    expect(mockIo).not.toHaveBeenCalled();
  });

  it('connects with token and joins ticket', () => {
    mockStorage.getAccessToken.mockReturnValue('mytoken');
    renderHook(() => useSoporteSocket('tk1', vi.fn()));
    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ auth: { token: 'mytoken' } })
    );
    expect(mockSocket.emit).toHaveBeenCalledWith('join_ticket', 'tk1');
  });

  it('registers comentario_recibido listener', () => {
    mockStorage.getAccessToken.mockReturnValue('token');
    renderHook(() => useSoporteSocket('tk1', vi.fn()));
    expect(mockSocket.on).toHaveBeenCalledWith('comentario_recibido', expect.any(Function));
  });

  it('calls onComentario when comentario_recibido fires', () => {
    mockStorage.getAccessToken.mockReturnValue('token');
    const callback = vi.fn();
    let listener: (c: any) => void = () => {};
    mockSocket.on.mockImplementation((event: string, cb: (c: any) => void) => {
      if (event === 'comentario_recibido') listener = cb;
    });
    renderHook(() => useSoporteSocket('tk1', callback));
    const comentario = { id: 'c1', contenido: 'Hola' };
    listener(comentario);
    expect(callback).toHaveBeenCalledWith(comentario);
  });

  it('leaves ticket and disconnects on cleanup', () => {
    mockStorage.getAccessToken.mockReturnValue('token');
    const { unmount } = renderHook(() => useSoporteSocket('tk1', vi.fn()));
    unmount();
    expect(mockSocket.emit).toHaveBeenCalledWith('leave_ticket', 'tk1');
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('reconnects when ticketId changes', () => {
    mockStorage.getAccessToken.mockReturnValue('token');
    const { rerender } = renderHook(
      ({ id }: { id: string | null }) => useSoporteSocket(id, vi.fn()),
      { initialProps: { id: 'tk1' } }
    );
    rerender({ id: 'tk2' });
    expect(mockIo).toHaveBeenCalledTimes(2);
  });
});
