import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { regionService } from '../../services/regionService';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Input from '../../components/ui/Input';
import { formatRut, parseRut } from '../../utils/rutFormatter';
import { validateField } from '../../utils/validators';

type RegionItem = { codigo: string; nombre: string };
type ComunaItem = { codigo: string; nombre: string };

const rolColor: Record<string, string> = {
    ciudadano: 'bg-blue-100 text-blue-700',
    veterinaria: 'bg-green-100 text-green-700',
    municipalidad: 'bg-purple-100 text-purple-700',
    moderador: 'bg-yellow-100 text-yellow-700',
    administrador: 'bg-orange-100 text-orange-700',
    superadmin: 'bg-red-100 text-red-700',
};

const rolLabel: Record<string, string> = {
    ciudadano: 'Ciudadano',
    veterinaria: 'Veterinaria',
    municipalidad: 'Municipalidad',
    moderador: 'Moderador',
    administrador: 'Administrador',
    superadmin: 'Super Admin',
};

const formatFecha = (fecha?: string) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formCrearInicial = {
    email: '', password: '', telefono: '', region: '', comuna: '',
    primer_nombre: '', segundo_nombre: '', apellido_paterno: '', apellido_materno: '', run: '',
    nombre_institucion: '', razon_social: '', rut: '', tipo_institucion: 'veterinaria', direccion: '',
};

const AdminUsuariosPage = () => {
    const { user: authUser } = useAuth();
    const isSuperadmin = authUser?.rol === 'superadmin';

    // Shared
    const [regiones, setRegiones] = useState<RegionItem[]>([]);

    // List
    const [usuarios, setUsuarios] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filtroRol, setFiltroRol] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // Create modal
    const [mostrarModal, setMostrarModal] = useState(false);
    const [tipoCrear, setTipoCrear] = useState<'ciudadano' | 'institucion'>('ciudadano');
    const [formCrear, setFormCrear] = useState(formCrearInicial);
    const [archivoCrear, setArchivoCrear] = useState<File | null>(null);
    const [comunasCrear, setComunasCrear] = useState<ComunaItem[]>([]);
    const [creandoUsuario, setCreandoUsuario] = useState(false);
    const [errorModal, setErrorModal] = useState('');
    const [touchedCrear, setTouchedCrear] = useState<Record<string, boolean>>({});
    const [fieldErrorsCrear, setFieldErrorsCrear] = useState<Record<string, string>>({});

    // Detail
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<User | null>(null);
    const [nuevoRol, setNuevoRol] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [errorDetalle, setErrorDetalle] = useState('');
    const [successDetalle, setSuccessDetalle] = useState('');

    // Edit (within detail)
    const [modoEdicion, setModoEdicion] = useState(false);
    const [formEditar, setFormEditar] = useState<Record<string, string>>({});
    const [comunasEditar, setComunasEditar] = useState<ComunaItem[]>([]);

    useEffect(() => {
        regionService.getRegiones().then(setRegiones).catch(() => {});
    }, []);

    useEffect(() => {
        cargarUsuarios();
    }, [filtroRol, filtroEstado]);

    // Load comunas when create form region changes
    useEffect(() => {
        if (formCrear.region) {
            regionService.getComunas(formCrear.region)
                .then(setComunasCrear)
                .catch(() => setComunasCrear([]));
        } else {
            setComunasCrear([]);
        }
    }, [formCrear.region]);

    // Load comunas when edit form region changes
    useEffect(() => {
        if (formEditar.region) {
            regionService.getComunas(formEditar.region)
                .then(setComunasEditar)
                .catch(() => setComunasEditar([]));
        }
    }, [formEditar.region]);

    const errCrear = (field: string) => touchedCrear[field] ? fieldErrorsCrear[field] : undefined;

    const blurCrear = (field: string, value: string) => {
        setTouchedCrear(prev => ({ ...prev, [field]: true }));
        const err = validateField(field, value);
        setFieldErrorsCrear(prev => ({ ...prev, [field]: err || '' }));
    };

    const changeCrear = (field: string, value: string) => {
        setFormCrear(prev => ({ ...prev, [field]: value }));
        if (touchedCrear[field]) {
            const err = validateField(field, value);
            setFieldErrorsCrear(prev => ({ ...prev, [field]: err || '' }));
        }
    };

    const changeRutCrear = (field: 'run' | 'rut', value: string) => {
        const formatted = formatRut(value);
        setFormCrear(prev => ({ ...prev, [field]: formatted }));
        if (touchedCrear[field]) {
            const err = validateField(field, parseRut(formatted));
            setFieldErrorsCrear(prev => ({ ...prev, [field]: err || '' }));
        }
    };

    const abrirModal = () => {
        setMostrarModal(true);
        setErrorModal('');
        setFormCrear(formCrearInicial);
        setArchivoCrear(null);
        setTouchedCrear({});
        setFieldErrorsCrear({});
    };

    const cargarUsuarios = async () => {
        setLoading(true);
        try {
            const filtros: { rol?: string; is_active?: boolean } = {};
            if (filtroRol) filtros.rol = filtroRol;
            if (filtroEstado !== '') filtros.is_active = filtroEstado === 'activo';
            const data = await userService.listarUsuarios(filtros);
            setUsuarios(data);
        } catch {
            setError('Error al cargar los usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleVerUsuario = async (id: string) => {
        try {
            const user = await userService.verUsuario(id);
            setUsuarioSeleccionado(user);
            setNuevoRol(user.rol);
            setModoEdicion(false);
            setErrorDetalle('');
            setSuccessDetalle('');
            const form: Record<string, string> = {
                telefono: user.telefono || '',
                region: user.region || '',
                comuna: user.comuna || '',
            };
            if (user.ciudadano) {
                form.primer_nombre = user.ciudadano.primer_nombre || '';
                form.segundo_nombre = user.ciudadano.segundo_nombre || '';
                form.apellido_paterno = user.ciudadano.apellido_paterno || '';
                form.apellido_materno = user.ciudadano.apellido_materno || '';
                form.direccion = user.ciudadano.direccion || '';
            }
            if (user.institucion) {
                form.nombre_institucion = user.institucion.nombre_institucion || '';
                form.razon_social = user.institucion.razon_social || '';
                form.direccion = user.institucion.direccion || '';
            }
            setFormEditar(form);
        } catch {
            setError('Error al cargar el usuario');
        }
    };

    const handleCambiarEstado = async () => {
        if (!usuarioSeleccionado) return;
        setGuardando(true);
        try {
            const actualizado = await userService.cambiarEstadoUsuario(
                usuarioSeleccionado.id,
                !usuarioSeleccionado.is_active
            );
            setUsuarioSeleccionado(actualizado);
            setSuccessDetalle(`Cuenta ${actualizado.is_active ? 'activada' : 'desactivada'} correctamente`);
            cargarUsuarios();
        } catch {
            setErrorDetalle('Error al cambiar el estado');
        } finally {
            setGuardando(false);
        }
    };

    const handleCambiarRol = async () => {
        if (!usuarioSeleccionado || nuevoRol === usuarioSeleccionado.rol) return;
        setGuardando(true);
        try {
            const actualizado = await userService.cambiarRolUsuario(usuarioSeleccionado.id, nuevoRol);
            setUsuarioSeleccionado(actualizado);
            setSuccessDetalle('Rol actualizado correctamente');
            cargarUsuarios();
        } catch {
            setErrorDetalle('Error al cambiar el rol');
        } finally {
            setGuardando(false);
        }
    };

    const handleGuardarEdicion = async () => {
        if (!usuarioSeleccionado) return;
        setGuardando(true);
        try {
            const actualizado = await userService.editarDatosUsuario(usuarioSeleccionado.id, formEditar);
            setUsuarioSeleccionado(actualizado);
            setModoEdicion(false);
            setSuccessDetalle('Datos actualizados correctamente');
            cargarUsuarios();
        } catch (err: any) {
            setErrorDetalle(err.response?.data?.message || 'Error al guardar los cambios');
        } finally {
            setGuardando(false);
        }
    };

    const handleCrearUsuario = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorModal('');

        const camposComunes = ['email', 'password', 'telefono', 'region', 'comuna', 'direccion'];
        const camposCiudadano = ['primer_nombre', 'apellido_paterno', 'run'];
        const camposInstitucion = ['nombre_institucion', 'razon_social', 'rut'];
        const campos = [...camposComunes, ...(tipoCrear === 'ciudadano' ? camposCiudadano : camposInstitucion)];

        const newTouched: Record<string, boolean> = {};
        const newErrors: Record<string, string> = {};
        campos.forEach(field => {
            newTouched[field] = true;
            const val = field === 'run' || field === 'rut' ? parseRut(formCrear[field as keyof typeof formCrear]) : formCrear[field as keyof typeof formCrear];
            const err = validateField(field, val);
            if (err) newErrors[field] = err;
        });
        setTouchedCrear(prev => ({ ...prev, ...newTouched }));
        setFieldErrorsCrear(prev => ({ ...prev, ...newErrors }));
        if (Object.keys(newErrors).length > 0) return;

        setCreandoUsuario(true);
        try {
            const fd = new FormData();
            fd.append('email', formCrear.email);
            fd.append('password', formCrear.password);
            fd.append('telefono', formCrear.telefono);
            fd.append('region', formCrear.region);
            fd.append('comuna', formCrear.comuna);
            if (archivoCrear) fd.append('foto_perfil', archivoCrear);

            if (tipoCrear === 'ciudadano') {
                fd.append('primer_nombre', formCrear.primer_nombre);
                fd.append('apellido_paterno', formCrear.apellido_paterno);
                if (formCrear.segundo_nombre) fd.append('segundo_nombre', formCrear.segundo_nombre);
                if (formCrear.apellido_materno) fd.append('apellido_materno', formCrear.apellido_materno);
                fd.append('run', parseRut(formCrear.run));
                fd.append('direccion', formCrear.direccion);
                await userService.registrarCiudadano(fd);
            } else {
                fd.append('nombre_institucion', formCrear.nombre_institucion);
                fd.append('razon_social', formCrear.razon_social);
                fd.append('rut', parseRut(formCrear.rut));
                fd.append('tipo_institucion', formCrear.tipo_institucion);
                fd.append('direccion', formCrear.direccion);
                await userService.registrarInstitucion(fd);
            }

            setMostrarModal(false);
            setFormCrear(formCrearInicial);
            setArchivoCrear(null);
            setSuccess('Usuario creado correctamente');
            cargarUsuarios();
        } catch (err: any) {
            setErrorModal(err.response?.data?.message || err.message || 'Error al crear el usuario');
        } finally {
            setCreandoUsuario(false);
        }
    };

    const nombreMostrar = (user: User) =>
        user.ciudadano
            ? `${user.ciudadano.primer_nombre} ${user.ciudadano.apellido_paterno}`
            : user.institucion?.nombre_institucion || 'Sin nombre';

    // ── DETAIL VIEW ──────────────────────────────────────────────────────────
    if (usuarioSeleccionado) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 py-8 px-4">
                    <div className="max-w-2xl mx-auto space-y-4">

                        <BotonVolver onClick={() => setUsuarioSeleccionado(null)} texto="← Volver a usuarios" />

                        {errorDetalle && <Alert variant="error">{errorDetalle}</Alert>}
                        {successDetalle && <Alert variant="success">{successDetalle}</Alert>}

                        {/* Datos completos */}
                        <Card className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                {usuarioSeleccionado.foto_perfil ? (
                                    <img src={usuarioSeleccionado.foto_perfil} alt="Foto" className="w-16 h-16 rounded-full object-cover border-2 border-gray-100" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                                        {usuarioSeleccionado.tipo === 'institucion' ? '🏥' : '👤'}
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-lg font-bold text-gray-800">{nombreMostrar(usuarioSeleccionado)}</h1>
                                    <p className="text-sm text-gray-500">{usuarioSeleccionado.email}</p>
                                    <div className="flex gap-2 mt-1">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rolColor[usuarioSeleccionado.rol]}`}>
                                            {rolLabel[usuarioSeleccionado.rol]}
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${usuarioSeleccionado.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {usuarioSeleccionado.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm border-t pt-4">
                                <div><p className="text-xs text-gray-400">Email</p><p className="font-medium break-all">{usuarioSeleccionado.email}</p></div>
                                <div><p className="text-xs text-gray-400">Teléfono</p><p className="font-medium">{usuarioSeleccionado.telefono || '-'}</p></div>
                                <div><p className="text-xs text-gray-400">Región</p><p className="font-medium">{usuarioSeleccionado.region || '-'}</p></div>
                                <div><p className="text-xs text-gray-400">Comuna</p><p className="font-medium">{usuarioSeleccionado.comuna || '-'}</p></div>
                                <div className="col-span-2"><p className="text-xs text-gray-400">Dirección</p><p className="font-medium">{usuarioSeleccionado.ciudadano?.direccion || usuarioSeleccionado.institucion?.direccion || '-'}</p></div>
                                <div><p className="text-xs text-gray-400">Tipo</p><p className="font-medium capitalize">{usuarioSeleccionado.tipo}</p></div>
                                <div><p className="text-xs text-gray-400">Rol</p><p className="font-medium">{rolLabel[usuarioSeleccionado.rol]}</p></div>
                                <div><p className="text-xs text-gray-400">Estado</p><p className="font-medium">{usuarioSeleccionado.is_active ? 'Activo' : 'Inactivo'}</p></div>
                                <div><p className="text-xs text-gray-400">Creado</p><p className="font-medium">{formatFecha(usuarioSeleccionado.created_at)}</p></div>
                                {usuarioSeleccionado.ciudadano && (
                                    <>
                                        <div className="col-span-2 border-t pt-3 mt-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos del ciudadano</p>
                                        </div>
                                        <div><p className="text-xs text-gray-400">Primer nombre</p><p className="font-medium">{usuarioSeleccionado.ciudadano.primer_nombre}</p></div>
                                        <div><p className="text-xs text-gray-400">Segundo nombre</p><p className="font-medium">{usuarioSeleccionado.ciudadano.segundo_nombre || '-'}</p></div>
                                        <div><p className="text-xs text-gray-400">Apellido paterno</p><p className="font-medium">{usuarioSeleccionado.ciudadano.apellido_paterno}</p></div>
                                        <div><p className="text-xs text-gray-400">Apellido materno</p><p className="font-medium">{usuarioSeleccionado.ciudadano.apellido_materno || '-'}</p></div>
                                        <div><p className="text-xs text-gray-400">RUN</p><p className="font-medium">{usuarioSeleccionado.ciudadano.run}</p></div>
                                    </>
                                )}

                                {usuarioSeleccionado.institucion && (
                                    <>
                                        <div className="col-span-2 border-t pt-3 mt-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos de la institución</p>
                                        </div>
                                        <div><p className="text-xs text-gray-400">Nombre institución</p><p className="font-medium">{usuarioSeleccionado.institucion.nombre_institucion}</p></div>
                                        <div><p className="text-xs text-gray-400">Razón social</p><p className="font-medium">{usuarioSeleccionado.institucion.razon_social}</p></div>
                                        <div><p className="text-xs text-gray-400">RUT</p><p className="font-medium">{usuarioSeleccionado.institucion.rut}</p></div>
                                        <div><p className="text-xs text-gray-400">Tipo institución</p><p className="font-medium capitalize">{usuarioSeleccionado.institucion.tipo_institucion}</p></div>
                                    </>
                                )}
                            </div>
                        </Card>

                        {/* Editar datos */}
                        {(isSuperadmin || usuarioSeleccionado.rol !== 'superadmin') && (
                            <Card className="p-6">
                                <div className="flex justify-between items-center mb-4 border-b pb-2">
                                    <h2 className="font-semibold text-gray-700">Editar datos</h2>
                                    {!modoEdicion && (
                                        <Button variant="secondary" onClick={() => setModoEdicion(true)} className="text-xs py-1 px-3">
                                            Editar
                                        </Button>
                                    )}
                                </div>

                                {modoEdicion ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2">
                                                <Input
                                                    label="Teléfono"
                                                    value={formEditar.telefono}
                                                    onChange={e => setFormEditar(prev => ({ ...prev, telefono: e.target.value }))}
                                                />
                                            </div>
                                            <Select
                                                label="Región"
                                                value={formEditar.region}
                                                onChange={e => setFormEditar(prev => ({ ...prev, region: e.target.value, comuna: '' }))}
                                            >
                                                <option value="">Selecciona región</option>
                                                {regiones.map(r => (
                                                    <option key={r.codigo} value={r.codigo}>{r.nombre}</option>
                                                ))}
                                            </Select>
                                            <Select
                                                label="Comuna"
                                                value={formEditar.comuna}
                                                onChange={e => setFormEditar(prev => ({ ...prev, comuna: e.target.value }))}
                                                disabled={comunasEditar.length === 0}
                                            >
                                                <option value="">Selecciona comuna</option>
                                                {comunasEditar.map(c => (
                                                    <option key={c.codigo} value={c.nombre}>{c.nombre}</option>
                                                ))}
                                            </Select>
                                            <div className="col-span-2">
                                                <Input label="Dirección" value={formEditar.direccion} onChange={e => setFormEditar(prev => ({ ...prev, direccion: e.target.value }))} required />
                                            </div>
                                        </div>

                                        {usuarioSeleccionado.ciudadano && (
                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                                                <Input label="Primer nombre" value={formEditar.primer_nombre} onChange={e => setFormEditar(prev => ({ ...prev, primer_nombre: e.target.value }))} />
                                                <Input label="Segundo nombre" value={formEditar.segundo_nombre} onChange={e => setFormEditar(prev => ({ ...prev, segundo_nombre: e.target.value }))} />
                                                <Input label="Apellido paterno" value={formEditar.apellido_paterno} onChange={e => setFormEditar(prev => ({ ...prev, apellido_paterno: e.target.value }))} />
                                                <Input label="Apellido materno" value={formEditar.apellido_materno} onChange={e => setFormEditar(prev => ({ ...prev, apellido_materno: e.target.value }))} />
                                            </div>
                                        )}

                                        {usuarioSeleccionado.institucion && (
                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                                                <Input label="Nombre institución" value={formEditar.nombre_institucion} onChange={e => setFormEditar(prev => ({ ...prev, nombre_institucion: e.target.value }))} />
                                                <Input label="Razón social" value={formEditar.razon_social} onChange={e => setFormEditar(prev => ({ ...prev, razon_social: e.target.value }))} />
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-2">
                                            <Button onClick={handleGuardarEdicion} disabled={guardando}>
                                                {guardando ? 'Guardando...' : 'Guardar cambios'}
                                            </Button>
                                            <Button variant="secondary" onClick={() => setModoEdicion(false)} disabled={guardando}>
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">Haz clic en "Editar" para modificar los datos del usuario.</p>
                                )}
                            </Card>
                        )}

                        {/* Acciones administrativas */}
                        {(isSuperadmin || usuarioSeleccionado.rol !== 'superadmin') && (
                            <Card className="p-6">
                                <h2 className="font-semibold text-gray-700 mb-4 border-b pb-2">Acciones administrativas</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar rol</label>
                                        <div className="flex gap-2">
                                            <Select
                                                value={nuevoRol}
                                                onChange={(e) => setNuevoRol(e.target.value)}
                                                className="flex-1"
                                            >
                                                <option value="ciudadano">Ciudadano</option>
                                                <option value="veterinaria">Veterinaria</option>
                                                <option value="municipalidad">Municipalidad</option>
                                                <option value="moderador">Moderador</option>
                                                <option value="administrador">Administrador</option>
                                            </Select>
                                            <Button
                                                onClick={handleCambiarRol}
                                                disabled={guardando || nuevoRol === usuarioSeleccionado.rol}
                                            >
                                                Guardar
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado de la cuenta</label>
                                        <Button
                                            onClick={handleCambiarEstado}
                                            disabled={guardando}
                                            fullWidth
                                            variant="ghost"
                                            className={usuarioSeleccionado.is_active
                                                ? 'text-red-600 border border-red-200 hover:bg-red-100'
                                                : 'text-green-600 border border-green-200 hover:bg-green-100'
                                            }
                                        >
                                            {usuarioSeleccionado.is_active ? 'Desactivar cuenta' : 'Activar cuenta'}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}

                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // ── LIST VIEW ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex-1 py-8 px-4">
                <div className="max-w-3xl mx-auto">

                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <BotonVolver ruta="/admin" texto="← Panel de control" />
                            <h1 className="text-xl font-bold text-gray-800">Gestión de Usuarios</h1>
                        </div>
                        <Button onClick={abrirModal}>
                            + Crear usuario
                        </Button>
                    </div>

                    {error && <Alert variant="error" className="mb-4">{error}</Alert>}
                    {success && <Alert variant="success" className="mb-4">{success}</Alert>}

                    <Card className="p-4 mb-4 space-y-3">
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Filtrar por rol</p>
                            <div className="flex gap-2 flex-wrap">
                                {['', 'ciudadano', 'veterinaria', 'municipalidad', 'moderador', 'administrador', 'superadmin'].map((rol) => (
                                    <button
                                        key={rol}
                                        onClick={() => setFiltroRol(rol)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${filtroRol === rol ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {rol === '' ? 'Todos' : rolLabel[rol]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Filtrar por estado</p>
                            <div className="flex gap-2">
                                {[['', 'Todos'], ['activo', 'Activos'], ['inactivo', 'Inactivos']].map(([val, label]) => (
                                    <button
                                        key={val}
                                        onClick={() => setFiltroEstado(val)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${filtroEstado === val ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {loading ? (
                        <div className="text-center py-12 text-gray-400">Cargando usuarios...</div>
                    ) : usuarios.length === 0 ? (
                        <Card className="p-12 text-center">
                            <div className="text-4xl mb-3">👥</div>
                            <h2 className="font-semibold text-gray-700">No hay usuarios</h2>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {usuarios.filter(u => isSuperadmin || u.rol !== 'superadmin').map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleVerUsuario(user.id)}
                                    className="w-full bg-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition"
                                >
                                    <div className="flex items-center gap-3">
                                        {user.foto_perfil ? (
                                            <img src={user.foto_perfil} alt="Foto" className="w-10 h-10 rounded-full object-cover border border-gray-100 flex-shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-lg flex-shrink-0">
                                                {user.tipo === 'institucion' ? '🏥' : '👤'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="font-semibold text-gray-800 text-sm">{nombreMostrar(user)}</p>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rolColor[user.rol]}`}>
                                                        {rolLabel[user.rol]}
                                                    </span>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {user.is_active ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                            <div className="flex gap-4 mt-1">
                                                {user.telefono && <p className="text-xs text-gray-500">{user.telefono}</p>}
                                                {(user.region || user.comuna) && (
                                                    <p className="text-xs text-gray-500">{[user.region, user.comuna].filter(Boolean).join(' · ')}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />

            {/* ── MODAL CREAR USUARIO ──────────────────────────────────────── */}
            {mostrarModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-800">Crear usuario</h2>
                                <button
                                    onClick={() => setMostrarModal(false)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Selector tipo */}
                            <div className="flex gap-2 mb-4">
                                {(['ciudadano', 'institucion'] as const).map(tipo => (
                                    <button
                                        key={tipo}
                                        type="button"
                                        onClick={() => setTipoCrear(tipo)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition border ${tipoCrear === tipo ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        {tipo === 'ciudadano' ? '👤 Ciudadano' : '🏥 Institución'}
                                    </button>
                                ))}
                            </div>

                            {errorModal && <Alert variant="error" className="mb-4">{errorModal}</Alert>}

                            <form onSubmit={handleCrearUsuario} className="space-y-3">
                                {/* Campos comunes */}
                                <Input label="Email *" type="email" value={formCrear.email}
                                    onChange={e => changeCrear('email', e.target.value)}
                                    onBlur={e => blurCrear('email', e.target.value)}
                                    error={errCrear('email')} />
                                <Input label="Contraseña *" type="password" value={formCrear.password}
                                    onChange={e => changeCrear('password', e.target.value)}
                                    onBlur={e => blurCrear('password', e.target.value)}
                                    error={errCrear('password')} />
                                <Input label="Teléfono *" value={formCrear.telefono}
                                    onChange={e => changeCrear('telefono', e.target.value)}
                                    onBlur={e => blurCrear('telefono', e.target.value)}
                                    error={errCrear('telefono')} />

                                <div className="grid grid-cols-2 gap-3">
                                    <Select
                                        label="Región *"
                                        value={formCrear.region}
                                        onChange={e => { changeCrear('region', e.target.value); setFormCrear(prev => ({ ...prev, comuna: '' })); }}
                                        onBlur={e => blurCrear('region', e.target.value)}
                                        error={errCrear('region')}
                                        required
                                    >
                                        <option value="">Selecciona</option>
                                        {regiones.map(r => <option key={r.codigo} value={r.codigo}>{r.nombre}</option>)}
                                    </Select>
                                    <Select
                                        label="Comuna *"
                                        value={formCrear.comuna}
                                        onChange={e => changeCrear('comuna', e.target.value)}
                                        onBlur={e => blurCrear('comuna', e.target.value)}
                                        error={errCrear('comuna')}
                                        disabled={!formCrear.region || comunasCrear.length === 0}
                                        required
                                    >
                                        <option value="">Selecciona</option>
                                        {comunasCrear.map(c => <option key={c.codigo} value={c.nombre}>{c.nombre}</option>)}
                                    </Select>
                                </div>
                                <Input label="Dirección *" value={formCrear.direccion}
                                    onChange={e => changeCrear('direccion', e.target.value)}
                                    onBlur={e => blurCrear('direccion', e.target.value)}
                                    error={errCrear('direccion')} />

                                {/* Campos ciudadano */}
                                {tipoCrear === 'ciudadano' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input label="Primer nombre *" value={formCrear.primer_nombre}
                                                onChange={e => changeCrear('primer_nombre', e.target.value)}
                                                onBlur={e => blurCrear('primer_nombre', e.target.value)}
                                                error={errCrear('primer_nombre')} />
                                            <Input label="Segundo nombre" value={formCrear.segundo_nombre}
                                                onChange={e => changeCrear('segundo_nombre', e.target.value)}
                                                onBlur={e => blurCrear('segundo_nombre', e.target.value)}
                                                error={errCrear('segundo_nombre')} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input label="Apellido paterno *" value={formCrear.apellido_paterno}
                                                onChange={e => changeCrear('apellido_paterno', e.target.value)}
                                                onBlur={e => blurCrear('apellido_paterno', e.target.value)}
                                                error={errCrear('apellido_paterno')} />
                                            <Input label="Apellido materno" value={formCrear.apellido_materno}
                                                onChange={e => changeCrear('apellido_materno', e.target.value)}
                                                onBlur={e => blurCrear('apellido_materno', e.target.value)}
                                                error={errCrear('apellido_materno')} />
                                        </div>
                                        <Input label="RUN *" placeholder="12.345.678-9" value={formCrear.run}
                                            onChange={e => changeRutCrear('run', e.target.value)}
                                            onBlur={e => blurCrear('run', parseRut(e.target.value))}
                                            error={errCrear('run')} />
                                    </>
                                )}

                                {/* Campos institución */}
                                {tipoCrear === 'institucion' && (
                                    <>
                                        <Input label="Nombre institución *" value={formCrear.nombre_institucion}
                                            onChange={e => changeCrear('nombre_institucion', e.target.value)}
                                            onBlur={e => blurCrear('nombre_institucion', e.target.value)}
                                            error={errCrear('nombre_institucion')} />
                                        <Input label="Razón social *" value={formCrear.razon_social}
                                            onChange={e => changeCrear('razon_social', e.target.value)}
                                            onBlur={e => blurCrear('razon_social', e.target.value)}
                                            error={errCrear('razon_social')} />
                                        <Input label="RUT *" placeholder="76.354.771-K" value={formCrear.rut}
                                            onChange={e => changeRutCrear('rut', e.target.value)}
                                            onBlur={e => blurCrear('rut', parseRut(e.target.value))}
                                            error={errCrear('rut')} />
                                        <Select
                                            label="Tipo institución *"
                                            value={formCrear.tipo_institucion}
                                            onChange={e => setFormCrear(prev => ({ ...prev, tipo_institucion: e.target.value }))}
                                            required
                                        >
                                            <option value="veterinaria">Veterinaria</option>
                                            <option value="municipalidad">Municipalidad</option>
                                        </Select>
                                    </>
                                )}

                                {/* Foto de perfil */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Foto de perfil</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setArchivoCrear(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button type="submit" disabled={creandoUsuario} fullWidth>
                                        {creandoUsuario ? 'Creando...' : 'Crear usuario'}
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => setMostrarModal(false)} disabled={creandoUsuario}>
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsuariosPage;
