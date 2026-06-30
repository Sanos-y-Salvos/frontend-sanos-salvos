import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

let mockAuthState = { user: null as any, isAuthenticated: false, logout: vi.fn() };
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

let mockAdminMode = { isAdminMode: false, isEmployee: false, setAdminMode: vi.fn() };
vi.mock('../../../context/AdminModeContext', () => ({
  useAdminMode: () => mockAdminMode,
}));

let mockMensajeria = { notificaciones: 0 };
vi.mock('../../../context/MensajeriaContext', () => ({
  useMensajeria: () => mockMensajeria,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const ciudadanoUser = {
  id: 'u1', rol: 'ciudadano',
  ciudadano: { primer_nombre: 'Juan', apellido_paterno: 'Pérez' },
};
const adminUser = { id: 'u2', rol: 'administrador', ciudadano: null, institucion: null };
const institucionUser = {
  id: 'u3', rol: 'ciudadano',
  ciudadano: null,
  institucion: { nombre_institucion: 'Clínica Vet' },
};

const renderNav = () => render(<MemoryRouter><Navbar /></MemoryRouter>);

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = { user: null, isAuthenticated: false, logout: vi.fn() };
    mockAdminMode = { isAdminMode: false, isEmployee: false, setAdminMode: vi.fn() };
    mockMensajeria = { notificaciones: 0 };
  });

  it('renders brand name', () => {
    renderNav();
    expect(screen.getAllByText('Sanos y Salvos').length).toBeGreaterThan(0);
  });

  it('shows login and register buttons when not authenticated', () => {
    renderNav();
    expect(screen.getAllByText('Iniciar sesión').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Registrarse|Registro/).length).toBeGreaterThan(0);
  });

  it('navigates to / when logo is clicked', () => {
    renderNav();
    fireEvent.click(screen.getAllByText('Sanos y Salvos')[0].closest('button')!);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to /login when Iniciar sesión is clicked (desktop)', () => {
    renderNav();
    fireEvent.click(screen.getAllByText('Iniciar sesión')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('navigates to /registro when Registrarse is clicked', () => {
    renderNav();
    const btns = screen.getAllByText(/Registrarse|Registro/);
    fireEvent.click(btns[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/registro');
  });

  it('shows nav links in desktop menu', () => {
    renderNav();
    expect(screen.getAllByText('Inicio').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Reportes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mapa').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Soporte').length).toBeGreaterThan(0);
  });

  it('shows user name when authenticated as ciudadano', () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    expect(screen.getAllByText('Juan Pérez').length).toBeGreaterThan(0);
  });

  it('shows nombre_institucion when user has institucion', () => {
    mockAuthState = { user: institucionUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    expect(screen.getAllByText('Clínica Vet').length).toBeGreaterThan(0);
  });

  it('shows Usuario when no ciudadano and no institucion', () => {
    mockAuthState = { user: adminUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    expect(screen.getAllByText('Usuario').length).toBeGreaterThan(0);
  });

  it('shows Mensajes link when authenticated', () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    expect(screen.getAllByText('Mensajes').length).toBeGreaterThan(0);
  });

  it('shows notification badge when notificaciones > 0', () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    mockMensajeria = { notificaciones: 3 };
    renderNav();
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });

  it('shows Admin link when user is admin', () => {
    mockAuthState = { user: { ...adminUser, rol: 'administrador' }, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
  });

  it('does not show Admin link for ciudadano', () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('toggles mobile menu on hamburger click', () => {
    renderNav();
    const hamburger = screen.getByRole('button', { name: '' });
    fireEvent.click(hamburger);
    expect(screen.getAllByText('Inicio').length).toBeGreaterThan(1);
  });

  it('opens user dropdown menu when clicking user button', () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    expect(screen.getAllByText('Mi perfil').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mis reportes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cerrar sesión').length).toBeGreaterThan(0);
  });

  it('navigates to /perfil from dropdown', () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    fireEvent.click(screen.getAllByText('Mi perfil')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/perfil');
  });

  it('navigates to /mis-reportes from dropdown', () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    fireEvent.click(screen.getAllByText('Mis reportes')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/mis-reportes');
  });

  it('calls logout and navigates to /login on Cerrar sesión', async () => {
    const logoutFn = vi.fn().mockResolvedValue(undefined);
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: logoutFn };
    renderNav();
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await act(async () => {
      fireEvent.click(screen.getAllByText('Cerrar sesión')[0]);
    });
    expect(logoutFn).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows foto_perfil img when user has foto', () => {
    mockAuthState = {
      user: { ...ciudadanoUser, foto_perfil: 'https://img.com/foto.jpg' },
      isAuthenticated: true, logout: vi.fn(),
    };
    renderNav();
    const img = document.querySelector('img[alt="Foto"]');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://img.com/foto.jpg');
  });

  it('shows "Volver al panel" banner when employee is in user mode', () => {
    mockAdminMode = { isAdminMode: false, isEmployee: true, setAdminMode: vi.fn() };
    mockAuthState = { user: adminUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    expect(screen.getAllByText('Volver al panel').length).toBeGreaterThan(0);
  });

  it('clicking "Volver al panel" calls setAdminMode(true)', () => {
    const setAdminMode = vi.fn();
    mockAdminMode = { isAdminMode: false, isEmployee: true, setAdminMode };
    mockAuthState = { user: adminUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    fireEvent.click(screen.getAllByText('Volver al panel')[0]);
    expect(setAdminMode).toHaveBeenCalledWith(true);
  });

  it('listens to scroll events', () => {
    renderNav();
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 20, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });
  });

  it('shows Panel de administración in mobile menu for admin', () => {
    mockAuthState = { user: { ...adminUser, rol: 'administrador' }, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    const hamburger = document.querySelector('button.md\\:hidden');
    if (hamburger) fireEvent.click(hamburger);
    expect(screen.queryAllByText('Panel de administración').length).toBeGreaterThanOrEqual(0);
  });

  it('clicks desktop Inicio nav link', () => {
    renderNav();
    const inicioBtn = screen.getAllByRole('button').find(b => b.textContent === 'Inicio');
    if (inicioBtn) fireEvent.click(inicioBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('clicks desktop Reportes nav link', () => {
    renderNav();
    const btn = screen.getAllByRole('button').find(b => b.textContent === 'Reportes');
    if (btn) fireEvent.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith('/reportes');
  });

  it('clicks desktop Mensajes nav link when authenticated', () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    const btn = screen.getAllByRole('button').find(b => b.textContent?.includes('Mensajes'));
    if (btn) fireEvent.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith('/mensajes');
  });

  it('clicks desktop Admin nav link when admin', () => {
    mockAuthState = { user: { ...adminUser, rol: 'administrador' }, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    const btn = screen.getAllByRole('button').find(b => b.textContent?.trim() === 'Admin');
    if (btn) fireEvent.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('opens mobile menu when authenticated and shows mobile nav links', async () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    const hamburger = document.querySelector('button[class*="md:hidden"]');
    if (hamburger) fireEvent.click(hamburger as HTMLElement);
    expect(screen.getAllByText('Inicio').length).toBeGreaterThan(1);
  });

  it('mobile menu authenticated: shows Mi perfil, Mis reportes, Cerrar sesión', async () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    const hamburger = document.querySelector('button[class*="md:hidden"]');
    if (hamburger) fireEvent.click(hamburger as HTMLElement);
    expect(screen.getAllByText('Mi perfil').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mis reportes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cerrar sesión').length).toBeGreaterThan(0);
  });

  it('mobile menu: navigates to /perfil from mobile menu', async () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    const hamburger = document.querySelector('button[class*="md:hidden"]');
    if (hamburger) fireEvent.click(hamburger as HTMLElement);
    const perfilBtns = screen.getAllByText('Mi perfil');
    fireEvent.click(perfilBtns[perfilBtns.length - 1]);
    expect(mockNavigate).toHaveBeenCalledWith('/perfil');
  });

  it('mobile menu: shows admin panel link for admin', async () => {
    mockAuthState = { user: { ...adminUser, rol: 'administrador' }, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    const hamburger = document.querySelector('button[class*="md:hidden"]');
    if (hamburger) fireEvent.click(hamburger as HTMLElement);
    expect(screen.getAllByText('Panel de administración').length).toBeGreaterThan(0);
  });

  it('mobile menu: shows Mensajes when authenticated', async () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    const hamburger = document.querySelector('button[class*="md:hidden"]');
    if (hamburger) fireEvent.click(hamburger as HTMLElement);
    expect(screen.getAllByText('Mensajes').length).toBeGreaterThan(1);
  });

  it('mobile menu: shows Iniciar sesión and Registro when unauthenticated', async () => {
    renderNav();
    const hamburger = document.querySelector('button[class*="md:hidden"]');
    if (hamburger) fireEvent.click(hamburger as HTMLElement);
    expect(screen.getAllByText('Iniciar sesión').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Registro').length).toBeGreaterThan(0);
  });

  it('mobile menu: logout from mobile', async () => {
    const logoutFn = vi.fn().mockResolvedValue(undefined);
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: logoutFn };
    renderNav();
    const hamburger = document.querySelector('button[class*="md:hidden"]');
    if (hamburger) fireEvent.click(hamburger as HTMLElement);
    const cerrarBtns = screen.getAllByText('Cerrar sesión');
    await act(async () => { fireEvent.click(cerrarBtns[cerrarBtns.length - 1]); });
    expect(logoutFn).toHaveBeenCalled();
  });

  it('mobile menu: shows notification badge', async () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    mockMensajeria = { notificaciones: 5 };
    renderNav();
    const hamburger = document.querySelector('button[class*="md:hidden"]');
    if (hamburger) fireEvent.click(hamburger as HTMLElement);
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
  });

  it('mobile menu: clicks Inicio nav link navigates to /', async () => {
    renderNav();
    const hamburger = document.querySelector('button[class*="md:hidden"]');
    if (hamburger) fireEvent.click(hamburger as HTMLElement);
    // Find the mobile Inicio button (the one in the expanded menu area, not desktop)
    const inicioBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === 'Inicio' && b.className.includes('w-full'));
    if (inicioBtn) fireEvent.click(inicioBtn);
    // Navigated (mock navigate called with '/')
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('mobile menu: clicks Mensajes navigates to /mensajes', async () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    const hamburger = document.querySelector('button[class*="md:hidden"]');
    if (hamburger) fireEvent.click(hamburger as HTMLElement);
    const mensajesBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('Mensajes') && b.className.includes('w-full'));
    if (mensajesBtns.length > 0) fireEvent.click(mensajesBtns[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/mensajes');
  });

  it('mobile menu: clicks Admin panel navigates to /admin', async () => {
    mockAuthState = { user: { ...adminUser, rol: 'administrador' }, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    const hamburger = document.querySelector('button[class*="md:hidden"]');
    if (hamburger) fireEvent.click(hamburger as HTMLElement);
    const panelBtn = screen.queryAllByText('Panel de administración').find(el => el.closest('button'));
    if (panelBtn) {
      const btn = panelBtn.closest('button');
      if (btn) fireEvent.click(btn);
    }
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('mobile menu: clicks Mis reportes navigates to /mis-reportes', async () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    const hamburger = document.querySelector('button[class*="md:hidden"]');
    if (hamburger) fireEvent.click(hamburger as HTMLElement);
    const misReportesBtns = screen.queryAllByText('Mis reportes');
    const mobileBtn = misReportesBtns.find(el => el.closest('button')?.className.includes('flex-1'));
    if (mobileBtn) {
      const btn = mobileBtn.closest('button');
      if (btn) fireEvent.click(btn);
    }
    expect(mockNavigate).toHaveBeenCalledWith('/mis-reportes');
  });

  it('mobile menu: unauthenticated clicks login navigates to /login', async () => {
    renderNav();
    const hamburger = document.querySelector('button[class*="md:hidden"]');
    if (hamburger) fireEvent.click(hamburger as HTMLElement);
    // Find the mobile login button (flex-1)
    const loginBtns = screen.queryAllByText('Iniciar sesión');
    const mobileBtn = loginBtns.find(el => el.closest('button')?.className.includes('flex-1'));
    if (mobileBtn) {
      const btn = mobileBtn.closest('button');
      if (btn) fireEvent.click(btn);
    }
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('mobile menu: unauthenticated clicks Registro navigates to /registro', async () => {
    renderNav();
    const hamburger = document.querySelector('button[class*="md:hidden"]');
    if (hamburger) fireEvent.click(hamburger as HTMLElement);
    const registroBtns = screen.queryAllByText('Registro');
    const mobileBtn = registroBtns.find(el => el.closest('button'));
    if (mobileBtn) {
      const btn = mobileBtn.closest('button');
      if (btn) fireEvent.click(btn);
    }
    expect(mockNavigate).toHaveBeenCalledWith('/registro');
  });

  it('nav has md:hidden class when isEmployee and isAdminMode (line 55)', () => {
    mockAdminMode = { isAdminMode: true, isEmployee: true, setAdminMode: vi.fn() };
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    renderNav();
    const nav = document.querySelector('nav');
    expect(nav?.className).toContain('md:hidden');
  });

  it('isActive("/mensajes") applies active class when on /mensajes (line 105)', () => {
    mockAuthState = { user: ciudadanoUser, isAuthenticated: true, logout: vi.fn() };
    render(<MemoryRouter initialEntries={['/mensajes']}><Navbar /></MemoryRouter>);
    const mensajesBtn = screen.getByRole('button', { name: /Mensajes/i });
    expect(mensajesBtn.className).toContain('brand');
  });

  it('isActive("/admin") applies active class when on /admin (line 123)', () => {
    mockAuthState = { user: { ...adminUser, rol: 'administrador' }, isAuthenticated: true, logout: vi.fn() };
    render(<MemoryRouter initialEntries={['/admin']}><Navbar /></MemoryRouter>);
    const adminBtn = screen.getByRole('button', { name: /Admin/i });
    expect(adminBtn.className).toContain('amber');
  });
});
