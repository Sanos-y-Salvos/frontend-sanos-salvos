import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Building2, Mail, Phone, MapPin, Lock, Camera,
  Eye, EyeOff, Pencil, X, Loader2, CheckCircle, ShieldAlert, KeyRound,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { regionService } from '../../services/regionService';
import { validateField } from '../../utils/validators';
import type { User as UserType } from '../../types';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';

interface Region { codigo: string; nombre: string; }
interface Comuna { codigo: string; nombre: string; }

const rolLabel: Record<string, string> = {
  ciudadano: 'Ciudadano',
  veterinaria: 'Veterinaria',
  municipalidad: 'Municipalidad',
  administrador: 'Administrador',
  superadmin: 'Super Administrador',
};

const SectionTitle = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    <div className="w-0.5 h-4 bg-brand-500 rounded-full" />
    <Icon className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{children}</h2>
  </div>
);

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-sm font-medium text-slate-700">{value || '-'}</p>
  </div>
);

const PerfilPage = () => {
  const { user, logout } = useAuth();

  const [perfilData, setPerfilData] = useState<UserType | null>(user);
  useEffect(() => { if (user) setPerfilData(user); }, [user]);

  const [editando, setEditando]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess]     = useState('');
  const [showModal, setShowModal] = useState(false);

  const [regiones, setRegiones]             = useState<Region[]>([]);
  const [comunas, setComunas]               = useState<Comuna[]>([]);
  const [loadingComunas, setLoadingComunas] = useState(false);

  const [telefono, setTelefono]             = useState('');
  const [region, setRegion]                 = useState('');
  const [comuna, setComuna]                 = useState('');
  const [primerNombre, setPrimerNombre]     = useState('');
  const [segundoNombre, setSegundoNombre]   = useState('');
  const [apellidoPaterno, setApellidoPaterno]   = useState('');
  const [apellidoMaterno, setApellidoMaterno]   = useState('');
  const [nombreInstitucion, setNombreInstitucion] = useState('');
  const [razonSocial, setRazonSocial]       = useState('');
  const [direccion, setDireccion]           = useState('');
  const [foto, setFoto]                     = useState<File | null>(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!foto) { setFotoPreviewUrl(null); return; }
    const url = URL.createObjectURL(foto);
    setFotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const [touched, setTouched]         = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [contrasenaActual, setContrasenaActual]     = useState('');
  const [contrasenaNueva, setContrasenaNueva]       = useState('');
  const [contrasenaConfirm, setContrasenaConfirm]   = useState('');
  const [loadingContrasena, setLoadingContrasena]   = useState(false);
  const [touchedPass, setTouchedPass]               = useState<Record<string, boolean>>({});
  const [passErrors, setPassErrors]                 = useState<Record<string, string>>({});
  const [showActual, setShowActual]     = useState(false);
  const [showNueva, setShowNueva]       = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  useEffect(() => { regionService.getRegiones().then(setRegiones).catch(() => {}); }, []);
  useEffect(() => {
    if (!region) { setComunas([]); return; }
    setLoadingComunas(true);
    regionService.getComunas(region).then(setComunas).catch(() => setComunas([])).finally(() => setLoadingComunas(false));
  }, [region]);

  const touch = (field: string, value: string, extra?: { password?: string }) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFieldErrors(prev => ({ ...prev, [field]: validateField(field, value, extra) }));
  };
  const onChange = (field: string, value: string, setter: (v: string) => void, extra?: { password?: string }) => {
    setter(value);
    if (touched[field]) setFieldErrors(prev => ({ ...prev, [field]: validateField(field, value, extra) }));
  };
  const touchPass = (field: string, value: string, extra?: { password?: string }) => {
    setTouchedPass(prev => ({ ...prev, [field]: true }));
    setPassErrors(prev => ({ ...prev, [field]: validateField(field, value, extra) }));
  };
  const onChangePass = (field: string, value: string, setter: (v: string) => void, extra?: { password?: string }) => {
    setter(value);
    if (touchedPass[field]) setPassErrors(prev => ({ ...prev, [field]: validateField(field, value, extra) }));
  };
  const onNuevaPassChange = (value: string) => {
    setContrasenaNueva(value);
    if (touchedPass['nueva_password']) setPassErrors(prev => ({ ...prev, nueva_password: validateField('nueva_password', value) }));
    if (touchedPass['confirm_password']) setPassErrors(prev => ({ ...prev, confirm_password: validateField('confirm_password', contrasenaConfirm, { password: value }) }));
  };
  const err = (field: string) => (touched[field] ? fieldErrors[field] : undefined);
  const errPass = (field: string) => (touchedPass[field] ? passErrors[field] : undefined);

  const iniciarEdicion = () => {
    setTelefono(perfilData?.telefono || '');
    setRegion(perfilData?.region || '');
    setComuna(perfilData?.comuna || '');
    if (perfilData?.ciudadano) {
      setPrimerNombre(perfilData.ciudadano.primer_nombre || '');
      setSegundoNombre(perfilData.ciudadano.segundo_nombre || '');
      setApellidoPaterno(perfilData.ciudadano.apellido_paterno || '');
      setApellidoMaterno(perfilData.ciudadano.apellido_materno || '');
      setDireccion(perfilData.ciudadano.direccion || '');
    }
    if (perfilData?.institucion) {
      setNombreInstitucion(perfilData.institucion.nombre_institucion || '');
      setRazonSocial(perfilData.institucion.razon_social || '');
      setDireccion(perfilData.institucion.direccion || '');
    }
    setTouched({}); setFieldErrors({}); setSubmitError(''); setSuccess('');
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false); setFoto(null); setTouched({}); setFieldErrors({}); setSubmitError('');
  };

  const handleGuardar = async () => {
    const fields: [string, string][] = [
      ['telefono', telefono], ['region', region], ['comuna', comuna], ['direccion', direccion],
    ];
    if (perfilData?.ciudadano) fields.push(
      ['primer_nombre', primerNombre], ['segundo_nombre', segundoNombre],
      ['apellido_paterno', apellidoPaterno], ['apellido_materno', apellidoMaterno],
    );
    if (perfilData?.institucion) fields.push(['nombre_institucion', nombreInstitucion], ['razon_social', razonSocial]);

    const newTouched: Record<string, boolean> = {};
    const newErrors: Record<string, string> = {};
    for (const [field, value] of fields) { newTouched[field] = true; newErrors[field] = validateField(field, value); }
    setTouched(prev => ({ ...prev, ...newTouched }));
    setFieldErrors(prev => ({ ...prev, ...newErrors }));
    if (Object.values(newErrors).some(e => e !== '')) return;

    setLoading(true); setSubmitError(''); setSuccess('');
    try {
      const fd = new FormData();
      fd.append('telefono', telefono);
      fd.append('region', region);
      fd.append('comuna', comuna);
      if (perfilData?.ciudadano) {
        fd.append('primer_nombre', primerNombre);
        fd.append('segundo_nombre', segundoNombre);
        fd.append('apellido_paterno', apellidoPaterno);
        fd.append('apellido_materno', apellidoMaterno);
        fd.append('direccion', direccion);
      }
      if (perfilData?.institucion) {
        fd.append('nombre_institucion', nombreInstitucion);
        fd.append('razon_social', razonSocial);
        fd.append('direccion', direccion);
      }
      if (foto) fd.append('foto_perfil', foto);
      await userService.actualizarPerfil(fd);
      const perfil = await userService.obtenerPerfil();
      setPerfilData(perfil);
      setSuccess('Perfil actualizado correctamente');
      setEditando(false);
    } catch (e: any) {
      setSubmitError(e.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarContrasena = async () => {
    const fields: [string, string, object?][] = [
      ['nueva_password', contrasenaNueva],
      ['confirm_password', contrasenaConfirm, { password: contrasenaNueva }],
    ];
    const newTouched: Record<string, boolean> = {};
    const newErrors: Record<string, string> = {};
    for (const [field, value, extra] of fields) {
      newTouched[field as string] = true;
      newErrors[field as string] = validateField(field as string, value as string, extra as any);
    }
    if (!contrasenaActual) { newTouched['contrasena_actual'] = true; newErrors['contrasena_actual'] = 'La contraseña actual es requerida'; }
    setTouchedPass(prev => ({ ...prev, ...newTouched }));
    setPassErrors(prev => ({ ...prev, ...newErrors }));
    if (Object.values(newErrors).some(e => e !== '')) return;

    setLoadingContrasena(true);
    try {
      const result = await userService.cambiarContrasena(contrasenaActual, contrasenaNueva);
      setPassErrors({}); setTouchedPass({});
      setPassErrors({ _success: result.message });
      setContrasenaActual(''); setContrasenaNueva(''); setContrasenaConfirm('');
    } catch (e: any) {
      setPassErrors(prev => ({ ...prev, contrasena_actual: e.response?.data?.message || 'Error al cambiar la contraseña' }));
      setTouchedPass(prev => ({ ...prev, contrasena_actual: true }));
    } finally {
      setLoadingContrasena(false);
    }
  };

  const handleDesactivar = async () => {
    try {
      await userService.desactivarCuenta();
      await logout();
    } catch {
      setSubmitError('Error al desactivar la cuenta');
    }
  };

  const nombreMostrar = perfilData?.ciudadano
    ? `${perfilData.ciudadano.primer_nombre} ${perfilData.ciudadano.apellido_paterno}`
    : perfilData?.institucion?.nombre_institucion || 'Usuario';

  const esInstitucion = perfilData?.tipo === 'institucion';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <BotonVolver ruta="/" texto="Volver al inicio" />
          <div className="flex items-center gap-4 mt-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {perfilData?.foto_perfil ? (
                <img
                  src={perfilData.foto_perfil}
                  alt="Foto de perfil"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                  {esInstitucion
                    ? <Building2 className="w-7 h-7 text-brand-500" strokeWidth={1.5} />
                    : <User className="w-7 h-7 text-brand-500" strokeWidth={1.5} />
                  }
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-slate-900">{nombreMostrar}</h1>
              <p className="text-sm text-slate-500">{perfilData?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1.5 bg-brand-100 text-brand-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {rolLabel[perfilData?.rol || ''] || perfilData?.rol}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 py-6 px-4">
        <div className="max-w-2xl mx-auto space-y-4">

          <AnimatePresence>
            {submitError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Alert variant="error">{submitError}</Alert>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Alert variant="success">{success}</Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Datos editables ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon={esInstitucion ? Building2 : User}>
                {esInstitucion ? 'Datos institucionales' : 'Datos personales'}
              </SectionTitle>
              {!editando && (
                <button
                  onClick={iniciarEdicion}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!editando ? (
                /* ── MODO LECTURA ── */
                <motion.div key="read" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {perfilData?.ciudadano && (
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Primer nombre"   value={perfilData.ciudadano.primer_nombre} />
                      <Field label="Segundo nombre"  value={perfilData.ciudadano.segundo_nombre} />
                      <Field label="Apellido paterno" value={perfilData.ciudadano.apellido_paterno} />
                      <Field label="Apellido materno" value={perfilData.ciudadano.apellido_materno} />
                      <Field label="RUN"              value={perfilData.ciudadano.run} />
                      <Field label="Teléfono"         value={perfilData.telefono} />
                      <Field label="Región"           value={perfilData.region} />
                      <Field label="Comuna"           value={perfilData.comuna} />
                      <div className="col-span-2">
                        <Field label="Dirección" value={perfilData.ciudadano.direccion} />
                      </div>
                    </div>
                  )}
                  {perfilData?.institucion && (
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Nombre institución" value={perfilData.institucion.nombre_institucion} />
                      <Field label="Razón social"       value={perfilData.institucion.razon_social} />
                      <Field label="RUT"                value={perfilData.institucion.rut} />
                      <Field label="Tipo"               value={perfilData.institucion.tipo_institucion} />
                      <Field label="Teléfono"           value={perfilData.telefono} />
                      <Field label="Región"             value={perfilData.region} />
                      <Field label="Comuna"             value={perfilData.comuna} />
                      <div className="col-span-2">
                        <Field label="Dirección" value={perfilData.institucion.direccion} />
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* ── MODO EDICIÓN ── */
                <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">

                  {perfilData?.ciudadano && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="Primer nombre" value={primerNombre}
                          onChange={e => onChange('primer_nombre', e.target.value, setPrimerNombre)}
                          onBlur={e => touch('primer_nombre', e.target.value)}
                          error={err('primer_nombre')} />
                        <Input label="Segundo nombre" value={segundoNombre}
                          onChange={e => onChange('segundo_nombre', e.target.value, setSegundoNombre)}
                          onBlur={e => touch('segundo_nombre', e.target.value)}
                          error={err('segundo_nombre')} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="Apellido paterno" value={apellidoPaterno}
                          onChange={e => onChange('apellido_paterno', e.target.value, setApellidoPaterno)}
                          onBlur={e => touch('apellido_paterno', e.target.value)}
                          error={err('apellido_paterno')} />
                        <Input label="Apellido materno" value={apellidoMaterno}
                          onChange={e => onChange('apellido_materno', e.target.value, setApellidoMaterno)}
                          onBlur={e => touch('apellido_materno', e.target.value)}
                          error={err('apellido_materno')} />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                        <Lock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        <span className="text-slate-400 text-xs">RUN: </span>
                        <span className="text-slate-600 font-medium font-mono">{perfilData.ciudadano.run}</span>
                        <span className="text-xs text-slate-300 ml-1">(no editable)</span>
                      </div>
                    </>
                  )}

                  {perfilData?.institucion && (
                    <>
                      <Input label="Nombre institución" value={nombreInstitucion}
                        onChange={e => onChange('nombre_institucion', e.target.value, setNombreInstitucion)}
                        onBlur={e => touch('nombre_institucion', e.target.value)}
                        error={err('nombre_institucion')} />
                      <Input label="Razón social" value={razonSocial}
                        onChange={e => onChange('razon_social', e.target.value, setRazonSocial)}
                        onBlur={e => touch('razon_social', e.target.value)}
                        error={err('razon_social')} />
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                        <Lock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        <span className="text-slate-400 text-xs">RUT: </span>
                        <span className="text-slate-600 font-medium font-mono">{perfilData.institucion.rut}</span>
                        <span className="text-xs text-slate-300 ml-1">(no editable)</span>
                      </div>
                    </>
                  )}

                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    <SectionTitle icon={Phone}>Contacto</SectionTitle>
                    <Input label="Teléfono" type="tel" value={telefono}
                      icon={<Phone className="w-4 h-4" />}
                      onChange={e => onChange('telefono', e.target.value, setTelefono)}
                      onBlur={e => touch('telefono', e.target.value)}
                      error={err('telefono')} />
                    <Select label="Región" value={region}
                      onChange={e => { setRegion(e.target.value); setComuna(''); touch('region', e.target.value); }}
                      onBlur={e => touch('region', e.target.value)}
                      error={err('region')}>
                      <option value="">Selecciona una región</option>
                      {regiones.map(r => <option key={r.codigo} value={r.codigo}>{r.nombre}</option>)}
                    </Select>
                    <Select label="Comuna" value={comuna}
                      onChange={e => onChange('comuna', e.target.value, setComuna)}
                      onBlur={e => touch('comuna', e.target.value)}
                      error={err('comuna')}
                      disabled={!region || loadingComunas}>
                      <option value="">{loadingComunas ? 'Cargando...' : 'Selecciona una comuna'}</option>
                      {comunas.map(c => <option key={c.codigo} value={c.nombre}>{c.nombre}</option>)}
                    </Select>
                    <Input label="Dirección" value={direccion}
                      icon={<MapPin className="w-4 h-4" />}
                      onChange={e => onChange('direccion', e.target.value, setDireccion)}
                      onBlur={e => touch('direccion', e.target.value)}
                      error={err('direccion')} />
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    <SectionTitle icon={Camera}>Foto de perfil</SectionTitle>
                    <label className="flex items-center gap-4 cursor-pointer group">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 group-hover:border-brand-400 transition-colors flex-shrink-0 flex items-center justify-center bg-slate-50">
                        {fotoPreviewUrl ? (
                          <img src={fotoPreviewUrl} alt="Nueva foto" className="w-full h-full object-cover" />
                        ) : perfilData?.foto_perfil ? (
                          <img src={perfilData.foto_perfil} alt="Foto actual" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-5 h-5 text-slate-300 group-hover:text-brand-400 transition-colors" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 group-hover:text-brand-600 transition-colors">
                          {fotoPreviewUrl ? 'Cambiar foto seleccionada' : 'Subir nueva foto'}
                        </p>
                        <p className="text-xs text-slate-400">PNG, JPG, WEBP</p>
                      </div>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => setFoto(e.target.files?.[0] || null)} />
                    </label>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleGuardar}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50"
                    >
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><CheckCircle className="w-4 h-4" /> Guardar cambios</>}
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 rounded-xl transition-all disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Cancelar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Cambio de contraseña ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <SectionTitle icon={KeyRound}>Cambiar contraseña</SectionTitle>

            {passErrors._success && (
              <Alert variant="success">{passErrors._success}</Alert>
            )}

            <div className="relative">
              <Input
                label="Contraseña actual"
                type={showActual ? 'text' : 'password'}
                value={contrasenaActual}
                onChange={e => onChangePass('contrasena_actual', e.target.value, setContrasenaActual)}
                onBlur={e => touchPass('contrasena_actual', e.target.value)}
                error={errPass('contrasena_actual')}
              />
              <button
                type="button"
                onClick={() => setShowActual(v => !v)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Nueva contraseña"
                type={showNueva ? 'text' : 'password'}
                value={contrasenaNueva}
                onChange={e => onNuevaPassChange(e.target.value)}
                onBlur={e => touchPass('nueva_password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                error={errPass('nueva_password')}
              />
              <button
                type="button"
                onClick={() => setShowNueva(v => !v)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirmar nueva contraseña"
                type={showConfirm ? 'text' : 'password'}
                value={contrasenaConfirm}
                onChange={e => onChangePass('confirm_password', e.target.value, setContrasenaConfirm, { password: contrasenaNueva })}
                onBlur={e => touchPass('confirm_password', e.target.value, { password: contrasenaNueva })}
                error={errPass('confirm_password')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={handleCambiarContrasena}
              disabled={loadingContrasena || !contrasenaActual || !contrasenaNueva || !contrasenaConfirm}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingContrasena
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Actualizando...</>
                : <><KeyRound className="w-4 h-4" /> Actualizar contraseña</>
              }
            </button>
          </div>

          {/* ── Zona de peligro ── */}
          {perfilData?.rol !== 'superadmin' && (
            <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-rose-500" strokeWidth={1.5} />
                <h2 className="text-sm font-semibold text-rose-600">Zona de peligro</h2>
              </div>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                Al desactivar tu cuenta no podrás iniciar sesión. Esta acción no es reversible de forma autónoma.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 border border-rose-300 text-rose-600 hover:bg-rose-50 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                Desactivar cuenta
              </button>
            </div>
          )}

        </div>
      </div>

      <Footer />

      {/* ── Modal confirmación ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 max-w-sm w-full"
            >
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-6 h-6 text-rose-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900 text-center mb-1">¿Desactivar cuenta?</h3>
              <p className="text-sm text-slate-500 text-center mb-5 leading-relaxed">
                Esta acción desactivará tu cuenta. No podrás iniciar sesión hasta que un administrador la reactive.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDesactivar}
                  className="flex-1 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
                >
                  Sí, desactivar
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 flex items-center justify-center border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 rounded-xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PerfilPage;
