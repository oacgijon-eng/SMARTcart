
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Package, Check, RefreshCw, Calendar, AlertTriangle } from 'lucide-react';
import { Button, Input, Modal } from '../components/UI';
import { Location, Item, CartItem } from '../types';
import { supabase } from '../services/supabase';

interface StockRevisionProps {
    onBack: () => void;
    locations: Location[];
    inventory: Item[];
    cartContents: CartItem[];
    onRefresh?: () => void;
    unitId?: string;
}

const getExpiryStatus = (locationId: string, locations: Location[], cartContents: CartItem[]) => {
    const subLocationIds = locations.filter(l => l.parent_id === locationId).map(l => l.id);
    const relevantLocationIds = [locationId, ...subLocationIds];
    const relevantContents = cartContents.filter(c => relevantLocationIds.includes(c.locationId));

    if (relevantContents.length === 0) return 'ok';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);

    let status: 'ok' | 'warning' | 'expired' = 'ok';

    for (const content of relevantContents) {
        if (!content.nextExpiryDate) continue;
        const expiryDate = new Date(content.nextExpiryDate);
        if (expiryDate < today) {
            return 'expired'; // Immediate priority
        }
        if (expiryDate <= nextMonth) {
            status = 'warning';
        }
    }

    return status;
};

export const StockRevision: React.FC<StockRevisionProps> = ({ onBack, locations, inventory, cartContents, onRefresh, unitId }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
    const [reviewerName, setReviewerName] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeSubLocationId, setActiveSubLocationId] = useState<string | null>(null);
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
    const [expiryChecked, setExpiryChecked] = useState(false);

    // Edit State
    const [editingItem, setEditingItem] = useState<{ id: string; name: string; currentDate?: string } | null>(null);
    const [newDate, setNewDate] = useState('');
    const [updating, setUpdating] = useState(false);

    const [lastRevisions, setLastRevisions] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchLastRevisions = async () => {
            const { data, error } = await supabase
                .from('stock_revisions')
                .select('location_id, created_at')
                .order('created_at', { ascending: false });

            if (data) {
                const revisions: Record<string, string> = {};
                data.forEach((rev: any) => {
                    if (!revisions[rev.location_id]) {
                        revisions[rev.location_id] = rev.created_at;
                    }
                });
                setLastRevisions(revisions);
            }
        };

        fetchLastRevisions();
    }, []);

    // Filter for CART locations (only top-level carts, exclude drawers/sublocations)
    const cartLocations = locations.filter(l => l.type === 'CART' && !l.parent_id);

    // Get sub-locations (drawers)
    const subLocations = selectedLocationId
        ? locations.filter(l => l.parent_id === selectedLocationId)
        : [];

    // Create a map of location groups (Parent + Children)
    const locationGroups: Record<string, { name: string; items: { cartItemId: string; text: string; subtext: string; imageUrl: string; stockIdeal: number; nextExpiryDate?: string }[] }> = {};

    if (selectedLocationId) {
        const selectedLocation = locations.find(l => l.id === selectedLocationId);
        if (selectedLocation) {
            locationGroups[selectedLocation.id] = { name: selectedLocation.name, items: [] };
        }
        subLocations.forEach(sub => {
            locationGroups[sub.id] = { name: sub.name, items: [] };
        });

        // Populate groups with items from cartContents
        cartContents.forEach(content => {
            if (locationGroups[content.locationId]) {
                const item = inventory.find(i => i.id === content.itemId);
                if (item) {
                    locationGroups[content.locationId].items.push({
                        cartItemId: content.id,
                        text: item.name,
                        subtext: item.category,
                        imageUrl: item.imageUrl,
                        stockIdeal: content.stockIdeal,
                        nextExpiryDate: content.nextExpiryDate
                    });
                }
            }
        });
    }

    // Convert groups to list for easier mapping
    const groupsList = Object.entries(locationGroups)
        .map(([id, group]) => ({ id, ...group }))
        .filter(g => g.items.length > 0);

    // Set initial sub-location when entering step 2
    useEffect(() => {
        if (step === 2 && groupsList.length > 0 && !activeSubLocationId) {
            setActiveSubLocationId(groupsList[0].id);
        }
    }, [step, groupsList, activeSubLocationId]);

    const handleSelectLocation = (id: string) => {
        setSelectedLocationId(id);
        setActiveSubLocationId(null); // Reset to help useEffect select first drawer
        setCheckedItems(new Set()); // Reset checklist for new location
    };

    const toggleCheck = (itemId: string) => {
        const newChecked = new Set(checkedItems);
        if (newChecked.has(itemId)) {
            newChecked.delete(itemId);
        } else {
            newChecked.add(itemId);
        }
        setCheckedItems(newChecked);
    };

    const handleSubmit = async () => {
        if (!selectedLocationId || !reviewerName.trim()) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('stock_revisions')
                .insert([{
                    location_id: selectedLocationId,
                    reviewer_name: reviewerName,
                    notes: notes,
                    expiry_checked: expiryChecked,
                    unit_id: unitId
                }]);

            if (error) throw error;


            onBack();
        } catch (error: any) {
            console.error(error);
            alert('Error al registrar la revisión: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateExpiry = async () => {
        if (!editingItem || !newDate) return;

        setUpdating(true);
        try {
            const { error } = await supabase
                .from('cart_contents')
                .update({ next_expiry_date: newDate })
                .eq('id', editingItem.id);

            if (error) throw error;

            if (onRefresh) onRefresh();
            setEditingItem(null);
            setNewDate('');
        } catch (error: any) {
            console.error(error);
            alert('Error al actualizar fecha: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const openEditModal = (item: { cartItemId: string; text: string; nextExpiryDate?: string }, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent row click
        setEditingItem({
            id: item.cartItemId,
            name: item.text,
            currentDate: item.nextExpiryDate
        });
        setNewDate(item.nextExpiryDate ? item.nextExpiryDate.split('T')[0] : '');
    };

    const itemsToDisplay = activeSubLocationId
        ? (groupsList.find(g => g.id === activeSubLocationId)?.items || [])
        : [];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 px-4 py-4 flex items-center gap-4 shadow-sm">
                <button
                    onClick={onBack}
                    title="Volver"
                    className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Revisión de Stock y Caducidades</h1>
            </header>

            <main className="flex-1 p-4 max-w-3xl mx-auto w-full space-y-6">

                {step === 1 && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Selecciona el Carro a Revisar</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {cartLocations.map(location => (
                                <button
                                    key={location.id}
                                    onClick={() => {
                                        handleSelectLocation(location.id);
                                        setStep(2);
                                    }}
                                    className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-clinical-500 dark:hover:border-clinical-500 hover:shadow-md transition-all text-left group relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${location.color ? '' : 'bg-slate-100 dark:bg-slate-700'} transition-transform group-hover:scale-110`} style={{ backgroundColor: location.color ? location.color + '20' : undefined }}>
                                            <Package size={24} className={location.color ? '' : 'text-slate-500 dark:text-slate-400'} style={{ color: location.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-clinical-600 dark:group-hover:text-clinical-400 transition-colors truncate">{location.name}</h3>
                                            {lastRevisions[location.id] && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    Última revisión: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(lastRevisions[location.id]).toLocaleDateString('es-ES')}</span>
                                                </p>
                                            )}
                                        </div>

                                        {(() => {
                                            const status = getExpiryStatus(location.id, locations, cartContents);
                                            if (status === 'ok') return null;

                                            const config = status === 'expired'
                                                ? { icon: <AlertTriangle size={18} />, text: 'Caducado', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800' }
                                                : { icon: <AlertTriangle size={18} />, text: 'Próxima cad.', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-800' };

                                            return (
                                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${config.bg} ${config.color} ${config.border} animate-pulse`}>
                                                    {config.icon}
                                                    <span className="text-[10px] font-bold uppercase tracking-tight">{config.text}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && selectedLocationId && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-lg flex items-start gap-3">
                            <CheckCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-medium text-blue-900 dark:text-blue-100">Instrucciones</h3>
                                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                                    Revisa físicamente el contenido del carro <strong>{locations.find(l => l.id === selectedLocationId)?.name}</strong>.
                                    Comprueba que no falte material y que las caducidades sean correctas.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            {/* Filter Buttons */}
                            {groupsList.length > 0 && (
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto">
                                    <div className="flex gap-2">
                                        {groupsList.map(group => (
                                            <button
                                                key={group.id}
                                                onClick={() => setActiveSubLocationId(group.id)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeSubLocationId === group.id
                                                    ? 'bg-clinical-600 text-white shadow-sm'
                                                    : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                                                    }`}
                                            >
                                                {group.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 w-10">Revisado</th>
                                            <th className="px-4 py-3">Material</th>
                                            <th className="px-4 py-3 text-center">Caducidad</th>
                                            <th className="px-4 py-3 text-right">Stock Ideal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {itemsToDisplay.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Package size={24} className="text-slate-300 dark:text-slate-600" />
                                                        <p>No hay contenido asignado.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            itemsToDisplay.map((item, idx) => {
                                                const itemId = `${activeSubLocationId}-${item.text}`; // unique key for checkbox
                                                const isChecked = checkedItems.has(itemId);
                                                return (
                                                    <tr
                                                        key={idx}
                                                        className={`transition-colors cursor-pointer ${isChecked ? 'bg-slate-50/50 dark:bg-slate-700/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                                        onClick={() => toggleCheck(itemId)}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${isChecked ? 'bg-clinical-600 border-clinical-600 shadow-sm' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 group-hover:border-clinical-400'}`}>
                                                                {isChecked && <Check size={16} className="text-white" />}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600 transition-opacity ${isChecked ? 'opacity-40' : ''}`}>
                                                                    {item.imageUrl ? (
                                                                        <img src={item.imageUrl} alt={item.text} className="w-full h-full object-cover rounded-lg" />
                                                                    ) : (
                                                                        <Package size={18} className="text-slate-400 dark:text-slate-500" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className={`font-medium transition-all ${isChecked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>{item.text}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {(() => {
                                                                if (!item.nextExpiryDate) return <span className="text-xs text-slate-400">-</span>;

                                                                const expiryDate = new Date(item.nextExpiryDate);
                                                                const today = new Date();
                                                                today.setHours(0, 0, 0, 0);

                                                                const nextMonth = new Date();
                                                                nextMonth.setMonth(today.getMonth() + 1);

                                                                let dateColor = 'text-slate-600 dark:text-slate-300';
                                                                if (expiryDate < today) {
                                                                    dateColor = 'text-red-600 dark:text-red-400 font-bold';
                                                                } else if (expiryDate <= nextMonth) {
                                                                    dateColor = 'text-orange-600 font-bold';
                                                                }

                                                                return (
                                                                    <span className={`text-base font-bold ${isChecked ? 'text-slate-300 dark:text-slate-600' : dateColor}`}>
                                                                        {expiryDate.toLocaleDateString('es-ES')}
                                                                    </span>
                                                                );
                                                            })()}
                                                            <button
                                                                onClick={(e) => openEditModal(item, e)}
                                                                className="ml-2 p-1.5 text-slate-400 hover:text-clinical-600 hover:bg-clinical-50 rounded-full transition-colors"
                                                                title="Actualizar Fecha"
                                                            >
                                                                <RefreshCw size={14} />
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`font-bold transition-all px-2 py-1 rounded-md ${isChecked ? 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700'}`}>
                                                                {item.stockIdeal}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Finalizar Revisión</h3>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tu Nombre</label>
                                <Input
                                    value={reviewerName}
                                    onChange={(e) => setReviewerName(e.target.value)}
                                    placeholder="Ej: Ana García"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas (Opcional)</label>
                                <textarea
                                    className="w-full rounded-lg border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-clinical-500 focus:ring-clinical-500 text-sm"
                                    rows={3}
                                    placeholder="Incidencias encontradas, objetos caducados retirados..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800/50 mb-4">
                                <input
                                    type="checkbox"
                                    id="expiry-check"
                                    checked={expiryChecked}
                                    onChange={(e) => setExpiryChecked(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-orange-300 dark:border-orange-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-800"
                                />
                                <label htmlFor="expiry-check" className="text-sm text-orange-900 dark:text-orange-200 cursor-pointer select-none font-medium">
                                    He revisado las fechas de caducidad
                                </label>
                            </div>

                            <div className="pt-2">
                                <Button
                                    onClick={handleSubmit}
                                    fullWidth
                                    disabled={!reviewerName.trim() || submitting}
                                    className="justify-center"
                                >
                                    {submitting ? 'Guardando...' : 'Confirmar Revisión'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                title="Actualizar Caducidad"
            >
                <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg flex items-center gap-3">
                        <Calendar className="text-slate-400 dark:text-slate-500" size={20} />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Material</p>
                            <p className="font-medium text-slate-900 dark:text-white">{editingItem?.name}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nueva Fecha</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-clinical-500 focus:ring-clinical-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setEditingItem(null)} fullWidth>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateExpiry} disabled={!newDate || updating} fullWidth>
                            {updating ? 'Guardando...' : 'Actualizar'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
