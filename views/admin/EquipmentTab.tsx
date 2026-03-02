import React from 'react';
import { Plus, Monitor, Edit, Trash2, Zap, MapPin, X, Camera, Upload } from 'lucide-react';
import { Button, Card } from '../../components/UI';
import { Equipment, Location } from '../../types';

interface EquipmentTabProps {
    equipment: Equipment[];
    equipmentMainSearch: string;
    setEquipmentMainSearch: (s: string) => void;
    onDeleteEquipment: (id: string) => void;
    savedLocations: Location[];
    handleSaveEquipment: (eq: any, imagePreview?: string | null) => Promise<void>;
}

export const EquipmentTab: React.FC<EquipmentTabProps> = ({
    equipment,
    equipmentMainSearch,
    setEquipmentMainSearch,
    onDeleteEquipment,
    savedLocations,
    handleSaveEquipment
}) => {
    const [isCreating, setIsCreating] = React.useState(false);
    const [editingEquipment, setEditingEquipment] = React.useState<Equipment | null>(null);
    const [newEquipment, setNewEquipment] = React.useState<Partial<Equipment>>({
        name: '',
        description: '',
        imageUrl: '',
        category: 'Respiradores',
        stockQuantity: 1,
        maintenanceStatus: 'Operativo',
        location: '',
        requiresPower: false
    });
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [uploading, setUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const filteredEquipment = equipment.filter(eq =>
        eq.name.toLowerCase().includes(equipmentMainSearch.toLowerCase())
    );

    const handleEdit = (eq: Equipment) => {
        setEditingEquipment(eq);
        setNewEquipment(eq);
        setImagePreview(eq.imageUrl || null);
        setIsCreating(true);
    };

    const handleLocalCreate = () => {
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
    };

    const handleLocalSave = async () => {
        setUploading(true);
        try {
            await handleSaveEquipment(newEquipment, imagePreview);
            setIsCreating(false);
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Aparataje</h2>
                <Button onClick={handleLocalCreate}>
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
                {filteredEquipment.map(eq => (
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
                                <button onClick={() => handleEdit(eq)} className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-lg text-slate-600 dark:text-slate-300 hover:text-clinical-600 dark:hover:text-clinical-400 shadow-sm" title="Editar Equipo">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => onDeleteEquipment(eq.id)} className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 shadow-sm" title="Eliminar Equipo">
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
                {filteredEquipment.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <Monitor size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No hay aparataje registrado.</p>
                    </div>
                )}
            </div>

            {/* Creator/Editor Modal */}
            {isCreating && (
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
                            <Button onClick={handleLocalSave} disabled={uploading}>
                                {uploading ? 'Guardando...' : editingEquipment ? 'Guardar Cambios' : 'Crear Equipo'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
