import React from 'react';
import { createPortal } from 'react-dom';
import { Package, Search, LayoutGrid, List, Plus, Edit, Trash2, MapPin, ClipboardList, Settings, X, Camera, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/UI';
import { Item, Location } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';

interface InventoryTabProps {
    inventory: Item[];
    inventorySearch: string;
    setInventorySearch: (s: string) => void;
    viewMode: 'grid' | 'table';
    setViewMode: (m: 'grid' | 'table') => void;
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    handleSort: (key: any) => void;
    onSaveItem: (item: any, locationId?: string) => Promise<void>;
    onDeleteItem: (id: string) => void;
    globalCartItems: { allItems: any[] };
    savedLocations: Location[];
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
    inventory,
    inventorySearch,
    setInventorySearch,
    viewMode,
    setViewMode,
    sortConfig,
    handleSort,
    onSaveItem,
    onDeleteItem,
    globalCartItems,
    savedLocations
}) => {
    const [viewingItem, setViewingItem] = React.useState<Item | null>(null);
    const [isCreating, setIsCreating] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<Item | null>(null);
    const [newItem, setNewItem] = React.useState<Partial<Item>>({});
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [uploading, setUploading] = React.useState(false);
    const [selectedParentLocation, setSelectedParentLocation] = React.useState('');
    const [selectedSubLocation, setSelectedSubLocation] = React.useState('');

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const cameraInputRef = React.useRef<HTMLInputElement>(null);

    // UX: Páginación y Búsqueda Optimizada (Debounce)
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = viewMode === 'grid' ? 20 : 15;
    const debouncedSearch = useDebounce(inventorySearch, 300);

    // Resetear a página 1 si cambia la búsqueda
    React.useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, viewMode]);

    // Optimización de rendimiento: pre-calcular diccionarios de localizaciones
    const locationMap = React.useMemo(() => {
        const map = new Map<string, Location>();
        savedLocations.forEach(loc => map.set(loc.id, loc));
        return map;
    }, [savedLocations]);

    // Optimización de rendimiento: mapear materiales a sus ubicaciones de inventario activas
    const itemLocationsMap = React.useMemo(() => {
        const map = new Map<string, Location[]>();
        globalCartItems.allItems.forEach(ci => {
            const loc = locationMap.get(ci.locationId);
            if (loc && loc.type !== 'CART') {
                const existing = map.get(ci.itemId) || [];
                existing.push(loc);
                map.set(ci.itemId, existing);
            }
        });
        return map;
    }, [globalCartItems.allItems, locationMap]);

    const filteredAndSortedInventory = React.useMemo(() => {
        return inventory
            .filter(item => {
                if (!debouncedSearch) return true;
                return item.name.toLowerCase().includes(debouncedSearch.toLowerCase());
            })
            .sort((a: any, b: any) => {
                const aValue = (a[sortConfig.key] || '').toString().toLowerCase();
                const bValue = (b[sortConfig.key] || '').toString().toLowerCase();
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
    }, [inventory, debouncedSearch, sortConfig]);

    const totalPages = Math.ceil(filteredAndSortedInventory.length / itemsPerPage);
    const paginatedInventory = filteredAndSortedInventory.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleLocalEdit = (item: Item) => {
        setEditingItem(item);
        setNewItem(item);
        setImagePreview(item.imageUrl || null);
        setIsCreating(true);
        // Buscar localidades usando los mapas de rendimiento (evita .find repetitivos)
        const locations = itemLocationsMap.get(item.id);
        const loc = locations && locations.length > 0 ? locations[0] : null;

        if (loc) {
            if (loc.parent_id) {
                setSelectedParentLocation(loc.parent_id);
                setSelectedSubLocation(loc.id);
            } else {
                setSelectedParentLocation(loc.id);
                setSelectedSubLocation('');
            }
        } else {
            setSelectedParentLocation('');
            setSelectedSubLocation('');
        }
    };

    return (
        <div className="space-y-6">
            {/* Item Detail Modal */}
            {viewingItem && createPortal(
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewingItem(null)}>
                    <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20 dark:border-slate-700/50" onClick={e => e.stopPropagation()}>
                        <div className="aspect-square bg-slate-100 relative">
                            {viewingItem.imageUrl ? (
                                <img src={viewingItem.imageUrl} alt={viewingItem.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <Package size={80} />
                                </div>
                            )}
                            <button onClick={() => setViewingItem(null)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{viewingItem.name}</h3>
                                {viewingItem.referencia_petitorio && (
                                    <span className="text-xs bg-clinical-50 text-clinical-700 dark:bg-clinical-900/30 dark:text-clinical-400 px-2 py-1 rounded-md font-mono mt-1 inline-block">
                                        {viewingItem.referencia_petitorio}
                                    </span>
                                )}
                            </div>
                            <div className="pt-4 flex gap-2">
                                <Button fullWidth variant="outline" className="gap-2" onClick={() => { handleLocalEdit(viewingItem); setViewingItem(null); }}>
                                    <Edit size={16} /> Editar
                                </Button>
                                <Button fullWidth variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2" onClick={() => { onDeleteItem(viewingItem.id); setViewingItem(null); }}>
                                    <Trash2 size={16} /> Eliminar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>, document.body
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <h2 className="text-lg font-bold">Listado de Materiales</h2>
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
                        <Button size="sm" className="gap-2 shrink-0 px-3 sm:px-4" onClick={() => {
                            setEditingItem(null);
                            setNewItem({});
                            setImagePreview(null);
                            setSelectedParentLocation('');
                            setSelectedSubLocation('');
                            setIsCreating(true);
                        }}>
                            <Plus size={16} /> <span className="hidden sm:inline">Nuevo Material</span><span className="sm:hidden">Nuevo</span>
                        </Button>
                    </div>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {paginatedInventory.map(item => (
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
                                        onClick={() => handleLocalEdit(item)}
                                        className="bg-white/90 dark:bg-slate-800/90 p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm hover:shadow"
                                        title="Editar"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => onDeleteItem(item.id)}
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
                            {paginatedInventory.map(item => {
                                const warehouseLocations = itemLocationsMap.get(item.id) || [];

                                const locationPairs = warehouseLocations.length > 0 ? warehouseLocations.map(loc => {
                                    const isSub = !!loc.parent_id;
                                    const parent = isSub && loc.parent_id ? locationMap.get(loc.parent_id) : null;
                                    return {
                                        principal: isSub ? (parent?.name || 'Unknown') : loc.name,
                                        secondary: isSub ? loc.name : '',
                                        color: isSub ? parent?.color : loc.color
                                    };
                                }) : [];

                                return (
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
                                                    onClick={() => handleLocalEdit(item)}
                                                    className="p-2 text-slate-400 hover:text-clinical-600 dark:hover:text-clinical-400 hover:bg-clinical-50 dark:hover:bg-clinical-900/20 rounded-lg transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteItem(item.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 mt-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAndSortedInventory.length)}</span> de <span className="font-medium">{filteredAndSortedInventory.length}</span> resultados
                    </p>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 px-3 flex items-center gap-1 rounded-md text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:text-clinical-600 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronLeft size={16} /> <span className="text-sm font-medium hidden sm:inline">Anterior</span>
                        </button>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 px-3 py-1">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 px-3 flex items-center gap-1 rounded-md text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:text-clinical-600 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                        >
                            <span className="text-sm font-medium hidden sm:inline">Siguiente</span> <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Material Creator/Editor Modal */}
            {isCreating && createPortal(
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 overflow-y-auto" onClick={() => setIsCreating(false)}>
                    <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full my-8 animate-in fade-in zoom-in-95 duration-200 border border-white/20 dark:border-slate-700/50" onClick={e => e.stopPropagation()}>
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
                                        <div className="w-full md:w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera size={32} />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-3 flex flex-col justify-end">
                                            <div className="flex flex-col gap-3">
                                                <div className="border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Añadir imagen:</label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    const result = reader.result as string;
                                                                    setImagePreview(result);
                                                                    setNewItem(prev => ({ ...prev, imageUrl: result }));
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
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
                                            value={newItem.name || ''}
                                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Referencia Petitorio</label>
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="Ej: REF-12345"
                                            value={newItem.referencia_petitorio || ''}
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
                                                setSelectedSubLocation('');
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
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 border-t dark:border-slate-800">
                                <Button fullWidth onClick={async () => {
                                    setUploading(true);
                                    try {
                                        const success = await onSaveItem(newItem, selectedSubLocation || selectedParentLocation);
                                        if (success !== false) {
                                            setIsCreating(false);
                                            setEditingItem(null);
                                            setNewItem({});
                                            setImagePreview(null);
                                        }
                                    } catch (err) {
                                        console.error("Unhandeled error in modal:", err);
                                    } finally {
                                        setUploading(false);
                                    }
                                }} disabled={uploading}>
                                    {uploading ? 'Guardando...' : (editingItem ? 'Actualizar Material' : 'Guardar Material')}
                                </Button>
                                <Button fullWidth variant="ghost" onClick={() => setIsCreating(false)} disabled={uploading}>Cancelar</Button>
                            </div>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
};
