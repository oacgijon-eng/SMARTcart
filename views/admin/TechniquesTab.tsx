import React from 'react';
import { Plus, Trash2, X, ChevronRight, ChevronDown, Check, FileText, Search, Siren, Monitor, Package } from 'lucide-react';
import { Button, Card } from '../../components/UI';
import { Technique, Location, Item, Equipment } from '../../types';
import { correctText } from '../../services/ai';

interface TechniquesTabProps {
    techniques: Technique[];
    liveTechniques: Technique[];
    techniqueSearch: string;
    setTechniqueSearch: (s: string) => void;
    onDeleteTechnique: (id: string) => void;
    savedLocations: Location[];
    inventory: Item[];
    equipment: Equipment[];
    handleSaveTechnique: (tech: any) => Promise<boolean | void>;
}

export const TechniquesTab: React.FC<TechniquesTabProps> = ({
    techniques,
    liveTechniques,
    techniqueSearch,
    setTechniqueSearch,
    onDeleteTechnique,
    savedLocations,
    inventory,
    equipment,
    handleSaveTechnique
}) => {
    const [viewingTechnique, setViewingTechnique] = React.useState<Technique | null>(null);
    const [isCreating, setIsCreating] = React.useState(false);
    const [editingTechnique, setEditingTechnique] = React.useState<Technique | null>(null);
    const [newTechnique, setNewTechnique] = React.useState<Partial<Technique>>({
        name: '',
        description: '',
        items: [],
        equipment: [],
        cartIds: [],
        imageUrl: '',
        protocolUrl: ''
    });
    const [isMaterialModalOpen, setIsMaterialModalOpen] = React.useState(false); 
    const [isEquipmentModalOpen, setIsEquipmentModalOpen] = React.useState(false); 
    const [isMaterialSearchFocused, setIsMaterialSearchFocused] = React.useState(false);
    const [isEquipmentSearchFocused, setIsEquipmentSearchFocused] = React.useState(false);
    const [materialSearch, setMaterialSearch] = React.useState('');
    const [equipmentSearch, setEquipmentSearch] = React.useState('');
    const [uploading, setUploading] = React.useState(false);
    const [saveError, setSaveError] = React.useState<string | null>(null);
    const [protocolViewer, setProtocolViewer] = React.useState<{ isOpen: boolean; url: string }>({ isOpen: false, url: '' });

    const displayedTechniques = (liveTechniques.length > 0 ? liveTechniques : techniques)
        .filter(tech => tech.name.toLowerCase().includes(techniqueSearch.toLowerCase()));

    const handleEdit = (tech: Technique) => {
        setEditingTechnique(tech);
        setNewTechnique(tech);
        setIsCreating(true);
    };

    const handleLocalCreate = () => {
        setIsCreating(true);
        setSaveError(null);
        setEditingTechnique(null);
        setNewTechnique({
            name: '',
            description: '',
            items: [],
            equipment: [],
            cartIds: [],
            imageUrl: '',
            protocolUrl: ''
        });
    };

    const handleLocalSave = async () => {
        setUploading(true);
        setSaveError(null);
        try {
            console.log("Saving Technique...", newTechnique.name);
            let finalName = newTechnique.name?.trim() || '';
            let finalDescription = newTechnique.description?.trim() || '';

            if (finalName) {
                try {
                    const corrected = await correctText(finalName);
                    if (corrected) {
                        finalName = corrected.charAt(0).toUpperCase() + corrected.slice(1);
                    } else {
                        finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
                    }
                } catch (e) {
                    console.error("AI correction failed:", e);
                    finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
                }
            }

            if (finalDescription) {
                try {
                    const corrected = await correctText(finalDescription);
                    if (corrected) {
                        finalDescription = corrected.charAt(0).toUpperCase() + corrected.slice(1);
                    } else {
                        finalDescription = finalDescription.charAt(0).toUpperCase() + finalDescription.slice(1);
                    }
                } catch (e) {
                    finalDescription = finalDescription.charAt(0).toUpperCase() + finalDescription.slice(1);
                }
            }

            const techToSave = {
                ...newTechnique,
                name: finalName,
                description: finalDescription
            };

            const success = await handleSaveTechnique(techToSave);
            if (success !== false) {
                setIsCreating(false);
            } else {
                setSaveError("No se pudo guardar. Verifica los campos.");
            }
        } catch (e: any) {
            setSaveError(e.message || "Error desconocido");
        } finally {
            setUploading(false);
        }
    };

    const toggleItem = (itemId: string, itemName: string) => {
        const currentItems = newTechnique.items || [];
        const exists = currentItems.find(m => m.itemId === itemId);

        if (exists) {
            setNewTechnique({
                ...newTechnique,
                items: currentItems.filter(m => m.itemId !== itemId)
            });
        } else {
            setNewTechnique({
                ...newTechnique,
                items: [...currentItems, { itemId, quantity: 1, item: inventory.find(i => i.id === itemId) }]
            });
        }
    };

    const updateItemQuantity = (itemId: string, quantity: number) => {
        setNewTechnique({
            ...newTechnique,
            items: (newTechnique.items || []).map(m => m.itemId === itemId ? { ...m, quantity } : m)
        });
    };

    const toggleEquipment = (equipmentId: string) => {
        const currentEq = newTechnique.equipment || [];
        const exists = currentEq.find(e => e.equipmentId === equipmentId);

        if (exists) {
            setNewTechnique({
                ...newTechnique,
                equipment: currentEq.filter(e => e.equipmentId !== equipmentId)
            });
        } else {
            setNewTechnique({
                ...newTechnique,
                equipment: [...currentEq, { equipmentId, quantity: 1, equipment: equipment.find(e => e.id === equipmentId) }]
            });
        }
    };

    const updateEquipmentQuantity = (equipmentId: string, quantity: number) => {
        setNewTechnique({
            ...newTechnique,
            equipment: (newTechnique.equipment || []).map(e => e.equipmentId === equipmentId ? { ...e, quantity } : e)
        });
    };

    const toggleCart = (cartId: string) => {
        const currentCarts = newTechnique.cartIds || [];
        if (currentCarts.includes(cartId)) {
            setNewTechnique({ ...newTechnique, cartIds: currentCarts.filter(id => id !== cartId) });
        } else {
            setNewTechnique({ ...newTechnique, cartIds: [...currentCarts, cartId] });
        }
    };

    const handleBlurCorrectionText = async (fieldName: 'name' | 'description', value: string) => {
        if (!value || !value.trim()) return;
        try {
            const corrected = await correctText(value);
            if (corrected && corrected !== value) {
                setNewTechnique(prev => ({ ...prev, [fieldName]: corrected }));
            }
        } catch (e) {
            console.error(`Error correcting ${fieldName}:`, e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Siren className="text-clinical-600" /> Técnicas
                </h2>
                <Button size="sm" className="gap-2" onClick={handleLocalCreate}>
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
                {displayedTechniques.map(tech => (
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
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{tech.description}</p>

                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            <Button size="sm" variant="outline" fullWidth onClick={() => handleEdit(tech)}>Editar</Button>
                            <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDeleteTechnique(tech.id)}>
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Technique Detail Modal */}
            {viewingTechnique && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setViewingTechnique(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full my-8 animate-in fade-in zoom-in-95 duration-200 overflow-hidden border dark:border-slate-800" onClick={e => e.stopPropagation()}>
                        <div className="h-full flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{viewingTechnique.name}</h2>
                                    <p className="text-slate-500 dark:text-slate-400">{viewingTechnique.description}</p>
                                </div>
                                <button onClick={() => setViewingTechnique(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {viewingTechnique.protocolUrl && (
                                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                        <button
                                            onClick={() => setProtocolViewer({ isOpen: true, url: viewingTechnique.protocolUrl })}
                                            className="w-full flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                                    <FileText size={20} className="text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <span className="font-semibold text-lg text-indigo-900 dark:text-indigo-100">Ver Documento del Protocolo</span>
                                            </div>
                                            <ChevronRight className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <Monitor size={18} className="text-clinical-600" /> Aparataje Necesario
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {viewingTechnique.equipment?.map((eq, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-600">
                                                        {eq.equipment?.imageUrl ? (
                                                            <img src={eq.equipment.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                                                        ) : (
                                                            <Monitor size={20} className="text-slate-300" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{eq.equipment?.name || 'Equipo desconocido'}</p>
                                                </div>
                                                <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-black px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                                    x{eq.quantity}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <Package size={18} className="text-clinical-600" /> Materiales Necesarios
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {viewingTechnique.items?.map((m, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-600">
                                                        {m.item?.imageUrl ? (
                                                            <img src={m.item.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                                                        ) : (
                                                            <Package size={20} className="text-slate-300" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{m.item?.name || 'Material desconocido'}</p>
                                                </div>
                                                <div className="bg-clinical-50 dark:bg-clinical-900/20 text-clinical-700 dark:text-clinical-400 font-black px-3 py-1 rounded-lg border border-clinical-100 dark:border-clinical-800 shadow-sm">
                                                    x{m.quantity}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t dark:border-slate-800 flex gap-3">
                                <Button fullWidth variant="outline" onClick={() => { handleEdit(viewingTechnique); setViewingTechnique(null); }}>Editar Técnica</Button>
                                <Button fullWidth onClick={() => setViewingTechnique(null)}>Cerrar</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Technique Creator/Editor Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[60] p-4 overflow-y-auto" onClick={() => setIsCreating(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-200 border dark:border-slate-800" onClick={e => e.stopPropagation()}>
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">{editingTechnique ? 'Editar Técnica' : 'Nueva Técnica'}</h2>
                                <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            {saveError && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                                    {saveError}
                                </div>
                            )}

                            <div className="space-y-4 text-left">
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Nombre de la Técnica</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 dark:text-white"
                                        value={newTechnique.name}
                                        onChange={e => setNewTechnique({ ...newTechnique, name: e.target.value })}
                                        onBlur={e => handleBlurCorrectionText('name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Descripción</label>
                                    <textarea
                                        className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 dark:text-white h-24"
                                        value={newTechnique.description}
                                        onChange={e => setNewTechnique({ ...newTechnique, description: e.target.value })}
                                        onBlur={e => handleBlurCorrectionText('description', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium dark:text-slate-300">Carros Necesarios</label>
                                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto">
                                        {savedLocations.filter(loc => loc.type === 'CART' && !loc.parent_id).map(cart => {
                                            const isSelected = newTechnique.cartIds?.includes(cart.id);
                                            return (
                                                <div key={cart.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => toggleCart(cart.id)}
                                                        className={`w-full text-left px-3 py-2 text-sm font-bold transition-colors flex items-center justify-between
                                                            ${isSelected
                                                                ? 'bg-clinical-50 text-clinical-700 dark:bg-clinical-900/30 dark:text-clinical-300'
                                                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4 h-4 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: cart.color || '#bae6fd' }}></div>
                                                            {cart.name}
                                                        </div>
                                                        {isSelected && <Check size={16} className="text-clinical-600 dark:text-clinical-400" />}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {savedLocations.filter(loc => loc.type === 'CART' && !loc.parent_id).length === 0 && (
                                            <span className="text-sm text-slate-500 italic">No hay carros registrados en el sistema.</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium dark:text-slate-300">Aparataje ({newTechnique.equipment?.length || 0})</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                            placeholder="Buscar aparataje para añadir..."
                                            value={equipmentSearch}
                                            onFocus={() => setIsEquipmentSearchFocused(true)}
                                            onChange={e => setEquipmentSearch(e.target.value)}
                                        />
                                        {equipmentSearch.length > 0 && isEquipmentSearchFocused && (
                                            <>
                                                <div className="fixed inset-0 z-[40]" onClick={() => setIsEquipmentSearchFocused(false)}></div>
                                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                    {equipment
                                                        .filter(eq => eq.name.toLowerCase().includes(equipmentSearch.toLowerCase()))
                                                        .map(eq => {
                                                            const isSelected = (newTechnique.equipment || []).some(e => e.equipmentId === eq.id);
                                                            return (
                                                                <button
                                                                    key={eq.id}
                                                                    className={`w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 ${isSelected ? 'opacity-50' : ''}`}
                                                                    onClick={() => {
                                                                        if (!isSelected) {
                                                                            toggleEquipment(eq.id);
                                                                        }
                                                                        setEquipmentSearch('');
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        {eq.imageUrl ? (
                                                                            <img src={eq.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                                                                        ) : (
                                                                            <Monitor size={16} className="text-slate-400" />
                                                                        )}
                                                                        <span className="text-sm dark:text-slate-200">{eq.name}</span>
                                                                    </div>
                                                                    {isSelected ? <Check size={16} className="text-indigo-600" /> : <Plus size={16} className="text-slate-400" />}
                                                                </button>
                                                            );
                                                        })}
                                                    {equipment.filter(eq => eq.name.toLowerCase().includes(equipmentSearch.toLowerCase())).length === 0 && (
                                                        <div className="p-4 text-center text-sm text-slate-500">No se encontraron equipos</div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                        {newTechnique.equipment?.map((eq, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-indigo-600">{eq.quantity}x</span>
                                                    <span className="text-sm dark:text-slate-300">{eq.equipment?.name || 'Equipo'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button size="sm" variant="ghost" onClick={() => updateEquipmentQuantity(eq.equipmentId, Math.max(1, eq.quantity - 1))}>-</Button>
                                                    <Button size="sm" variant="ghost" onClick={() => updateEquipmentQuantity(eq.equipmentId, eq.quantity + 1)}>+</Button>
                                                    <button onClick={() => toggleEquipment(eq.equipmentId)} className="text-red-500 p-1 ml-2">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium dark:text-slate-300">Materiales ({newTechnique.items?.length || 0})</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-clinical-500 outline-none dark:text-white"
                                            placeholder="Buscar material para añadir..."
                                            value={materialSearch}
                                            onFocus={() => setIsMaterialSearchFocused(true)}
                                            onChange={e => setMaterialSearch(e.target.value)}
                                        />
                                        {materialSearch.length > 0 && isMaterialSearchFocused && (
                                            <>
                                                <div className="fixed inset-0 z-[40]" onClick={() => setIsMaterialSearchFocused(false)}></div>
                                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                    {inventory
                                                        .filter(item => item.name.toLowerCase().includes(materialSearch.toLowerCase()))
                                                        .map(item => {
                                                            const isSelected = (newTechnique.items || []).some(m => m.itemId === item.id);
                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    className={`w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 ${isSelected ? 'opacity-50' : ''}`}
                                                                    onClick={() => {
                                                                        if (!isSelected) {
                                                                            toggleItem(item.id, item.name);
                                                                        }
                                                                        setMaterialSearch('');
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        {item.imageUrl ? (
                                                                            <img src={item.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                                                                        ) : (
                                                                            <Package size={16} className="text-slate-400" />
                                                                        )}
                                                                        <span className="text-sm dark:text-slate-200">{item.name}</span>
                                                                    </div>
                                                                    {isSelected ? <Check size={16} className="text-clinical-600" /> : <Plus size={16} className="text-slate-400" />}
                                                                </button>
                                                            );
                                                        })}
                                                    {inventory.filter(item => item.name.toLowerCase().includes(materialSearch.toLowerCase())).length === 0 && (
                                                        <div className="p-4 text-center text-sm text-slate-500">No se encontraron materiales</div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                        {newTechnique.items?.map((m, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-clinical-600">{m.quantity}x</span>
                                                    <span className="text-sm dark:text-slate-300">{m.item?.name || 'Material'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button size="sm" variant="ghost" onClick={() => updateItemQuantity(m.itemId, Math.max(1, m.quantity - 1))}>-</Button>
                                                    <Button size="sm" variant="ghost" onClick={() => updateItemQuantity(m.itemId, m.quantity + 1)}>+</Button>
                                                    <button onClick={() => toggleItem(m.itemId, '')} className="text-red-500 p-1 ml-2">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t dark:border-slate-800 flex gap-3">
                                <Button fullWidth variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
                                <Button fullWidth onClick={handleLocalSave} disabled={uploading}>
                                    {uploading ? 'Guardando...' : 'Guardar Técnica'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Protocol Viewer Modal */}
            {protocolViewer.isOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4" onClick={() => setProtocolViewer({ isOpen: false, url: '' })}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="text-indigo-600" /> Visor de Protocolo
                            </h3>
                            <button onClick={() => setProtocolViewer({ isOpen: false, url: '' })} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100 relative">
                            <iframe src={protocolViewer.url} className="w-full h-full" title="Protocol Viewer" />
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                            <Button variant="outline" onClick={() => window.open(protocolViewer.url, '_blank')}>Abrir en nueva pestaña</Button>
                            <Button onClick={() => setProtocolViewer({ isOpen: false, url: '' })}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
