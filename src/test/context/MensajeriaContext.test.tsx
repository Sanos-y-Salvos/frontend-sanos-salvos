import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MensajeriaProvider, useMensajeria } from '../../context/MensajeriaContext';
import { AuthContext } from '../../context/AuthContext';

vi.mock('../../utils/storage', () => ({
  storage: { getAccessToken: vi.fn().mockReturnValue('token') },
}));

const mockSocket = {
  on: vi.fn(),
  disconnect: vi.fn(),
};
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

import { io } from 'socket.io-client';
const mockIo = vi.mocked(io);

const makeAuthCtx = (isAuthenticated: boolean) => ({
  user: isAuthenticated ? { id: 'u1' } as any : null,
  loading: false,
  isAuthenticated,
  login: vi.fn(),
  logout: vi.fn(),
});

const Consumer = () => {
  const { connected, notificaciones, clearNotificaciones } = useMensajeria();
  return (
    <div>
      <span data-testid="connected">{String(connected)}</span>
      <span data-testid="notif">{notificaciones}</span>
      <button onClick={clearNotificaciones}>clear</button>
    </div>
  );
};

const renderWithAuth = (isAuthenticated: boolean) =>
  render(
    <AuthContext.Provider value={makeAuthCtx(isAuthenticated)}>
      <MensajeriaProvider>
        <Consumer />
      </MensajeriaProvider>
    </AuthContext.Provider>
  );

describe('MensajeriaContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.on.mockImplementation(() => {});
    mockSocket.disconnect.mockImplementation(() => {});
  });

  it('does not create socket when not authenticated', () => {
    renderWithAuth(false);
    expect(mockIo).not.toHaveBeenCalled();
  });

  it('creates socket when authenticated', () => {
    renderWithAuth(true);
    expect(mockIo).toHaveBeenCalled();
  });

  it('registers connect/disconnect/sala_creada listeners', () => {
    renderWithAuth(true);
    const calls = mockSocket.on.mock.calls.map(c => c[0]);
    expect(calls).toContain('connect');
    expect(calls).toContain('disconnect');
    expect(calls).toContain('sala_creada');
  });

  it('fires connect callback and sets connected=true', () => {
    let connectCb: () => void = () => {};
    mockSocket.on.mockImplementation((event: string, cb: () => void) => {
      if (event === 'connect') connectCb = cb;
    });
    renderWithAuth(true);
    act(() => connectCb());
    expect(screen.getByTestId('connected').textContent).toBe('true');
  });

  it('fires disconnect callback and sets connected=false', () => {
    let connectCb: () => void = () => {};
    let disconnectCb: () => void = () => {};
    mockSocket.on.mockImplementation((event: string, cb: () => void) => {
      if (event === 'connect') connectCb = cb;
      if (event === 'disconnect') disconnectCb = cb;
    });
    renderWithAuth(true);
    act(() => { connectCb(); disconnectCb(); });
    expect(screen.getByTestId('connected').textContent).toBe('false');
  });

  it('increments notificaciones on sala_creada', () => {
    let salaCreada: () => void = () => {};
    mockSocket.on.mockImplementation((event: string, cb: () => void) => {
      if (event === 'sala_creada') salaCreada = cb;
    });
    renderWithAuth(true);
    act(() => { salaCreada(); salaCreada(); });
    expect(screen.getByTestId('notif').textContent).toBe('2');
  });

  it('clearNotificaciones resets to 0', () => {
    let salaCreada: () => void = () => {};
    mockSocket.on.mockImplementation((event: string, cb: () => void) => {
      if (event === 'sala_creada') salaCreada = cb;
    });
    renderWithAuth(true);
    act(() => salaCreada());
    act(() => screen.getByText('clear').click());
    expect(screen.getByTestId('notif').textContent).toBe('0');
  });

  it('useMensajeria returns defaults outside provider', () => {
    const Hook = () => {
      const ctx = useMensajeria();
      return <span data-testid="s">{String(ctx.connected)}-{ctx.notificaciones}</span>;
    };
    render(<Hook />);
    expect(screen.getByTestId('s').textContent).toBe('false-0');
  });
});
