import React, { useState, useRef } from 'react';
import { PageHeader, Button, Card } from '../components/UI';
import { CartView } from '../components/CartView';
import { Item, Technique, Equipment } from '../types';
import { Package, FilePlus, Settings, LogOut, Plus, Camera, Sparkles, ArrowLeft, Upload, X, Edit, Trash2, MapPin, LayoutGrid, List, FileText, ShoppingCart, BriefcaseMedical, Siren, Zap, ChevronDown, ChevronRight, Check, Monitor, ClipboardList, Clock, Building2, Users, Menu, Search, ShieldCheck, RefreshCw } from 'lucide-react';

import { supabase } from '../services/supabase';
import { Location } from '../hooks/useLocations';
import { useStockRevisions } from '../hooks/useSupabaseData';
import { useUnits, Unit } from '../hooks/useUnits';
import { useCartItems, useGlobalCartItems } from '../hooks/useCartItems';
import { useIncidents } from '../hooks/useIncidents';
import { useFeedbacks } from '../hooks/useFeedbacks';
import { useUsers } from '../hooks/useUsers';
import { generateMaterialImage, correctText } from '../services/ai';
import { resizeImage } from '../utils/imageUtils';

interface AdminProps {
    inventory: Item[];
    techniques: Technique[];
    onLogout: () => void;
    onRefreshInventory?: () => void;
    onRefreshTechniques?: () => void;
    createItem: (item: any) => Promise<any>;
    updateItem: (id: string, updates: any) => Promise<any>;
    deleteItem: (id: string) => Promise<any>;
    equipmentData: Equipment[];
    createEquipment: (data: any) => Promise<any>;
    updateEquipment: (id: string, updates: any) => Promise<any>;
    deleteEquipment: (id: string) => Promise<any>;
    onRefreshEquipment?: () => void;
    createTechnique: (data: any) => Promise<any>;
    updateTechnique: (id: string, updates: any) => Promise<any>;
    deleteTechnique: (id: string) => Promise<any>;
    locationsData: Location[];
    createLocation: (location: any) => Promise<any>;
    updateLocation: (id: string, updates: any) => Promise<any>;
    deleteLocation: (id: string) => Promise<any>;
    unitId: string;
}

export const AdminLogin: React.FC<{
    onLogin: (email: string, pass: string) => Promise<{ error: any }>;
    onSuccess: () => void;
    onBack: () => void
}> = ({ onLogin, onSuccess, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Por favor introduce email y contraseña');
            return;
        }

        setLoading(true);
        setError(null);
        const { error } = await onLogin(email, password);
        if (error) {
            setError('Credenciales incorrectas o error de conexión');
            setLoading(false);
        } else {
            onSuccess();
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors pt-[calc(1rem+env(safe-area-inset-top))]">
            <Card className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 space-y-6 dark:bg-slate-800 dark:border-slate-700">
                <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Acceso Supervisión</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Introduce tus credenciales</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                            placeholder="admin@hospital.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
                        <input
                            type="password"
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                            placeholder="••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        />
                    </div>
                    <Button fullWidth onClick={handleLogin} disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                    <button onClick={onBack} className="w-full text-center text-sm text-slate-500 dark:text-slate-400 hover:underline">Volver al inicio</button>
                </div>
            </Card>

        </div>
    )
}

const LOCATION_TYPES: Record<string, string> = {
    CART: 'Carro',
    WAREHOUSE: 'Almacén',
    EXTERNAL: 'Externo'
};

const LOCATION_COLORS = [
    { name: 'Rojo', value: '#ef4444', class: 'bg-red-500' },
    { name: 'Naranja', value: '#f97316', class: 'bg-orange-500' },
    { name: 'Ámbar', value: '#f59e0b', class: 'bg-amber-500' },
    { name: 'Verde', value: '#22c55e', class: 'bg-green-500' },
    { name: 'Esmeralda', value: '#10b981', class: 'bg-emerald-500' },
    { name: 'Teal', value: '#14b8a6', class: 'bg-teal-500' },
    { name: 'Cian', value: '#06b6d4', class: 'bg-cyan-500' },
    { name: 'Azul', value: '#3b82f6', class: 'bg-blue-500' },
    { name: 'Índigo', value: '#6366f1', class: 'bg-indigo-500' },
    { name: 'Violeta', value: '#8b5cf6', class: 'bg-violet-500' },
    { name: 'Púrpura', value: '#a855f7', class: 'bg-purple-500' },
    { name: 'Fucsia', value: '#d946ef', class: 'bg-fuchsia-500' },
    { name: 'Rosa', value: '#ec4899', class: 'bg-pink-500' },
    { name: 'Gris', value: '#64748b', class: 'bg-slate-500' },
];

const SettingsView: React.FC<{ unitId: string }> = ({ unitId }) => {
    const { units, updateUnit, refreshUnits } = useUnits();
    const currentUnitName = localStorage.getItem('SMARTCART_UNIT_NAME') || localStorage.getItem('SMARTCART_UNIT');
    const [newName, setNewName] = useState(currentUnitName || '');
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);

    const handleSavePrimary = async () => {
        if (!newName.trim() || newName === currentUnitName) return;

        try {
            setSaving(true);
            const unit = units.find(u => u.id === unitId);
            if (unit) {
                await updateUnit(unit.id, { name: newName.trim() });
                localStorage.setItem('SMARTCART_UNIT_NAME', newName.trim());
                localStorage.setItem('SMARTCART_UNIT', newName.trim());
                await refreshUnits();
                alert('Nombre de la unidad actualizado correctamente');
            } else {
                alert('Error: No se encontró la unidad en la base de datos.');
            }
        } catch (e: any) {
            alert('Error al actualizar: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleResetContents = async () => {
        if (!confirm('¿ESTÁS SEGURO? Esta acción vaciará TODOS los carros y ubicaciones de esta unidad. El catálogo de materiales, técnicas y usuarios permanecerán intactos.')) return;

        const secondConfirm = confirm('Confirma una segunda vez: Se borrarán todas las asignaciones de stock de los carros.');
        if (!secondConfirm) return;

        try {
            setResetting(true);

            // 1. Get all location IDs for this unit
            const { data: locations, error: locError } = await supabase
                .from('locations')
                .select('id')
                .eq('unit_id', unitId);

            if (locError) throw locError;

            if (locations && locations.length > 0) {
                const locationIds = locations.map(l => l.id);

                // 2. Delete from cart_contents
                const { error: delError } = await supabase
                    .from('cart_contents')
                    .delete()
                    .in('location_id', locationIds);

                if (delError) throw delError;
            }

            alert('Contenidos reseteados con éxito. Los carros están ahora vacíos.');
            window.location.reload(); // Refresh to ensure all states are cleared
        } catch (e: any) {
            alert('Error al resetear contenidos: ' + e.message);
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Panel de Control</h2>
                <p className="text-slate-500 dark:text-slate-400">Configuración de la unidad y mantenimiento</p>
            </div>

            {/* Current Unit & Local Settings */}
            <section className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Settings size={20} className="text-clinical-500" /> Identificación de la Unidad
                </h3>
                <Card className="p-4 sm:p-8 space-y-6 dark:bg-slate-800 dark:border-slate-700">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="p-3 bg-clinical-100 dark:bg-clinical-900/50 rounded-xl text-clinical-600">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre Actual</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                    {currentUnitName || 'Sin nombre'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Cambiar nombre público</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    className="flex-1 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="Ej: UCI A, Planta 4, Emergencias..."
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                />
                                <Button onClick={handleSavePrimary} disabled={saving || !newName.trim() || newName === currentUnitName} className="whitespace-nowrap">
                                    {saving ? 'Guardando...' : 'Actualizar Nombre'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Maintenance / Reset */}
            <section className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Zap size={20} className="text-amber-500" /> Mantenimiento de Datos
                </h3>
                <Card className="p-8 border-amber-100 bg-amber-50/20 dark:bg-amber-900/5 dark:border-amber-900/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 flex-1">
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white underline decoration-amber-200">Resetear Contenidos de Carros</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                                Esta acción **borrará todos los materiales asignados** a los cajones y ubicaciones de esta unidad, dejándolos vacíos.
                                Útil si quieres empezar una nueva configuración de stock desde cero.
                            </p>
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <ShieldCheck size={14} /> El catálogo global y las técnicas NO se verán afectados.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleResetContents}
                            disabled={resetting}
                            className="bg-white hover:bg-red-50 text-red-600 border-red-200 shadow-sm whitespace-nowrap h-auto py-4 px-8"
                        >
                            {resetting ? 'Reseteando...' : 'Resetear Carros y Ubicaciones'}
                        </Button>
                    </div>
                </Card>

                <div className="pt-6">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Desvincular Dispositivo (Opcional)</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 px-1">
                        Si este dispositivo se va a usar en un servidor o entorno diferente, usa esta opción para limpiar la memoria local.
                    </p>
                    <button
                        onClick={() => {
                            if (confirm('¿Desvincular este dispositivo? Se cerrará la sesión y se reseteará la configuración inicial.')) {
                                localStorage.removeItem('SMARTCART_UNIT_ID');
                                localStorage.removeItem('SMARTCART_UNIT_NAME');
                                localStorage.removeItem('SMARTCART_UNIT');
                                window.location.reload();
                            }
                        }}
                        className="text-sm text-slate-400 hover:text-red-500 underline transition-colors"
                    >
                        Limpiar registro local y desvincular
                    </button>
                </div>
            </section>
        </div>
    );
};



const UsersView: React.FC = () => {
    const { users, loading, createUser, deleteUser } = useUsers();
    const [isCreating, setIsCreating] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'NURSE' | 'SUPERVISOR' | 'ADMIN' | 'USER'>('NURSE');
    const [createError, setCreateError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleCreate = async () => {
        setCreateError(null);
        setDeleteError(null);
        const isStandardUser = role === 'USER';
        if (!name || (!isStandardUser && (!email || !password))) {
            setCreateError('Por favor, rellena todos los campos obligatorios');
            return;
        }
        setSaving(true);
        const { error } = await createUser(email, password, name, role);
        setSaving(false);
        if (error) {
            setCreateError('Error al crear usuario: ' + error);
        } else {
            setIsCreating(false);
            setEmail('');
            setPassword('');
            setName('');
            setRole('NURSE');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setDeleteError(null);
            setCreateError(null);
            setSaving(true);
            const { error } = await deleteUser(id);
            if (error) {
                setDeleteError(error);
            }
            setDeletingId(null);
        } catch (e: any) {
            setDeleteError(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestión de Usuarios</h2>
                    <p className="text-slate-500 dark:text-slate-400">Control de acceso al espacio de Supervisión</p>
                </div>
                <Button onClick={() => setIsCreating(true)} className="gap-2">
                    <Plus size={20} /> Nuevo Usuario
                </Button>
            </div>

            {deleteError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-0" role="alert">
                    <strong className="font-bold">Error al eliminar: </strong>
                    <span className="block sm:inline">{deleteError}</span>
                    <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setDeleteError(null)}>
                        <X className="h-4 w-4 text-red-500 cursor-pointer" />
                    </span>
                </div>
            )}

            {isCreating && (
                <Card className="p-6 border-clinical-200 bg-clinical-50/30 dark:bg-clinical-900/10 dark:border-clinical-800/50">
                    {createError && (
                        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{createError}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nombre</label>
                            <input
                                type="text"
                                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                placeholder="Nombre completo"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        {role !== 'USER' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="email@hospital.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Contraseña</label>
                                    <input
                                        type="password"
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Rol</label>
                            <select
                                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                value={role}
                                onChange={e => setRole(e.target.value as any)}
                            >
                                <option value="NURSE">Autorizado</option>
                                <option value="SUPERVISOR">Supervisión</option>
                                <option value="ADMIN">Admin</option>
                                <option value="USER">Usuario</option>
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1 ml-1 px-1">
                                {role === 'ADMIN' ? 'Acceso total al sistema y base de datos.' :
                                    role === 'SUPERVISOR' ? 'Acceso total a gestión y configuración.' :
                                        role === 'USER' ? 'Acceso básico de consulta.' :
                                            'Acceso limitado a uso clínico.'}
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                        <Button onClick={handleCreate} disabled={saving}>
                            {saving ? 'Guardando...' : 'Crear Usuario'}
                        </Button>
                        <Button variant="ghost" onClick={() => setIsCreating(false)}>
                            Cancelar
                        </Button>
                    </div>
                </Card>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Rol</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Fecha Alta</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Cargando usuarios...</td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No hay usuarios registrados</td>
                            </tr>
                        ) : users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-clinical-100 dark:bg-clinical-900/50 flex items-center justify-center text-clinical-700 dark:text-clinical-400 font-bold text-xs uppercase">
                                            {user.name.charAt(0)}
                                        </div>
                                        <span className="font-medium text-slate-700 dark:text-slate-200">{user.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${user.role === 'ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                        user.role === 'SUPERVISOR' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                            user.role === 'USER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-clinical-100 text-clinical-700 dark:bg-clinical-900/30 dark:text-clinical-400'
                                        }`}>
                                        {user.role === 'ADMIN' ? 'Admin' :
                                            user.role === 'SUPERVISOR' ? 'Supervisión' :
                                                user.role === 'USER' ? 'Usuario' :
                                                    'Autorizado'}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                                    {deletingId === user.id ? (
                                        <div className="flex justify-end gap-2 animate-in fade-in zoom-in duration-200">
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                disabled={saving}
                                                className="px-2 sm:px-3 py-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                                            >
                                                {saving ? '...' : 'Eliminar'}
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(null)}
                                                disabled={saving}
                                                className="px-2 sm:px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] sm:text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors"
                                            >
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeletingId(user.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                            title="Eliminar usuario"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const AdminDashboard: React.FC<AdminProps> = (props) => {
    const { inventory, unitId, techniques, onLogout, onRefreshInventory, createItem, updateItem, deleteItem, equipmentData, createEquipment, updateEquipment, deleteEquipment, onRefreshEquipment, createTechnique, updateTechnique, deleteTechnique, locationsData, createLocation, updateLocation, deleteLocation } = props;
    const [activeTab, setActiveTab] = useState<'INVENTORY' | 'TECHNIQUES' | 'LOCATIONS' | 'CART' | 'EQUIPMENT' | 'REGISTROS' | 'REGISTROS_STOCK' | 'REGISTROS_FEEDBACK' | 'SETTINGS' | 'USERS'>('INVENTORY');
    const [selectedCartId, setSelectedCartId] = useState<string | null>(null);
    const [isCartsOpen, setIsCartsOpen] = useState(true);
    const [isTechNavOpen, setIsTechNavOpen] = useState(true);
    const [isRegistrosOpen, setIsRegistrosOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isTabSelectorOpen, setIsTabSelectorOpen] = useState(false);

    // Material Creation/Edit State - Now received from props
    // const {createItem, updateItem, deleteItem} = useItems();
    const [isCreating, setIsCreating] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [viewingItem, setViewingItem] = useState<Item | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table'); // Default to table as requested
    const [newItem, setNewItem] = useState<Partial<Item>>({
        name: '',
        category: 'material',
        referencia_petitorio: ''
    });
    const [selectedParentLocation, setSelectedParentLocation] = useState<string>('');
    const [selectedSubLocation, setSelectedSubLocation] = useState<string>('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Generic Cart Hook for the CURRENTLY selected cart
    const activeCartHook = useCartItems(selectedCartId || '');
    const { revisions, loading: loadingRevisions, refreshRevisions } = useStockRevisions(unitId);

    // Global items for "Available In" check
    const globalCartItems = useGlobalCartItems(unitId);

    // AI Text Correction Helper
    const handleBlurCorrection = async (text: string, setter: (val: string) => void) => {
        if (!text || !text.trim()) return;
        console.log("Blur triggered for:", text); // Debug log
        try {
            // Temporary debug alert to confirm it runs
            // alert(`Analizando texto: "${text}"...`); 

            const corrected = await correctText(text);
            console.log("AI Response:", corrected);

            if (corrected && corrected !== text) {
                console.log("Applying correction:", corrected);
                setter(corrected);
                // alert(`Corregido a: "${corrected}"`);
            } else {
                console.log("No correction needed or failed.");
            }
        } catch (error) {
            console.error("Error correcting text:", error);
            alert("Error en corrección AI (ver consola)");
        }
    };

    // Locations State - Now received from props
    // const {locations: savedLocations, createLocation, deleteLocation, updateLocation } = useLocations();
    const savedLocations = locationsData;
    const [newLocation, setNewLocation] = useState({ name: '', type: 'CART' as 'CART' | 'WAREHOUSE' | 'EXTERNAL', parentId: '' });
    const [colorSelectionModal, setColorSelectionModal] = useState<{ isOpen: boolean; pendingLocation: { name: string, type: 'CART' | 'WAREHOUSE' | 'EXTERNAL', parentId: string } | null }>({ isOpen: false, pendingLocation: null });
    const [editingLocation, setEditingLocation] = useState<{ id: string, name: string, type: 'CART' | 'WAREHOUSE' | 'EXTERNAL', color?: string } | null>(null);
    const [subLocationModal, setSubLocationModal] = useState<{ isOpen: boolean; parentId: string; parentName: string; parentType: 'CART' | 'WAREHOUSE' | 'EXTERNAL' }>({ isOpen: false, parentId: '', parentName: '', parentType: 'CART' });
    const [subLocationName, setSubLocationName] = useState('');
    const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
    const [inventorySearch, setInventorySearch] = useState('');
    const [techniqueSearch, setTechniqueSearch] = useState('');
    const [equipmentMainSearch, setEquipmentMainSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Item; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    // Helper to upload base64 images to Supabase Storage
    const handleStorageDebug = async () => {
        try {
            alert("Iniciando prueba de conexión con Storage...");
            const fileName = `debug_${Date.now()}.txt`;
            const { data, error } = await supabase.storage
                .from('images')
                .upload(fileName, new Blob(['test'], { type: 'text/plain' }));

            if (error) {
                console.error("DEBUG STORAGE ERROR:", error);
                alert(`ERROR CRÍTICO STORAGE:\n${error.message}\nCodigo: ${error.cause || 'N/A'}`);
            } else {
                alert(`¡ÉXITO! Archivo subido correctamente.\nPath: ${data.path}`);
                // Cleanup
                // await supabase.storage.from('images').remove([fileName]);
            }
        } catch (e: any) {
            alert(`EXCEPCIÓN LOCAL: ${e.message}`);
        }
    };

    // Robust Base64 to Blob converter
    const base64ToBlob = (base64: string, contentType: string = 'image/jpeg') => {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteArrays = [];
        for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays.push(byteCharacters.charCodeAt(i));
        }
        const byteArray = new Uint8Array(byteArrays);
        return new Blob([byteArray], { type: contentType });
    };

    const uploadImageToStorage = async (base64Data: string): Promise<string | null> => {
        try {
            // STEP 1: Conversion
            alert("Paso 1: Convirtiendo imagen...");
            let blob;
            try {
                blob = base64ToBlob(base64Data, 'image/jpeg');
                console.log("Blob created:", blob.size, blob.type);
            } catch (e: any) {
                alert(`Error convirtiendo imagen: ${e.message}`);
                return null;
            }

            const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

            // STEP 2: Upload
            alert(`Paso 2: Subiendo ${Math.round(blob.size / 1024)}KB a Storage...`);
            const { data, error } = await supabase.storage
                .from('images')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                    upsert: false
                });

            if (error) {
                console.error("Supabase Storage Upload Error:", error);
                alert(`Error subiendo imagen real: ${error.message}`);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error: any) {
            // Alerts handled above for specific steps
            return null;
        }
    };

    const handleSort = (key: keyof Item) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Equipment State - Now received from props
    // const {equipment, createEquipment, updateEquipment, deleteEquipment, refreshEquipment} = useEquipment();
    const equipment = equipmentData;
    const refreshEquipment = onRefreshEquipment;
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [newEquipment, setNewEquipment] = useState<Partial<Equipment>>({
        name: '',
        description: '',
        imageUrl: '',
        category: 'Respiradores',
        stockQuantity: 1,
        maintenanceStatus: 'Operativo',
        location: '',
        requiresPower: false
    });

    // Incidents & Feedbacks State
    const { incidents, loading: loadingIncidents, fetchIncidents } = useIncidents(unitId);
    const { feedbacks, loading: loadingFeedbacks, fetchFeedbacks } = useFeedbacks(unitId);



    const handleSaveEquipment = async () => {
        if (!newEquipment.name || !newEquipment.category) {
            alert('Por favor rellena el nombre y la categoría');
            return;
        }

        try {
            setUploading(true);
            let finalImage = imagePreview;

            // Upload to Storage if it's a new image (base64)
            if (finalImage && finalImage.startsWith('data:')) {
                console.log("Uploading equipment image to storage...");
                const uploadedUrl = await uploadImageToStorage(finalImage);
                if (uploadedUrl) {
                    finalImage = uploadedUrl;
                } else {
                    console.warn("Upload failed, keeping base64");
                    if (!confirm("La subida de la imagen falló. ¿Intentar guardar sin imagen?")) {
                        setUploading(false);
                        return; // Stop saving
                    }
                    finalImage = ''; // Clear it to avoid DB error
                }
            }

            console.log("Saving Equipment. Image length:", finalImage?.length);

            // Basic Format Correction
            let finalName = newEquipment.name.trim();
            if (finalName.length > 0) {
                finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
                // AI refinement
                try {
                    const corrected = await correctText(finalName);
                    if (corrected) finalName = corrected;
                } catch (e) {
                    console.error("Text correction failed", e);
                }
            }

            if (editingEquipment) {
                await updateEquipment(editingEquipment.id, {
                    name: finalName,
                    description: newEquipment.description,
                    imageUrl: finalImage || editingEquipment.imageUrl,
                    category: newEquipment.category,
                    stockQuantity: newEquipment.stockQuantity,
                    maintenanceStatus: newEquipment.maintenanceStatus,
                    location: newEquipment.location,
                    requiresPower: newEquipment.requiresPower
                });
            } else {
                await createEquipment({
                    name: finalName,
                    description: newEquipment.description || '',
                    imageUrl: finalImage || '',
                    category: newEquipment.category!,
                    stockQuantity: newEquipment.stockQuantity || 0,
                    maintenanceStatus: newEquipment.maintenanceStatus as any || 'Operativo',
                    location: newEquipment.location || '',
                    requiresPower: newEquipment.requiresPower || false
                });
            }

            setIsCreating(false);
            setEditingEquipment(null);
            setImagePreview(null);
            setNewEquipment({
                name: '',
                description: '',
                imageUrl: '',
                category: 'Respiradores',
                stockQuantity: 1,
                maintenanceStatus: 'Operativo',
                location: '',
                requiresPower: false
            });

            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (e: any) {
            console.error('Error saving equipment:', e);
            alert('Error al guardar: ' + e.message);
        } finally {
            setUploading(false);
        }
    };

    const handleEditEquipment = (eq: Equipment) => {
        setEditingEquipment(eq);
        setNewEquipment({
            name: eq.name,
            description: eq.description,
            imageUrl: eq.imageUrl,
            category: eq.category,
            stockQuantity: eq.stockQuantity,
            maintenanceStatus: eq.maintenanceStatus,
            location: eq.location,
            requiresPower: eq.requiresPower
        });
        setImagePreview(eq.imageUrl);
        setIsCreating(true);
    };

    const handleDeleteEquipment = (id: string) => {
        setDeleteConfirmation({ isOpen: true, type: 'EQUIPMENT', id });
    };

    const toggleLocation = (id: string) => {
        const newExpanded = new Set(expandedLocations);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedLocations(newExpanded);
    };

    // Add Material to Drawer State (Bulk)
    const [addMaterialData, setAddMaterialData] = useState<{
        isOpen: boolean;
        targetLocationId: string;
        targetLocationName: string;
        cartType: 'TECHNIQUES' | 'CURES' | 'CRASH' | null;
        locationType: 'CART' | 'WAREHOUSE' | 'EXTERNAL' | 'TECHNIQUE' | null;
        selectedItems: Record<string, { stockIdeal: number; nextExpiryDate: string }>;
        searchTerm: string;
    }>({
        isOpen: false,
        targetLocationId: '',
        targetLocationName: '',
        cartType: null,
        locationType: null,
        selectedItems: {}, // {itemId: {stockIdeal: 1, nextExpiryDate: '' } }
        searchTerm: ''
    });

    const openMaterialModalNew = (locationId: string, locationName: string, cartType: any, locationType: any, existingItems: any[] = []) => {
        console.log('openMaterialModalNew called with:', { locationId, locationName, cartType, locationType, existingItems });
        const initialSelected: Record<string, { stockIdeal: number; nextExpiryDate: string }> = {};

        if (existingItems && existingItems.length > 0) {
            existingItems.forEach(item => {
                initialSelected[item.itemId] = {
                    stockIdeal: item.stockIdeal,
                    nextExpiryDate: item.nextExpiryDate || ''
                };
            });
        }

        setAddMaterialData({
            isOpen: true,
            targetLocationId: locationId,
            targetLocationName: locationName,
            cartType,
            locationType,
            selectedItems: initialSelected,
            searchTerm: ''
        });
    };

    const toggleMaterialSelection = (itemId: string) => {
        setAddMaterialData(prev => {
            const newSelected = { ...prev.selectedItems };
            if (newSelected[itemId]) {
                delete newSelected[itemId];
            } else {
                newSelected[itemId] = { stockIdeal: 1, nextExpiryDate: '' };
            }
            return { ...prev, selectedItems: newSelected };
        });
    };

    const updateSelectedMaterial = (itemId: string, field: 'stockIdeal' | 'nextExpiryDate', value: any) => {
        setAddMaterialData(prev => ({
            ...prev,
            selectedItems: {
                ...prev.selectedItems,
                [itemId]: {
                    ...prev.selectedItems[itemId],
                    [field]: value
                }
            }
        }));
    };

    const handleAddMaterialToCart = async () => {
        if (!addMaterialData.targetLocationId) {
            console.error("No targetLocationId in addMaterialData");
            alert('Error interno: Falta ID de ubicación destino');
            return;
        }

        try {
            console.log("Saving to location:", addMaterialData.targetLocationId);

            // 1. Delete existing for this drawer
            const { error: delErr } = await supabase
                .from('cart_contents')
                .delete()
                .eq('location_id', addMaterialData.targetLocationId);

            if (delErr) {
                console.error("Delete error:", delErr);
                throw delErr;
            }

            // 2. Insert new
            const desiredItemIds = Object.keys(addMaterialData.selectedItems);
            console.log("Desired items:", desiredItemIds, addMaterialData.selectedItems);

            if (desiredItemIds.length > 0) {
                const toInsert = desiredItemIds.map(itemId => ({
                    location_id: addMaterialData.targetLocationId,
                    item_id: itemId,
                    stock_ideal: addMaterialData.selectedItems[itemId].stockIdeal || 1,
                    next_expiry_date: addMaterialData.selectedItems[itemId].nextExpiryDate || null
                }));
                console.log("Inserting payload:", toInsert);

                const { error: insErr } = await supabase.from('cart_contents').insert(toInsert);
                if (insErr) {
                    console.error("Insert error:", insErr);
                    throw insErr;
                }
            } else {
                console.log("No items to insert (clearing drawer)");
            }

            // 3. Refresh View
            console.log("Refreshing view...");
            if (activeCartHook) {
                await activeCartHook.refresh();
                console.log("Refresh promise resolved");
            } else {
                console.warn("No activeCartHook available for refresh");
            }

            // alert(`Guardado en ${addMaterialData.targetLocationName} (${addMaterialData.targetLocationId})`);
            setAddMaterialData(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
            console.error("Sync Error Detailed:", error);
            alert('Error al actualizar materiales: ' + (error.message || 'Error desconocido'));
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; type: 'TECHNIQUE' | 'LOCATION' | 'ITEM' | 'EQUIPMENT' | null; id: string | null }>({
        isOpen: false,
        type: null,
        id: null
    });

    // Technique Creation/Edit State - Now received from props
    // const {techniques: liveTechniques, createTechnique, updateTechnique, deleteTechnique } = useTechniques();
    const liveTechniques = techniques;
    const [newTechnique, setNewTechnique] = useState<{ name: string; description: string; protocolUrl: string; cartIds: string[] }>({ name: '', description: '', protocolUrl: '', cartIds: [] });
    const [uploadingProtocol, setUploadingProtocol] = useState(false);
    const [editingTechnique, setEditingTechnique] = useState<Technique | null>(null);
    const [selectedTechItems, setSelectedTechItems] = useState<{ itemId: string; quantity: number }[]>([]);
    const [selectedTechEquipment, setSelectedTechEquipment] = useState<{ equipmentId: string; quantity: number }[]>([]);
    const [itemSelectorOpen, setItemSelectorOpen] = useState(false);
    const [equipmentSelectorOpen, setEquipmentSelectorOpen] = useState(false);
    const [techMaterialSearch, setTechMaterialSearch] = useState('');
    const [techEquipmentSearch, setTechEquipmentSearch] = useState('');
    const [viewingTechnique, setViewingTechnique] = useState<Technique | null>(null);
    const [viewingMaterialSearch, setViewingMaterialSearch] = useState('');
    const [protocolViewer, setProtocolViewer] = useState<{ isOpen: boolean; url: string }>({ isOpen: false, url: '' });

    const handleAddTechnique = async () => {
        if (!newTechnique.name) {
            alert('Por favor, indica un nombre para la técnica');
            return;
        }
        try {
            // Basic Format Correction (Capitalization)
            let finalName = newTechnique.name.trim();
            if (finalName.length > 0) {
                finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);

                // AI refinement for Name (Keep existing logic but quiet it down if needed, or leave as is)
                try {
                    const corrected = await correctText(finalName);
                    if (corrected) finalName = corrected;
                } catch (e) {
                    // Silent fail
                }
            }

            // Description Correction (Detailed)
            let finalDescription = newTechnique.description;
            if (finalDescription && finalDescription.trim().length > 0) {
                try {
                    const correctedDesc = await correctText(finalDescription);
                    if (correctedDesc) finalDescription = correctedDesc;
                } catch (e) {
                    // Silent fail, keep original
                    console.warn("Description correction failed, saving original.");
                }
            }

            if (editingTechnique) {
                await updateTechnique(editingTechnique.id, {
                    ...newTechnique,
                    name: finalName,
                    description: finalDescription,
                    items: selectedTechItems,
                    equipment: selectedTechEquipment
                });
            } else {
                await createTechnique({
                    ...newTechnique,
                    name: finalName,
                    description: finalDescription,
                    items: selectedTechItems,
                    equipment: selectedTechEquipment
                });
            }
            setIsCreating(false);
            setNewTechnique({ name: '', description: '', protocolUrl: '', cartIds: [] });
            setEditingTechnique(null);
            setSelectedTechItems([]);
            setSelectedTechEquipment([]);
            if (props.onRefreshTechniques) props.onRefreshTechniques();
        } catch (e: any) {
            console.error(e);
            if (e.message?.includes('technique_items_item_id_fkey') || e.code === '23503') {
                alert('Error de sincronización: Algunos materiales seleccionados ya no existen en la base de datos (IDs obsoletos). Por favor, recarga la página para actualizar el inventario.');
            } else {
                alert('Error al guardar técnica: ' + (e.message || JSON.stringify(e)));
            }
        }
    };

    const handleProtocolUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingProtocol(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('protocols')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('protocols')
                .getPublicUrl(filePath);

            setNewTechnique(prev => ({ ...prev, protocolUrl: data.publicUrl }));
        } catch (error: any) {
            console.error('Error uploading protocol:', error);
            alert('Error al subir el documento: ' + (error.message || 'Error desconocido'));
        } finally {
            setUploadingProtocol(false);
        }
    };

    const handleEditTechnique = (tech: Technique) => {
        setEditingTechnique(tech);
        setNewTechnique({ name: tech.name, description: tech.description, protocolUrl: tech.protocolUrl, cartIds: tech.cartIds || [] });
        setNewTechnique({ name: tech.name, description: tech.description, protocolUrl: tech.protocolUrl, cartIds: tech.cartIds || [] });
        setSelectedTechItems(tech.items.map(i => ({ itemId: i.itemId, quantity: i.quantity })));
        setSelectedTechEquipment(tech.equipment?.map(e => ({ equipmentId: e.equipmentId, quantity: e.quantity })) || []);
        setIsCreating(true);
    };

    const handleDeleteTechnique = (id: string) => {
        setDeleteConfirmation({ isOpen: true, type: 'TECHNIQUE', id });
    };

    const handleConfirmDelete = async () => {
        const { type, id } = deleteConfirmation;
        if (!id || !type) return;

        try {
            if (type === 'TECHNIQUE') {
                await deleteTechnique(id);
                if (props.onRefreshTechniques) props.onRefreshTechniques();
            } else if (type === 'LOCATION') {
                await deleteLocation(id);
            } else if (type === 'ITEM') {
                await deleteItem(id);
                if (props.onRefreshInventory) props.onRefreshInventory();
            } else if (type === 'EQUIPMENT') {
                await deleteEquipment(id);
                if (onRefreshEquipment) onRefreshEquipment();
            }
            setDeleteConfirmation({ isOpen: false, type: null, id: null });
        } catch (e: any) {
            console.error(e);
            if (e.message?.includes('technique_items_item_id_fkey') || e.code === '23503') {
                alert('Error de sincronización: Algunos materiales seleccionados ya no existen. Por favor, recarga la página para actualizar el inventario.');
            } else {
                alert('Error al borrar: ' + (e.message || 'Error desconocido'));
            }
            setDeleteConfirmation({ isOpen: false, type: null, id: null });
        }
    };

    const toggleTechItem = (itemId: string) => {
        if (selectedTechItems.find(i => i.itemId === itemId)) {
            setSelectedTechItems(prev => prev.filter(i => i.itemId !== itemId));
        } else {
            setSelectedTechItems(prev => [...prev, { itemId, quantity: 1 }]);
        }
    };

    const updateTechItemQuantity = (itemId: string, info: number) => {
        setSelectedTechItems(prev => prev.map(i => i.itemId === itemId ? { ...i, quantity: info } : i));
    };

    const toggleTechEquipment = (equipmentId: string) => {
        if (selectedTechEquipment.find(e => e.equipmentId === equipmentId)) {
            setSelectedTechEquipment(prev => prev.filter(e => e.equipmentId !== equipmentId));
        } else {
            setSelectedTechEquipment(prev => [...prev, { equipmentId, quantity: 1 }]);
        }
    };

    const updateTechEquipmentQuantity = (equipmentId: string, quantity: number) => {
        setSelectedTechEquipment(prev => prev.map(e => e.equipmentId === equipmentId ? { ...e, quantity } : e));
    };

    // Reset form for item creation
    // Reset form for location creation
    const resetLocationForm = () => {
        setNewLocation({ name: '', type: 'CART', parentId: '' });
    };

    const handleInitiateCreateLocation = () => {
        if (!newLocation.name) return;

        if (newLocation.type === 'CART') {
            // Show color picker popup
            setColorSelectionModal({
                isOpen: true,
                pendingLocation: { ...newLocation }
            });
        } else {
            // Direct create for others
            finalCreateLocation(newLocation.name, newLocation.type, null, null);
        }
    };

    const finalCreateLocation = async (name: string, type: string, parentId: string | null, color: string | null) => {
        try {
            let finalName = name.trim();
            if (finalName.length > 0) {
                finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
                try {
                    const corrected = await correctText(finalName);
                    if (corrected) finalName = corrected;
                } catch (e) { console.error("Text correction failed", e); }
            }

            await createLocation({
                name: finalName,
                type: type as any,
                parent_id: parentId,
                color: color
            });
            resetLocationForm();
            setColorSelectionModal({ isOpen: false, pendingLocation: null });
        } catch (e) {
            alert('Error al crear ubicación');
        }
    };

    const handleUpdateLocation = async () => {
        if (!editingLocation || !editingLocation.name) return;
        try {
            let finalName = editingLocation.name.trim();
            if (finalName.length > 0) {
                finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
                try {
                    const corrected = await correctText(finalName);
                    if (corrected) finalName = corrected;
                } catch (e) { console.error("Text correction failed", e); }
            }

            await updateLocation(editingLocation.id, {
                name: finalName,
                type: editingLocation.type,
                color: editingLocation.color
            });
            setEditingLocation(null);
        } catch (e) {
            alert('Error al actualizar ubicación');
        }
    };

    const handleSaveSubLocation = async () => {
        if (!subLocationName) return;
        try {
            let finalName = subLocationName.trim();
            if (finalName.length > 0) {
                finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
                try {
                    const corrected = await correctText(finalName);
                    if (corrected) finalName = corrected;
                } catch (e) { console.error("Text correction failed", e); }
            }

            await createLocation({
                name: finalName,
                type: subLocationModal.parentType,
                parent_id: subLocationModal.parentId
            });
            setSubLocationModal({ isOpen: false, parentId: '', parentName: '', parentType: 'CART' });
            setSubLocationName('');
        } catch (e) {
            alert('Error al crear sub-ubicación');
        }
    };

    const handleDeleteLocation = (id: string) => {
        setDeleteConfirmation({ isOpen: true, type: 'LOCATION', id });
    }

    // Reset form
    // Reset form for item creation
    const resetItemForm = () => {
        setNewItem({
            name: '',
            category: 'material',
            referencia_petitorio: ''
        });
        setImagePreview(null);
        setIsCreating(false);
        setEditingItem(null);
        setSelectedParentLocation('');
        setSelectedSubLocation('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleEditItem = (item: Item) => {
        setEditingItem(item);

        setNewItem({
            name: item.name,
            category: item.category,
            referencia_petitorio: item.referencia_petitorio || ''
        });
        setImagePreview(item.imageUrl);
        setIsCreating(true);
        // setSelectedParentLocation(parentId); // No longer needed
    };

    const handleDeleteItem = (id: string) => {
        setDeleteConfirmation({ isOpen: true, type: 'ITEM', id });
    };


    const handleSaveMaterial = async () => {
        if (!newItem.name) {
            alert('Por favor rellena el nombre');
            return;
        }

        try {
            setUploading(true);
            let finalImage = imagePreview;

            // Upload to Storage if it's a new image (base64)
            if (finalImage && finalImage.startsWith('data:')) {
                console.log("Uploading material image to storage...");
                const uploadedUrl = await uploadImageToStorage(finalImage);
                if (uploadedUrl) {
                    finalImage = uploadedUrl;
                } else {
                    console.warn("Upload failed, keeping base64");
                    if (!confirm("La subida de la imagen falló. ¿Intentar guardar sin imagen?")) {
                        setUploading(false);
                        return; // Stop saving
                    }
                    finalImage = ''; // Clear it to avoid DB error
                }
            }

            console.log("Saving Material. Image length:", finalImage?.length);

            // Basic Format Correction (Capitalization)
            let finalName = newItem.name.trim();
            if (finalName.length > 0) {
                finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);

                // AI refinement
                try {
                    console.log("Requesting AI correction for:", finalName);
                    const corrected = await correctText(finalName);
                    console.log("AI returned:", corrected);
                    if (corrected) finalName = corrected;
                } catch (e) {
                    console.error("Text correction failed", e);
                }
            }


            // AI Auto-generation disabled by user request due to billing quota.
            // if (!finalImage && newItem.name) {... }

            let createdItemId = '';
            if (editingItem) {
                await updateItem(editingItem.id, {
                    name: finalName,
                    category: newItem.category,
                    imageUrl: finalImage || editingItem.imageUrl,
                    referencia_petitorio: newItem.referencia_petitorio
                });
                createdItemId = editingItem.id;
            } else {
                const res = await createItem({
                    name: finalName,
                    category: newItem.category,
                    imageUrl: finalImage || '',
                    referencia_petitorio: newItem.referencia_petitorio || ''
                });
                createdItemId = res?.id;
            }

            // If a location was selected, associate or update it for this material
            if (selectedParentLocation || selectedSubLocation) {
                // Determine the most specific location available
                const finalLocationId = selectedSubLocation || selectedParentLocation;
                const targetLoc = savedLocations.find(l => l.id === finalLocationId);

                if (createdItemId && finalLocationId) {

                    // Enforce Single Stock Location Constraint
                    // If target is WAREHOUSE or EXTERNAL, remove item from any other WAREHOUSE/EXTERNAL location first.
                    if (targetLoc && (targetLoc.type === 'WAREHOUSE' || targetLoc.type === 'EXTERNAL')) {
                        console.log("Enforcing single stock location for:", targetLoc.type);

                        // 1. Find existing assignments of this item to general stock
                        const { data: conflicts } = await supabase
                            .from('cart_contents')
                            .select('id, locations!inner(type)')
                            .eq('item_id', createdItemId)
                            .in('locations.type', ['WAREHOUSE', 'EXTERNAL']);

                        if (conflicts && conflicts.length > 0) {
                            const idsToDelete = conflicts.map((c: any) => c.id);
                            console.log("Removing conflicting stock locations:", idsToDelete);
                            await supabase.from('cart_contents').delete().in('id', idsToDelete);
                        }
                    }

                    // Use the top-level supabase client already imported
                    const { error: assocError } = await supabase.from('cart_contents').upsert({
                        item_id: createdItemId,
                        location_id: finalLocationId,
                        stock_ideal: 0
                    }, { onConflict: 'location_id,item_id' });

                    if (assocError) throw assocError;
                }
            }

            // Refresh AFTER all DB operations are done
            console.log("Saving complete. Starting refresh...");

            // 1. Refresh materials list
            if (props.onRefreshInventory) {
                await props.onRefreshInventory();
            }

            // 2. Refresh associations (locations)
            if (globalCartItems.refresh) {
                await globalCartItems.refresh();
            }

            console.log("Refresh successful. Closing form.");

            // Final success feedback


            resetItemForm();
            setIsCreating(false);
        } catch (e: any) {
            console.error('CRITICAL: Error saving material:', e);
            if (e.message?.includes('ON CONFLICT')) {
                alert('Error de base de datos: Falta una restricción necesaria para guardar ubicaciones.\n\nPor favor, ejecuta esta consulta en el SQL Editor de Supabase:\n\nALTER TABLE cart_contents ADD CONSTRAINT unique_location_item UNIQUE (location_id, item_id);');
            } else {
                alert('Error al guardar material: ' + (e.message || 'Error desconocido'));
            }
        } finally {
            setUploading(false);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Optimization: Use ObjectURL instead of FileReader for memory efficiency
                // This prevents reading the entire 10MB+ file into a base64 string before resizing
                const objectUrl = URL.createObjectURL(file);
                // alert(`Debug: Foto seleccionada. Tamaño original: ${Math.round(file.size/1024)}KB`);

                // Resize (accepts URL now)
                const resized = await resizeImage(objectUrl, 600, 600, 0.7);
                setImagePreview(resized);

                // Cleanup
                URL.revokeObjectURL(objectUrl);
            } catch (err: any) {
                console.error("Error handling image:", err);

                // Fallback: If resize fails (often memory on older phones), try original if < 4MB
                if (file.size < 4 * 1024 * 1024) {
                    alert("Aviso: Falló la compresión. Usando imagen original...");
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                } else {
                    alert(`Error: La imagen es muy grande (${Math.round(file.size / 1024)}KB) y falló la compresión. Intenta tomar la foto con menor resolución.`);
                }
            }

            // Clear input so same file can be selected again if needed
            e.target.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors overflow-x-hidden">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2 sm:py-4 flex justify-between items-center sticky top-0 z-40 pt-[calc(0.5rem+env(safe-area-inset-top))]">
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <div className="bg-clinical-600 text-white p-1.5 sm:p-2 rounded-lg">
                        <Settings size={18} />
                    </div>
                    <div className="md:hidden relative">
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                            {activeTab === 'INVENTORY' ? 'Inventario' :
                                activeTab === 'EQUIPMENT' ? 'Aparataje' :
                                    activeTab === 'LOCATIONS' ? 'Ubicaciones' :
                                        activeTab === 'TECHNIQUES' ? 'Técnicas' :
                                            activeTab === 'CART' ? 'Carro' :
                                                activeTab === 'USERS' ? 'Usuarios' :
                                                    activeTab === 'SETTINGS' ? 'Ajustes' :
                                                        activeTab === 'REGISTROS_STOCK' ? 'Stock' :
                                                            activeTab === 'REGISTROS_FEEDBACK' ? 'Feedback' : 'Admin'}
                        </h1>

                    </div>
                    <h1 className="hidden md:block text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">Admin</h1>
                </div>
                <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700">
                    <LogOut size={16} /> Salir
                </Button>
                <div className="hidden md:block ml-2">
                    <button onClick={handleStorageDebug} className="text-xs text-blue-500 underline">Probar Storage</button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative w-full">
                {/* Mobile Menu Backdrop */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Sidebar / Tabs */}
                <div className={`
                    fixed md:relative inset-y-0 left-0 w-72 md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
                    flex flex-col z-50 transform transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0 md:static transition-colors shrink-0
                `}>
                    {/* 1. Carros Dropdown */}
                    <div className="border-b md:border-b-0 border-transparent transition-all">
                        <button
                            onClick={() => setIsCartsOpen(!isCartsOpen)}
                            className={`w-full flex items-center justify-between px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap
                            ${activeTab === 'CART' ? 'text-clinical-700 bg-clinical-50/50 dark:text-clinical-400 dark:bg-clinical-900/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <MapPin size={18} /> Carros
                            </div>
                            {isCartsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        {isCartsOpen && (
                            <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50 flex flex-col">
                                {savedLocations
                                    .filter(l => l.type === 'CART' && !l.parent_id)
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(cart => (
                                        <button
                                            key={cart.id}
                                            onClick={() => {
                                                setActiveTab('CART');
                                                setSelectedCartId(cart.id);
                                                setIsCreating(false);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className={`flex items-center gap-3 pl-12 pr-6 py-3 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap text-left border-l-4
                                            ${activeTab === 'CART' && selectedCartId === cart.id ? 'bg-clinical-100/50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/20 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-500 dark:text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full mr-1"
                                                style={{ backgroundColor: cart.color || '#bae6fd' }}
                                            />
                                            {cart.name}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Inventario */}
                    <button
                        onClick={() => { setActiveTab('INVENTORY'); setIsCreating(false); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-6 py-4 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap
                        ${activeTab === 'INVENTORY' ? 'bg-clinical-50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/10 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <Package size={18} /> Inventario
                    </button>

                    {/* 3. Aparataje */}
                    <button
                        onClick={() => { setActiveTab('EQUIPMENT'); setIsCreating(false); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-6 py-4 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap
                        ${activeTab === 'EQUIPMENT' ? 'bg-clinical-50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/10 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <Monitor size={18} /> Aparataje
                    </button>

                    {/* 3.1 Ubicaciones */}
                    <button
                        onClick={() => { setActiveTab('LOCATIONS'); setIsCreating(false); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-6 py-4 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap
                        ${activeTab === 'LOCATIONS' ? 'bg-clinical-50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/10 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <Building2 size={18} /> Ubicaciones
                    </button>

                    {/* 4. Técnicas */}
                    <button
                        onClick={() => { setActiveTab('TECHNIQUES'); setIsCreating(false); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-6 py-4 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap
                        ${activeTab === 'TECHNIQUES' ? 'bg-clinical-50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/10 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <FilePlus size={18} /> Técnicas
                    </button>

                    {/* 5. Registros Dropdown */}
                    <div className="border-b md:border-b-0 border-transparent">
                        <button
                            onClick={() => { setIsRegistrosOpen(!isRegistrosOpen); setActiveTab('REGISTROS'); }}
                            className={`w-full flex items-center justify-between px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap
                            ${['REGISTROS', 'REGISTROS_STOCK', 'REGISTROS_FEEDBACK'].includes(activeTab) ? 'text-clinical-700 bg-clinical-50/50 dark:text-clinical-400 dark:bg-clinical-900/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <ClipboardList size={18} /> Registros
                            </div>
                            {isRegistrosOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        {isRegistrosOpen && (
                            <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50 flex flex-col">
                                <button
                                    onClick={() => { setActiveTab('REGISTROS_STOCK'); setIsCreating(false); setIsMobileMenuOpen(false); }}
                                    className={`flex items-center gap-3 pl-12 pr-6 py-3 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap text-left
                                    ${activeTab === 'REGISTROS_STOCK' ? 'bg-clinical-100/50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/20 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-500 dark:text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                                >
                                    Stock y Caducidades
                                </button>
                                <button
                                    onClick={() => { setActiveTab('REGISTROS_FEEDBACK'); setIsCreating(false); setIsMobileMenuOpen(false); }}
                                    className={`flex items-center gap-3 pl-12 pr-6 py-3 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap text-left
                                    ${activeTab === 'REGISTROS_FEEDBACK' ? 'bg-clinical-100/50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/20 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-500 dark:text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                                >
                                    Feedback
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 6. Usuarios */}
                    <button
                        onClick={() => { setActiveTab('USERS'); setIsCreating(false); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-6 py-4 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap
                        ${activeTab === 'USERS' ? 'bg-clinical-50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/10 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <Users size={18} /> Usuarios
                    </button>


                    {/* 7. Ajustes */}
                    <button
                        onClick={() => { setActiveTab('SETTINGS'); setIsCreating(false); setIsMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-6 py-4 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap
                        ${activeTab === 'SETTINGS' ? 'bg-clinical-50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/10 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <Settings size={18} /> Ajustes
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-3 sm:p-6 overflow-y-auto w-full md:w-auto">


                    {/* Delete Confirmation Modal (Global) */}
                    {deleteConfirmation.isOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 border dark:border-slate-800">
                                <div className="text-center space-y-2">
                                    <div className="mx-auto bg-red-100 dark:bg-red-900/30 w-12 h-12 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                                        <Trash2 size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">¿Confirmar eliminación?</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {deleteConfirmation.type === 'ITEM' && 'Estás a punto de eliminar este material del inventario. Esta acción no se puede deshacer.'}
                                        {deleteConfirmation.type === 'LOCATION' && 'Estás a punto de eliminar esta ubicación y TODO su contenido. Esta acción no se puede deshacer.'}
                                        {deleteConfirmation.type === 'TECHNIQUE' && 'Estás a punto de eliminar esta técnica. Esta acción no se puede deshacer.'}
                                        {deleteConfirmation.type === 'EQUIPMENT' && 'Estás a punto de eliminar este equipo (aparataje). Esta acción no se puede deshacer.'}
                                        {!deleteConfirmation.type && 'Esta acción es irreversible. Se eliminará el elemento y todas sus asociaciones.'}
                                    </p>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleConfirmDelete}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors ring-offset-2 focus:ring-2 focus:ring-red-500 outline-none"
                                    >
                                        Eliminar
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmation({ isOpen: false, type: null, id: null })}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-2 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}



                    {activeTab === 'EQUIPMENT' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Aparataje</h2>
                                <Button onClick={() => {
                                    setIsCreating(true);
                                    setEditingEquipment(null);
                                    setNewEquipment({
                                        name: '',
                                        description: '',
                                        imageUrl: '',
                                        category: 'Respiradores',
                                        stockQuantity: 1,
                                        maintenanceStatus: 'Operativo',
                                        location: '',
                                        requiresPower: false
                                    });
                                    setImagePreview(null);
                                }}>
                                    <Plus size={20} /> Nuevo Equipo
                                </Button>
                            </div>

                            {/* Search Bar for Equipment */}
                            <div className="w-full md:w-64">
                                <input
                                    type="text"
                                    placeholder="Buscar aparataje..."
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                                    value={equipmentMainSearch}
                                    onChange={(e) => setEquipmentMainSearch(e.target.value)}
                                />
                            </div>

                            {/* Equipment List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {equipment
                                    .filter(eq => eq.name.toLowerCase().includes(equipmentMainSearch.toLowerCase()))
                                    .map(eq => (
                                        <div key={eq.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow group relative">
                                            <div className="h-40 bg-slate-100 dark:bg-slate-900 relative">
                                                {eq.imageUrl ? (
                                                    <img src={eq.imageUrl} alt={eq.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                        <Monitor size={48} />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditEquipment(eq)} className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-lg text-slate-600 dark:text-slate-300 hover:text-clinical-600 dark:hover:text-clinical-400 shadow-sm" title="Editar Equipo">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteEquipment(eq.id)} className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 shadow-sm" title="Eliminar Equipo">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-bold text-slate-900 dark:text-white truncate flex-1" title={eq.name}>{eq.name}</h3>
                                                    {eq.requiresPower && (
                                                        <div className="text-amber-500" title="Requiere estar enchufado">
                                                            <Zap size={16} fill="currentColor" />
                                                        </div>
                                                    )}
                                                </div>

                                                {eq.location && (
                                                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                        <MapPin size={14} /> {eq.location}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                {equipment.length === 0 && (
                                    <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        <Monitor size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>No hay aparataje registrado.</p>
                                    </div>
                                )}
                            </div>

                            {/* Creator/Editor Modal */}
                            {isCreating && activeTab === 'EQUIPMENT' && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto border dark:border-slate-800">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                    {editingEquipment ? 'Editar Equipo' : 'Nuevo Equipo'}
                                                </h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Gestión de aparataje médico</p>
                                            </div>
                                            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                                <X size={24} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                {/* 1. Name */}
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                        placeholder="Ej: Monitor Philips"
                                                        value={newEquipment.name}
                                                        onChange={e => setNewEquipment({ ...newEquipment, name: e.target.value })}
                                                    />
                                                </div>

                                                {/* 2. Location */}
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ubicación</label>
                                                    <select
                                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                        value={newEquipment.location || ''}
                                                        onChange={e => setNewEquipment({ ...newEquipment, location: e.target.value })}
                                                    >
                                                        <option value="">Seleccionar ubicación...</option>
                                                        {savedLocations.filter(l => !l.parent_id).map(loc => (
                                                            <option key={loc.id} value={loc.name}>
                                                                {loc.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* 3. Requires Power */}
                                                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        id="requiresPower"
                                                        className="w-4 h-4 text-clinical-600 rounded focus:ring-clinical-500 border-gray-300"
                                                        checked={newEquipment.requiresPower || false}
                                                        onChange={e => setNewEquipment({ ...newEquipment, requiresPower: e.target.checked })}
                                                    />
                                                    <label htmlFor="requiresPower" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                                        Requiere estar enchufado
                                                    </label>
                                                    <Zap size={16} className={newEquipment.requiresPower ? "text-amber-500" : "text-slate-400"} />
                                                </div>

                                                {/* 5. Description */}
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                                                    <textarea
                                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none h-24 resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                        placeholder="Detalles adicionales..."
                                                        value={newEquipment.description}
                                                        onChange={e => setNewEquipment({ ...newEquipment, description: e.target.value })}
                                                    />
                                                </div>



                                            </div>

                                            <div className="space-y-4">
                                                {/* 4. Image */}
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Imagen</label>
                                                <Card className="aspect-square flex items-center justify-center bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 relative overflow-hidden group">
                                                    {imagePreview ? (
                                                        <>
                                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                                                                    Cambiar Imagen
                                                                </Button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center p-6">
                                                            <div className="mx-auto bg-slate-100 dark:bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center text-slate-400 mb-3">
                                                                <Camera size={32} />
                                                            </div>
                                                            <p className="text-sm text-slate-500 mb-3">Sube una foto del equipo</p>
                                                            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                                                Seleccionar Archivo
                                                            </Button>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                    />
                                                </Card>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t dark:border-slate-700 flex justify-end gap-3">
                                            <Button variant="ghost" onClick={() => setIsCreating(false)}>
                                                Cancelar
                                            </Button>
                                            <Button onClick={handleSaveEquipment} disabled={uploading}>
                                                {uploading ? 'Guardando...' : editingEquipment ? 'Guardar Cambios' : 'Crear Equipo'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}




                    {activeTab === 'CART' && selectedCartId && (
                        <CartView
                            cartType={selectedCartId}
                            locations={savedLocations}
                            rootLocationId={selectedCartId}
                            cartItems={activeCartHook.cartItems}
                            loading={activeCartHook.loading}
                            onManageMaterials={(locationId, locationName, cartType, existingItems) => openMaterialModalNew(locationId, locationName, cartType, 'CART', existingItems)}
                            onManageLocations={() => setActiveTab('LOCATIONS')}
                            onAddSubLocation={() => {
                                const cart = savedLocations.find(l => l.id === selectedCartId);
                                if (cart) {
                                    setSubLocationModal({ isOpen: true, parentId: cart.id, parentName: cart.name, parentType: 'CART' });
                                }
                            }}
                            onEditSubLocation={(loc) => setEditingLocation(loc)}
                            onDeleteSubLocation={(id) => handleDeleteLocation(id)}
                        />
                    )}

                    {/* Sub-location Modal (Rendered independently of tabs) */}
                    {subLocationModal.isOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-900">Nueva Sub-ubicación</h3>
                                    <button onClick={() => setSubLocationModal({ ...subLocationModal, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Creando ubicación dentro de: <span className="font-semibold text-slate-900">{subLocationModal.parentName}</span>
                                    </p>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none"
                                        placeholder="Ej: Bandeja Superior"
                                        autoFocus
                                        value={subLocationName}
                                        onChange={e => setSubLocationName(e.target.value)}
                                        onBlur={e => handleBlurCorrection(e.target.value, setSubLocationName)}
                                        onKeyDown={e => e.key === 'Enter' && handleSaveSubLocation()}
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button fullWidth onClick={handleSaveSubLocation}>Crear</Button>
                                    <Button fullWidth variant="ghost" onClick={() => setSubLocationModal({ ...subLocationModal, isOpen: false })}>Cancelar</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Editing Location Modal (Rendered independently of tabs) */}
                    {editingLocation && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 border dark:border-slate-800">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold dark:text-white">Editar Ubicación</h3>
                                    <button onClick={() => setEditingLocation(null)} className="dark:text-slate-400 dark:hover:text-white"><X size={20} /></button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-clinical-500 outline-none"
                                        value={editingLocation.name}
                                        onChange={e => setEditingLocation({ ...editingLocation, name: e.target.value })}
                                        autoFocus
                                    />
                                </div>

                                {editingLocation.type === 'CART' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color del Carro</label>
                                        <div className="flex flex-wrap gap-2">
                                            {LOCATION_COLORS.map(c => (
                                                <button
                                                    key={c.value}
                                                    onClick={() => setEditingLocation({ ...editingLocation, color: c.value === editingLocation.color ? undefined : c.value })}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all ${c.class} ${editingLocation.color === c.value ? 'border-slate-800 scale-110 shadow-lg ring-2 ring-slate-300' : 'border-transparent hover:scale-105'}`}
                                                    title={c.name}
                                                />
                                            ))}
                                            <button
                                                onClick={() => setEditingLocation({ ...editingLocation, color: undefined })}
                                                className={`w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all ${!editingLocation.color ? 'border-slate-800 dark:border-slate-200 ring-2 ring-slate-300 dark:ring-slate-600' : ''}`}
                                                title="Sin color"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <Button fullWidth onClick={handleUpdateLocation}>Guardar Cambios</Button>
                            </div>
                        </div>
                    )}


                    {activeTab === 'INVENTORY' && !isCreating && (
                        <div className="space-y-6">
                            {/* Item Detail Modal */}
                            {viewingItem && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingItem(null)}>
                                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative border dark:border-slate-800" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => setViewingItem(null)}
                                            className={`absolute top-4 right-4 rounded-full p-1 transition-colors z-10 ${viewingItem.imageUrl ? 'bg-black/30 hover:bg-black/50 text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                        >
                                            <X size={20} />
                                        </button>

                                        {viewingItem.imageUrl && (
                                            <div className="relative h-64 bg-slate-100 flex items-center justify-center">
                                                <img src={viewingItem.imageUrl} alt={viewingItem.name} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="p-6 space-y-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewingItem.name}</h3>
                                                <p className="text-slate-500 dark:text-slate-400">{viewingItem.category}</p>
                                            </div>



                                            {viewingItem.referencia_petitorio && (
                                                <div className="bg-clinical-50 dark:bg-clinical-900/20 p-3 rounded-lg border border-clinical-100 dark:border-clinical-800">
                                                    <p className="text-xs text-clinical-600 dark:text-clinical-400 uppercase font-semibold mb-1">Referencia Petitorio</p>
                                                    <p className="font-medium text-clinical-900 dark:text-clinical-100">{viewingItem.referencia_petitorio}</p>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-2">Disponible en Carros</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(() => {
                                                            const allCartItems = globalCartItems.allItems;
                                                            const matches = allCartItems.filter(ci => ci.itemId === viewingItem.id);
                                                            const uniqueCartIds = new Set<string>();
                                                            matches.forEach(match => {
                                                                const loc = savedLocations.find(l => l.id === match.locationId);
                                                                if (loc) {
                                                                    // If drawer, use parent_id. If root, use id.
                                                                    const rootId = loc.parent_id || loc.id;
                                                                    uniqueCartIds.add(rootId);
                                                                }
                                                            });

                                                            const carts = Array.from(uniqueCartIds).map(id => savedLocations.find(l => l.id === id)).filter(Boolean);

                                                            if (carts.length === 0) return <p className="text-sm text-slate-400 italic">No asignado a ningún carro</p>;

                                                            return carts.map(cart => (
                                                                <div key={cart!.id} className="flex items-center gap-2 px-3 py-2 bg-clinical-50 dark:bg-clinical-900/20 text-clinical-700 dark:text-clinical-400 rounded-lg border border-clinical-200 dark:border-clinical-800 shadow-sm">
                                                                    <div
                                                                        className="w-2 h-6 rounded-full"
                                                                        style={{ backgroundColor: cart!.color || '#bae6fd' }}
                                                                    />
                                                                    <span className="font-medium">{cart!.name}</span>
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                                <h2 className="text-lg font-bold">Listado de Materiales [ACTUALIZADO]</h2>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar..."
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                                            value={inventorySearch}
                                            onChange={(e) => setInventorySearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center shrink-0">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                                            title="Vista en Cuadrícula"
                                        >
                                            <LayoutGrid size={18} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('table')}
                                            className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                                            title="Vista en Tabla"
                                        >
                                            <List size={18} />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">

                                        <Button size="sm" className="gap-2 shrink-0 px-3 sm:px-4" onClick={() => { resetItemForm(); setIsCreating(true); }}>
                                            <Plus size={16} /> <span className="hidden sm:inline">Nuevo Material</span><span className="sm:hidden">Nuevo</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {inventory
                                        .filter(item => {
                                            if (!inventorySearch) return true;
                                            return item.name.toLowerCase().includes(inventorySearch.toLowerCase());
                                        })
                                        .sort((a, b) => {
                                            const aValue = (a[sortConfig.key] || '').toString().toLowerCase();
                                            const bValue = (b[sortConfig.key] || '').toString().toLowerCase();
                                            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                                            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                                            return 0;
                                        })
                                        .map(item => (
                                            <div
                                                key={item.id}
                                                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative"
                                                onClick={() => setViewingItem(item)}
                                            >
                                                <div className="aspect-square bg-slate-100 relative">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-900">
                                                            <Package size={48} />
                                                        </div>
                                                    )}

                                                    {/* Actions overlay */}
                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleEditItem(item)}
                                                            className="bg-white/90 dark:bg-slate-800/90 p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm hover:shadow"
                                                            title="Editar"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            className="bg-white/90 dark:bg-slate-800/90 p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 shadow-sm hover:shadow"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-3 text-center">
                                                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate" title={item.name}>
                                                        {item.name}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                    <table className="w-full text-left text-sm table-fixed">
                                        <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th
                                                    className="w-[30%] px-4 sm:px-6 py-4 font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                    onClick={() => handleSort('name')}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Package size={16} className="text-clinical-600 dark:text-clinical-400" />
                                                        Material
                                                        {sortConfig.key === 'name' && (
                                                            <span className="text-clinical-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                                        )}
                                                    </div>
                                                </th>
                                                <th className="w-[20%] px-4 sm:px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={16} className="text-clinical-600 dark:text-clinical-400" />
                                                        Ubicación Principal
                                                    </div>
                                                </th>
                                                <th className="w-[20%] px-4 sm:px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={16} className="text-clinical-600 dark:text-clinical-400" />
                                                        Ubicación Secundaria
                                                    </div>
                                                </th>
                                                <th className="w-[15%] px-4 sm:px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <ClipboardList size={16} className="text-clinical-600 dark:text-clinical-400" />
                                                        Petitorio
                                                    </div>
                                                </th>
                                                <th className="w-[15%] px-4 sm:px-6 py-4 font-bold text-slate-700 dark:text-slate-200 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Settings size={16} className="text-clinical-600 dark:text-clinical-400" />
                                                        Acciones
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {inventory
                                                .filter(item => {
                                                    if (!inventorySearch) return true;
                                                    return item.name.toLowerCase().includes(inventorySearch.toLowerCase());
                                                })
                                                .sort((a, b) => {
                                                    const aValue = (a[sortConfig.key] || '').toString().toLowerCase();
                                                    const bValue = (b[sortConfig.key] || '').toString().toLowerCase();
                                                    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                                                    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                                                    return 0;
                                                })
                                                .map(item => (
                                                    <tr
                                                        key={item.id}
                                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 group cursor-pointer"
                                                        onClick={() => setViewingItem(item)}
                                                    >
                                                        <td className="px-4 sm:px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                {item.imageUrl ? (
                                                                    <div className="relative group/img">
                                                                        <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-700 shadow-sm transition-transform group-hover/img:scale-110" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 shadow-sm border border-slate-200 dark:border-slate-600">
                                                                        <Package size={20} />
                                                                    </div>
                                                                )}
                                                                <span className="font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">{item.name}</span>
                                                            </div>
                                                        </td>
                                                        {(() => {
                                                            const matches = globalCartItems.allItems.filter(ci => ci.itemId === item.id);
                                                            const warehouseLocations = matches
                                                                .map(m => savedLocations.find(l => l.id === m.locationId))
                                                                .filter(l => l && l.type !== 'CART');

                                                            // Determine pairs for alignment
                                                            const locationPairs = warehouseLocations.length > 0 ? warehouseLocations.map(loc => {
                                                                if (!loc) return { p: '?', s: '?' };
                                                                const isSub = !!loc.parent_id;
                                                                const parent = isSub ? savedLocations.find(p => p.id === loc.parent_id) : null;
                                                                return {
                                                                    principal: isSub ? (parent?.name || 'Unknown') : loc.name,
                                                                    secondary: isSub ? loc.name : '',
                                                                    color: isSub ? parent?.color : loc.color
                                                                };
                                                            }) : [];

                                                            return (
                                                                <>
                                                                    <td className="w-[20%] px-4 sm:px-6 py-4">
                                                                        {locationPairs.length === 0 ? (
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">Sin asignar</span>
                                                                        ) : (
                                                                            <div className="flex flex-col gap-1.5">
                                                                                {locationPairs.map((pair, idx) => (
                                                                                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                                                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pair.color || '#94a3b8' }} />
                                                                                        {pair.principal}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="w-[20%] px-4 sm:px-6 py-4">
                                                                        {locationPairs.length === 0 ? (
                                                                            <span className="text-slate-300 dark:text-slate-600">--</span>
                                                                        ) : (
                                                                            <div className="flex flex-col gap-1.5">
                                                                                {locationPairs.map((pair, idx) => (
                                                                                    <div key={idx} className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                                                                        {pair.secondary || <span className="text-slate-300 dark:text-slate-600">--</span>}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </>
                                                            );
                                                        })()}
                                                        <td className="w-[15%] px-4 sm:px-6 py-4">
                                                            {item.referencia_petitorio ? (
                                                                <span className="px-2 py-1 bg-clinical-50 dark:bg-clinical-900/30 text-clinical-700 dark:text-clinical-400 rounded-md font-mono text-xs border border-clinical-100 dark:border-clinical-800/50">
                                                                    {item.referencia_petitorio}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 dark:text-slate-600 italic">--</span>
                                                            )}
                                                        </td>
                                                        <td className="w-[15%] px-4 sm:px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-1 sm:gap-2" onClick={e => e.stopPropagation()}>
                                                                <button
                                                                    onClick={() => handleEditItem(item)}
                                                                    className="p-2 text-slate-400 hover:text-clinical-600 dark:hover:text-clinical-400 hover:bg-clinical-50 dark:hover:bg-clinical-900/20 rounded-lg transition-all"
                                                                    title="Editar"
                                                                >
                                                                    <Edit size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteItem(item.id)}
                                                                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Material Creator/Editor Modal */}
                    {isCreating && activeTab === 'INVENTORY' && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto" onClick={() => setIsCreating(false)}>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full my-8 animate-in fade-in zoom-in-95 duration-200 border dark:border-slate-800" onClick={e => e.stopPropagation()}>
                                <div className="p-6 space-y-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingItem ? 'Editar Material' : 'Añadir Nuevo Material'}</h2>
                                        <button
                                            onClick={() => setIsCreating(false)}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
                                        {/* Camera / Image Upload Section */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Foto del Material</label>

                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div
                                                    className="w-full md:w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative"
                                                >
                                                    {imagePreview ? (
                                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Camera size={32} />
                                                    )}
                                                </div>

                                                <div className="flex-1 space-y-3">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        capture="environment"
                                                        className="hidden"
                                                        ref={fileInputRef}
                                                        onChange={handleImageChange}
                                                    />

                                                    <Button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        fullWidth
                                                        variant="outline"
                                                        className="gap-2 h-12"
                                                    >
                                                        <Upload size={18} />
                                                        Subir Imagen
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Material</label>
                                                <input
                                                    type="text"
                                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    placeholder="Ej: Gasas Estériles"
                                                    value={newItem.name}
                                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Referencia Petitorio</label>
                                                <input
                                                    type="text"
                                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    placeholder="Ej: REF-12345"
                                                    value={newItem.referencia_petitorio}
                                                    onChange={e => setNewItem({ ...newItem, referencia_petitorio: e.target.value })}
                                                />
                                            </div>

                                        </div>

                                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ubicación Stock General</label>
                                                <select
                                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    value={selectedParentLocation}
                                                    onChange={e => {
                                                        setSelectedParentLocation(e.target.value);
                                                        setSelectedSubLocation(''); // Reset sub selection when parent changes
                                                    }}
                                                >
                                                    <option value="">Seleccionar ubicación...</option>
                                                    {savedLocations
                                                        .filter(l => l.type !== 'CART' && !l.parent_id)
                                                        .sort((a, b) => a.name.localeCompare(b.name))
                                                        .map(loc => (
                                                            <option key={loc.id} value={loc.id}>
                                                                {loc.name}
                                                            </option>
                                                        ))}
                                                </select>
                                                <p className="text-[10px] text-slate-500 mt-1 italic">Solo aparecen Almacenes y ubicaciones Externas</p>
                                            </div>

                                            {selectedParentLocation && (
                                                <div className="animate-in slide-in-from-top-2 duration-200">
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ubicación Secundaria (Fila/Armario)</label>
                                                    <select
                                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                        value={selectedSubLocation}
                                                        onChange={e => setSelectedSubLocation(e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Seleccionar sub-ubicación...</option>
                                                        {savedLocations
                                                            .filter(l => l.parent_id === selectedParentLocation)
                                                            .sort((a, b) => a.name.localeCompare(b.name))
                                                            .map(sub => (
                                                                <option key={sub.id} value={sub.id}>
                                                                    {sub.name}
                                                                </option>
                                                            ))}
                                                    </select>
                                                    <p className="text-[10px] text-amber-500 mt-1 italic font-medium">Debes seleccionar una sub-ubicación específica</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3 border-t dark:border-slate-800">
                                        <Button fullWidth onClick={handleSaveMaterial} disabled={uploading}>
                                            {uploading ? 'Guardando...' : (editingItem ? 'Actualizar Material' : 'Guardar Material')}
                                        </Button>
                                        <Button fullWidth variant="ghost" onClick={() => setIsCreating(false)} disabled={uploading}>Cancelar</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {
                        activeTab === 'TECHNIQUES' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-bold">Técnicas</h2>
                                    <Button size="sm" className="gap-2" onClick={() => setIsCreating(true)}>
                                        <Plus size={16} /> Nueva Técnica
                                    </Button>
                                </div>

                                {/* Search Bar for Techniques */}
                                <div className="w-full md:w-64">
                                    <input
                                        type="text"
                                        placeholder="Buscar técnica..."
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                                        value={techniqueSearch}
                                        onChange={(e) => setTechniqueSearch(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(liveTechniques.length > 0 ? liveTechniques : techniques)
                                        .filter(tech => tech.name.toLowerCase().includes(techniqueSearch.toLowerCase()))
                                        .map(tech => (
                                            <Card
                                                key={tech.id}
                                                className="p-4 cursor-pointer hover:shadow-md transition-shadow group relative"
                                                onClick={() => setViewingTechnique(tech)}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-clinical-600 dark:group-hover:text-clinical-400 transition-colors">{tech.name}</h3>
                                                    <div className="flex -space-x-1">
                                                        {tech.cartIds?.map(cid => {
                                                            const cart = savedLocations.find(l => l.id === cid);
                                                            if (!cart) return null;
                                                            return (
                                                                <div
                                                                    key={cid}
                                                                    className="w-4 h-4 rounded-full border border-white shadow-sm"
                                                                    style={{ backgroundColor: cart.color || '#bae6fd' }}
                                                                    title={cart.name}
                                                                />
                                                            );
                                                        })}
                                                        {(!tech.cartIds || tech.cartIds.length === 0) && (
                                                            <span className="text-xs text-slate-400">Sin carro</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                    <Button size="sm" variant="outline" fullWidth onClick={() => handleEditTechnique(tech)}>Editar</Button>
                                                    <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteTechnique(tech.id)}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </Card>
                                        ))}
                                </div>
                            </div>
                        )
                    }


                    {
                        activeTab === 'TECHNIQUES' && isCreating && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto" onClick={() => setIsCreating(false)}>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full my-8 animate-in fade-in zoom-in-95 duration-200 border dark:border-slate-800" onClick={e => e.stopPropagation()}>
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingTechnique ? 'Editar Técnica' : 'Nueva Técnica'}</h2>
                                            <button
                                                onClick={() => setIsCreating(false)}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                                            >
                                                <X size={24} />
                                            </button>
                                        </div>

                                        <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Técnica</label>
                                                <input
                                                    type="text"
                                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    placeholder="Ej: Sondaje Vesical"
                                                    value={newTechnique.name}
                                                    onChange={e => setNewTechnique({ ...newTechnique, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                                                <textarea
                                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none h-24 resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    placeholder="Descripción del procedimiento..."
                                                    value={newTechnique.description}
                                                    onChange={e => setNewTechnique({ ...newTechnique, description: e.target.value })}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Documento del Protocolo (PDF)</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.doc,.docx"
                                                            className="hidden"
                                                            id="protocol-upload"
                                                            onChange={handleProtocolUpload}
                                                            disabled={uploadingProtocol}
                                                        />
                                                        <label
                                                            htmlFor="protocol-upload"
                                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${uploadingProtocol ? 'opacity-50 pointer-events-none' : ''}`}
                                                        >
                                                            <Upload size={18} className="text-slate-500 dark:text-slate-400" />
                                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                {uploadingProtocol ? 'Subiendo...' : 'Subir Documento'}
                                                            </span>
                                                        </label>
                                                    </div>

                                                    {newTechnique.protocolUrl && (
                                                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                                            <FileText size={16} className="text-indigo-600" />
                                                            <span className="text-xs font-medium text-indigo-700">Documento Adjunto</span>
                                                            <a
                                                                href={newTechnique.protocolUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-xs text-indigo-500 hover:text-indigo-700 underline"
                                                            >
                                                                Ver
                                                            </a>
                                                            <button
                                                                onClick={() => setNewTechnique(prev => ({ ...prev, protocolUrl: '' }))}
                                                                className="ml-1 text-indigo-400 hover:text-red-500"
                                                                title="Eliminar documento"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Carros Asociados</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {savedLocations.filter(l => l.type === 'CART' && !l.parent_id).map(cart => {
                                                        const isSelected = newTechnique.cartIds?.includes(cart.id);
                                                        return (
                                                            <button
                                                                key={cart.id}
                                                                onClick={() => {
                                                                    const current = newTechnique.cartIds || [];
                                                                    const updated = isSelected
                                                                        ? current.filter(id => id !== cart.id)
                                                                        : [...current, cart.id];
                                                                    setNewTechnique({ ...newTechnique, cartIds: updated });
                                                                }}
                                                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2
                                                    ${isSelected
                                                                        ? 'bg-clinical-50 border-clinical-500 text-clinical-700 dark:bg-clinical-900/30 dark:text-clinical-400 shadow-sm'
                                                                        : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                                            >
                                                                <div
                                                                    className="w-2 h-8 rounded-full"
                                                                    style={{ backgroundColor: cart.color || '#bae6fd' }}
                                                                />
                                                                {cart.name}
                                                                {isSelected && <Check size={14} />}
                                                            </button>
                                                        );
                                                    })}
                                                    {savedLocations.filter(l => l.type === 'CART' && !l.parent_id).length === 0 && (
                                                        <p className="text-sm text-slate-400 italic">No hay carros disponibles</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Materiales Necesarios</label>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-2"
                                                        onClick={() => setItemSelectorOpen(true)}
                                                    >
                                                        <Settings size={16} /> Gestionar Materiales
                                                    </Button>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                                    {selectedTechItems.length === 0 ? (
                                                        <p className="text-sm text-slate-500 italic text-center py-4">No hay materiales seleccionados</p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {selectedTechItems.map(si => {
                                                                const item = inventory.find(i => i.id === si.itemId);
                                                                // Find locations for this item, prioritizing Carts and including colors
                                                                const allItemLocs = globalCartItems.allItems
                                                                    .filter(ci => ci.itemId === si.itemId)
                                                                    .map(ci => {
                                                                        const loc = savedLocations.find(l => l.id === ci.locationId);
                                                                        if (!loc) return null;
                                                                        let isCart = loc.type === 'CART';
                                                                        let parentName = '';
                                                                        let color = loc.color || '#94a3b8'; // Default grey
                                                                        if (loc.parent_id) {
                                                                            const parent = savedLocations.find(pl => pl.id === loc.parent_id);
                                                                            if (parent?.type === 'CART') {
                                                                                isCart = true;
                                                                                color = parent.color || color;
                                                                            }
                                                                            parentName = parent?.name || '';
                                                                        }
                                                                        return {
                                                                            isCart,
                                                                            color,
                                                                            text: parentName ? `${parentName} - ${loc.name}` : loc.name
                                                                        };
                                                                    })
                                                                    .filter(Boolean) as { isCart: boolean; color: string; text: string }[];

                                                                const cartLocs = allItemLocs.filter(l => l.isCart);
                                                                const itemLocations = cartLocs.length > 0 ? cartLocs : allItemLocs;

                                                                return (
                                                                    <div key={si.itemId} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                                            <img src={item?.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
                                                                            <div className="flex flex-col min-w-0">
                                                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{item?.name || 'Material sin nombre'}</span>
                                                                                {itemLocations.length > 0 ? (
                                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                                        {itemLocations.map((loc, idx) => (
                                                                                            <span
                                                                                                key={idx}
                                                                                                className="text-[10px] bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded flex items-center gap-1 border transition-colors"
                                                                                                style={{
                                                                                                    backgroundColor: loc.isCart ? `${loc.color}15` : undefined,
                                                                                                    borderColor: loc.isCart ? `${loc.color}40` : 'transparent',
                                                                                                    color: loc.isCart ? loc.color : undefined
                                                                                                }}
                                                                                            >
                                                                                                <MapPin size={10} /> {loc.text}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-[10px] text-amber-500 italic mt-0.5">Sin ubicación asignada</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <span className="bg-clinical-100 text-clinical-700 font-bold px-2 py-0.5 rounded text-xs ml-2">x{si.quantity}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Aparataje Necesario</label>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-2"
                                                        onClick={() => setEquipmentSelectorOpen(true)}
                                                    >
                                                        <Monitor size={16} /> Gestionar Aparataje
                                                    </Button>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                                    {selectedTechEquipment.length === 0 ? (
                                                        <p className="text-sm text-slate-500 italic text-center py-4">No hay aparataje seleccionado</p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {selectedTechEquipment.map(se => {
                                                                const eq = equipment.find(e => e.id === se.equipmentId);
                                                                return (
                                                                    <div key={se.equipmentId} className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                                            <img src={eq?.imageUrl} className="w-8 h-8 rounded object-cover bg-slate-100" />
                                                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{eq?.name || 'Equipo sin nombre'}</span>
                                                                        </div>
                                                                        <span className="bg-clinical-100 text-clinical-700 font-bold px-2 py-0.5 rounded text-xs">x{se.quantity}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-4 flex gap-3 border-t dark:border-slate-800">
                                                <Button fullWidth onClick={handleAddTechnique}>{editingTechnique ? 'Actualizar' : 'Crear Técnica'}</Button>
                                                <Button fullWidth variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    {
                        activeTab === 'LOCATIONS' && (
                            <div className="space-y-6">





                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Añadir Nueva Ubicación Principal</h3>
                                    <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                                        <div className="flex-1 w-full">
                                            <label htmlFor="loc-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                                            <input
                                                id="loc-name"
                                                type="text"
                                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                                                placeholder="Ej: Almacén de sueros, Séptico..."
                                                value={newLocation.name}
                                                onChange={e => setNewLocation({ ...newLocation, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="w-full sm:w-48">
                                            <label htmlFor="loc-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                                            <select
                                                id="loc-type"
                                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                value={newLocation.type}
                                                onChange={e => setNewLocation({ ...newLocation, type: e.target.value as any })}
                                            >
                                                <option value="CART">Carro</option>
                                                <option value="WAREHOUSE">Almacén</option>
                                                <option value="EXTERNAL">Externo</option>
                                            </select>
                                        </div>
                                        <Button onClick={handleInitiateCreateLocation} className="w-full sm:w-auto mb-0.5" disabled={!newLocation.name}>Añadir</Button>
                                    </div>
                                </div>

                                {/* Color Selection Modal (Step 2 for Carts) */}
                                {colorSelectionModal.isOpen && (
                                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full p-6 space-y-6 transform scale-100">
                                            <div className="text-center">
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Elige un color</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                                    Para identificar el carro "{colorSelectionModal.pendingLocation?.name}"
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-3 justify-center">
                                                {LOCATION_COLORS.map(c => (
                                                    <button
                                                        key={c.value}
                                                        onClick={() => colorSelectionModal.pendingLocation && finalCreateLocation(colorSelectionModal.pendingLocation.name, colorSelectionModal.pendingLocation.type, colorSelectionModal.pendingLocation.parentId || null, c.value)}
                                                        className={`w-10 h-10 rounded-full border-2 transition-all transform hover:scale-110 ${c.class} border-transparent shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400`}
                                                        title={c.name}
                                                    />
                                                ))}
                                                <button
                                                    onClick={() => colorSelectionModal.pendingLocation && finalCreateLocation(colorSelectionModal.pendingLocation.name, colorSelectionModal.pendingLocation.type, colorSelectionModal.pendingLocation.parentId || null, null)}
                                                    className="w-10 h-10 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
                                                    title="Sin color"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                fullWidth
                                                onClick={() => setColorSelectionModal({ isOpen: false, pendingLocation: null })}
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                )}





                                {/* Grouped Locations View */}
                                <div className="space-y-8">
                                    {/* 1. Carros */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                                            <MapPin className="text-clinical-600" />
                                            Carros
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {savedLocations.filter(l => !l.parent_id && l.type === 'CART').map(root => (
                                                <div key={root.id} className="space-y-2">
                                                    <Card
                                                        className="p-4 flex justify-between items-center group bg-white dark:bg-slate-800 border-l-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        style={{ borderLeftColor: root.color || '#bae6fd' }}
                                                        onClick={() => toggleLocation(root.id)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {expandedLocations.has(root.id) ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 dark:text-white">{root.name}</h4>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {savedLocations.filter(child => child.parent_id === root.id).length} sub-ubicaciones
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingLocation({ id: root.id, name: root.name, type: root.type, color: root.color }); }} title="Editar">
                                                                <Edit size={16} className="text-slate-400 hover:text-indigo-600" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSubLocationModal({ isOpen: true, parentId: root.id, parentName: root.name, parentType: 'CART' }); }} title="Añadir sub-ubicación">
                                                                <Plus size={16} className="text-clinical-600" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDeleteLocation(root.id); }} title="Borrar">
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                    {/* Sub-locations (Collapsible) */}
                                                    {expandedLocations.has(root.id) && (
                                                        <div className="pl-6 space-y-2 border-l-2 border-slate-200 dark:border-slate-700 ml-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                                            {savedLocations.filter(child => child.parent_id === root.id).map(child => (
                                                                <Card key={child.id} className="p-3 flex justify-between items-center group bg-slate-50 dark:bg-slate-700">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500"></div>
                                                                        <h4 className="font-medium text-slate-700 dark:text-slate-200 text-sm">{child.name}</h4>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <Button variant="ghost" size="sm" onClick={() => setEditingLocation({ id: child.id, name: child.name, type: child.type, color: child.color })} title="Editar">
                                                                            <Edit size={14} className="text-slate-400 hover:text-indigo-600" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLocation(child.id)} title="Borrar">
                                                                            <Trash2 size={14} className="text-slate-400 hover:text-red-600" />
                                                                        </Button>
                                                                    </div>
                                                                </Card>
                                                            ))}
                                                            {savedLocations.filter(child => child.parent_id === root.id).length === 0 && (
                                                                <div className="text-sm text-slate-400 italic px-4 py-2">No hay sub-ubicaciones</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {savedLocations.filter(l => !l.parent_id && l.type === 'CART').length === 0 && (
                                                <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg italic">
                                                    No hay carros definidos.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Almacenes (Warehouses) */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                                            <Package className="text-sky-500" />
                                            Almacenes
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {savedLocations.filter(l => !l.parent_id && l.type === 'WAREHOUSE').map(root => (
                                                <div key={root.id} className="space-y-2">
                                                    <Card
                                                        className="p-4 flex justify-between items-center group bg-white dark:bg-slate-800 border-l-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        style={{ borderLeftColor: '#0ea5e9' }} // Sky/Light Blue
                                                        onClick={() => toggleLocation(root.id)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {expandedLocations.has(root.id) ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 dark:text-white">{root.name}</h4>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {savedLocations.filter(child => child.parent_id === root.id).length} sub-ubicaciones
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingLocation({ id: root.id, name: root.name, type: root.type, color: root.color }); }} title="Editar">
                                                                <Edit size={16} className="text-slate-400 hover:text-indigo-600" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSubLocationModal({ isOpen: true, parentId: root.id, parentName: root.name, parentType: 'WAREHOUSE' }); }} title="Añadir sub-ubicación">
                                                                <Plus size={16} className="text-sky-500" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDeleteLocation(root.id); }} title="Borrar">
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                    {/* Sub-locations (Collapsible) */}
                                                    {expandedLocations.has(root.id) && (
                                                        <div className="pl-6 space-y-2 border-l-2 border-slate-200 dark:border-slate-700 ml-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                                            {savedLocations.filter(child => child.parent_id === root.id).map(child => (
                                                                <Card key={child.id} className="p-3 flex justify-between items-center group bg-slate-50 dark:bg-slate-700">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500"></div>
                                                                        <h4 className="font-medium text-slate-700 dark:text-slate-200 text-sm">{child.name}</h4>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <Button variant="ghost" size="sm" onClick={() => setEditingLocation({ id: child.id, name: child.name, type: child.type, color: child.color })} title="Editar">
                                                                            <Edit size={14} className="text-slate-400 hover:text-indigo-600" />
                                                                        </Button>

                                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLocation(child.id)} title="Borrar">
                                                                            <Trash2 size={14} className="text-slate-400 hover:text-red-600" />
                                                                        </Button>
                                                                    </div>
                                                                </Card>
                                                            ))}
                                                            {savedLocations.filter(child => child.parent_id === root.id).length === 0 && (
                                                                <div className="text-sm text-slate-400 italic px-4 py-2">No hay sub-ubicaciones</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {savedLocations.filter(l => !l.parent_id && l.type === 'WAREHOUSE').length === 0 && (
                                                <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg italic">
                                                    No hay almacenes definidos.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Externos (External) */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                                            <MapPin className="text-slate-600" />
                                            Externos
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {savedLocations.filter(l => !l.parent_id && l.type === 'EXTERNAL').map(root => (
                                                <div key={root.id} className="space-y-2">
                                                    <Card
                                                        className="p-4 flex justify-between items-center group bg-white dark:bg-slate-800 border-l-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        style={{ borderLeftColor: '#94a3b8' }} // Slate
                                                        onClick={() => toggleLocation(root.id)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {expandedLocations.has(root.id) ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 dark:text-white">{root.name}</h4>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {savedLocations.filter(child => child.parent_id === root.id).length} sub-ubicaciones
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingLocation({ id: root.id, name: root.name, type: root.type, color: root.color }); }} title="Editar">
                                                                <Edit size={16} className="text-slate-400 hover:text-indigo-600" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSubLocationModal({ isOpen: true, parentId: root.id, parentName: root.name, parentType: 'EXTERNAL' }); }} title="Añadir sub-ubicación">
                                                                <Plus size={16} className="text-slate-600" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDeleteLocation(root.id); }} title="Borrar">
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                    {/* Sub-locations (Collapsible) */}
                                                    {expandedLocations.has(root.id) && (
                                                        <div className="pl-6 space-y-2 border-l-2 border-slate-200 dark:border-slate-700 ml-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                                            {savedLocations.filter(child => child.parent_id === root.id).map(child => (
                                                                <Card key={child.id} className="p-3 flex justify-between items-center group bg-slate-50 dark:bg-slate-700">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500"></div>
                                                                        <h4 className="font-medium text-slate-700 dark:text-slate-200 text-sm">{child.name}</h4>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <Button variant="ghost" size="sm" onClick={() => setEditingLocation({ id: child.id, name: child.name, type: child.type, color: child.color })} title="Editar">
                                                                            <Edit size={14} className="text-slate-400 hover:text-indigo-600" />
                                                                        </Button>

                                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLocation(child.id)} title="Borrar">
                                                                            <Trash2 size={14} className="text-slate-400 hover:text-red-600" />
                                                                        </Button>
                                                                    </div>
                                                                </Card>
                                                            ))}
                                                            {savedLocations.filter(child => child.parent_id === root.id).length === 0 && (
                                                                <div className="text-sm text-slate-400 italic px-4 py-2">No hay sub-ubicaciones</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {savedLocations.filter(l => !l.parent_id && l.type === 'EXTERNAL').length === 0 && (
                                                <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg italic">
                                                    No hay ubicaciones externas.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {activeTab === 'USERS' && <UsersView />}


                    {activeTab === 'SETTINGS' && <SettingsView unitId={unitId} />}

                    {
                        ['REGISTROS', 'REGISTROS_STOCK', 'REGISTROS_FEEDBACK'].includes(activeTab) && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-bold">
                                        {activeTab === 'REGISTROS_STOCK' ? 'Registro de Stock y Caducidades' :
                                            activeTab === 'REGISTROS_FEEDBACK' ? 'Feedback de Usuarios' :
                                                'Registro de Actividad e Incidencias'}
                                    </h2>
                                    <Button size="sm" variant="outline" className="gap-2" onClick={() => { fetchIncidents(); fetchFeedbacks(); refreshRevisions(); }}>
                                        <Clock size={16} /> Actualizar
                                    </Button>
                                </div>


                                <div className="space-y-4">
                                    {activeTab === 'REGISTROS_STOCK' && (() => {
                                        // Calculate latest revision per location
                                        const latestRevisions = revisions.reduce((acc: any[], curr: any) => {
                                            if (!acc.find(item => item.location_id === curr.location_id) && curr.locations) {
                                                acc.push({
                                                    location_id: curr.location_id,
                                                    location_name: curr.locations.name,
                                                    location_color: curr.locations.color,
                                                    date: curr.created_at
                                                });
                                            }
                                            return acc;
                                        }, []).sort((a: any, b: any) => a.location_name.localeCompare(b.location_name));

                                        if (latestRevisions.length === 0) return null;

                                        return (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
                                                {latestRevisions.map((item: any) => (
                                                    <div
                                                        key={item.location_id}
                                                        className="bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex items-center"
                                                        style={{ borderColor: item.location_color || '#e2e8f0' }}
                                                    >
                                                        {/* Color accent bar */}
                                                        <div
                                                            className="absolute top-0 left-0 w-1.5 h-full"
                                                            style={{ backgroundColor: item.location_color || '#e2e8f0' }}
                                                        />

                                                        <div className="pl-3">
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate" title={item.location_name}>
                                                                {item.location_name}
                                                            </div>
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                                    {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {new Date(item.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>

                                <Card className="overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400">Fecha</th>
                                                    {activeTab === 'REGISTROS_STOCK' ? (
                                                        <>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400">Revisor</th>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400">Ubicación</th>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400 hidden sm:table-cell">Caducidades</th>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400 text-right">Notas</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400">Valor/Estado</th>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400 hidden sm:table-cell">Técnica</th>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400">Incidencia</th>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400 text-right">Descripción</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {(loadingIncidents || loadingFeedbacks || (activeTab === 'REGISTROS_STOCK' && loadingRevisions)) ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Cargando registros...</td>
                                                    </tr>
                                                ) : (() => {
                                                    if (activeTab === 'REGISTROS_STOCK') {
                                                        if (revisions.length === 0) return (
                                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No hay revisiones de stock.</td></tr>
                                                        );
                                                        return revisions.map((rev: any) => (
                                                            <tr key={rev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                                    <div className="text-xs sm:text-sm">
                                                                        {new Date(rev.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                                    </div>
                                                                    <div className="text-[10px] sm:hidden text-slate-400">
                                                                        {new Date(rev.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-900 dark:text-slate-200 text-xs sm:text-sm">{rev.reviewer_name}</td>
                                                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 dark:text-slate-400">
                                                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                                                        <span
                                                                            className="w-2 h-2 sm:w-3 sm:h-3 rounded-full shrink-0"
                                                                            style={{ backgroundColor: rev.locations?.color || '#cbd5e1' }}
                                                                        />
                                                                        <span className="truncate max-w-[80px] sm:max-w-none">{rev.locations?.name || 'Desconocida'}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                                                    {rev.expiry_checked ? (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">
                                                                            <Check size={12} /> Revisado
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-slate-400 text-xs">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-slate-500 dark:text-slate-400 italic max-w-[100px] sm:max-w-xs truncate text-xs sm:text-sm">
                                                                    {rev.notes || '-'}
                                                                </td>
                                                            </tr>
                                                        ));
                                                    }

                                                    let rows = [];

                                                    if (activeTab === 'REGISTROS_FEEDBACK') {
                                                        rows = feedbacks.map(feedback => ({
                                                            id: feedback.id,
                                                            created_at: feedback.created_at,
                                                            type: feedback.type,
                                                            description: feedback.description,
                                                            category: feedback.issue || feedback.category,
                                                            rating: feedback.rating,
                                                            related_technique_id: feedback.technique_id,
                                                            source: 'feedback'
                                                        }));
                                                    } else {
                                                        // ALL REGISTROS (Merged view if desired, or just incidents for now)
                                                        const incidentRows = incidents.map(i => ({
                                                            id: i.id,
                                                            created_at: i.created_at,
                                                            type: i.type === 'INCIDENCE' ? 'INCIDENCE' : 'OTHER',
                                                            description: i.description || '',
                                                            category: i.category,
                                                            status: i.status,
                                                            related_technique_id: i.related_technique_id,
                                                            source: 'incident'
                                                        }));
                                                        const feedbackRows = feedbacks.map(f => ({
                                                            id: f.id,
                                                            created_at: f.created_at,
                                                            type: f.type,
                                                            description: f.description,
                                                            category: f.issue || f.category,
                                                            rating: f.rating,
                                                            related_technique_id: f.technique_id,
                                                            source: 'feedback'
                                                        }));
                                                        rows = [...incidentRows, ...feedbackRows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                                                    }

                                                    if (rows.length === 0) {
                                                        return (
                                                            <tr>
                                                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No hay registros disponibles.</td>
                                                            </tr>
                                                        );
                                                    }

                                                    return rows.map((row: any) => (
                                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 whitespace-nowrap">
                                                                <div className="text-xs sm:text-sm">
                                                                    {new Date(row.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                                </div>
                                                                <div className="text-[10px] sm:hidden text-slate-400">
                                                                    {new Date(row.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                                {row.source === 'incident' ? (
                                                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium ${row.status === 'OPEN' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                        row.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                                            'bg-slate-50 text-slate-400 border border-slate-100'
                                                                        }`}>
                                                                        {row.status === 'OPEN' ? 'Pendiente' :
                                                                            row.status === 'RESOLVED' ? 'Resuelto' : 'Descartado'}
                                                                    </span>
                                                                ) : (
                                                                    row.rating ? (
                                                                        <div className="flex text-amber-400 text-[10px] sm:text-sm">
                                                                            {'★'.repeat(row.rating)}
                                                                            <span className="text-slate-200">{'★'.repeat(5 - row.rating)}</span>
                                                                        </div>
                                                                    ) : <span className="text-slate-400 text-xs">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 hidden sm:table-cell text-sm">
                                                                {row.related_technique_id ?
                                                                    (techniques.find((t: any) => t.id === row.related_technique_id)?.name || '-')
                                                                    : '-'
                                                                }
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${row.type === 'INCIDENCE' ? 'bg-red-100 text-red-700' :
                                                                    row.type === 'RATING' ? 'bg-indigo-100 text-indigo-700' :
                                                                        row.type === 'SUGGESTION' ? 'bg-amber-100 text-amber-700' :
                                                                            'bg-slate-100 text-slate-700'
                                                                    }`}>
                                                                    {row.category || (
                                                                        row.type === 'INCIDENCE' ? 'Incidencia' :
                                                                            row.type === 'RATING' ? 'Valoración' :
                                                                                row.type === 'SUGGESTION' ? 'Sugerencia' : 'Comentario'
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-900 min-w-[120px] sm:min-w-[200px] text-right">
                                                                <p className="font-medium text-xs sm:text-sm line-clamp-2 sm:line-clamp-none">{row.description}</p>
                                                                {row.category && <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase mt-0.5 sm:mt-1">{row.category}</p>}
                                                            </td>
                                                        </tr>
                                                    ));
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        )
                    }
                </div >
            </div >
            {/* Material Selector Modal for Sub-Locations (Drawers) */}
            {activeTab === 'CART' && addMaterialData.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-4xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3 shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Gestionar Material ({addMaterialData.locationType})</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Editando contenido de: <span className="font-bold text-indigo-600 dark:text-indigo-400">{addMaterialData.targetLocationName}</span>
                                </p>
                            </div>
                            <button onClick={() => setAddMaterialData({ ...addMaterialData, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden min-h-0">
                            {/* LEFT COLUMN: Available Materials */}
                            <div className="flex-1 flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-4 md:pb-0 md:pr-6">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                    <List size={18} /> Disponibles
                                </h4>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-clinical-500 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                    placeholder="Buscar material..."
                                    value={addMaterialData.searchTerm}
                                    onChange={e => setAddMaterialData(prev => ({ ...prev, searchTerm: e.target.value }))}
                                    autoFocus
                                />
                                <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                                    {inventory
                                        .filter(item => item.name.toLowerCase().includes(addMaterialData.searchTerm.toLowerCase()))
                                        .map(item => {
                                            const isSelected = !!addMaterialData.selectedItems[item.id];
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`p-3 flex items-center gap-3 cursor-pointer rounded-lg border transition-all ${isSelected
                                                        ? 'bg-clinical-50 dark:bg-clinical-900/20 border-clinical-500 ring-1 ring-clinical-500'
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                        }`}
                                                    onClick={() => toggleMaterialSelection(item.id)}
                                                >
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-clinical-600 border-clinical-600' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                                                        {isSelected && <Check size={14} className="text-white" />}
                                                    </div>
                                                    {item.imageUrl && <img src={item.imageUrl} className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 object-cover" alt="" />}
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Selected Materials */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                    <Package size={18} /> Seleccionados
                                    <span className="text-xs bg-clinical-100 text-clinical-700 px-2 py-0.5 rounded-full">
                                        {Object.keys(addMaterialData.selectedItems).length}
                                    </span>
                                </h4>

                                {Object.keys(addMaterialData.selectedItems).length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
                                        <Package size={48} className="mb-4 opacity-20" />
                                        <p>Selecciona materiales a la izquierda</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                        {Object.entries(addMaterialData.selectedItems).map(([itemId, rawData]) => {
                                            const data = rawData as { stockIdeal: number; nextExpiryDate: string };
                                            const item = inventory.find(i => i.id === itemId);
                                            if (!item) return null;
                                            return (
                                                <div key={itemId} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            {item.imageUrl && <img src={item.imageUrl} className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 object-cover" alt="" />}
                                                            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{item.name}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => toggleMaterialSelection(itemId)}
                                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-500 mb-1">Stock Ideal</label>
                                                            <div className="flex items-center">
                                                                <button
                                                                    onClick={() => updateSelectedMaterial(itemId, 'stockIdeal', Math.max(1, data.stockIdeal - 1))}
                                                                    className="w-8 h-8 rounded-l border border-r-0 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600"
                                                                >
                                                                    -
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    value={data.stockIdeal}
                                                                    onChange={e => updateSelectedMaterial(itemId, 'stockIdeal', parseInt(e.target.value) || 1)}
                                                                    className="w-12 h-8 border-y border-slate-200 dark:border-slate-600 text-center text-sm outline-none dark:bg-slate-800 dark:text-white"
                                                                />
                                                                <button
                                                                    onClick={() => updateSelectedMaterial(itemId, 'stockIdeal', data.stockIdeal + 1)}
                                                                    className="w-8 h-8 rounded-r border border-l-0 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {addMaterialData.locationType === 'CART' && (
                                                            <div>
                                                                <label className="block text-xs font-medium text-slate-500 mb-1">Caducidad</label>
                                                                <input
                                                                    type="date"
                                                                    value={data.nextExpiryDate}
                                                                    onChange={e => updateSelectedMaterial(itemId, 'nextExpiryDate', e.target.value)}
                                                                    className="w-full h-8 border border-slate-200 dark:border-slate-700 rounded px-2 text-xs outline-none focus:border-clinical-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Button onClick={handleAddMaterialToCart}>
                                Guardar Cambios
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Material Selector Modal for Techniques */}
            {
                itemSelectorOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-4xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3 shrink-0">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Seleccionar Materiales</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Configura el kit para la técnica</p>
                                </div>
                                <button onClick={() => setItemSelectorOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden min-h-0">
                                {/* LEFT COLUMN: Available Materials */}
                                <div className="flex-1 flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-4 md:pb-0 md:pr-6">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                        <List size={18} /> Disponibles
                                    </h4>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-clinical-500 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Buscar material..."
                                        value={techMaterialSearch}
                                        onChange={e => setTechMaterialSearch(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                                        {inventory
                                            .filter(i => i.name.toLowerCase().includes(techMaterialSearch.toLowerCase()))
                                            .map(item => {
                                                const isSelected = selectedTechItems.find(si => si.itemId === item.id);
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`p-3 flex items-center gap-3 cursor-pointer rounded-lg border transition-all ${isSelected
                                                            ? 'bg-clinical-50 dark:bg-clinical-900/20 border-clinical-500 ring-1 ring-clinical-500'
                                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                            }`}
                                                        onClick={() => toggleTechItem(item.id)}
                                                    >
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-clinical-600 border-clinical-600' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                                                            {isSelected && <Plus size={14} className="text-white" />}
                                                        </div>
                                                        <img src={item.imageUrl} className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 object-cover" alt="" />
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Selected Materials */}
                                <div className="flex-1 flex flex-col min-h-0">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                        <MapPin size={18} /> Seleccionados
                                        <span className="text-xs bg-clinical-100 text-clinical-700 px-2 py-0.5 rounded-full">
                                            {selectedTechItems.length}
                                        </span>
                                    </h4>

                                    {selectedTechItems.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
                                            <MapPin size={48} className="mb-4 opacity-20" />
                                            <p>Selecciona materiales a la izquierda</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                            {selectedTechItems.map(si => {
                                                const item = inventory.find(i => i.id === si.itemId);
                                                if (!item) return null;
                                                return (
                                                    <div key={si.itemId} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <img src={item.imageUrl} className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 object-cover" alt="" />
                                                            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{item.name}</span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => updateTechItemQuantity(item.id, Math.max(1, si.quantity - 1))}
                                                                className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600"
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                className="w-12 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-center text-sm focus:ring-1 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                                                value={si.quantity}
                                                                onChange={(e) => updateTechItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                                            />
                                                            <button
                                                                onClick={() => updateTechItemQuantity(item.id, si.quantity + 1)}
                                                                className="w-8 h-8 rounded bg-clinical-100 flex items-center justify-center hover:bg-clinical-200 text-clinical-700"
                                                            >
                                                                +
                                                            </button>
                                                            <button
                                                                onClick={() => toggleTechItem(item.id)}
                                                                className="ml-2 text-slate-300 hover:text-red-500 p-1"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t mt-auto flex justify-end">
                                <Button onClick={() => setItemSelectorOpen(false)}>
                                    Aceptar
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* Technique Detail Modal */}
            {
                viewingTechnique && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setViewingTechnique(null)}>
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative flex flex-col max-h-[95vh] sm:max-h-[90vh] mx-2 sm:mx-0" onClick={e => e.stopPropagation()}>
                            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{viewingTechnique.name}</h3>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Detalles de la técnica y materiales necesarios</p>
                                </div>
                                <button
                                    onClick={() => setViewingTechnique(null)}
                                    className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 sm:p-2 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>

                            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
                                {viewingTechnique.description && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <FileText size={16} /> Descripción
                                        </h4>
                                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                            {viewingTechnique.description}
                                        </p>
                                    </div>
                                )}

                                {viewingTechnique.cartIds && viewingTechnique.cartIds.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <MapPin size={16} /> Carros Necesarios
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {viewingTechnique.cartIds.map(cartId => {
                                                const cart = savedLocations.find(l => l.id === cartId);
                                                if (!cart) return null;
                                                return (
                                                    <div key={cartId} className="flex items-center gap-2 px-3 py-2 bg-clinical-50 dark:bg-clinical-900/20 text-clinical-700 dark:text-clinical-400 rounded-lg border border-clinical-200 dark:border-clinical-800 shadow-sm">
                                                        <div
                                                            className="w-2 h-6 rounded-full"
                                                            style={{ backgroundColor: cart.color || '#bae6fd' }}
                                                        />
                                                        <span className="font-medium">{cart.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {viewingTechnique.protocolUrl && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <Sparkles size={16} /> Protocolo Oficial
                                        </h4>
                                        <button
                                            onClick={() => setProtocolViewer({ isOpen: true, url: viewingTechnique.protocolUrl })}
                                            className="w-full flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors group text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                                    <FileText size={20} className="text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <span className="font-semibold text-lg text-indigo-900 dark:text-indigo-100">Ver Documento del Protocolo</span>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                <div>
                                    {viewingTechnique.equipment && viewingTechnique.equipment.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                                                <span className="flex items-center gap-2">
                                                    <Monitor size={16} /> Aparataje Necesario
                                                </span>
                                                <span className="text-slate-500 font-normal lowercase">{viewingTechnique.equipment.length} equipos</span>
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {viewingTechnique.equipment.map(techEq => {
                                                    const eq = techEq.equipment;
                                                    if (!eq) return null;
                                                    return (
                                                        <div key={eq.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-600">
                                                                    <img src={eq.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <p className="font-bold text-slate-900 dark:text-white truncate text-sm" title={eq.name}>{eq.name}</p>
                                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Equipamiento</p>
                                                                </div>
                                                            </div>
                                                            <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-black px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                                                x{techEq.quantity}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Package size={16} /> Materiales Necesarios
                                        </span>
                                        <span className="text-slate-500 font-normal lowercase">{viewingTechnique.items.length} materiales</span>
                                    </h4>

                                    {/* Search Input for View Mode */}
                                    <div className="mb-4">
                                        <input
                                            type="text"
                                            placeholder="Buscar material..."
                                            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                                            value={viewingMaterialSearch}
                                            onChange={(e) => setViewingMaterialSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                                        {viewingTechnique.items
                                            .map(techItem => {
                                                const item = inventory.find(i => i.id === techItem.itemId);
                                                return { ...techItem, item };
                                            })
                                            .filter(data => {
                                                if (!viewingMaterialSearch) return true;
                                                const term = viewingMaterialSearch.toLowerCase();
                                                return data.item?.name.toLowerCase().includes(term);
                                            })
                                            .sort((a, b) => (a.item?.name || '').localeCompare(b.item?.name || ''))
                                            .map(techItem => {
                                                const item = techItem.item;
                                                return (
                                                    <div key={techItem.itemId} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-clinical-200 dark:hover:border-clinical-700 transition-colors">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-600">
                                                                {item?.imageUrl ? (
                                                                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                                                                ) : (
                                                                    <Package size={20} className="text-slate-300 dark:text-slate-500" />
                                                                )}
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="font-bold text-slate-900 dark:text-white truncate text-sm" title={item?.name}>{item?.name || 'Material desconocido'}</p>
                                                                <div className="flex flex-col gap-0.5 mt-1">
                                                                    {(() => {
                                                                        if (!item) return <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Sin Ubicación</span>;
                                                                        const allCartItems = globalCartItems.allItems;
                                                                        const matches = allCartItems.filter(ci => ci.itemId === item.id);

                                                                        if (matches.length === 0) return <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Sin Ubicación</span>;

                                                                        const allResolved = matches.map((match) => {
                                                                            const loc = savedLocations.find(l => l.id === match.locationId);
                                                                            if (!loc) return null;
                                                                            const isSub = !!loc.parent_id;
                                                                            const parent = isSub ? savedLocations.find(p => p.id === loc.parent_id) : null;
                                                                            const isCart = (loc.type === 'CART') || (parent?.type === 'CART');

                                                                            return {
                                                                                isCart,
                                                                                text: isSub ? `${parent?.name} - ${loc.name}` : loc.name
                                                                            };
                                                                        }).filter(Boolean) as { isCart: boolean; text: string }[];

                                                                        const cartLocs = allResolved.filter(l => l.isCart);
                                                                        const finalLocs = cartLocs.length > 0 ? cartLocs : allResolved;

                                                                        return finalLocs.map((loc, idx) => (
                                                                            <span key={idx} className="text-[10px] text-slate-400 uppercase font-bold tracking-tight block">
                                                                                {loc.text}
                                                                            </span>
                                                                        ));
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-clinical-50 dark:bg-clinical-900/20 text-clinical-700 dark:text-clinical-400 font-black px-3 py-1 rounded-lg border border-clinical-100 dark:border-clinical-800 shadow-sm">
                                                            x{techItem.quantity}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
                                <Button onClick={() => setViewingTechnique(null)} className="px-8 h-12 text-lg">
                                    Cerrar Detalles
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* Protocol Viewer Modal */}
            {
                protocolViewer.isOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200" onClick={() => setProtocolViewer({ isOpen: false, url: '' })}>
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0 bg-white">
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <FileText className="text-indigo-600" />
                                    Visor de Protocolo
                                </h3>
                                <button
                                    onClick={() => setProtocolViewer({ isOpen: false, url: '' })}
                                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-red-500 transition-colors"
                                    title="Cerrar"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex-1 bg-slate-100 relative">
                                {protocolViewer.url ? (
                                    <iframe
                                        src={protocolViewer.url}
                                        className="w-full h-full"
                                        title="Protocol Viewer"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <FileText size={64} className="mb-4 opacity-20" />
                                        <p>No se pudo cargar el documento</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
                                <a
                                    href={protocolViewer.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
                                >
                                    <Upload size={16} className="rotate-90" /> Abrir en nueva pestaña
                                </a>
                                <Button onClick={() => setProtocolViewer({ isOpen: false, url: '' })}>
                                    Cerrar Visor
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Equipment Selector Modal for Techniques */}
            {
                equipmentSelectorOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-4xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3 shrink-0">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Seleccionar Aparataje</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Configura el aparataje necesario para la técnica</p>
                                </div>
                                <button onClick={() => setEquipmentSelectorOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden min-h-0">
                                {/* LEFT COLUMN: Available Equipment */}
                                <div className="flex-1 flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-4 md:pb-0 md:pr-6">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                        <List size={18} /> Disponibles
                                    </h4>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-clinical-500 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                        placeholder="Buscar aparataje..."
                                        value={techEquipmentSearch}
                                        onChange={e => setTechEquipmentSearch(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                                        {equipment
                                            .filter(e => e.name.toLowerCase().includes(techEquipmentSearch.toLowerCase()))
                                            .map(eq => {
                                                const isSelected = selectedTechEquipment.find(se => se.equipmentId === eq.id);
                                                return (
                                                    <div
                                                        key={eq.id}
                                                        className={`p-3 flex items-center gap-3 cursor-pointer rounded-lg border transition-all ${isSelected
                                                            ? 'bg-clinical-50 dark:bg-clinical-900/20 border-clinical-500 ring-1 ring-clinical-500'
                                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                            }`}
                                                        onClick={() => toggleTechEquipment(eq.id)}
                                                    >
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-clinical-600 border-clinical-600' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                                                            {isSelected && <Plus size={14} className="text-white" />}
                                                        </div>
                                                        <img src={eq.imageUrl} className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 object-cover" alt="" />
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{eq.name}</span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Selected Equipment */}
                                <div className="flex-1 flex flex-col min-h-0">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                        <Monitor size={18} /> Seleccionados
                                        <span className="text-xs bg-clinical-100 text-clinical-700 px-2 py-0.5 rounded-full">
                                            {selectedTechEquipment.length}
                                        </span>
                                    </h4>

                                    {selectedTechEquipment.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
                                            <Monitor size={48} className="mb-4 opacity-20" />
                                            <p>Selecciona aparataje a la izquierda</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                            {selectedTechEquipment.map(se => {
                                                const eq = equipment.find(e => e.id === se.equipmentId);
                                                if (!eq) return null;
                                                return (
                                                    <div key={se.equipmentId} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <img src={eq.imageUrl} className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 object-cover" alt="" />
                                                            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{eq.name}</span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => updateTechEquipmentQuantity(eq.id, Math.max(1, se.quantity - 1))}
                                                                className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-8 text-center font-bold text-slate-700 dark:text-white">{se.quantity}</span>
                                                            <button
                                                                onClick={() => updateTechEquipmentQuantity(eq.id, se.quantity + 1)}
                                                                className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600"
                                                            >
                                                                +
                                                            </button>
                                                            <button
                                                                onClick={() => toggleTechEquipment(eq.id)}
                                                                className="w-8 h-8 rounded bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 ml-2"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Button onClick={() => setEquipmentSelectorOpen(false)}>
                                    Confirmar
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};