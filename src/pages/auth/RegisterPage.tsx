import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userService } from '../../services/userService';
import { regionService } from '../../services/regionService';
import { formatRut, parseRut } from '../../utils/rutFormatter';
import { validateField } from '../../utils/validators';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';

type TipoRegistro = 'ciudadano' | 'institucion' | null;

interface Region { codigo: string; nombre: string; }
interface Comuna { codigo: string; nombre: string; }

// ─── Componente ──────────────────────────────────────────────────────────────
const RegisterPage = () => {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<TipoRegistro>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  const [regiones, setRegiones] = useState<Region[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [loadingComunas, setLoadingComunas] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [region, setRegion] = useState('');
  const [comuna, setComuna] = useState('');
  const [foto, setFoto] = useState<File | null>(null);

  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [run, setRun] = useState('');

  const [nombreInstitucion, setNombreInstitucion] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [rut, setRut] = useState('');
  const [tipoInstitucion, setTipoInstitucion] = useState('');
  const [direccion, setDireccion] = useState('');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    regionService.getRegiones().then(setRegiones).catch(() => {});
  }, []);

  const handleRegionChange = async (codigo: string) => {
    setRegion(codigo);
    setComuna('');
    setComunas([]);
    touch('region', codigo);
    if (codigo) {
      setLoadingComunas(true);
      try {
        const data = await regionService.getComunas(codigo);
        setComunas(data);
      } catch {
        setComunas([]);
      } finally {
        setLoadingComunas(false);
      }
    }
  };

  // Marca como tocado y valida un campo
  const touch = (field: string, value: string, extra?: { password?: string }) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFieldErrors(prev => ({ ...prev, [field]: validateField(field, value, extra) }));
  };

  // Para campos que ya fueron tocados, revalida al cambiar
  const onChange = (field: string, value: string, setter: (v: string) => void, extra?: { password?: string }) => {
    setter(value);
    if (touched[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: validateField(field, value, extra) }));
    }
  };

  // Cuando cambia el password, revalida confirmPassword si ya fue tocado
  const onPasswordChange = (value: string) => {
    setPassword(value);
    if (touched['password']) {
      setFieldErrors(prev => ({ ...prev, password: validateField('password', value) }));
    }
    if (touched['confirmPassword']) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: validateField('confirmPassword', confirmPassword, { password: value }) }));
    }
  };

  const err = (field: string) => (touched[field] ? fieldErrors[field] : undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // Validar todos los campos relevantes antes de enviar
    const commonFields: [string, string][] = [
      ['email', email], ['password', password],
      ['confirmPassword', confirmPassword], ['telefono', telefono],
      ['region', region], ['comuna', comuna], ['direccion', direccion],
    ];
    const ciudadanoFields: [string, string][] = [
      ['primer_nombre', primerNombre], ['segundo_nombre', segundoNombre],
      ['apellido_paterno', apellidoPaterno], ['apellido_materno', apellidoMaterno],
      ['run', run],
    ];
    const institucionFields: [string, string][] = [
      ['nombre_institucion', nombreInstitucion], ['razon_social', razonSocial], ['rut', rut],
    ];

    const allFields = [
      ...commonFields,
      ...(tipo === 'ciudadano' ? ciudadanoFields : institucionFields),
    ];

    const newTouched: Record<string, boolean> = {};
    const newErrors: Record<string, string> = {};
    for (const [field, value] of allFields) {
      newTouched[field] = true;
      newErrors[field] = validateField(field, value, { password });
    }
    setTouched(prev => ({ ...prev, ...newTouched }));
    setFieldErrors(prev => ({ ...prev, ...newErrors }));

    if (Object.values(newErrors).some(e => e !== '')) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('telefono', telefono);
      formData.append('region', region);
      formData.append('comuna', comuna);
      if (foto) formData.append('foto_perfil', foto);

      if (tipo === 'ciudadano') {
        formData.append('primer_nombre', primerNombre);
        if (segundoNombre) formData.append('segundo_nombre', segundoNombre);
        formData.append('apellido_paterno', apellidoPaterno);
        if (apellidoMaterno) formData.append('apellido_materno', apellidoMaterno);
        formData.append('run', parseRut(run));
        formData.append('direccion', direccion);
        await userService.registrarCiudadano(formData);
      } else {
        formData.append('nombre_institucion', nombreInstitucion);
        formData.append('razon_social', razonSocial);
        formData.append('rut', parseRut(rut));
        formData.append('tipo_institucion', tipoInstitucion);
        formData.append('direccion', direccion);
        await userService.registrarInstitucion(formData);
      }

      setSuccess(true);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
            <div className="text-5xl mb-4">🐾</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Registro exitoso!</h2>
            <p className="text-gray-500 mb-6">Tu cuenta fue creada correctamente. Inicia sesión para continuar.</p>
            <Button fullWidth onClick={() => navigate('/login')}>
              Ir al inicio de sesión
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!tipo) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🐾</div>
              <h1 className="text-2xl font-bold text-gray-800">Crear cuenta</h1>
              <p className="text-gray-500 mt-1">¿Cómo quieres registrarte?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTipo('ciudadano')}
                className="border-2 border-gray-200 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition group"
              >
                <div className="text-3xl mb-2">👤</div>
                <p className="font-semibold text-gray-700 group-hover:text-blue-600">Persona</p>
                <p className="text-xs text-gray-400 mt-1">Ciudadano particular</p>
              </button>

              <button
                onClick={() => setTipo('institucion')}
                className="border-2 border-gray-200 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition group"
              >
                <div className="text-3xl mb-2">🏥</div>
                <p className="font-semibold text-gray-700 group-hover:text-blue-600">Institución</p>
                <p className="text-xs text-gray-400 mt-1">Veterinaria o Municipalidad</p>
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="text-blue-600 hover:underline">Inicia sesión</a>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-md p-8">

            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setTipo(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                ← Volver
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {tipo === 'ciudadano' ? 'Registro de Persona' : 'Registro de Institución'}
                </h1>
                <p className="text-sm text-gray-500">Completa todos los campos requeridos</p>
              </div>
            </div>

            {submitError && (
              <Alert variant="error" className="mb-4">
                {submitError === 'El correo ya está registrado'
                  ? <>El correo ya está registrado. Envíe una solicitud a{' '}
                      <Link to="/soporte" className="underline font-medium hover:opacity-80">soporte</Link>.
                    </>
                  : submitError
                }
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {tipo === 'ciudadano' && (
                <>
                  <h2 className="font-semibold text-gray-700 border-b pb-2">Datos personales</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={<>Primer nombre <span className="text-red-500">*</span></>}
                      type="text"
                      value={primerNombre}
                      onChange={(e) => onChange('primer_nombre', e.target.value, setPrimerNombre)}
                      onBlur={(e) => touch('primer_nombre', e.target.value)}
                      error={err('primer_nombre')}
                    />
                    <Input
                      label="Segundo nombre"
                      type="text"
                      value={segundoNombre}
                      onChange={(e) => onChange('segundo_nombre', e.target.value, setSegundoNombre)}
                      onBlur={(e) => touch('segundo_nombre', e.target.value)}
                      error={err('segundo_nombre')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={<>Apellido paterno <span className="text-red-500">*</span></>}
                      type="text"
                      value={apellidoPaterno}
                      onChange={(e) => onChange('apellido_paterno', e.target.value, setApellidoPaterno)}
                      onBlur={(e) => touch('apellido_paterno', e.target.value)}
                      error={err('apellido_paterno')}
                    />
                    <Input
                      label="Apellido materno"
                      type="text"
                      value={apellidoMaterno}
                      onChange={(e) => onChange('apellido_materno', e.target.value, setApellidoMaterno)}
                      onBlur={(e) => touch('apellido_materno', e.target.value)}
                      error={err('apellido_materno')}
                    />
                  </div>

                  <Input
                    label={<>RUN <span className="text-red-500">*</span></>}
                    type="text"
                    value={run}
                    onChange={(e) => {
                      const formatted = formatRut(e.target.value);
                      onChange('run', formatted, setRun);
                    }}
                    onBlur={(e) => touch('run', formatRut(e.target.value))}
                    placeholder="11.111.111-1"
                    maxLength={12}
                    error={err('run')}
                  />
                </>
              )}

              {tipo === 'institucion' && (
                <>
                  <h2 className="font-semibold text-gray-700 border-b pb-2">Datos institucionales</h2>

                  <Select
                    label={<>Tipo de institución <span className="text-red-500">*</span></>}
                    value={tipoInstitucion}
                    onChange={(e) => setTipoInstitucion(e.target.value)}
                    required
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="veterinaria">Veterinaria</option>
                    <option value="municipalidad">Municipalidad</option>
                  </Select>

                  <Input
                    label={<>Nombre de la institución <span className="text-red-500">*</span></>}
                    type="text"
                    value={nombreInstitucion}
                    onChange={(e) => onChange('nombre_institucion', e.target.value, setNombreInstitucion)}
                    onBlur={(e) => touch('nombre_institucion', e.target.value)}
                    error={err('nombre_institucion')}
                  />

                  <Input
                    label={<>Razón social <span className="text-red-500">*</span></>}
                    type="text"
                    value={razonSocial}
                    onChange={(e) => onChange('razon_social', e.target.value, setRazonSocial)}
                    onBlur={(e) => touch('razon_social', e.target.value)}
                    error={err('razon_social')}
                  />

                  <Input
                    label={<>RUT <span className="text-red-500">*</span></>}
                    type="text"
                    value={rut}
                    onChange={(e) => {
                      const formatted = formatRut(e.target.value);
                      onChange('rut', formatted, setRut);
                    }}
                    onBlur={(e) => touch('rut', formatRut(e.target.value))}
                    placeholder="76.354.771-K"
                    maxLength={12}
                    error={err('rut')}
                  />
                </>
              )}

              <h2 className="font-semibold text-gray-700 border-b pb-2 pt-2">Datos de contacto</h2>

              <Input
                label={<>Correo electrónico <span className="text-red-500">*</span></>}
                type="email"
                value={email}
                onChange={(e) => onChange('email', e.target.value, setEmail)}
                onBlur={(e) => touch('email', e.target.value)}
                error={err('email')}
              />

              <Input
                label={<>Teléfono <span className="text-red-500">*</span></>}
                type="tel"
                value={telefono}
                onChange={(e) => onChange('telefono', e.target.value, setTelefono)}
                onBlur={(e) => touch('telefono', e.target.value)}
                placeholder="912345678"
                error={err('telefono')}
              />

              <Select
                label={<>Región <span className="text-red-500">*</span></>}
                value={region}
                onChange={(e) => handleRegionChange(e.target.value)}
                onBlur={(e) => touch('region', e.target.value)}
                error={err('region')}
                required
              >
                <option value="">Selecciona una región</option>
                {regiones.map((r) => (
                  <option key={r.codigo} value={r.codigo}>{r.nombre}</option>
                ))}
              </Select>

              <Select
                label={<>Comuna <span className="text-red-500">*</span></>}
                value={comuna}
                onChange={(e) => onChange('comuna', e.target.value, setComuna)}
                onBlur={(e) => touch('comuna', e.target.value)}
                error={err('comuna')}
                required
                disabled={!region || loadingComunas}
              >
                <option value="">
                  {loadingComunas ? 'Cargando comunas...' : 'Selecciona una comuna'}
                </option>
                {comunas.map((c) => (
                  <option key={c.codigo} value={c.nombre}>{c.nombre}</option>
                ))}
              </Select>

              <Input
                label={<>Dirección <span className="text-red-500">*</span></>}
                type="text"
                value={direccion}
                onChange={(e) => onChange('direccion', e.target.value, setDireccion)}
                onBlur={(e) => touch('direccion', e.target.value)}
                error={err('direccion')}
              />

              <h2 className="font-semibold text-gray-700 border-b pb-2 pt-2">Seguridad</h2>

              <Input
                label={<>Contraseña <span className="text-red-500">*</span></>}
                type="password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                onBlur={(e) => touch('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                error={err('password')}
              />

              <Input
                label={<>Confirmar contraseña <span className="text-red-500">*</span></>}
                type="password"
                value={confirmPassword}
                onChange={(e) => onChange('confirmPassword', e.target.value, setConfirmPassword, { password })}
                onBlur={(e) => touch('confirmPassword', e.target.value, { password })}
                error={err('confirmPassword')}
              />

              <h2 className="font-semibold text-gray-700 border-b pb-2 pt-2">Foto de perfil</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto de perfil <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFoto(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                />
                {foto && <p className="text-xs text-green-600 mt-1">✓ {foto.name}</p>}
              </div>

              <Button type="submit" disabled={loading} fullWidth className="py-3 mt-4">
                {loading ? 'Registrando...' : 'Crear cuenta'}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="text-blue-600 hover:underline">Inicia sesión</a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RegisterPage;
