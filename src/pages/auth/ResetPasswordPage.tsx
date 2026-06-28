import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const ResetPasswordPage = () => {
  const navigate = useNavigate();

  // Paso 1 — solicitar código
  const [email, setEmail] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [errorEmail, setErrorEmail] = useState('');
  const [paso, setPaso] = useState<1 | 2>(1);

  // Paso 2 — ingresar código y nueva contraseña
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingReset, setLoadingReset] = useState(false);
  const [errorReset, setErrorReset] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorEmail('');
    setLoadingEmail(true);
    try {
      await userService.forgotPassword(email);
      setPaso(2);
    } catch (err: any) {
      setErrorEmail(err.response?.data?.message || 'Error al enviar el código');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleRestablecer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorReset('');
    if (newPassword.length < 6) { setErrorReset('La contraseña debe tener al menos 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { setErrorReset('Las contraseñas no coinciden'); return; }
    setLoadingReset(true);
    try {
      await userService.resetPassword(email, code, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setErrorReset(err.response?.data?.message || 'Error al restablecer la contraseña');
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col public-glass">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <BotonVolver ruta="/login" texto="← Volver al inicio de sesión" />

          <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-1">Restablecer contraseña</h1>

          {paso === 1 ? (
            <>
              <p className="text-gray-500 mb-6">Ingresa tu correo y te enviaremos un código de verificación.</p>
              {errorEmail && <Alert variant="error" className="mb-4">{errorEmail}</Alert>}
              <form onSubmit={handleSolicitarCodigo} className="space-y-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.cl"
                  required
                />
                <Button type="submit" disabled={loadingEmail} fullWidth>
                  {loadingEmail ? 'Enviando...' : 'Enviar código'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-1">
                Enviamos un código de 6 dígitos a <strong>{email}</strong>.
              </p>
              <button
                onClick={() => { setPaso(1); setErrorReset(''); }}
                className="text-xs text-blue-600 hover:underline mb-5 inline-block"
              >
                ¿No es tu correo? Cambiarlo
              </button>

              {success && <Alert variant="success" className="mb-4">Contraseña actualizada. Redirigiendo...</Alert>}
              {errorReset && <Alert variant="error" className="mb-4">{errorReset}</Alert>}

              <form onSubmit={handleRestablecer} className="space-y-4">
                <Input
                  label="Código de verificación"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                  disabled={success}
                />
                <Input
                  label="Nueva contraseña"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  disabled={success}
                />
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={success}
                />
                <Button type="submit" disabled={loadingReset || success} fullWidth>
                  {loadingReset ? 'Guardando...' : 'Restablecer contraseña'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
