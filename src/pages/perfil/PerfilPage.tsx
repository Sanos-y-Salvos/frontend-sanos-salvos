import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { regionService } from '../../services/regionService';
import { validateField } from '../../utils/validators';
import type { User } from '../../types';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
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

const PerfilPage = () => {
  const { user, logout } = useAuth();

  const [perfilData, setPerfilData] = useState<User | null>(user);
  useEffect(() => { if (user) setPerfilData(user); }, [user]);

  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [regiones, setRegiones] = useState<Region[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [loadingComunas, setLoadingComunas] = useState(false);

  // Campos del formulario de perfil
  const [telefono, setTelefono] = useState('');
  const [region, setRegion] = useState('');
  const [comuna, setComuna] = useState('');
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [nombreInstitucion, setNombreInstitucion] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [direccion, setDireccion] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!foto) { setFotoPreviewUrl(null); return; }
    const url = URL.createObjectURL(foto);
    setFotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  // Validación en tiempo real — perfil
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Cambio de contraseña
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [contrasenaConfirm, setContrasenaConfirm] = useState('');
  const [loadingContrasena, setLoadingContrasena] = useState(false);
  const [touchedPass, setTouchedPass] = useState<Record<string, boolean>>({});
  const [passErrors, setPassErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    regionService.getRegiones().then(setRegiones).catch(() => {});
  }, []);

  useEffect(() => {
    if (!region) { setComunas([]); return; }
    setLoadingComunas(true);
    regionService.getComunas(region)
      .then(setComunas)
      .catch(() => setComunas([]))
      .finally(() => setLoadingComunas(false));
  }, [region]);

  // ── Helpers de validación ────────────────────────────────────────────────
  const touch = (field: string, value: string, extra?: { password?: string }) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFieldErrors(prev => ({ ...prev, [field]: validateField(field, value, extra) }));
  };

  const onChange = (field: string, value: string, setter: (v: string) => void, extra?: { password?: string }) => {
    setter(value);
    if (touched[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: validateField(field, value, extra) }));
    }
  };

  const touchPass = (field: string, value: string, extra?: { password?: string }) => {
    setTouchedPass(prev => ({ ...prev, [field]: true }));
    setPassErrors(prev => ({ ...prev, [field]: validateField(field, value, extra) }));
  };

  const onChangePass = (field: string, value: string, setter: (v: string) => void, extra?: { password?: string }) => {
    setter(value);
    if (touchedPass[field]) {
      setPassErrors(prev => ({ ...prev, [field]: validateField(field, value, extra) }));
    }
  };

  const onNuevaPassChange = (value: string) => {
    setContrasenaNueva(value);
    if (touchedPass['nueva_password']) {
      setPassErrors(prev => ({ ...prev, nueva_password: validateField('nueva_password', value) }));
    }
    if (touchedPass['confirm_password']) {
      setPassErrors(prev => ({ ...prev, confirm_password: validateField('confirm_password', contrasenaConfirm, { password: value }) }));
    }
  };

  const err = (field: string) => (touched[field] ? fieldErrors[field] : undefined);
  const errPass = (field: string) => (touchedPass[field] ? passErrors[field] : undefined);

  // ── Edición de perfil ────────────────────────────────────────────────────
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
    setTouched({});
    setFieldErrors({});
    setSubmitError('');
    setSuccess('');
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setFoto(null);
    setTouched({});
    setFieldErrors({});
    setSubmitError('');
  };

  const handleGuardar = async () => {
    // Validar todos los campos requeridos antes de enviar
    const fields: [string, string][] = [
      ['telefono', telefono], ['region', region], ['comuna', comuna], ['direccion', direccion],
    ];
    if (perfilData?.ciudadano) {
      fields.push(
        ['primer_nombre', primerNombre], ['segundo_nombre', segundoNombre],
        ['apellido_paterno', apellidoPaterno], ['apellido_materno', apellidoMaterno],
      );
    }
    if (perfilData?.institucion) {
      fields.push(['nombre_institucion', nombreInstitucion], ['razon_social', razonSocial]);
    }

    const newTouched: Record<string, boolean> = {};
    const newErrors: Record<string, string> = {};
    for (const [field, value] of fields) {
      newTouched[field] = true;
      newErrors[field] = validateField(field, value);
    }
    setTouched(prev => ({ ...prev, ...newTouched }));
    setFieldErrors(prev => ({ ...prev, ...newErrors }));
    if (Object.values(newErrors).some(e => e !== '')) return;

    setLoading(true);
    setSubmitError('');
    setSuccess('');
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
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // ── Cambio de contraseña ─────────────────────────────────────────────────
  const handleCambiarContrasena = async () => {
    // Forzar validación de todos los campos de contraseña
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
      const result = await authService.cambiarContrasena(contrasenaActual, contrasenaNueva);
      setPassErrors({});
      setTouchedPass({});
      // Mostrar éxito inline en el campo de contraseña actual (usamos passErrors como canal)
      setPassErrors({ _success: result.message });
      setContrasenaActual('');
      setContrasenaNueva('');
      setContrasenaConfirm('');
    } catch (err: any) {
      setPassErrors(prev => ({ ...prev, contrasena_actual: err.response?.data?.message || 'Error al cambiar la contraseña' }));
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-4">

          <BotonVolver ruta="/" texto="← Volver" />

          {/* Header */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              {perfilData?.foto_perfil ? (
                <img src={perfilData.foto_perfil} alt="Foto de perfil" className="w-20 h-20 rounded-full object-cover border-2 border-blue-100" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl">
                  {perfilData?.tipo === 'institucion' ? '🏥' : '👤'}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-800">{nombreMostrar}</h1>
                <p className="text-sm text-gray-500">{perfilData?.email}</p>
                <span className="inline-block mt-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {rolLabel[perfilData?.rol || ''] || perfilData?.rol}
                </span>
              </div>
            </div>
          </Card>

          {submitError && <Alert variant="error">{submitError}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* Datos editables */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="font-semibold text-gray-700">
                {perfilData?.tipo === 'ciudadano' ? 'Datos personales' : 'Datos institucionales'}
              </h2>
              {!editando && (
                <button onClick={iniciarEdicion} className="text-sm text-blue-600 hover:underline">
                  Editar
                </button>
              )}
            </div>

            {!editando ? (
              /* ── MODO LECTURA ── */
              <div className="space-y-4">
                {perfilData?.ciudadano && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-gray-400">Primer nombre</p><p className="font-medium text-gray-700">{perfilData.ciudadano.primer_nombre}</p></div>
                    <div><p className="text-gray-400">Segundo nombre</p><p className="font-medium text-gray-700">{perfilData.ciudadano.segundo_nombre || '-'}</p></div>
                    <div><p className="text-gray-400">Apellido paterno</p><p className="font-medium text-gray-700">{perfilData.ciudadano.apellido_paterno}</p></div>
                    <div><p className="text-gray-400">Apellido materno</p><p className="font-medium text-gray-700">{perfilData.ciudadano.apellido_materno || '-'}</p></div>
                    <div><p className="text-gray-400">RUN</p><p className="font-medium text-gray-700">{perfilData.ciudadano.run}</p></div>
                    <div><p className="text-gray-400">Teléfono</p><p className="font-medium text-gray-700">{perfilData.telefono || '-'}</p></div>
                    <div><p className="text-gray-400">Región</p><p className="font-medium text-gray-700">{perfilData.region || '-'}</p></div>
                    <div><p className="text-gray-400">Comuna</p><p className="font-medium text-gray-700">{perfilData.comuna || '-'}</p></div>
                    <div className="col-span-2"><p className="text-gray-400">Dirección</p><p className="font-medium text-gray-700">{perfilData.ciudadano.direccion}</p></div>
                  </div>
                )}
                {perfilData?.institucion && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-gray-400">Nombre institución</p><p className="font-medium text-gray-700">{perfilData.institucion.nombre_institucion}</p></div>
                    <div><p className="text-gray-400">Razón social</p><p className="font-medium text-gray-700">{perfilData.institucion.razon_social}</p></div>
                    <div><p className="text-gray-400">RUT</p><p className="font-medium text-gray-700">{perfilData.institucion.rut}</p></div>
                    <div><p className="text-gray-400">Tipo</p><p className="font-medium text-gray-700 capitalize">{perfilData.institucion.tipo_institucion}</p></div>
                    <div><p className="text-gray-400">Teléfono</p><p className="font-medium text-gray-700">{perfilData.telefono || '-'}</p></div>
                    <div><p className="text-gray-400">Región</p><p className="font-medium text-gray-700">{perfilData.region || '-'}</p></div>
                    <div><p className="text-gray-400">Comuna</p><p className="font-medium text-gray-700">{perfilData.comuna || '-'}</p></div>
                    <div className="col-span-2"><p className="text-gray-400">Dirección</p><p className="font-medium text-gray-700">{perfilData.institucion.direccion}</p></div>
                  </div>
                )}
              </div>
            ) : (
              /* ── MODO EDICIÓN ── */
              <div className="space-y-3">

                {perfilData?.ciudadano && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Primer nombre"
                        value={primerNombre}
                        onChange={e => onChange('primer_nombre', e.target.value, setPrimerNombre)}
                        onBlur={e => touch('primer_nombre', e.target.value)}
                        error={err('primer_nombre')}
                      />
                      <Input
                        label="Segundo nombre"
                        value={segundoNombre}
                        onChange={e => onChange('segundo_nombre', e.target.value, setSegundoNombre)}
                        onBlur={e => touch('segundo_nombre', e.target.value)}
                        error={err('segundo_nombre')}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Apellido paterno"
                        value={apellidoPaterno}
                        onChange={e => onChange('apellido_paterno', e.target.value, setApellidoPaterno)}
                        onBlur={e => touch('apellido_paterno', e.target.value)}
                        error={err('apellido_paterno')}
                      />
                      <Input
                        label="Apellido materno"
                        value={apellidoMaterno}
                        onChange={e => onChange('apellido_materno', e.target.value, setApellidoMaterno)}
                        onBlur={e => touch('apellido_materno', e.target.value)}
                        error={err('apellido_materno')}
                      />
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500 border border-gray-200">
                      <span className="font-medium text-gray-600">RUN: </span>{perfilData.ciudadano.run}
                      <span className="ml-2 text-xs text-gray-400">(no editable)</span>
                    </div>
                  </>
                )}

                {perfilData?.institucion && (
                  <>
                    <Input
                      label="Nombre institución"
                      value={nombreInstitucion}
                      onChange={e => onChange('nombre_institucion', e.target.value, setNombreInstitucion)}
                      onBlur={e => touch('nombre_institucion', e.target.value)}
                      error={err('nombre_institucion')}
                    />
                    <Input
                      label="Razón social"
                      value={razonSocial}
                      onChange={e => onChange('razon_social', e.target.value, setRazonSocial)}
                      onBlur={e => touch('razon_social', e.target.value)}
                      error={err('razon_social')}
                    />
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500 border border-gray-200">
                      <span className="font-medium text-gray-600">RUT: </span>{perfilData.institucion.rut}
                      <span className="ml-2 text-xs text-gray-400">(no editable)</span>
                    </div>
                  </>
                )}

                <div className="border-t pt-3 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contacto</p>
                  <Input
                    label="Teléfono"
                    type="tel"
                    value={telefono}
                    onChange={e => onChange('telefono', e.target.value, setTelefono)}
                    onBlur={e => touch('telefono', e.target.value)}
                    error={err('telefono')}
                  />
                  <Select
                    label="Región"
                    value={region}
                    onChange={e => { setRegion(e.target.value); setComuna(''); touch('region', e.target.value); }}
                    onBlur={e => touch('region', e.target.value)}
                    error={err('region')}
                  >
                    <option value="">Selecciona una región</option>
                    {regiones.map(r => (
                      <option key={r.codigo} value={r.codigo}>{r.nombre}</option>
                    ))}
                  </Select>
                  <Select
                    label="Comuna"
                    value={comuna}
                    onChange={e => onChange('comuna', e.target.value, setComuna)}
                    onBlur={e => touch('comuna', e.target.value)}
                    error={err('comuna')}
                    disabled={!region || loadingComunas}
                  >
                    <option value="">{loadingComunas ? 'Cargando...' : 'Selecciona una comuna'}</option>
                    {comunas.map(c => (
                      <option key={c.codigo} value={c.nombre}>{c.nombre}</option>
                    ))}
                  </Select>
                  <Input
                    label="Dirección"
                    value={direccion}
                    onChange={e => onChange('direccion', e.target.value, setDireccion)}
                    onBlur={e => touch('direccion', e.target.value)}
                    error={err('direccion')}
                  />
                </div>

                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Foto de perfil</p>
                  {perfilData?.foto_perfil && !foto && (
                    <img src={perfilData.foto_perfil} alt="Foto actual" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                  )}
                  {fotoPreviewUrl && (
                    <img src={fotoPreviewUrl} alt="Nueva foto" className="w-16 h-16 rounded-full object-cover border-2 border-blue-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setFoto(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleGuardar} disabled={loading} fullWidth>
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                  <Button variant="secondary" onClick={cancelarEdicion} disabled={loading} fullWidth>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Cambiar contraseña */}
          <Card className="p-6">
            <h2 className="font-semibold text-gray-700 mb-4 border-b pb-2">Cambiar contraseña</h2>
            <div className="space-y-3">
              {passErrors._success && <Alert variant="success">{passErrors._success}</Alert>}
              <Input
                label="Contraseña actual"
                type="password"
                value={contrasenaActual}
                onChange={e => onChangePass('contrasena_actual', e.target.value, setContrasenaActual)}
                onBlur={e => touchPass('contrasena_actual', e.target.value)}
                error={errPass('contrasena_actual')}
              />
              <Input
                label="Nueva contraseña"
                type="password"
                value={contrasenaNueva}
                onChange={e => onNuevaPassChange(e.target.value)}
                onBlur={e => touchPass('nueva_password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                error={errPass('nueva_password')}
              />
              <Input
                label="Confirmar nueva contraseña"
                type="password"
                value={contrasenaConfirm}
                onChange={e => onChangePass('confirm_password', e.target.value, setContrasenaConfirm, { password: contrasenaNueva })}
                onBlur={e => touchPass('confirm_password', e.target.value, { password: contrasenaNueva })}
                error={errPass('confirm_password')}
              />
              <Button
                onClick={handleCambiarContrasena}
                disabled={loadingContrasena || !contrasenaActual || !contrasenaNueva || !contrasenaConfirm}
              >
                {loadingContrasena ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </div>
          </Card>

          {/* Zona de peligro */}
          {perfilData?.rol !== 'superadmin' && (
            <Card className="p-6 border border-red-100">
              <h2 className="font-semibold text-red-600 mb-2">Zona de peligro</h2>
              <p className="text-sm text-gray-500 mb-3">
                Al desactivar tu cuenta no podrás iniciar sesión. Esta acción no es reversible.
              </p>
              <Button variant="ghost" className="text-red-600 border border-red-300 hover:bg-red-50" onClick={() => setShowModal(true)}>
                Desactivar cuenta
              </Button>
            </Card>
          )}

        </div>
      </div>

      <Footer />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <Card className="p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">¿Desactivar cuenta?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Esta acción desactivará tu cuenta. No podrás iniciar sesión hasta que un administrador la reactive.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={handleDesactivar} fullWidth>Sí, desactivar</Button>
              <Button variant="secondary" onClick={() => setShowModal(false)} fullWidth>Cancelar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PerfilPage;
