import React from 'react';
import { Plus, ChevronDown, ChevronRight, Edit, Trash2, Package, MapPin, ShoppingCart, X, Search, Check } from 'lucide-react';
import { Button, Card } from '../../components/UI';
import { Location } from '../../types';

interface LocationsTabProps {
    savedLocations: Location[];
    onSaveLocation: (loc: any) => Promise<void>;
    onUpdateLocation: (id: string, updates: any) => Promise<void>;
    onDeleteLocation: (id: string) => void;
    expandedLocations: Set<string>;
    toggleLocation: (id: string) => void;
}

export const LocationsTab: React.FC<LocationsTabProps> = ({
    savedLocations,
    onSaveLocation,
    onUpdateLocation,
    onDeleteLocation,
    expandedLocations,
    toggleLocation
}) => {
    const [isCreating, setIsCreating] = React.useState(false);
    const [editingLocation, setEditingLocation] = React.useState<any>(null);
    const [subLocationModal, setSubLocationModal] = React.useState<{ isOpen: boolean; parentId: string; parentName: string; parentType: string }>({
        isOpen: false,
        parentId: '',
        parentName: '',
        parentType: ''
    });
    const [newLocation, setNewLocation] = React.useState({ name: '', type: 'CART', color: '#4f46e5' });
    const [newSubLocation, setNewSubLocation] = React.useState({ name: '' });
    const [uploading, setUploading] = React.useState(false);

    const handleSave = async () => {
        setUploading(true);
        try {
            await onSaveLocation(newLocation);
            setIsCreating(false);
            setNewLocation({ name: '', type: 'CART', color: '#4f46e5' });
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingLocation) return;
        setUploading(true);
        try {
            await onUpdateLocation(editingLocation.id, editingLocation);
            setEditingLocation(null);
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleSaveSub = async () => {
        setUploading(true);
        try {
            await onSaveLocation({
                name: newSubLocation.name,
                type: subLocationModal.parentType,
                parent_id: subLocationModal.parentId
            });
            setSubLocationModal({ isOpen: false, parentId: '', parentName: '', parentType: '' });
            setNewSubLocation({ name: '' });
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };
    const renderLocationGroups = (type: 'CART' | 'WAREHOUSE' | 'EXTERNAL', title: string, Icon: any, accentColor: string) => {
        const roots = savedLocations.filter(l => !l.parent_id && l.type === type);

        return (
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                    <Icon className={type === 'CART' ? "text-clinical-600" : type === 'WAREHOUSE' ? "text-sky-500" : "text-slate-600"} />
                    {title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roots.map(root => (
                        <div key={root.id} className="space-y-2">
                            <Card
                                className="p-4 flex justify-between items-center group bg-white dark:bg-slate-800 border-l-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                style={{ borderLeftColor: root.color || accentColor }}
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
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingLocation({ ...root }); }} title="Editar">
                                        <Edit size={16} className="text-slate-400 hover:text-indigo-600" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSubLocationModal({ isOpen: true, parentId: root.id, parentName: root.name, parentType: root.type }); }} title="Añadir sub-ubicación">
                                        <Plus size={16} className={type === 'CART' ? "text-clinical-600" : type === 'WAREHOUSE' ? "text-sky-500" : "text-slate-600"} />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onDeleteLocation(root.id); }} title="Borrar">
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
                                                <Button variant="ghost" size="sm" onClick={() => setEditingLocation({ ...child })} title="Editar">
                                                    <Edit size={14} className="text-slate-400 hover:text-indigo-600" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => onDeleteLocation(child.id)} title="Borrar">
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
                    {roots.length === 0 && (
                        <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg italic">
                            No hay {title.toLowerCase()} definidos.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-12 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold font-heading text-deep-blue dark:text-white">Ubicaciones</h2>
                    <p className="text-slate-500 dark:text-slate-400">Gestión de carros, almacenes y puntos externos</p>
                </div>
                <Button onClick={() => setIsCreating(true)} className="gap-2">
                    <Plus size={20} /> Nueva Ubicación
                </Button>
            </div>

            <div className="space-y-10">
                {renderLocationGroups('CART', 'Carros', ShoppingCart, '#4f46e5')}
                {renderLocationGroups('WAREHOUSE', 'Almacenes', Package, '#0ea5e9')}
                {renderLocationGroups('EXTERNAL', 'Externos', MapPin, '#94a3b8')}
            </div>

            {/* Create Location Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 border dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Nueva Ubicación</h2>
                            <button onClick={() => setIsCreating(false)}><X size={24} className="text-slate-400" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                                    value={newLocation.name}
                                    onChange={e => setNewLocation({ ...newLocation, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo</label>
                                <select
                                    className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                                    value={newLocation.type}
                                    onChange={e => setNewLocation({ ...newLocation, type: e.target.value })}
                                >
                                    <option value="CART">Carro</option>
                                    <option value="WAREHOUSE">Almacén</option>
                                    <option value="EXTERNAL">Externo</option>
                                </select>
                            </div>
                            {newLocation.type === 'CART' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Color del Carro</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b'].map(c => (
                                            <button
                                                key={c}
                                                className={`w-8 h-8 rounded-full border-2 ${newLocation.color === c ? 'border-slate-900 dark:border-white ring-2 ring-slate-200' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }}
                                                onClick={() => setNewLocation({ ...newLocation, color: c })}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="pt-4 flex gap-3">
                                <Button fullWidth variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
                                <Button fullWidth onClick={handleSave} disabled={uploading}>{uploading ? 'Guardando...' : 'Crear Ubicación'}</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Location Modal */}
            {editingLocation && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 border dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Editar Ubicación</h2>
                            <button onClick={() => setEditingLocation(null)}><X size={24} className="text-slate-400" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                                    value={editingLocation.name}
                                    onChange={e => setEditingLocation({ ...editingLocation, name: e.target.value })}
                                />
                            </div>
                            {editingLocation.type === 'CART' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Color del Carro</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b'].map(c => (
                                            <button
                                                key={c}
                                                className={`w-8 h-8 rounded-full border-2 ${editingLocation.color === c ? 'border-slate-900 dark:border-white ring-2 ring-slate-200' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }}
                                                onClick={() => setEditingLocation({ ...editingLocation, color: c })}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="pt-4 flex gap-3">
                                <Button fullWidth variant="ghost" onClick={() => setEditingLocation(null)}>Cancelar</Button>
                                <Button fullWidth onClick={handleUpdate} disabled={uploading}>{uploading ? 'Guardando...' : 'Guardar Cambios'}</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-location Modal */}
            {subLocationModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 border dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nueva Sub-ubicación en {subLocationModal.parentName}</h2>
                            <button onClick={() => setSubLocationModal({ ...subLocationModal, isOpen: false })} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-clinical-500 outline-none"
                                    value={newSubLocation.name}
                                    onChange={e => setNewSubLocation({ ...newSubLocation, name: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button fullWidth variant="ghost" onClick={() => setSubLocationModal({ ...subLocationModal, isOpen: false })}>Cancelar</Button>
                                <Button fullWidth onClick={handleSaveSub} disabled={uploading}>{uploading ? 'Guardando...' : 'Crear Sub-ubicación'}</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
