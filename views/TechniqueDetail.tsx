import React, { useState } from 'react';
import { PageHeader, Button, Card, Modal } from '../components/UI';
import { Technique, Item } from '../types';
import { FileText, MapPin, ArrowRight, Box, Monitor, Check, Search } from 'lucide-react';
import { useIncidents } from '../hooks/useIncidents';

import { Location, CartItem } from '../types';

interface TechniqueDetailProps {
  technique: Technique;
  inventory: Item[];
  locations: Location[];
  cartContents: CartItem[];
  onBack: () => void;
  onStartRestock: () => void;
  unitId?: string;
}

export const TechniqueDetail: React.FC<TechniqueDetailProps> = ({ technique, inventory, locations, cartContents, onBack, onStartRestock, unitId }) => {
  const { createIncident } = useIncidents(unitId);
  // Checklist State
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // 1. Determine which carts are relevant for this technique (Defined in technique OR derived from items)
  const finalCartIds = React.useMemo(() => {
    if (technique.cartIds && technique.cartIds.length > 0) return technique.cartIds;

    const derived = new Set<string>();
    technique.items.forEach(kitItem => {
      const cartItems = cartContents.filter(ci => ci.itemId === kitItem.itemId);
      cartItems.forEach(cItem => {
        const drawer = locations.find(l => l.id === cItem.locationId);
        if (drawer) {
          const cartId = drawer.parent_id || drawer.id;
          derived.add(cartId);
        }
      });
    });
    return Array.from(derived);
  }, [technique, cartContents, locations]);

  // 2. Hydrate items with full details and prioritized locations
  const hydratedItems = React.useMemo(() => {
    return technique.items.map(kitItem => {
      const fullItem = inventory.find(i => i.id === kitItem.itemId);
      const cartItems = cartContents.filter(ci => ci.itemId === kitItem.itemId);

      // Resolve all available locations first
      const allResolvedLocations: { name: string; color: string; type: string; cartId: string }[] = [];

      cartItems.forEach((cItem) => {
        const drawer = locations.find(l => l.id === cItem.locationId);
        if (drawer) {
          let locString = drawer.name;
          let cartId = drawer.id;
          let locColor = drawer.color || '#0ea5e9';
          let locType = (drawer.type as string);

          if (drawer.parent_id) {
            const cart = locations.find(l => l.id === drawer.parent_id);
            if (cart) {
              locString = `${cart.name} - ${drawer.name}`;
              cartId = cart.id;
              locColor = cart.color || locColor;
              locType = (cart.type as string) || locType;
            }
          }
          allResolvedLocations.push({ name: locString, color: locColor, type: locType, cartId });
        }
      });

      // Filter Strategy:
      // 1. Try to find locations that are in the SELECTED carts for this technique
      let filteredLocations = allResolvedLocations.filter(loc => finalCartIds.includes(loc.cartId));

      // 2. Fallback: If not in any required cart, show any other CART locations
      if (filteredLocations.length === 0) {
        filteredLocations = allResolvedLocations.filter(loc => loc.type === 'CART');
      }

      // 3. Fallback: If still nothing, show everything (Warehouse/External)
      const resolvedLocations = filteredLocations.length > 0 ? filteredLocations : allResolvedLocations;

      // Extract one representative cartId for background logic (if needed)
      const associatedCartId = resolvedLocations.find(l => l.type === 'CART')?.cartId;

      return { ...kitItem, item: fullItem, resolvedLocations, associatedCartId };
    });
  }, [technique, inventory, cartContents, locations, finalCartIds]);

  // Warehouse Modal State
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const openWarehouseModal = (item: Item) => {
    setSelectedItem(item);
    setIsWarehouseOpen(true);
    setIsSearchOpen(false); // Ensure search is closed if opened from there
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">

      <PageHeader
        title={technique.name}
        subtitle="Modo Preparación"
        onBack={onBack}
        action={
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hidden md:flex"
            onClick={() => technique.protocolUrl && window.open(technique.protocolUrl, '_blank')}
          >
            <FileText size={16} /> Ver Protocolo PDF
          </Button>
        }
      />

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 pb-24 overflow-y-auto">

        <div className="flex justify-between items-center mb-4 md:hidden">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 w-full justify-center"
            onClick={() => technique.protocolUrl && window.open(technique.protocolUrl, '_blank')}
          >
            <FileText size={16} /> Ver Protocolo PDF
          </Button>
        </div>

        {/* Description Section */}
        {technique.description && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Descripción</h3>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              {technique.description}
            </p>

          </div>
        )}

        {/* Necessary Carts Section */}
        {finalCartIds.length > 0 ? (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Carros Necesarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations
                .filter(loc => finalCartIds.includes(loc.id))
                .map(cart => (
                  <Card key={cart.id} className="flex items-center gap-4 p-4 border-l-4 bg-white dark:bg-slate-800" style={{ borderLeftColor: cart.color || '#0ea5e9' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: cart.color || '#0ea5e9' }}>
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{cart.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Ubicación Principal</p>
                    </div>

                  </Card>
                ))}
            </div>
          </div>
        ) : (hydratedItems.some(i => i.resolvedLocations && i.resolvedLocations.length > 0) && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Carros Necesarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="flex items-center gap-4 p-4 border-l-4 border-l-clinical-500 bg-white dark:bg-slate-800">
                <div className="w-12 h-12 rounded-full bg-clinical-100 dark:bg-clinical-900/30 flex items-center justify-center text-clinical-600 dark:text-clinical-400">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Carro de Técnicas</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Ubicación Genérica</p>
                </div>

              </Card>
            </div>
          </div>
        ))}

        {technique.equipment && technique.equipment.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Aparataje Necesario</h3>
            <div className="space-y-4">
              {technique.equipment.map((techEq, idx) => {
                const eq = techEq.equipment;
                if (!eq) return null;

                return (
                  <Card key={`eq-${idx}`} className="flex flex-col md:flex-row p-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="w-full md:w-32 h-32 md:h-auto bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 p-2">
                      {eq.imageUrl ? (
                        <img
                          src={eq.imageUrl}
                          alt={eq.name}
                          className="max-h-full max-w-full object-contain rounded-md"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 p-4">
                          <Monitor size={40} strokeWidth={1.5} />
                        </div>

                      )}
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-lg text-slate-900 dark:text-white">{eq.name}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{eq.description || 'Aparataje médico'}</p>
                        </div>

                        {/* Quantity removed as per request */}
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg w-full md:w-auto">
                          <Monitor size={18} />
                          <span className="font-semibold">Equipamiento</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Materiales Necesarios</h3>


        <div className="space-y-4">
          {hydratedItems.map((kitItem, idx) => {
            const item = kitItem.item;
            if (!item) return null;



            // External/Warehouse detection logic is removed as fields are gone.
            // We rely on resolvedLocations to know if it is in a cart.
            const isExternal = false; // Default to false as we don't know
            const toUseItem = item;
            const isChecked = checkedItems.has(toUseItem.id);

            return (
              <Card
                key={idx}
                className={`group relative flex flex-col md:flex-row p-0 transition-all duration-300 ${isChecked
                  ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 shadow-sm'
                  : isExternal
                    ? 'border-alert-200 bg-alert-50 dark:bg-alert-950/20 dark:border-alert-900'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-clinical-300 dark:hover:border-clinical-500 hover:shadow-md'}`}
              >
                {/* Image Section */}
                <div className={`w-full md:w-32 h-32 md:h-auto flex items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 p-2 transition-all ${isChecked ? 'opacity-50 grayscale bg-green-50 dark:bg-green-950/20' : 'bg-white dark:bg-slate-800'}`}>

                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain rounded-md"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 p-4">
                      <Box size={40} strokeWidth={1.5} />
                    </div>

                  )}
                </div>

                <div className={`flex-1 p-4 flex flex-col justify-center relative transition-all ${isChecked ? 'bg-green-50/30 dark:bg-green-950/10' : ''}`}>
                  <div className="flex justify-between items-start mb-0">
                    <div>
                      <h4 className={`font-bold text-base sm:text-lg text-slate-900 dark:text-white transition-colors ${isChecked ? 'text-green-800 dark:text-green-300' : ''}`}>{item.name}</h4>
                    </div>
                    <div className="flex flex-col items-end mr-1 sm:mr-2">
                      <span className={`text-xl sm:text-2xl font-bold transition-colors ${isChecked ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>x{kitItem.quantity}</span>
                      <span className="text-[10px] text-slate-400">unids</span>
                    </div>
                  </div>

                  {/* Location Badge */}
                  <div className={`flex flex-col items-start gap-1 mt-0 transition-opacity ${isChecked ? 'opacity-60' : 'opacity-100'}`}>
                    {kitItem.resolvedLocations && kitItem.resolvedLocations.length > 0 ? (
                      kitItem.resolvedLocations.map((loc, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-0.5 rounded-lg w-full md:w-auto"
                          style={{
                            color: loc.color,
                            backgroundColor: `${loc.color}15` // 15 = approx 8% opacity
                          }}
                        >
                          <MapPin size={18} style={{ color: loc.color }} />
                          <span className="font-semibold">{loc.name}</span>
                        </div>
                      ))
                    ) : (
                      // Fallback for items with no resolved location (Missing or External unknown)
                      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-0.5 rounded-lg w-full md:w-auto border border-slate-200 dark:border-slate-700">
                        <MapPin size={18} />
                        <span className="font-semibold">Ubicación no disponible</span>
                      </div>
                    )}
                  </div>

                  {!isChecked && (
                    <button
                      onClick={() => openWarehouseModal(item)}
                      className="absolute bottom-2 right-2 text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:text-amber-800 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 px-2 py-1 rounded transition-colors flex items-center gap-1 uppercase border border-amber-200 dark:border-amber-800 shadow-sm"
                    >

                      <MapPin size={10} /> Falta material
                    </button>
                  )}
                </div>

                {/* Checkbox Column */}
                <div className={`flex items-center justify-center p-4 border-l border-slate-100 dark:border-slate-700 ${isChecked ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-slate-50/30 dark:bg-slate-900/20'} md:w-20`}>
                  <button

                    onClick={() => toggleItem(toUseItem.id)}
                    className="group"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${isChecked
                      ? 'bg-green-500 text-white shadow-md scale-110 ring-4 ring-green-100 dark:ring-green-900'
                      : 'bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 text-slate-300 dark:text-slate-500 group-hover:border-clinical-500 group-hover:text-clinical-500 group-hover:scale-105'
                      }`}>

                      <Check size={28} className={isChecked ? "stroke-[3]" : "stroke-[2]"} />
                    </div>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div >

      {/* Sticky Bottom Action */}
      <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="max-w-4xl mx-auto space-y-2">

          <Button
            onClick={() => setIsSearchOpen(true)}
            fullWidth
            size="sm"
            variant="outline"
            className="flex justify-center items-center gap-2 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 h-10"
          >

            <Search size={18} />
            <span>¿Necesitas más material?</span>
          </Button>
          <Button onClick={onStartRestock} fullWidth size="lg" className="flex justify-between items-center group h-12">
            <span>Finalizar y Reponer</span>
            <ArrowRight className="opacity-70 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div >


      {/* Warehouse Location Modal */}
      <Modal isOpen={isWarehouseOpen} onClose={() => setIsWarehouseOpen(false)} title="Ubicación en Almacén">
        <div className="space-y-6">
          {selectedItem && (
            <>
              <div className="flex items-start gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                  {selectedItem.imageUrl ? (

                    <img src={selectedItem.imageUrl} alt={selectedItem.name} className="max-h-full max-w-full object-contain p-1" />
                  ) : (
                    <Box size={24} className="text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{selectedItem.name}</h4>
                  {selectedItem.category !== 'General' && selectedItem.category !== 'Material' && selectedItem.category !== 'material' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-wider">{selectedItem.category}</p>
                  )}

                </div>
              </div>

              <div className="bg-clinical-50 dark:bg-clinical-900/10 border border-clinical-100 dark:border-clinical-800 rounded-xl p-6 flex flex-col gap-2 text-center items-center">
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className="flex items-center gap-2 text-clinical-600 dark:text-clinical-400">
                    <MapPin size={20} />
                    <label className="text-sm font-bold uppercase tracking-widest">Ubicación en Almacén</label>
                  </div>
                </div>
                <div className="w-full space-y-2 text-center">
                  {(() => {
                    const itemLinks = cartContents.filter(ci => ci.itemId === selectedItem.id);

                    const replenishmentLocs = itemLinks.map(link => {
                      const loc = locations.find(l => l.id === link.locationId);
                      if (!loc) return null;

                      // Recursively find if it belongs to a CART
                      const isCartLocation = (l: any): boolean => {
                        const type = (l.type || '').toUpperCase();
                        if (type === 'CART') return true;
                        if (l.parent_id) {
                          const parent = locations.find(p => p.id === l.parent_id);
                          return parent ? isCartLocation(parent) : false;
                        }
                        return false;
                      };

                      if (isCartLocation(loc)) return null;

                      const parent = loc.parent_id ? locations.find(p => p.id === loc.parent_id) : null;
                      return parent ? `${parent.name} - ${loc.name}` : loc.name;
                    }).filter(Boolean);

                    if (replenishmentLocs.length === 0) {
                      return <p className="text-2xl font-bold text-slate-400 dark:text-slate-500 italic">No asignado en almacén</p>;
                    }

                    return replenishmentLocs.map((locName, i) => (
                      <p key={i} className="text-2xl font-bold text-slate-900 dark:text-white">
                        {locName}
                      </p>
                    ));
                  })()}
                </div>

              </div>

              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  Este material tiene su stock de reserva en la ubicación indicada.
                  Acude al almacén para reponer el nivel del carro.
                </p>
              </div>

              <Button fullWidth onClick={() => setIsWarehouseOpen(false)}>
                Entendido
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* Search Material Modal */}
      <Modal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} title="Buscar Material Adicional">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              aria-label="Buscar material adicional"
              placeholder="Buscar material..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-clinical-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />

          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {inventory
              .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .slice(0, 20) // Limit results
              .map(item => (
                <button
                  key={item.id}
                  onClick={() => openWarehouseModal(item)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600 text-left"
                >
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="max-h-full max-w-full object-contain p-1" />
                    ) : (
                      <Box size={20} className="text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{item.name}</h4>
                    {item.category !== 'General' && item.category !== 'Material' && item.category !== 'material' && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">{item.category}</p>
                    )}
                  </div>

                </button>
              ))}

            {searchQuery && inventory.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No se encontraron materiales
              </div>
            )}

          </div>
        </div>
      </Modal>


    </div >
  );
};