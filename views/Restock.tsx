import { correctText } from '../services/ai';
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { PageHeader, Button, Card, Badge } from '../components/UI';
import { Technique, Item, Location, CartItem } from '../types';

import { CheckCircle2, Circle, ArrowRight, Warehouse, RotateCw, Box, Angry, Frown, Meh, Smile, Laugh, MessageSquareWarning, ChevronDown, Search, Plus, Minus, X } from 'lucide-react';

interface RestockProps {
    technique: Technique;
    inventory: Item[];
    locations: Location[];
    cartContents: CartItem[];
    onFinish: () => void;
    unitId?: string;
}

export const Restock: React.FC<RestockProps> = ({ technique, inventory, locations, cartContents, onFinish, unitId }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rating, setRating] = useState<number | null>(null);
    const [issue, setIssue] = useState('');
    const [comments, setComments] = useState('');
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [extraItems, setExtraItems] = useState<Record<string, number>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const hydratedItems = React.useMemo(() => {
        return (technique.items || []).map(ti => {
            const item = inventory.find(i => i.id === ti.itemId);
            const itemContents = cartContents.filter(cc => cc.itemId === ti.itemId);

            const resolvedLocations = itemContents.map(cc => {
                const loc = locations.find(l => l.id === cc.locationId);
                const parent = loc?.parent_id ? locations.find(l => l.id === loc.parent_id) : null;
                return {
                    name: parent ? `${parent.name} - ${loc?.name}` : loc?.name || 'General',
                    color: parent?.color || loc?.color || '#e2e8f0',
                    stockIdeal: cc.stockIdeal
                };
            });

            const firstLoc = itemContents[0];
            const loc = locations.find(l => l.id === firstLoc?.locationId);
            const parent = loc?.parent_id ? locations.find(l => l.id === loc.parent_id) : null;

            return {
                ...ti,
                item,
                resolvedLocations,
                stockParentName: parent?.name || 'Almacén',
                stockSubName: loc?.name || 'General'
            };
        });
    }, [technique, inventory, cartContents, locations]);

    const getItemLocationName = (item: Item, locs: Location[]) => {
        const itemLocs = cartContents.filter(cc => cc.itemId === item.id);
        if (itemLocs.length === 0) return 'Sin ubicación';
        const first = itemLocs[0];
        const loc = locs.find(l => l.id === first.locationId);
        const parent = loc?.parent_id ? locs.find(l => l.id === loc.parent_id) : null;
        return parent ? `${parent.name} - ${loc?.name}` : loc?.name || 'General';
    };

    const handleFinish = async () => {
        setIsSubmitting(true);
        console.log('Attempting to save feedback:', { rating, issue, comments, techniqueId: technique.id });
        try {
            let finalComments = comments;

            // AI Correction for comments if there is an issue
            if (issue && comments.trim().length > 0) {
                try {
                    const corrected = await correctText(comments);
                    if (corrected) finalComments = corrected;
                } catch (e) {
                    console.warn("AI Correction for feedback failed, saving original.");
                }
            }
            // Fallback to localStorage if prop is missing (Double safety)
            const finalUnitId = unitId || localStorage.getItem('SMARTCART_UNIT_ID');

            if (!finalUnitId) {
                console.warn("Saving feedback without unitId!");
                alert("Atención: No se ha detectado una unidad activa. El registro podría no guardarse correctamente.");
            }

            const { data, error } = await supabase.from('feedbacks').insert([{
                rating: rating || 0,
                issue: issue || 'No, todo correcto',
                comments: finalComments || '',
                technique_id: technique.id,
                unit_id: finalUnitId
            }]);

            if (error) {
                console.error('Supabase Error saving feedback:', error);
                alert("Error al guardar feedback: " + error.message);
            } else {
                console.log('Feedback saved successfully:', data);
            }
        } catch (error: any) {
            console.error('Unexpected error saving feedback:', error);
            alert("Error inesperado al guardar feedback: " + error.message);
        } finally {
            setIsSubmitting(false);
            onFinish();
        }
    };


    const toggleCheck = (id: string) => {
        setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Filter inventory for search, excluding items already in the main kit (optional choice, 
    // but usually "extra" implies things not already listed, or simply allow all to add *more* of something)
    // Here we allow searching ALL inventory.
    const searchResults = inventory.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        searchQuery.length > 1
    );

    const handleAddExtraItem = (item: Item) => {
        setExtraItems(prev => ({
            ...prev,
            [item.id]: (prev[item.id] || 0) + 1
        }));
        setSearchQuery(''); // Clear search
        setIsSearching(false);
    };

    const updateExtraQuantity = (itemId: string, delta: number) => {
        setExtraItems(prev => {
            const current = prev[itemId] || 0;
            const next = current + delta;
            if (next <= 0) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: next };
        });
    };

    const allChecked = hydratedItems.every((item, idx) => checkedItems[`${item.itemId}-${idx}`]);

    const incidentOptions = [
        "Problema con la App",
        "Falta material en el Carro (Stock insuficiente)",
        "Falta material en el Almacén",
        "Error en el Protocolo",
        "Error en materiales necesarios (Kit incorrecto)"
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            <PageHeader

                title="Reposición"
                subtitle="Asegura que el carro quede listo para el siguiente uso"
                onBack={() => { }} // No back, must finish
            />

            <div className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 pb-24 space-y-8">

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3 text-blue-800 dark:text-blue-200">
                    <RotateCw className="shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold">Instrucciones de Reposición</h4>

                        <p className="text-sm mt-1 opacity-90">
                            Recoge el material del almacén indicado y guárdalo en la ubicación correcta del carro.
                        </p>
                    </div>
                </div>

                {/* Core Checklist */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Material usado</h3>

                    {hydratedItems.map((kitItem, idx) => {
                        const item = kitItem.item!;
                        // if (item.locationType === 'EXTERNAL') return null; // Removed check

                        const uniqueId = `${item.id}-${idx}`;
                        const isChecked = checkedItems[uniqueId];

                        return (
                            <div
                                key={uniqueId}
                                onClick={() => toggleCheck(uniqueId)}
                                className={`
                            relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer flex flex-col md:flex-row
                            ${isChecked
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600 opacity-60'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-clinical-400 dark:hover:border-clinical-500 shadow-sm'}
                        `}
                            >
                                <div className={`w-12 flex items-center justify-center shrink-0 ${isChecked ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500'}`}>
                                    {isChecked ? <CheckCircle2 /> : <Circle />}

                                </div>

                                <div className="p-4 flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-bold text-lg ${isChecked ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                                            {item.name}
                                        </h4>
                                        <div className="flex flex-col items-end">
                                            {/* Detailed Stock Breakdown */}
                                            {kitItem.resolvedLocations && kitItem.resolvedLocations.length > 0 ? (
                                                <div className="flex flex-col gap-1 mt-2 items-end">
                                                    {kitItem.resolvedLocations.map((loc, i) => (
                                                        <div key={i} className="flex items-center gap-1.5 text-sm">
                                                            <div
                                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                                style={{ backgroundColor: loc.color }}
                                                            ></div>
                                                            <span className="text-slate-600 dark:text-slate-300 font-bold text-right">{loc.name}:</span>
                                                            <span className="font-extrabold text-slate-900 dark:text-white text-base">Ideal {loc.stockIdeal}</span>
                                                        </div>
                                                    ))}

                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold">
                                                    -
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-col md:flex-row gap-2 md:items-center text-sm">
                                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded">
                                            <Warehouse size={14} />
                                            <span>{kitItem.stockParentName}</span>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-400 hidden md:block" />
                                        <div className="flex items-center gap-1.5 text-clinical-700 dark:text-clinical-300 bg-clinical-50 dark:bg-clinical-900/20 px-2 py-1 rounded font-medium">
                                            <Box size={14} />
                                            <span>{kitItem.stockSubName}</span>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- EXTRA MATERIAL SECTION --- */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">

                        <Plus className="text-clinical-600 bg-clinical-100 rounded-md p-0.5" size={24} />
                        ¿Has usado más material?
                    </h3>

                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="relative z-10">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-6 w-6 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onFocus={() => setIsSearching(true)}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-lg placeholder-slate-400 dark:text-white focus:outline-none focus:border-clinical-500 focus:ring-4 focus:ring-clinical-100 dark:focus:ring-clinical-900/30 transition-all shadow-sm"
                                placeholder="Buscar material adicional..."
                            />


                            {/* Predictive Results Dropdown */}
                            {searchQuery.length > 1 && isSearching && (
                                <div className="absolute w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-80 overflow-y-auto overflow-hidden">

                                    {searchResults.length > 0 ? (
                                        searchResults.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleAddExtraItem(item)}
                                                className="p-3 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-clinical-50 dark:active:bg-clinical-900/20 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
                                            >
                                                <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600" />
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">-</p>
                                                </div>

                                                <div className="bg-clinical-100 text-clinical-700 p-2 rounded-full">
                                                    <Plus size={20} />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                                            No se encontraron materiales.
                                        </div>

                                    )}
                                </div>
                            )}

                            {/* Overlay to close search when clicking outside */}
                            {isSearching && searchQuery.length > 1 && (
                                <div className="fixed inset-0 z-[-1]" onClick={() => setIsSearching(false)}></div>
                            )}
                        </div>

                        {/* List of Added Extra Items */}
                        {Object.keys(extraItems).length > 0 && (
                            <div className="space-y-3 animate-fade-in-up">
                                {Object.entries(extraItems).map(([itemId, qty]) => {
                                    const item = inventory.find(i => i.id === itemId);
                                    if (!item) return null;

                                    return (
                                        <div key={itemId} className="flex items-center justify-between bg-white dark:bg-slate-800 border-l-4 border-l-clinical-500 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-700" />
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white">{item.name}</p>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                        <Warehouse size={12} />
                                                        <span>{getItemLocationName(item, locations)}</span>
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <button
                                                    onClick={() => updateExtraQuantity(itemId, -qty)} // Remove item completely
                                                    className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                                                    title="Eliminar material adicional"
                                                >
                                                    <X size={20} />
                                                </button>

                                                {/* Detailed Stock Breakdown for Extra Items */}
                                                {(() => {
                                                    let resolvedLocations: { name: string; color: string; stockIdeal: number }[] = [];
                                                    // if (item.locationType === 'CART') {
                                                    // Always try to find in cart contents
                                                    const cartItems = cartContents.filter(ci => ci.itemId === item.id);
                                                    cartItems.forEach((cItem) => {
                                                        const drawer = locations.find(l => l.id === cItem.locationId);
                                                        if (drawer) {
                                                            let locString = drawer.name;
                                                            let locColor = drawer.color || '#0ea5e9';
                                                            if (drawer.parent_id) {
                                                                const cart = locations.find(l => l.id === drawer.parent_id);
                                                                if (cart) {
                                                                    locString = `${cart.name} - ${drawer.name}`;
                                                                    locColor = cart.color || locColor;
                                                                }
                                                            }
                                                            resolvedLocations.push({ name: locString, color: locColor, stockIdeal: cItem.stockIdeal });
                                                        }
                                                    });
                                                    // }

                                                    if (resolvedLocations.length > 0) {
                                                        return (
                                                            <div className="flex flex-col gap-1 mt-1 items-end">
                                                                {resolvedLocations.map((loc, i) => (
                                                                    <div key={i} className="flex items-center gap-1.5 text-sm">
                                                                        <div
                                                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                                                            style={{ backgroundColor: loc.color }}
                                                                        ></div>
                                                                        <span className="text-slate-600 dark:text-slate-300 font-bold text-right">{loc.name}:</span>
                                                                        <span className="font-extrabold text-slate-900 dark:text-white text-base">Ideal {loc.stockIdeal}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    } else {
                                                        return null;
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Feedback Section */}
                <div className="mt-8 pt-8 border-t-2 border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <MessageSquareWarning className="text-clinical-600" />
                        Feedback Rápido
                    </h3>

                    <Card className="p-6 space-y-8 bg-white dark:bg-slate-800">
                        {/* 1. Faces Rating */}
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 text-center uppercase tracking-wide">Valoración de la experiencia</label>

                            <div className="flex justify-between items-center max-w-md mx-auto px-2">
                                {[
                                    { val: 1, icon: Angry, color: 'text-red-500', label: 'Muy mal' },
                                    { val: 2, icon: Frown, color: 'text-orange-500', label: 'Mal' },
                                    { val: 3, icon: Meh, color: 'text-yellow-500', label: 'Regular' },
                                    { val: 4, icon: Smile, color: 'text-lime-500', label: 'Bien' },
                                    { val: 5, icon: Laugh, color: 'text-green-600', label: 'Muy bien' },
                                ].map((mood) => (
                                    <button
                                        key={mood.val}
                                        onClick={() => setRating(mood.val)}
                                        className={`flex flex-col items-center gap-2 transition-all duration-200 ${rating === mood.val ? 'scale-125' : 'opacity-40 hover:opacity-100 hover:scale-110'}`}
                                    >
                                        <mood.icon size={48} className={mood.color} strokeWidth={rating === mood.val ? 2.5 : 1.5} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 2. Incident Dropdown */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">¿Hubo algún problema?</label>
                                <div className="relative">
                                    <select
                                        value={issue}
                                        onChange={(e) => setIssue(e.target.value)}
                                        className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-lg rounded-xl focus:ring-clinical-500 focus:border-clinical-500 block p-4 pr-10"
                                    >
                                        <option value="">No, todo correcto</option>

                                        {incidentOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-slate-400">
                                        <ChevronDown size={20} />
                                    </div>

                                </div>
                            </div>

                            {/* 3. Conditional Comments */}
                            {issue && (
                                <div className="space-y-2 animate-fade-in-up">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Observaciones extra</label>
                                    <textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        className="w-full h-[60px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-clinical-500 outline-none resize-none"
                                        placeholder="Detalla brevemente la incidencia..."
                                    />
                                </div>

                            )}
                        </div>
                    </Card>
                </div>

            </div>

            <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
                <div className="max-w-3xl mx-auto flex flex-col gap-2">

                    <Button
                        onClick={handleFinish}
                        fullWidth
                        size="lg"
                        variant={allChecked ? 'primary' : 'secondary'}
                        disabled={!allChecked || isSubmitting}
                    >
                        {isSubmitting ? 'Guardando...' : (allChecked ? 'Confirmar y Salir' : 'Marca todos los ítems para finalizar')}
                    </Button>

                    <Button
                        onClick={onFinish}
                        fullWidth
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-600 font-normal"
                    >
                        Salir sin crear registro
                    </Button>
                </div>
            </div>
        </div >
    );
};