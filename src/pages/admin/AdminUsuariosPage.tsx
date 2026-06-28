import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, ChevronRight, ChevronLeft, Loader2, Filter,
  User, Building2, Edit2, X, Check, Search,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { regionService } from '../../services/regionService';
import { useAuth } from '../../hooks/useAuth';
import type { User as UserType } from '../../types';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Alert from '../../components/ui/Alert';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { formatRut, parseRut } from '../../utils/rutFormatter';
import { validateField, sanitizeNombre, formatDireccion } from '../../utils/validators';

type RegionItem = { codigo: string; nombre: string };
type ComunaItem = { codigo: string; nombre: string };

/* ── helpers ─────────────────────────────────────────────────────────── */
const rolColor: Record<string, string> = {
    ciudadano:     'bg-blue-100 text-blue-700 border border-blue-200',
    veterinaria:   'bg-emerald-100 text-emerald-700 border border-emerald-200',
    municipalidad: 'bg-purple-100 text-purple-700 border border-purple-200',
    moderador:     'bg-amber-100 text-amber-700 border border-amber-200',
    administrador: 'bg-orange-100 text-orange-700 border border-orange-200',
    superadmin:    'bg-rose-100 text-rose-700 border border-rose-200',
};
const rolLabel: Record<string, string> = {
    ciudadano: 'Ciudadano', veterinaria: 'Veterinaria', municipalidad: 'Municipalidad',
    moderador: 'Moderador', administrador: 'Administrador', superadmin: 'Super Admin',
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

const PAGE_SIZE = 12;

const Paginacion = ({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) => {
    if (totalPages <= 1) return null;
    const pages: (number | '…')[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (page > 3) pages.push('…');
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
        if (page < totalPages - 2) pages.push('…');
        pages.push(totalPages);
    }
    const btn = 'w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors';
    return (
        <div className="flex items-center justify-center gap-1.5 mt-8">
            <button onClick={() => onChange(page - 1)} disabled={page === 1}
                className={`${btn} border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed`}>
                <ChevronLeft className="w-4 h-4" />
            </button>
            {pages.map((p, i) =>
                p === '…'
                    ? <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                    : <button key={p} onClick={() => onChange(p as number)}
                        className={`${btn} ${page === p ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                        {p}
                      </button>
            )}
            <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
                className={`${btn} border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed`}>
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
};

const AvatarIcon = ({ tipo, size = 'md' }: { tipo?: string; size?: 'sm' | 'md' | 'lg' }) => {
    const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' };
    const cls = `${sizes[size]} text-slate-400`;
    return tipo === 'institucion'
        ? <Building2 className={cls} strokeWidth={1.5} />
        : <User className={cls} strokeWidth={1.5} />;
};

/* ── Componente principal ─────────────────────────────────────────────── */
const AdminUsuariosPage = () => {
    const { user: authUser } = useAuth();
    const isSuperadmin = authUser?.rol === 'superadmin';

    const [regiones, setRegiones] = useState<RegionItem[]>([]);

    // List
    const [usuarios, setUsuarios]     = useState<UserType[]>([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [success, setSuccess]       = useState('');
    const [filtroRol, setFiltroRol]   = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [page, setPage]             = useState(1);
    const [busqueda, setBusqueda]     = useState('');

    // Create modal
    const [mostrarModal, setMostrarModal]       = useState(false);
    const [tipoCrear, setTipoCrear]             = useState<'ciudadano' | 'institucion'>('ciudadano');
    const [formCrear, setFormCrear]             = useState(formCrearInicial);
    const [archivoCrear, setArchivoCrear]       = useState<File | null>(null);
    const [comunasCrear, setComunasCrear]       = useState<ComunaItem[]>([]);
    const [creandoUsuario, setCreandoUsuario]   = useState(false);
    const [errorModal, setErrorModal]           = useState('');
    const [touchedCrear, setTouchedCrear]       = useState<Record<string, boolean>>({});
    const [fieldErrorsCrear, setFieldErrorsCrear] = useState<Record<string, string>>({});

    // Detail
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UserType | null>(null);
    const [nuevoRol, setNuevoRol]         = useState('');
    const [guardando, setGuardando]       = useState(false);
    const [errorDetalle, setErrorDetalle] = useState('');
    const [successDetalle, setSuccessDetalle] = useState('');

    // Edit
    const [modoEdicion, setModoEdicion]   = useState(false);
    const [formEditar, setFormEditar]     = useState<Record<string, string>>({});
    const [comunasEditar, setComunasEditar] = useState<ComunaItem[]>([]);

    useEffect(() => { regionService.getRegiones().then(setRegiones).catch(() => {}); }, []);
    useEffect(() => { setPage(1); cargarUsuarios(); }, [filtroRol, filtroEstado]);
    useEffect(() => {
        if (formCrear.region) regionService.getComunas(formCrear.region).then(setComunasCrear).catch(() => setComunasCrear([]));
        else setComunasCrear([]);
    }, [formCrear.region]);
    useEffect(() => {
        if (formEditar.region) regionService.getComunas(formEditar.region).then(setComunasEditar).catch(() => {});
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
        setMostrarModal(true); setErrorModal('');
        setFormCrear(formCrearInicial); setArchivoCrear(null);
        setTouchedCrear({}); setFieldErrorsCrear({});
    };

    const cargarUsuarios = async () => {
        setLoading(true);
        try {
            const filtros: { rol?: string; is_active?: boolean } = {};
            if (filtroRol) filtros.rol = filtroRol;
            if (filtroEstado !== '') filtros.is_active = filtroEstado === 'activo';
            setUsuarios(await userService.listarUsuarios(filtros));
        } catch { setError('Error al cargar los usuarios'); }
        finally { setLoading(false); }
    };

    const handleVerUsuario = async (id: string) => {
        try {
            const user = await userService.verUsuario(id);
            setUsuarioSeleccionado(user); setNuevoRol(user.rol);
            setModoEdicion(false); setErrorDetalle(''); setSuccessDetalle('');
            const form: Record<string, string> = {
                telefono: (user.telefono || '').replace(/^\+569/, ''), region: user.region || '', comuna: user.comuna || '',
            };
            if (user.ciudadano) {
                form.primer_nombre    = user.ciudadano.primer_nombre    || '';
                form.segundo_nombre   = user.ciudadano.segundo_nombre   || '';
                form.apellido_paterno = user.ciudadano.apellido_paterno || '';
                form.apellido_materno = user.ciudadano.apellido_materno || '';
                form.direccion        = user.ciudadano.direccion        || '';
            }
            if (user.institucion) {
                form.nombre_institucion = user.institucion.nombre_institucion || '';
                form.razon_social       = user.institucion.razon_social       || '';
                form.direccion          = user.institucion.direccion          || '';
            }
            setFormEditar(form);
        } catch { setError('Error al cargar el usuario'); }
    };

    const handleCambiarEstado = async () => {
        if (!usuarioSeleccionado) return;
        setGuardando(true);
        try {
            const actualizado = await userService.cambiarEstadoUsuario(usuarioSeleccionado.id, !usuarioSeleccionado.is_active);
            setUsuarioSeleccionado(actualizado);
            setSuccessDetalle(`Cuenta ${actualizado.is_active ? 'activada' : 'desactivada'} correctamente`);
            cargarUsuarios();
        } catch { setErrorDetalle('Error al cambiar el estado'); }
        finally { setGuardando(false); }
    };

    const handleCambiarRol = async () => {
        if (!usuarioSeleccionado || nuevoRol === usuarioSeleccionado.rol) return;
        setGuardando(true);
        try {
            const actualizado = await userService.cambiarRolUsuario(usuarioSeleccionado.id, nuevoRol);
            setUsuarioSeleccionado(actualizado);
            setSuccessDetalle('Rol actualizado correctamente');
            cargarUsuarios();
        } catch { setErrorDetalle('Error al cambiar el rol'); }
        finally { setGuardando(false); }
    };

    const handleGuardarEdicion = async () => {
        if (!usuarioSeleccionado) return;
        const u = usuarioSeleccionado;
        const camposNombre: [string, string][] = [];
        if (u.ciudadano) camposNombre.push(
            ['primer_nombre', formEditar.primer_nombre ?? ''],
            ['segundo_nombre', formEditar.segundo_nombre ?? ''],
            ['apellido_paterno', formEditar.apellido_paterno ?? ''],
            ['apellido_materno', formEditar.apellido_materno ?? ''],
        );
        if (u.institucion) camposNombre.push(
            ['nombre_institucion', formEditar.nombre_institucion ?? ''],
            ['razon_social', formEditar.razon_social ?? ''],
        );
        for (const [field, value] of camposNombre) {
            const err = validateField(field, value);
            if (err) { setErrorDetalle(err); return; }
        }
        setGuardando(true);
        try {
            const actualizado = await userService.editarDatosUsuario(usuarioSeleccionado.id, {
                ...formEditar,
                telefono: formEditar.telefono ? '+569' + formEditar.telefono : formEditar.telefono,
            });
            setUsuarioSeleccionado(actualizado); setModoEdicion(false);
            setSuccessDetalle('Datos actualizados correctamente'); cargarUsuarios();
        } catch (err: any) {
            setErrorDetalle(err.response?.data?.message || 'Error al guardar los cambios');
        } finally { setGuardando(false); }
    };

    const handleCrearUsuario = async (e: React.FormEvent) => {
        e.preventDefault(); setErrorModal('');
        const camposComunes   = ['email', 'password', 'telefono', 'region', 'comuna', 'direccion'];
        const camposCiudadano = ['primer_nombre', 'apellido_paterno', 'run'];
        const camposInstitucion = ['nombre_institucion', 'razon_social', 'rut'];
        const campos = [...camposComunes, ...(tipoCrear === 'ciudadano' ? camposCiudadano : camposInstitucion)];
        const newTouched: Record<string, boolean>  = {};
        const newErrors: Record<string, string>    = {};
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
            fd.append('email', formCrear.email); fd.append('password', formCrear.password);
            fd.append('telefono', '+569' + formCrear.telefono); fd.append('region', formCrear.region);
            fd.append('comuna', formCrear.comuna);
            if (archivoCrear) fd.append('foto_perfil', archivoCrear);
            if (tipoCrear === 'ciudadano') {
                fd.append('primer_nombre', formCrear.primer_nombre);
                fd.append('apellido_paterno', formCrear.apellido_paterno);
                if (formCrear.segundo_nombre)   fd.append('segundo_nombre', formCrear.segundo_nombre);
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
            setMostrarModal(false); setFormCrear(formCrearInicial); setArchivoCrear(null);
            setSuccess('Usuario creado correctamente'); cargarUsuarios();
        } catch (err: any) {
            setErrorModal(err.response?.data?.message || err.message || 'Error al crear el usuario');
        } finally { setCreandoUsuario(false); }
    };

    const nombreMostrar = (user: UserType) =>
        user.ciudadano
            ? `${user.ciudadano.primer_nombre} ${user.ciudadano.apellido_paterno}`
            : user.institucion?.nombre_institucion || 'Sin nombre';

    /* ── DETAIL VIEW ───────────────────────────────────────────────────── */
    if (usuarioSeleccionado) {
        const u = usuarioSeleccionado;
        return (
            <div className="min-h-screen flex flex-col admin-glass">
                <Navbar />

                {/* Header */}
                <div className="bg-white border-b border-slate-100">
                    <div className="px-6 lg:px-8 py-5">
                        <BotonVolver onClick={() => setUsuarioSeleccionado(null)} texto="Volver a usuarios" />
                        <div className="flex items-center gap-4 mt-4">
                            {u.foto_perfil ? (
                                <img src={u.foto_perfil} alt="Foto" className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 flex-shrink-0" />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <AvatarIcon tipo={u.tipo} size="lg" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-xl font-display font-bold text-slate-900">{nombreMostrar(u)}</h1>
                                <p className="text-sm text-slate-500">{u.email}</p>
                                <div className="flex gap-2 mt-1.5">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rolColor[u.rol]}`}>
                                        {rolLabel[u.rol]}
                                    </span>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                                        {u.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 py-6 px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">

                        <AnimatePresence>
                            {errorDetalle   && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Alert variant="error">{errorDetalle}</Alert></motion.div>}
                            {successDetalle && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Alert variant="success">{successDetalle}</Alert></motion.div>}
                        </AnimatePresence>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start mt-4">
                        <div className="space-y-4">
                        {/* Datos completos */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Datos generales</p>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                {[
                                    ['Email',    u.email],
                                    ['Teléfono', u.telefono || '-'],
                                    ['Región',   u.region   || '-'],
                                    ['Comuna',   u.comuna   || '-'],
                                    ['Tipo',     u.tipo],
                                    ['Creado',   formatFecha(u.created_at)],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                                        <p className="font-medium text-slate-800 break-all">{value}</p>
                                    </div>
                                ))}
                                <div className="col-span-2">
                                    <p className="text-xs text-slate-400 mb-0.5">Dirección</p>
                                    <p className="font-medium text-slate-800">{u.ciudadano?.direccion || u.institucion?.direccion || '-'}</p>
                                </div>
                            </div>

                            {u.ciudadano && (
                                <>
                                    <div className="border-t border-slate-100 mt-4 pt-4">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Datos del ciudadano</p>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                            {[
                                                ['Primer nombre',    u.ciudadano.primer_nombre],
                                                ['Segundo nombre',   u.ciudadano.segundo_nombre   || '-'],
                                                ['Primer apellido', u.ciudadano.apellido_paterno],
                                                ['Segundo apellido', u.ciudadano.apellido_materno || '-'],
                                                ['RUN',              u.ciudadano.run],
                                            ].map(([label, value]) => (
                                                <div key={label}>
                                                    <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                                                    <p className="font-medium text-slate-800">{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {u.institucion && (
                                <>
                                    <div className="border-t border-slate-100 mt-4 pt-4">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Datos de la institución</p>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                            {[
                                                ['Nombre institución', u.institucion.nombre_institucion],
                                                ['Razón social',       u.institucion.razon_social],
                                                ['RUT',                u.institucion.rut],
                                                ['Tipo institución',   u.institucion.tipo_institucion],
                                            ].map(([label, value]) => (
                                                <div key={label}>
                                                    <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                                                    <p className="font-medium text-slate-800 capitalize">{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Editar datos */}
                        {(isSuperadmin || u.rol !== 'superadmin') && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Editar datos</p>
                                    {!modoEdicion && (
                                        <button
                                            onClick={() => setModoEdicion(true)}
                                            className="flex items-center gap-1.5 text-xs font-medium border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            Editar
                                        </button>
                                    )}
                                </div>

                                {modoEdicion ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-sm font-medium text-slate-700">Teléfono</label>
                                                    <div className="flex rounded-xl overflow-hidden border border-slate-200 hover:border-slate-300 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-400 transition-all duration-200">
                                                        <span className="flex items-center px-3 bg-slate-50 border-r border-slate-200 text-sm text-slate-500 font-medium select-none">+56 9</span>
                                                        <input
                                                            type="tel"
                                                            inputMode="numeric"
                                                            maxLength={8}
                                                            value={formEditar.telefono || ''}
                                                            placeholder="12345678"
                                                            onChange={e => {
                                                                const v = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                                setFormEditar(prev => ({ ...prev, telefono: v }));
                                                            }}
                                                            className="flex-1 px-3 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <Select label="Región" value={formEditar.region} onChange={e => setFormEditar(prev => ({ ...prev, region: e.target.value, comuna: '' }))}>
                                                <option value="">Selecciona región</option>
                                                {regiones.map(r => <option key={r.codigo} value={r.codigo}>{r.nombre}</option>)}
                                            </Select>
                                            <Select label="Comuna" value={formEditar.comuna} onChange={e => setFormEditar(prev => ({ ...prev, comuna: e.target.value }))} disabled={comunasEditar.length === 0}>
                                                <option value="">Selecciona comuna</option>
                                                {comunasEditar.map(c => <option key={c.codigo} value={c.nombre}>{c.nombre}</option>)}
                                            </Select>
                                            <div className="col-span-2">
                                                <Input label="Dirección" value={formEditar.direccion} onChange={e => setFormEditar(prev => ({ ...prev, direccion: formatDireccion(e.target.value) }))} placeholder="Ej: Lago Riñihue 132" required />
                                            </div>
                                        </div>

                                        {u.ciudadano && (
                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                                <Input label="Primer nombre"    value={formEditar.primer_nombre}    onChange={e => setFormEditar(prev => ({ ...prev, primer_nombre:    sanitizeNombre(e.target.value) }))} />
                                                <Input label="Segundo nombre"   value={formEditar.segundo_nombre}   onChange={e => setFormEditar(prev => ({ ...prev, segundo_nombre:   sanitizeNombre(e.target.value) }))} />
                                                <Input label="Primer apellido" value={formEditar.apellido_paterno} onChange={e => setFormEditar(prev => ({ ...prev, apellido_paterno: sanitizeNombre(e.target.value) }))} />
                                                <Input label="Segundo apellido" value={formEditar.apellido_materno} onChange={e => setFormEditar(prev => ({ ...prev, apellido_materno: sanitizeNombre(e.target.value) }))} />
                                            </div>
                                        )}
                                        {u.institucion && (
                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                                <Input label="Nombre institución" value={formEditar.nombre_institucion} onChange={e => setFormEditar(prev => ({ ...prev, nombre_institucion: sanitizeNombre(e.target.value) }))} />
                                                <Input label="Razón social"        value={formEditar.razon_social}       onChange={e => setFormEditar(prev => ({ ...prev, razon_social:       sanitizeNombre(e.target.value) }))} />
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={handleGuardarEdicion}
                                                disabled={guardando}
                                                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                                            >
                                                <Check className="w-4 h-4" />
                                                {guardando ? 'Guardando...' : 'Guardar cambios'}
                                            </button>
                                            <button
                                                onClick={() => setModoEdicion(false)}
                                                disabled={guardando}
                                                className="flex items-center gap-2 text-sm font-medium border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400">Haz clic en "Editar" para modificar los datos del usuario.</p>
                                )}
                            </div>
                        )}

                        </div>
                        <div>
                        {/* Acciones administrativas */}
                        {(isSuperadmin || u.rol !== 'superadmin') && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Acciones administrativas</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Cambiar rol</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={nuevoRol}
                                                onChange={(e) => setNuevoRol(e.target.value)}
                                                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all"
                                            >
                                                <option value="ciudadano">Ciudadano</option>
                                                <option value="veterinaria">Veterinaria</option>
                                                <option value="municipalidad">Municipalidad</option>
                                                <option value="moderador">Moderador</option>
                                                <option value="administrador">Administrador</option>
                                            </select>
                                            <button
                                                onClick={handleCambiarRol}
                                                disabled={guardando || nuevoRol === u.rol}
                                                className="px-4 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all disabled:opacity-40"
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado de la cuenta</label>
                                        <button
                                            onClick={handleCambiarEstado}
                                            disabled={guardando}
                                            className={`w-full text-sm font-medium py-2.5 rounded-xl border transition-all disabled:opacity-50 ${
                                                u.is_active
                                                    ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                                                    : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                                            }`}
                                        >
                                            {u.is_active ? 'Desactivar cuenta' : 'Activar cuenta'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    /* ── LIST VIEW ─────────────────────────────────────────────────────── */
    const usuariosFiltrados = usuarios.filter(u => {
        if (!isSuperadmin && u.rol === 'superadmin') return false;
        if (busqueda.trim()) {
            const q        = busqueda.toLowerCase().trim();
            const qStrip   = q.replace(/[\.\-\s]/g, '');   // sin puntos/guiones para RUN/RUT
            const qDigits  = q.replace(/\D/g, '');          // solo dígitos para teléfono

            const nombre = u.ciudadano
                ? `${u.ciudadano.primer_nombre} ${u.ciudadano.apellido_paterno}`
                : u.institucion?.nombre_institucion || '';

            const runRut = (u.ciudadano?.run || u.institucion?.rut || '')
                .replace(/[\.\-]/g, '').toLowerCase();

            const telefonoDigits = (u.telefono || '').replace(/\D/g, '');

            return (
                nombre.toLowerCase().includes(q)          ||
                u.email.toLowerCase().includes(q)         ||
                (qStrip.length >= 3 && runRut.includes(qStrip)) ||
                (qDigits.length >= 4 && telefonoDigits.includes(qDigits))
            );
        }
        return true;
    });
    const totalPages  = Math.ceil(usuariosFiltrados.length / PAGE_SIZE);
    const usuariosPag = usuariosFiltrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="min-h-screen flex flex-col admin-glass">
            <Navbar />

            {/* Header */}
            <div className="bg-white border-b border-slate-100">
                <div className="px-6 lg:px-8 py-6 flex items-start justify-between gap-4">
                    <div>
                        <BotonVolver ruta="/admin" texto="Panel de control" />
                        <div className="flex items-center gap-2.5 mt-3">
                            <Users className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                            <h1 className="text-xl font-display font-bold text-slate-900">Gestión de Usuarios</h1>
                        </div>
                        {!loading && (
                            <p className="text-slate-500 text-sm mt-0.5 ml-7">
                                {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? 's' : ''} encontrado{usuariosFiltrados.length !== 1 ? 's' : ''}
                                {usuariosFiltrados.length > PAGE_SIZE && ` · página ${page} de ${totalPages}`}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={abrirModal}
                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98] flex-shrink-0 mt-8"
                    >
                        <UserPlus className="w-4 h-4" />
                        Crear usuario
                    </button>
                </div>

                {/* Filtros */}
                <div className="px-6 lg:px-8 pb-4 space-y-3">
                    {/* Búsqueda */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email, RUN/RUT o teléfono..."
                            value={busqueda}
                            onChange={e => { setBusqueda(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                            <Filter className="w-4 h-4" />
                            <span className="text-xs font-medium">Rol:</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {['', 'ciudadano', 'veterinaria', 'municipalidad', 'moderador', 'administrador', 'superadmin'].map((rol) => (
                                <button
                                    key={rol}
                                    onClick={() => setFiltroRol(rol)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                        filtroRol === rol ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {rol === '' ? 'Todos' : rolLabel[rol]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <span className="text-xs font-medium text-slate-400 block mb-2">Estado:</span>
                        <div className="flex gap-2">
                            {[['', 'Todos'], ['activo', 'Activos'], ['inactivo', 'Inactivos']].map(([val, label]) => (
                                <button
                                    key={val}
                                    onClick={() => setFiltroEstado(val)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                        filtroEstado === val ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <main className="flex-1 py-6 px-6 lg:px-8">
                <div>

                    <AnimatePresence>
                        {error   && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4"><Alert variant="error">{error}</Alert></motion.div>}
                        {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4"><Alert variant="success">{success}</Alert></motion.div>}
                    </AnimatePresence>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                            <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
                            <p className="text-sm">Cargando usuarios...</p>
                        </div>
                    ) : usuariosFiltrados.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center"
                        >
                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Users className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
                            </div>
                            <h2 className="font-display font-bold text-slate-800 mb-1">No hay usuarios</h2>
                            <p className="text-sm text-slate-400">
                                {busqueda ? `Sin resultados para "${busqueda}"` : 'No se encontraron usuarios con esos filtros.'}
                            </p>
                        </motion.div>
                    ) : (
                        <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {usuariosPag.map((user, i) => (
                                <motion.button
                                    key={user.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => handleVerUsuario(user.id)}
                                    className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 p-4 text-left transition-all duration-200 group active:scale-[0.99]"
                                >
                                    <div className="flex items-center gap-3">
                                        {user.foto_perfil ? (
                                            <img src={user.foto_perfil} alt="Foto" className="w-10 h-10 rounded-full object-cover border border-slate-100 flex-shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                <AvatarIcon tipo={user.tipo} />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="font-semibold text-slate-900 text-sm">{nombreMostrar(user)}</p>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rolColor[user.rol]}`}>
                                                        {rolLabel[user.rol]}
                                                    </span>
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.is_active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                                                        {user.is_active ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                                            <div className="flex gap-4 mt-1">
                                                {user.telefono && <p className="text-xs text-slate-500">{user.telefono}</p>}
                                                {(user.region || user.comuna) && (
                                                    <p className="text-xs text-slate-500">{[user.region, user.comuna].filter(Boolean).join(' · ')}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                        <Paginacion page={page} totalPages={totalPages} onChange={setPage} />
                        </>
                    )}
                </div>
            </main>

            <Footer />

            {/* ── MODAL CREAR USUARIO ─────────────────────────────────────── */}
            <AnimatePresence>
                {mostrarModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-5">
                                    <h2 className="text-lg font-display font-bold text-slate-900">Crear usuario</h2>
                                    <button
                                        onClick={() => setMostrarModal(false)}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Selector tipo */}
                                <div className="flex gap-2 mb-5">
                                    {(['ciudadano', 'institucion'] as const).map(tipo => (
                                        <button
                                            key={tipo}
                                            type="button"
                                            onClick={() => setTipoCrear(tipo)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                                                tipoCrear === tipo
                                                    ? 'bg-slate-900 text-white border-slate-900'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {tipo === 'ciudadano' ? 'Ciudadano' : 'Institución'}
                                        </button>
                                    ))}
                                </div>

                                {errorModal && <Alert variant="error" className="mb-4">{errorModal}</Alert>}

                                <form onSubmit={handleCrearUsuario} className="space-y-3">
                                    <Input label="Email *" type="email" value={formCrear.email}
                                        onChange={e => changeCrear('email', e.target.value)}
                                        onBlur={e => blurCrear('email', e.target.value)}
                                        error={errCrear('email')} />
                                    <Input label="Contraseña *" type="password" value={formCrear.password}
                                        onChange={e => changeCrear('password', e.target.value)}
                                        onBlur={e => blurCrear('password', e.target.value)}
                                        error={errCrear('password')} />
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-slate-700">Teléfono *</label>
                                        <div className={`flex rounded-xl overflow-hidden border transition-all duration-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-400 ${errCrear('telefono') ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'}`}>
                                            <span className="flex items-center px-3 bg-slate-50 border-r border-slate-200 text-sm text-slate-500 font-medium select-none">+56 9</span>
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={8}
                                                value={formCrear.telefono}
                                                placeholder="12345678"
                                                onChange={e => {
                                                    const v = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                    changeCrear('telefono', v);
                                                }}
                                                onBlur={e => blurCrear('telefono', e.target.value)}
                                                className="flex-1 px-3 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none"
                                            />
                                        </div>
                                        {errCrear('telefono') && <p className="text-rose-500 text-xs">{errCrear('telefono')}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Select label="Región *" value={formCrear.region}
                                            onChange={e => { changeCrear('region', e.target.value); setFormCrear(prev => ({ ...prev, comuna: '' })); }}
                                            onBlur={e => blurCrear('region', e.target.value)}
                                            error={errCrear('region')} required>
                                            <option value="">Selecciona</option>
                                            {regiones.map(r => <option key={r.codigo} value={r.codigo}>{r.nombre}</option>)}
                                        </Select>
                                        <Select label="Comuna *" value={formCrear.comuna}
                                            onChange={e => changeCrear('comuna', e.target.value)}
                                            onBlur={e => blurCrear('comuna', e.target.value)}
                                            error={errCrear('comuna')}
                                            disabled={!formCrear.region || comunasCrear.length === 0} required>
                                            <option value="">Selecciona</option>
                                            {comunasCrear.map(c => <option key={c.codigo} value={c.nombre}>{c.nombre}</option>)}
                                        </Select>
                                    </div>
                                    <Input label="Dirección *" value={formCrear.direccion}
                                        onChange={e => changeCrear('direccion', formatDireccion(e.target.value))}
                                        onBlur={e => blurCrear('direccion', e.target.value)}
                                        placeholder="Ej: Lago Riñihue 132"
                                        error={errCrear('direccion')} />

                                    {tipoCrear === 'ciudadano' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input label="Primer nombre *" value={formCrear.primer_nombre}
                                                    onChange={e => changeCrear('primer_nombre', sanitizeNombre(e.target.value))}
                                                    onBlur={e => blurCrear('primer_nombre', e.target.value)}
                                                    error={errCrear('primer_nombre')} />
                                                <Input label="Segundo nombre" value={formCrear.segundo_nombre}
                                                    onChange={e => changeCrear('segundo_nombre', sanitizeNombre(e.target.value))}
                                                    onBlur={e => blurCrear('segundo_nombre', e.target.value)}
                                                    error={errCrear('segundo_nombre')} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input label="Primer apellido *" value={formCrear.apellido_paterno}
                                                    onChange={e => changeCrear('apellido_paterno', sanitizeNombre(e.target.value))}
                                                    onBlur={e => blurCrear('apellido_paterno', e.target.value)}
                                                    error={errCrear('apellido_paterno')} />
                                                <Input label="Segundo apellido" value={formCrear.apellido_materno}
                                                    onChange={e => changeCrear('apellido_materno', sanitizeNombre(e.target.value))}
                                                    onBlur={e => blurCrear('apellido_materno', e.target.value)}
                                                    error={errCrear('apellido_materno')} />
                                            </div>
                                            <Input label="RUN *" placeholder="12.345.678-9" value={formCrear.run}
                                                onChange={e => changeRutCrear('run', e.target.value)}
                                                onBlur={e => blurCrear('run', parseRut(e.target.value))}
                                                error={errCrear('run')} />
                                        </>
                                    )}

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
                                            <Select label="Tipo institución *" value={formCrear.tipo_institucion}
                                                onChange={e => setFormCrear(prev => ({ ...prev, tipo_institucion: e.target.value }))} required>
                                                <option value="veterinaria">Veterinaria</option>
                                                <option value="municipalidad">Municipalidad</option>
                                            </Select>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Foto de perfil</label>
                                        <input
                                            type="file" accept="image/*"
                                            onChange={e => setArchivoCrear(e.target.files?.[0] || null)}
                                            className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="submit"
                                            disabled={creandoUsuario}
                                            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2.5 rounded-xl transition-all disabled:opacity-50"
                                        >
                                            {creandoUsuario
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <UserPlus className="w-4 h-4" />}
                                            {creandoUsuario ? 'Creando...' : 'Crear usuario'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMostrarModal(false)}
                                            disabled={creandoUsuario}
                                            className="flex items-center gap-2 text-sm font-medium border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminUsuariosPage;
