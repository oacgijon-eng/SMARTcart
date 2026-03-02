import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button, Card } from '../../components/UI';
import { useUsers } from '../../hooks/useUsers';

export const UsersTab: React.FC = () => {
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
                    <h2 className="text-2xl font-bold font-heading text-deep-blue dark:text-white">Gestión de Usuarios</h2>
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
                        <tr className="bg-light-gray-blue dark:bg-slate-800/50 border-b border-white dark:border-slate-800">
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
