import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PawPrint, User, Building2, Mail, Lock, Phone, MapPin, Eye, EyeOff,
  ArrowLeft, ArrowRight, UserPlus, CheckCircle, Camera, IdCard, Landmark,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { regionService } from '../../services/regionService';
import { formatRut, parseRut } from '../../utils/rutFormatter';
import { validateField } from '../../utils/validators';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';

type TipoRegistro = 'ciudadano' | 'institucion' | null;
interface Region { codigo: string; nombre: string; }
interface Comuna { codigo: string; nombre: string; }

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 pt-2 pb-1">
    <div className="w-0.5 h-4 bg-brand-500 rounded-full" />
    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{children}</h2>
  </div>
);

const Req = () => <span className="text-rose-400 ml-0.5">*</span>;

/* ── Panel izquierdo compartido ─────────────────────────────────── */
const LeftPanel = ({ onHome }: { onHome: () => void }) => (
  <div className="hidden lg:flex lg:w-5/12 bg-mesh flex-col justify-between p-12 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-brand-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-brand-300/15 rounded-full blur-3xl" />
    </div>

    <button onClick={onHome} className="relative flex items-center gap-2.5 w-fit">
      <PawPrint className="w-6 h-6 text-white" strokeWidth={2.5} />
      <span className="font-display font-bold text-white text-lg">Sanos y Salvos</span>
    </button>

    <div className="relative">
      <p className="text-brand-200 text-sm font-medium mb-3 uppercase tracking-wider">Únete a la red</p>
      <h2 className="text-3xl font-display font-bold text-white mb-4 leading-tight">
        Tu cuenta, la llave<br />para ayudar
      </h2>
      <p className="text-brand-100/80 text-sm leading-relaxed max-w-xs">
        Regístrate gratis y empieza a reportar, buscar y conectar mascotas con sus familias en todo Chile.
      </p>

      <div className="mt-10 space-y-3">
        {[
          { icon: CheckCircle, text: 'Reportes ilimitados sin costo' },
          { icon: CheckCircle, text: 'Alertas automáticas por zona' },
          { icon: CheckCircle, text: 'Chat directo con otros usuarios' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 text-brand-100/90 text-sm">
            <Icon className="w-4 h-4 text-brand-400 flex-shrink-0" />
            {text}
          </div>
        ))}
      </div>
    </div>

    <p className="relative text-brand-300/60 text-xs">© 2026 Sanos y Salvos</p>
  </div>
);

/* ── Página principal ──────────────────────────────────────────── */
const RegisterPage = () => {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<TipoRegistro>(null);
  const [loading, setLoading]       = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess]       = useState(false);
  const [showPwd, setShowPwd]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [regiones, setRegiones] = useState<Region[]>([]);
  const [comunas, setComunas]   = useState<Comuna[]>([]);
  const [loadingComunas, setLoadingComunas] = useState(false);

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [telefono, setTelefono]         = useState('');
  const [region, setRegion]             = useState('');
  const [comuna, setComuna]             = useState('');
  const [direccion, setDireccion]       = useState('');
  const [foto, setFoto]                 = useState<File | null>(null);

  const [primerNombre, setPrimerNombre]         = useState('');
  const [segundoNombre, setSegundoNombre]       = useState('');
  const [apellidoPaterno, setApellidoPaterno]   = useState('');
  const [apellidoMaterno, setApellidoMaterno]   = useState('');
  const [run, setRun]                           = useState('');

  const [nombreInstitucion, setNombreInstitucion] = useState('');
  const [razonSocial, setRazonSocial]             = useState('');
  const [rut, setRut]                             = useState('');
  const [tipoInstitucion, setTipoInstitucion]     = useState('');

  const [touched, setTouched]         = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    regionService.getRegiones().then(setRegiones).catch(() => {});
  }, []);

  const handleRegionChange = async (codigo: string) => {
    setRegion(codigo); setComuna(''); setComunas([]);
    touch('region', codigo);
    if (codigo) {
      setLoadingComunas(true);
      try { setComunas(await regionService.getComunas(codigo)); }
      catch { setComunas([]); }
      finally { setLoadingComunas(false); }
    }
  };

  const touch = (field: string, value: string, extra?: { password?: string }) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFieldErrors(prev => ({ ...prev, [field]: validateField(field, value, extra) }));
  };

  const onChange = (field: string, value: string, setter: (v: string) => void, extra?: { password?: string }) => {
    setter(value);
    if (touched[field]) setFieldErrors(prev => ({ ...prev, [field]: validateField(field, value, extra) }));
  };

  const onPasswordChange = (value: string) => {
    setPassword(value);
    if (touched['password'])        setFieldErrors(prev => ({ ...prev, password: validateField('password', value) }));
    if (touched['confirmPassword']) setFieldErrors(prev => ({ ...prev, confirmPassword: validateField('confirmPassword', confirmPassword, { password: value }) }));
  };

  const err = (field: string) => (touched[field] ? fieldErrors[field] : undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const allFields: [string, string][] = [
      ['email', email], ['password', password], ['confirmPassword', confirmPassword],
      ['telefono', telefono], ['region', region], ['comuna', comuna], ['direccion', direccion],
      ...(tipo === 'ciudadano'
        ? [['primer_nombre', primerNombre], ['apellido_paterno', apellidoPaterno], ['run', run]] as [string, string][]
        : [['nombre_institucion', nombreInstitucion], ['razon_social', razonSocial], ['rut', rut]] as [string, string][]),
    ];

    const newTouched: Record<string, boolean> = {};
    const newErrors: Record<string, string>   = {};
    for (const [field, value] of allFields) {
      newTouched[field] = true;
      newErrors[field]  = validateField(field, value, { password });
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
      formData.append('direccion', direccion);
      if (foto) formData.append('foto_perfil', foto);

      if (tipo === 'ciudadano') {
        formData.append('primer_nombre', primerNombre);
        if (segundoNombre)  formData.append('segundo_nombre', segundoNombre);
        formData.append('apellido_paterno', apellidoPaterno);
        if (apellidoMaterno) formData.append('apellido_materno', apellidoMaterno);
        formData.append('run', parseRut(run));
        await userService.registrarCiudadano(formData);
      } else {
        formData.append('nombre_institucion', nombreInstitucion);
        formData.append('razon_social', razonSocial);
        formData.append('rut', parseRut(rut));
        formData.append('tipo_institucion', tipoInstitucion);
        await userService.registrarInstitucion(formData);
      }
      setSuccess(true);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  /* ── Éxito ── */
  if (success) {
    return (
      <div className="min-h-screen flex">
        <LeftPanel onHome={() => navigate('/')} />
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">¡Cuenta creada!</h2>
            <p className="text-slate-500 text-sm mb-8">Tu cuenta fue creada correctamente. Ya puedes iniciar sesión.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-all shadow-md text-sm"
            >
              Ir al inicio de sesión
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Selección de tipo ── */
  if (!tipo) {
    return (
      <div className="min-h-screen flex">
        <LeftPanel onHome={() => navigate('/')} />
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-slate-50">

          <button onClick={() => navigate('/')} className="lg:hidden flex items-center gap-2 mb-10">
            <PawPrint className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
            <span className="font-display font-bold text-slate-900">Sanos y Salvos</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm"
          >
            <div className="mb-8">
              <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Crear cuenta</h1>
              <p className="text-slate-500 text-sm">¿Cómo quieres registrarte?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTipo('ciudadano')}
                className="group border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50 rounded-2xl p-6 text-center transition-all duration-200 active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-slate-100 group-hover:bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                  <User className="w-6 h-6 text-slate-500 group-hover:text-brand-600 transition-colors" strokeWidth={1.5} />
                </div>
                <p className="font-semibold text-slate-800 group-hover:text-brand-700 text-sm transition-colors">Persona</p>
                <p className="text-xs text-slate-400 mt-1">Ciudadano particular</p>
              </button>

              <button
                onClick={() => setTipo('institucion')}
                className="group border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50 rounded-2xl p-6 text-center transition-all duration-200 active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-slate-100 group-hover:bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                  <Building2 className="w-6 h-6 text-slate-500 group-hover:text-brand-600 transition-colors" strokeWidth={1.5} />
                </div>
                <p className="font-semibold text-slate-800 group-hover:text-brand-700 text-sm transition-colors">Institución</p>
                <p className="text-xs text-slate-400 mt-1">Veterinaria o Municipalidad</p>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-500">
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Formulario ── */
  return (
    <div className="min-h-screen flex">
      <LeftPanel onHome={() => navigate('/')} />

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="min-h-full flex flex-col justify-center items-center px-6 py-12">

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setTipo(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-display font-bold text-slate-900">
                  {tipo === 'ciudadano' ? 'Registro de persona' : 'Registro de institución'}
                </h1>
                <p className="text-xs text-slate-500">Los campos con <span className="text-rose-400">*</span> son obligatorios</p>
              </div>
            </div>

            <AnimatePresence>
              {submitError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                  <Alert variant="error">
                    {submitError === 'El correo ya está registrado'
                      ? <>El correo ya está registrado. Puedes contactar{' '}
                          <Link to="/soporte" className="underline font-medium">soporte</Link>.
                        </>
                      : submitError}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* ─── Ciudadano ─── */}
              {tipo === 'ciudadano' && (
                <>
                  <SectionTitle>Datos personales</SectionTitle>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={<>Primer nombre <Req /></>}
                      type="text" value={primerNombre}
                      onChange={(e) => onChange('primer_nombre', e.target.value, setPrimerNombre)}
                      onBlur={(e) => touch('primer_nombre', e.target.value)}
                      error={err('primer_nombre')}
                    />
                    <Input
                      label="Segundo nombre"
                      type="text" value={segundoNombre}
                      onChange={(e) => onChange('segundo_nombre', e.target.value, setSegundoNombre)}
                      onBlur={(e) => touch('segundo_nombre', e.target.value)}
                      error={err('segundo_nombre')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={<>Primer apellido <Req /></>}
                      type="text" value={apellidoPaterno}
                      onChange={(e) => onChange('apellido_paterno', e.target.value, setApellidoPaterno)}
                      onBlur={(e) => touch('apellido_paterno', e.target.value)}
                      error={err('apellido_paterno')}
                    />
                    <Input
                      label="Segundo apellido"
                      type="text" value={apellidoMaterno}
                      onChange={(e) => onChange('apellido_materno', e.target.value, setApellidoMaterno)}
                      onBlur={(e) => touch('apellido_materno', e.target.value)}
                      error={err('apellido_materno')}
                    />
                  </div>
                  <Input
                    label={<>RUN <Req /></>}
                    type="text" value={run}
                    icon={<IdCard className="w-4 h-4" />}
                    onChange={(e) => { const f = formatRut(e.target.value); onChange('run', f, setRun); }}
                    onBlur={(e) => touch('run', formatRut(e.target.value))}
                    placeholder="11.111.111-1" maxLength={12}
                    error={err('run')}
                  />
                </>
              )}

              {/* ─── Institución ─── */}
              {tipo === 'institucion' && (
                <>
                  <SectionTitle>Datos institucionales</SectionTitle>
                  <Select
                    label={<>Tipo de institución <Req /></>}
                    value={tipoInstitucion}
                    onChange={(e) => setTipoInstitucion(e.target.value)}
                    required
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="veterinaria">Veterinaria</option>
                    <option value="municipalidad">Municipalidad</option>
                  </Select>
                  <Input
                    label={<>Nombre de la institución <Req /></>}
                    icon={<Building2 className="w-4 h-4" />}
                    type="text" value={nombreInstitucion}
                    onChange={(e) => onChange('nombre_institucion', e.target.value, setNombreInstitucion)}
                    onBlur={(e) => touch('nombre_institucion', e.target.value)}
                    error={err('nombre_institucion')}
                  />
                  <Input
                    label={<>Razón social <Req /></>}
                    icon={<Landmark className="w-4 h-4" />}
                    type="text" value={razonSocial}
                    onChange={(e) => onChange('razon_social', e.target.value, setRazonSocial)}
                    onBlur={(e) => touch('razon_social', e.target.value)}
                    error={err('razon_social')}
                  />
                  <Input
                    label={<>RUT <Req /></>}
                    icon={<IdCard className="w-4 h-4" />}
                    type="text" value={rut}
                    onChange={(e) => { const f = formatRut(e.target.value); onChange('rut', f, setRut); }}
                    onBlur={(e) => touch('rut', formatRut(e.target.value))}
                    placeholder="76.354.771-K" maxLength={12}
                    error={err('rut')}
                  />
                </>
              )}

              {/* ─── Contacto ─── */}
              <SectionTitle>Datos de contacto</SectionTitle>
              <Input
                label={<>Correo electrónico <Req /></>}
                icon={<Mail className="w-4 h-4" />}
                type="email" value={email}
                onChange={(e) => onChange('email', e.target.value, setEmail)}
                onBlur={(e) => touch('email', e.target.value)}
                placeholder="tu@email.cl"
                error={err('email')}
              />
              <Input
                label={<>Teléfono <Req /></>}
                icon={<Phone className="w-4 h-4" />}
                type="tel" value={telefono}
                onChange={(e) => onChange('telefono', e.target.value, setTelefono)}
                onBlur={(e) => touch('telefono', e.target.value)}
                placeholder="912345678"
                error={err('telefono')}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label={<>Región <Req /></>}
                  value={region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  onBlur={(e) => touch('region', e.target.value)}
                  error={err('region')} required
                >
                  <option value="">Selecciona</option>
                  {regiones.map((r) => <option key={r.codigo} value={r.codigo}>{r.nombre}</option>)}
                </Select>
                <Select
                  label={<>Comuna <Req /></>}
                  value={comuna}
                  onChange={(e) => onChange('comuna', e.target.value, setComuna)}
                  onBlur={(e) => touch('comuna', e.target.value)}
                  error={err('comuna')} required
                  disabled={!region || loadingComunas}
                >
                  <option value="">{loadingComunas ? 'Cargando...' : 'Selecciona'}</option>
                  {comunas.map((c) => <option key={c.codigo} value={c.nombre}>{c.nombre}</option>)}
                </Select>
              </div>
              <Input
                label={<>Dirección <Req /></>}
                icon={<MapPin className="w-4 h-4" />}
                type="text" value={direccion}
                onChange={(e) => onChange('direccion', e.target.value, setDireccion)}
                onBlur={(e) => touch('direccion', e.target.value)}
                error={err('direccion')}
              />

              {/* ─── Seguridad ─── */}
              <SectionTitle>Seguridad</SectionTitle>

              {/* Password con toggle */}
              {(['password', 'confirmPassword'] as const).map((field) => {
                const isConfirm = field === 'confirmPassword';
                const show = isConfirm ? showConfirm : showPwd;
                const setShow = isConfirm ? setShowConfirm : setShowPwd;
                const val = isConfirm ? confirmPassword : password;
                return (
                  <div key={field} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">
                      {isConfirm ? 'Confirmar contraseña' : 'Contraseña'} <Req />
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={show ? 'text' : 'password'}
                        value={val}
                        placeholder={isConfirm ? '••••••••' : 'Mínimo 6 caracteres'}
                        onChange={(e) => isConfirm
                          ? onChange('confirmPassword', e.target.value, setConfirmPassword, { password })
                          : onPasswordChange(e.target.value)}
                        onBlur={(e) => touch(field, e.target.value, isConfirm ? { password } : undefined)}
                        className={`w-full border rounded-xl pl-10 pr-10 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all ${
                          err(field) ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShow(!show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {err(field) && <p className="text-rose-500 text-xs">{err(field)}</p>}
                  </div>
                );
              })}

              {/* ─── Foto ─── */}
              <SectionTitle>Foto de perfil</SectionTitle>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-xl p-5 cursor-pointer transition-colors group">
                <div className="w-10 h-10 bg-slate-100 group-hover:bg-brand-50 rounded-full flex items-center justify-center transition-colors">
                  <Camera className="w-5 h-5 text-slate-400 group-hover:text-brand-500 transition-colors" />
                </div>
                {foto
                  ? <p className="text-sm text-brand-600 font-medium">{foto.name}</p>
                  : <>
                      <p className="text-sm text-slate-500">Haz clic para subir una foto</p>
                      <p className="text-xs text-slate-400">PNG, JPG · Opcional</p>
                    </>
                }
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFoto(e.target.files?.[0] || null)} />
              </label>

              {/* ─── Submit ─── */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creando cuenta...
                  </span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Crear cuenta
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-500">
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  Inicia sesión
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
