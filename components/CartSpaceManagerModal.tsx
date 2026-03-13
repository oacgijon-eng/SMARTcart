import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Trash2, Package } from 'lucide-react';
import { Button } from './UI';
import { Item } from '../types';

interface CartSpaceManagerModalProps {
    locationId: string;
    locationName: string;
    existingItems: any[];
    inventory: Item[];
    onClose: () => void;
    onSave: (locationId: string, desiredItems: Record<string, { stockIdeal: number; nextExpiryDate: string }>) => Promise<void>;
}

export const CartSpaceManagerModal: React.FC<CartSpaceManagerModalProps> = ({
    locationId,
    locationName,
    existingItems,
    inventory,
    onClose,
    onSave
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState<Record<string, { stockIdeal: number; nextExpiryDate: string }>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const initialSelected: Record<string, { stockIdeal: number; nextExpiryDate: string }> = {};
        existingItems.forEach(item => {
            initialSelected[item.itemId] = {
                stockIdeal: item.stockIdeal || 1,
                nextExpiryDate: item.nextExpiryDate || ''
            };
        });
        setSelectedItems(initialSelected);
    }, [existingItems]);

    const handleToggleItem = (itemId: string) => {
        setSelectedItems(prev => {
            const newSelected = { ...prev };
            if (newSelected[itemId]) {
                delete newSelected[itemId];
            } else {
                newSelected[itemId] = { stockIdeal: 1, nextExpiryDate: '' };
            }
            return newSelected;
        });
    };

    const handleUpdateStock = (itemId: string, stockIdeal: number) => {
        if (stockIdeal < 1) return;
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], stockIdeal }
        }));
    };

    const handleSaveList = async () => {
        setSaving(true);
        try {
            await onSave(locationId, selectedItems);
            onClose();
        } catch (e: any) {
            alert('Error al guardar: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredInventory = useMemo(() => {
        if (!searchQuery.trim()) return inventory;
        const q = searchQuery.toLowerCase();
        return inventory.filter(item => item.name.toLowerCase().includes(q) || (item.referencia_petitorio && item.referencia_petitorio.toLowerCase().includes(q)));
    }, [inventory, searchQuery]);

    // Split items into selected and unselected
    const selectedInventoryItems = inventory.filter(item => selectedItems[item.id]);
    
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full h-[85vh] max-h-[800px] flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gestionar Materiales</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Ubicación: <span className="font-semibold text-clinical-600 dark:text-clinical-400">{locationName}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Left side: Search & Add */}
                    <div className="w-full md:w-1/2 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar material en el inventario..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-clinical-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {filteredInventory.map(item => {
                                const isSelected = !!selectedItems[item.id];
                                return (
                                    <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'border-clinical-300 bg-clinical-50 dark:border-clinical-800 dark:bg-clinical-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-clinical-200 dark:hover:border-slate-600'}`} onClick={() => handleToggleItem(item.id)}>
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-md object-cover border border-slate-100 dark:border-slate-700 shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                                                    <Package size={20} />
                                                </div>
                                            )}
                                            <div className="truncate">
                                                <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{item.name}</p>
                                                {item.referencia_petitorio && <p className="text-xs text-slate-500">{item.referencia_petitorio}</p>}
                                            </div>
                                        </div>
                                        <div className="shrink-0 ml-2">
                                            {isSelected ? (
                                                <div className="w-6 h-6 rounded-full bg-clinical-100 dark:bg-clinical-900/50 text-clinical-600 dark:text-clinical-400 flex items-center justify-center">
                                                    <X size={14} className="opacity-0 group-hover:opacity-100" />
                                                    <span className="w-2 h-2 rounded-full bg-clinical-600 dark:bg-clinical-400" />
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:border-clinical-400 hover:text-clinical-500">
                                                    <Plus size={16} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredInventory.length === 0 && (
                                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No se encontraron materiales</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side: Selected Items */}
                    <div className="w-full md:w-1/2 flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">Materiales Asignados</h3>
                            <span className="bg-clinical-100 text-clinical-700 dark:bg-clinical-900/30 dark:text-clinical-400 px-2 py-0.5 rounded-full text-xs font-bold">
                                {selectedInventoryItems.length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {selectedInventoryItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                                    <Package size={48} className="opacity-20" />
                                    <p className="text-sm font-medium">No hay materiales en este cajón</p>
                                    <p className="text-xs text-center px-8 text-slate-500">Selecciona materiales de la lista de la izquierda para añadirlos</p>
                                </div>
                            ) : (
                                selectedInventoryItems.map(item => (
                                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 gap-3">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-md object-cover border border-slate-100 dark:border-slate-700 shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                                                    <Package size={20} />
                                                </div>
                                            )}
                                            <p className="font-medium text-sm text-slate-900 dark:text-white truncate" title={item.name}>{item.name}</p>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold uppercase text-slate-500">Stock Ideal</label>
                                                <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                    <button 
                                                        onClick={() => handleUpdateStock(item.id, (selectedItems[item.id]?.stockIdeal || 1) - 1)}
                                                        className="px-2 py-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                    >-</button>
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={selectedItems[item.id]?.stockIdeal || 1}
                                                        onChange={(e) => handleUpdateStock(item.id, parseInt(e.target.value) || 1)}
                                                        className="w-10 text-center text-sm font-bold bg-transparent outline-none py-1"
                                                    />
                                                    <button 
                                                        onClick={() => handleUpdateStock(item.id, (selectedItems[item.id]?.stockIdeal || 1) + 1)}
                                                        className="px-2 py-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                    >+</button>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleToggleItem(item.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Quitar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSaveList} disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
