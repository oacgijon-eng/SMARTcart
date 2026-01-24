import React, { useState } from 'react';
import { Card, Button } from './UI';
import { LayoutGrid, Package, Edit, Trash2, ChevronDown, ChevronRight, Check, Clock, Plus } from 'lucide-react';
import { useCartItems } from '../hooks/useCartItems';
import { Location } from '../hooks/useLocations';

interface CartViewProps {
    cartType: string;
    locations: Location[];
    rootLocationId: string; // The ID of the cart itself (e.g. "Carro de Anestesia")
    cartItems: any[];
    loading: boolean;
    onManageMaterials: (locationId: string, locationName: string, cartType: string, existingItems: any[]) => void;
    onManageLocations: () => void;
    onAddSubLocation?: () => void;
    onEditSubLocation?: (location: Location) => void;
    onDeleteSubLocation?: (locationId: string) => void;
}

export const CartView: React.FC<CartViewProps> = ({ cartType, locations, rootLocationId, cartItems, loading, onManageMaterials, onManageLocations, onAddSubLocation, onEditSubLocation, onDeleteSubLocation }) => {
    // We now receive cartItems and loading as props to ensure synchronization with Admin dashboard
    const [expandedDrawers, setExpandedDrawers] = useState<Set<string>>(new Set());

    const toggleDrawer = (id: string) => {
        const newExpanded = new Set(expandedDrawers);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedDrawers(newExpanded);
    };

    // Filter for drawers/sub-locations that belong to this cart
    // Using parent_id check
    const drawerLocations = locations.filter(l => l.parent_id === rootLocationId);

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Cargando contenido del carro...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <LayoutGrid className="text-clinical-600" />
                    Contenido del Carro
                </h2>
                {(() => {
                    const rootLoc = locations.find(l => l.id === rootLocationId);
                    return rootLoc ? (
                        <p className="text-slate-500 dark:text-slate-400 ml-8 mt-1 text-sm font-medium">
                            {rootLoc.name}
                        </p>

                    ) : null;
                })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drawerLocations.map(location => {
                    const locationItems = cartItems.filter(i => i.locationId === location.id);
                    const isExpanded = expandedDrawers.has(location.id);

                    return (
                        <Card key={location.id} className="p-0 space-y-0 relative overflow-hidden flex flex-col h-fit">
                            {location.color && (
                                <div className="absolute top-0 left-0 bottom-0 w-1.5" style={{ backgroundColor: location.color }} />
                            )}

                            {/* Header: Clickable to toggle */}
                            <div
                                className={`flex justify-between items-center p-4 pl-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${isExpanded ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
                                onClick={() => toggleDrawer(location.id)}
                            >

                                <div className="flex items-center gap-3">
                                    <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                                        <ChevronRight size={20} className="text-slate-400" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200">
                                        {location.name}
                                    </h3>

                                </div>
                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="sm"

                                        onClick={() => onManageMaterials(location.id, location.name, cartType, locationItems)}
                                        title="Gestionar materiales"
                                        className="h-9 w-9 p-0 rounded-full text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                                    >

                                        <Edit size={20} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDeleteSubLocation && onDeleteSubLocation(location.id)}
                                        title="Eliminar cajón"
                                        className="h-9 w-9 p-0 rounded-full text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400"
                                    >

                                        <Trash2 size={20} />
                                    </Button>
                                </div>
                            </div>

                            {/* Collapsible Content */}
                            {isExpanded && (
                                <div className="p-2 bg-slate-50/30 dark:bg-slate-900/50 animate-in slide-in-from-top-2 duration-200">

                                    {locationItems.length > 0 ? (
                                        <div className="space-y-1 max-h-80 overflow-y-auto px-2">
                                            {locationItems.map(cartItem => (
                                                <div key={cartItem.id} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-lg shadow-sm group">

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[120px]">
                                                            {cartItem.item?.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {cartItem.nextExpiryDate && (() => {
                                                            const expiry = new Date(cartItem.nextExpiryDate);
                                                            const today = new Date();
                                                            const oneMonthFromNow = new Date();
                                                            oneMonthFromNow.setDate(today.getDate() + 30);

                                                            let styles = "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50";
                                                            let iconColor = "text-green-600";

                                                            if (expiry < today) {
                                                                styles = "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50";
                                                                iconColor = "text-red-600";
                                                            } else if (expiry < oneMonthFromNow) {
                                                                styles = "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50";
                                                                iconColor = "text-amber-600";
                                                            }

                                                            return (
                                                                <div className={`flex items-center gap-1 mr-2 px-1.5 py-0.5 rounded border ${styles}`}>
                                                                    <Clock size={10} className={iconColor} />
                                                                    <span className="text-[10px] font-bold">{expiry.toLocaleDateString()}</span>
                                                                </div>
                                                            );
                                                        })()}
                                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Ideal</span>
                                                        <span className="text-slate-900 dark:text-slate-100 font-black bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] min-w-[20px] text-center">{cartItem.stockIdeal}</span>
                                                    </div>

                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-6 flex flex-col items-center justify-center text-slate-400 text-xs italic">
                                            <Package size={20} className="mb-2 opacity-20" />
                                            <span>Sin materiales</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    );
                })}

                {/* New Sub-location Button (only if there are existing drawers) */}
                {drawerLocations.length > 0 && onAddSubLocation && (
                    <button
                        onClick={onAddSubLocation}
                        className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-clinical-300 dark:hover:border-clinical-500 hover:text-clinical-600 transition-all group h-full min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm group-hover:border-clinical-200 dark:group-hover:border-clinical-500">

                            <Plus size={24} className="text-slate-400 group-hover:text-clinical-600 transition-colors" />
                        </div>
                        <span className="font-medium text-slate-500 group-hover:text-clinical-700 transition-colors">Añadir Cajón/Espacio</span>
                    </button>
                )}

                {drawerLocations.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">

                        <Package size={48} className="mx-auto mb-3 opacity-20" />
                        <p>Este carro no tiene cajones o espacios definidos.</p>
                        <p className="text-sm mt-1">Crea sub-ubicaciones (ej. "Cajón 1") asignadas a este carro en la sección de Ubicaciones.</p>
                        <Button variant="outline" className="mt-4" onClick={onManageLocations}>
                            Gestionar Ubicaciones
                        </Button>
                    </div>
                )}
            </div>
        </div >
    );
};
