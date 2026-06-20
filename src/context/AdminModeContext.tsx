import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const EMPLOYEE_ROLES = ['moderador', 'administrador', 'superadmin'];
const STORAGE_KEY = 'sanos_admin_mode';

type AdminModeContextType = {
  isAdminMode: boolean;
  isEmployee: boolean;
  setAdminMode: (v: boolean) => void;
};

const AdminModeContext = createContext<AdminModeContextType>({
  isAdminMode: false,
  isEmployee: false,
  setAdminMode: () => {},
});

export const AdminModeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const isEmployee = EMPLOYEE_ROLES.includes(user?.rol ?? '');

  const [userModeActive, setUserModeActive] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === 'user'
  );

  useEffect(() => {
    if (!isEmployee) setUserModeActive(false);
  }, [isEmployee]);

  const setAdminMode = (v: boolean) => {
    setUserModeActive(!v);
    localStorage.setItem(STORAGE_KEY, v ? 'admin' : 'user');
  };

  return (
    <AdminModeContext.Provider value={{
      isAdminMode: isEmployee && !userModeActive,
      isEmployee,
      setAdminMode,
    }}>
      {children}
    </AdminModeContext.Provider>
  );
};

export const useAdminMode = () => useContext(AdminModeContext);
