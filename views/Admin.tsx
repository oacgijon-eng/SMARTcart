import React, { useState, useRef } from 'react';
import { PageHeader, Button, Card } from '../components/UI';
import { CartView } from '../components/CartView';
import { Item, Technique, Equipment } from '../types';
import { Package, FilePlus, Settings, LogOut, Plus, Camera, ArrowLeft, Upload, X, Edit, Trash2, MapPin, LayoutGrid, List, FileText, ShoppingCart, BriefcaseMedical, Siren, Zap, ChevronDown, ChevronRight, ChevronLeft, Check, Monitor, ClipboardList, Clock, Building2, Users, Menu, Search, ShieldCheck, RefreshCw } from 'lucide-react';

import { supabase } from '../services/supabase';
import { Location } from '../hooks/useLocations';
import { useStockRevisions } from '../hooks/useSupabaseData';
import { useUnits, Unit } from '../hooks/useUnits';
import { useCartItems, useGlobalCartItems } from '../hooks/useCartItems';
import { useIncidents } from '../hooks/useIncidents';
import { useFeedbacks } from '../hooks/useFeedbacks';
import { useUsers } from '../hooks/useUsers';
import { correctText } from '../services/ai';


import { LOCATION_TYPES, LOCATION_COLORS } from '../constants';
import { InventoryTab } from './admin/InventoryTab';
import { TechniquesTab } from './admin/TechniquesTab';
import { EquipmentTab } from './admin/EquipmentTab';
import { LocationsTab } from './admin/LocationsTab';
import { UsersTab } from './admin/UsersTab';
import { SettingsTab } from './admin/SettingsTab';


interface AdminProps {
    inventory: Item[];
    techniques: Technique[];
    onLogout: () => void;
    onRefreshInventory?: () => void;
    onRefreshTechniques?: () => void;
    createItem: (item: any) => Promise<any>;
    updateItem: (id: string, updates: any) => Promise<any>;
    deleteItem: (id: string) => Promise<any>;
    equipmentData: Equipment[];
    createEquipment: (data: any) => Promise<any>;
    updateEquipment: (id: string, updates: any) => Promise<any>;
    deleteEquipment: (id: string) => Promise<any>;
    onRefreshEquipment?: () => void;
    createTechnique: (data: any) => Promise<any>;
    updateTechnique: (id: string, updates: any) => Promise<any>;
    deleteTechnique: (id: string) => Promise<any>;
    locationsData: Location[];
    createLocation: (location: any) => Promise<any>;
    updateLocation: (id: string, updates: any) => Promise<any>;
    deleteLocation: (id: string) => Promise<any>;
    unitId: string;
}

export const AdminLogin: React.FC<{
    onLogin: (email: string, pass: string) => Promise<{ error: any }>;
    onSuccess: () => void;
    onBack: () => void
}> = ({ onLogin, onSuccess, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Por favor introduce email y contraseña');
            return;
        }

        setLoading(true);
        setError(null);
        const { error } = await onLogin(email, password);
        if (error) {
            setError('Credenciales incorrectas o error de conexión');
            setLoading(false);
        } else {
            onSuccess();
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-night-bg flex items-center justify-center p-4 transition-colors pt-[calc(1rem+env(safe-area-inset-top))]">
            <Card className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 space-y-6 dark:bg-night-card dark:border-slate-700">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <img src="/Carro dia-01.png" alt="Logo" className="h-16 w-auto dark:hidden" />
                        <img src="/carro noche-01.png" alt="Logo" className="h-16 w-auto hidden dark:block" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-heading text-deep-blue dark:text-white">Acceso Supervisión</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Introduce tus credenciales</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-night-bg text-deep-blue dark:text-white placeholder-slate-400"
                            placeholder="admin@hospital.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
                        <input
                            type="password"
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-night-bg text-deep-blue dark:text-white placeholder-slate-400"
                            placeholder="••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        />
                    </div>
                    <Button fullWidth onClick={handleLogin} disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                    <button onClick={onBack} className="w-full text-center text-sm text-slate-500 dark:text-slate-400 hover:underline">Volver al inicio</button>
                </div>
            </Card>

        </div>
    )
}




export const AdminDashboard: React.FC<AdminProps> = (props) => {
    const { inventory, unitId, techniques, onLogout, onRefreshInventory, onRefreshTechniques, createItem, updateItem, deleteItem, equipmentData, createEquipment, updateEquipment, deleteEquipment, onRefreshEquipment, createTechnique, updateTechnique, deleteTechnique, locationsData, createLocation, updateLocation, deleteLocation } = props;
    const [activeTab, setActiveTab] = useState<'INVENTORY' | 'TECHNIQUES' | 'LOCATIONS' | 'CART' | 'EQUIPMENT' | 'REGISTROS' | 'REGISTROS_STOCK' | 'REGISTROS_FEEDBACK' | 'SETTINGS' | 'USERS'>('INVENTORY');
    const [selectedCartId, setSelectedCartId] = useState<string | null>(null);
    const [isCartsOpen, setIsCartsOpen] = useState(true);
    const [isTechNavOpen, setIsTechNavOpen] = useState(true);
    const [isRegistrosOpen, setIsRegistrosOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isTabSelectorOpen, setIsTabSelectorOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; type: 'TECHNIQUE' | 'LOCATION' | 'ITEM' | 'EQUIPMENT' | null; id: string | null }>({
        isOpen: false,
        type: null,
        id: null
    });

    // Material Creation/Edit State - Now received from props
    // const {createItem, updateItem, deleteItem} = useItems();
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [uploading, setUploading] = useState(false);

    // Location management state
    const [subLocationModal, setSubLocationModal] = useState<{ isOpen: boolean; parentId: string; parentName: string; parentType: string }>({
        isOpen: false,
        parentId: '',
        parentName: '',
        parentType: ''
    });
    const [subLocationName, setSubLocationName] = useState('');
    const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

    // Generic Cart Hook for the CURRENTLY selected cart
    const activeCartHook = useCartItems(selectedCartId || '');
    const { revisions, loading: loadingRevisions, refreshRevisions } = useStockRevisions(unitId);

    // Global items for "Available In" check
    const globalCartItems = useGlobalCartItems(unitId);

    // AI Text Correction Helper
    const handleBlurCorrection = async (text: string, setter: (val: string) => void) => {
        if (!text || !text.trim()) return;
        console.log("Blur triggered for:", text); // Debug log
        try {
            // Temporary debug alert to confirm it runs
            // alert(`Analizando texto: "${text}"...`); 

            const corrected = await correctText(text);
            console.log("AI Response:", corrected);

            if (corrected && corrected !== text) {
                console.log("Applying correction:", corrected);
                setter(corrected);
                // alert(`Corregido a: "${corrected}"`);
            } else {
                console.log("No correction needed or failed.");
            }
        } catch (error) {
            console.error("Error correcting text:", error);
            alert("Error en corrección AI (ver consola)");
        }
    };

    // Locations State - Now received from props
    // const {locations: savedLocations, createLocation, deleteLocation, updateLocation } = useLocations();
    const savedLocations = locationsData;
    const [editingLocation, setEditingLocation] = useState<{ id: string, name: string, type: 'CART' | 'WAREHOUSE' | 'EXTERNAL', color?: string } | null>(null);
    const [inventorySearch, setInventorySearch] = useState('');
    const [techniqueSearch, setTechniqueSearch] = useState('');
    const [equipmentMainSearch, setEquipmentMainSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Item; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    // Helper to upload base64 images to Supabase Storage
    const handleStorageDebug = async () => {
        try {
            alert("Iniciando prueba de conexión con Storage...");
            const fileName = `debug_${Date.now()}.txt`;
            const { data, error } = await supabase.storage
                .from('images')
                .upload(fileName, new Blob(['test'], { type: 'text/plain' }));

            if (error) {
                console.error("DEBUG STORAGE ERROR:", error);
                alert(`ERROR CRÍTICO STORAGE:\n${error.message}\nCodigo: ${error.cause || 'N/A'}`);
            } else {
                alert(`¡ÉXITO! Archivo subido correctamente.\nPath: ${data.path}`);
                // Cleanup
                // await supabase.storage.from('images').remove([fileName]);
            }
        } catch (e: any) {
            alert(`EXCEPCIÓN LOCAL: ${e.message}`);
        }
    };

    // Robust Base64 to Blob converter
    const base64ToBlob = (base64: string, contentType: string = 'image/jpeg') => {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteArrays = [];
        for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays.push(byteCharacters.charCodeAt(i));
        }
        const byteArray = new Uint8Array(byteArrays);
        return new Blob([byteArray], { type: contentType });
    };

    const uploadImageToStorage = async (data: string | File): Promise<string | null> => {
        try {
            let blob: Blob;

            // Step 1: Prepare Blob
            if (data instanceof File) {
                // Raw file (Zero-copy)
                blob = data;
                console.log("Using raw file for upload:", blob.size, blob.type);
            } else {
                // Base64 Legacy conversion
                // alert("Paso 1: Convirtiendo imagen...");
                try {
                    blob = base64ToBlob(data, 'image/jpeg');
                    console.log("Blob created from base64:", blob.size, blob.type);
                } catch (e: any) {
                    alert(`Error convirtiendo imagen: ${e.message}`);
                    return null;
                }
            }

            const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

            // STEP 2: Upload
            // alert(`Paso 2: Subiendo ${Math.round(blob.size / 1024)}KB a Storage...`);
            const { data: uploadData, error } = await supabase.storage
                .from('images')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                    upsert: false
                });

            if (error) {
                console.error("Supabase Storage Upload Error:", error);
                alert(`Error subiendo imagen real: ${error.message}`);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error: any) {
            // Alerts handled above for specific steps
            return null;
        }
    };

    const handleSort = (key: keyof Item) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Equipment State - Now received from props
    // const {equipment, createEquipment, updateEquipment, deleteEquipment, refreshEquipment} = useEquipment();
    const equipment = equipmentData;
    const refreshEquipment = onRefreshEquipment;

    // Incidents & Feedbacks State
    const { incidents, loading: loadingIncidents, fetchIncidents } = useIncidents(unitId);
    const { feedbacks, loading: loadingFeedbacks, fetchFeedbacks } = useFeedbacks(unitId);



    const handleConfirmDelete = async () => {
        const { type, id } = deleteConfirmation;
        if (!id || !type) return;

        try {
            if (type === 'TECHNIQUE') {
                await deleteTechnique(id);
                if (onRefreshTechniques) onRefreshTechniques();
            } else if (type === 'LOCATION') {
                await deleteLocation(id);
            } else if (type === 'ITEM') {
                await deleteItem(id);
                if (onRefreshInventory) onRefreshInventory();
            } else if (type === 'EQUIPMENT') {
                await deleteEquipment(id);
                if (onRefreshEquipment) onRefreshEquipment();
            }
            setDeleteConfirmation({ isOpen: false, type: null, id: null });
        } catch (e: any) {
            console.error(e);
            alert('Error al borrar: ' + (e.message || 'Error desconocido'));
            setDeleteConfirmation({ isOpen: false, type: null, id: null });
        }
    };

    const handleDeleteLocation = (id: string) => {
        setDeleteConfirmation({ isOpen: true, type: 'LOCATION', id });
    };

    const handleDeleteTechnique = (id: string) => {
        setDeleteConfirmation({ isOpen: true, type: 'TECHNIQUE', id });
    };

    const handleAddTechnique = async (techData: any) => {
        try {
            if (techData.id) {
                await updateTechnique(techData.id, techData);
            } else {
                await createTechnique(techData);
            }
            if (onRefreshTechniques) onRefreshTechniques();
            return true;
        } catch (e: any) {
            console.error("Full Error:", e);
            const errMsg = e?.message || e?.details || JSON.stringify(e);
            alert('Error al guardar técnica:\n' + errMsg);
            return false;
        }
    };

    const toggleLocation = (id: string) => {
        setExpandedLocations(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const finalCreateLocation = async (locData: any) => {
        try {
            let finalName = locData.name ? locData.name.trim() : '';
            if (finalName.length > 0) {
                finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
                try {
                    const corrected = await correctText(finalName);
                    if (corrected) finalName = corrected;
                } catch (e) {
                    console.error("Text correction failed", e);
                }
            }
            await createLocation({ ...locData, name: finalName || locData.name, unit_id: unitId });
        } catch (e: any) {
            alert("Error: " + e.message);
        }
    };

    const handleUpdateLocation = async (id?: string, updates?: any) => {
        const targetId = typeof id === 'string' ? id : editingLocation?.id;
        const targetUpdates = updates || editingLocation;

        if (!targetId || !targetUpdates) return;
        try {
            let finalName = targetUpdates.name ? targetUpdates.name.trim() : '';
            if (finalName.length > 0) {
                finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
                try {
                    const corrected = await correctText(finalName);
                    if (corrected) finalName = corrected;
                } catch (e) {
                    console.error("Text correction failed", e);
                }
            }
            await updateLocation(targetId, { ...targetUpdates, name: finalName || targetUpdates.name });
            if (!id && editingLocation) setEditingLocation(null);
        } catch (e: any) {
            alert("Error: " + e.message);
        }
    };

    const handleSaveSubLocation = async () => {
        if (!subLocationName) return;
        try {
            let finalName = subLocationName.trim();
            if (finalName.length > 0) {
                finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
                try {
                    const corrected = await correctText(finalName);
                    if (corrected) finalName = corrected;
                } catch (e) {
                    console.error("Text correction failed", e);
                }
            }

            await createLocation({
                name: finalName,
                type: subLocationModal.parentType,
                parent_id: subLocationModal.parentId,
                unit_id: unitId
            });
            setSubLocationModal({ ...subLocationModal, isOpen: false });
            setSubLocationName('');
        } catch (e: any) {
            alert("Error: " + e.message);
        }
    };

    const handleSaveItem = async (itemData: any, locationId?: string) => {
        if (!itemData.name) {
            alert('Por favor rellena el nombre');
            return false;
        }

        try {
            setUploading(true);
            let finalImage = itemData.imageUrl;

            // Handle image upload if it's base64
            if (finalImage && finalImage.startsWith('data:')) {
                const uploadedUrl = await uploadImageToStorage(finalImage);
                if (uploadedUrl) finalImage = uploadedUrl;
            }

            let finalName = itemData.name.trim();
            if (finalName.length > 0) {
                finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
                try {
                    const corrected = await correctText(finalName);
                    if (corrected) finalName = corrected;
                } catch (e) {
                    console.error("Text correction failed", e);
                }
            }

            let createdItemId = '';
            if (itemData.id) {
                await updateItem(itemData.id, {
                    ...itemData,
                    name: finalName,
                    imageUrl: finalImage
                });
                createdItemId = itemData.id;
            } else {
                const res = await createItem({
                    ...itemData,
                    name: finalName,
                    imageUrl: finalImage
                });
                createdItemId = res?.id;
            }

            if (locationId && createdItemId) {
                // Delete previous warehouse associations for this item to avoid duplicates 
                const warehouseLocationIds = locationsData.filter(l => l.type !== 'CART').map(l => l.id);

                if (warehouseLocationIds.length > 0) {
                    const { error: delErr } = await supabase.from('cart_contents')
                        .delete()
                        .eq('item_id', createdItemId)
                        .in('location_id', warehouseLocationIds);
                    if (delErr) console.warn("Could not clean up old item locations:", delErr);
                }

                try {
                    await activeCartHook.addCartItem(locationId, createdItemId, 0);
                } catch (addErr) {
                    console.error("Error setting new item location:", addErr);
                }
            }

            if (onRefreshInventory) onRefreshInventory();
            await globalCartItems.refresh();
            return true;
        } catch (e: any) {
            console.error('Error al guardar material:', e);
            // alert('Error al guardar material: ' + e.message); // Prevent Playwright hang
            return false;
        } finally {
            setUploading(false);
        }
    };

    const handleSaveEquipment = async (equipmentData: any) => {
        if (!equipmentData.name) return;
        try {
            setUploading(true);
            let finalImage = equipmentData.imageUrl;
            if (finalImage && finalImage.startsWith('data:')) {
                const uploadedUrl = await uploadImageToStorage(finalImage);
                if (uploadedUrl) finalImage = uploadedUrl;
            }

            if (equipmentData.id) {
                await updateEquipment(equipmentData.id, { ...equipmentData, imageUrl: finalImage });
            } else {
                await createEquipment({ ...equipmentData, imageUrl: finalImage });
            }
            if (onRefreshEquipment) onRefreshEquipment();
        } catch (e: any) {
            console.error(e);
            alert('Error al guardar equipo: ' + e.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteItem = (id: string) => {
        setDeleteConfirmation({ isOpen: true, type: 'ITEM', id });
    };

    const handleDeleteEquipment = (id: string) => {
        setDeleteConfirmation({ isOpen: true, type: 'EQUIPMENT', id });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors overflow-x-hidden">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2 sm:py-4 flex justify-between items-center sticky top-0 z-40 pt-[calc(0.5rem+env(safe-area-inset-top))]">
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <div className="bg-clinical-600 text-white p-1.5 sm:p-2 rounded-lg">
                        <Settings size={18} />
                    </div>
                    <div className="md:hidden relative">
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                            {activeTab === 'INVENTORY' ? 'Inventario' :
                                activeTab === 'EQUIPMENT' ? 'Aparataje' :
                                    activeTab === 'LOCATIONS' ? 'Ubicaciones' :
                                        activeTab === 'TECHNIQUES' ? 'Técnicas' :
                                            activeTab === 'CART' ? 'Carro' :
                                                activeTab === 'USERS' ? 'Usuarios' :
                                                    activeTab === 'SETTINGS' ? 'Ajustes' :
                                                        activeTab === 'REGISTROS_STOCK' ? 'Stock' :
                                                            activeTab === 'REGISTROS_FEEDBACK' ? 'Feedback' : 'Panel de Control'}
                        </h1>

                    </div>
                    <h1 className="hidden md:block text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">Panel de Control</h1>
                </div>
                <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 ml-auto">
                    <LogOut size={16} /> Salir
                </Button>
                <div className="hidden md:block ml-2">

                </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative w-full">
                {/* Mobile Menu Backdrop */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Sidebar / Tabs */}
                <div className={`
                    fixed md:relative inset-y-0 left-0 ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'} w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
                    flex flex-col z-50 transform transition-all duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0 md:static shrink-0
                `}>
                    {/* Toggle Button (Desktop only) */}
                    <div className="hidden md:flex justify-end p-2 border-b border-transparent">
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
                    </div>

                    {/* 1. Carros Dropdown */}
                    <div className="border-b md:border-b-0 border-transparent transition-all">
                        <button
                            onClick={() => {
                                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
                                setIsCartsOpen(!isCartsOpen);
                            }}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-6'} py-4 text-sm font-medium transition-colors whitespace-nowrap
                            ${activeTab === 'CART' ? 'text-clinical-700 bg-clinical-50/50 dark:text-clinical-400 dark:bg-clinical-900/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            title={isSidebarCollapsed ? "Carros" : ""}
                        >
                            <div className="flex items-center gap-3">
                                <img src="/Carro%20dia-01.png" alt="Carros" className="w-6 h-6 dark:hidden object-contain" />
                                <img src="/carro%20noche-01.png" alt="Carros" className="w-6 h-6 hidden dark:block object-contain" />
                                {!isSidebarCollapsed && <span>Carros</span>}
                            </div>
                            {!isSidebarCollapsed && (isCartsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                        </button>

                        {isCartsOpen && (
                            <div className={`bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50 flex flex-col ${isSidebarCollapsed ? 'hidden' : ''}`}>
                                {savedLocations
                                    .filter(l => l.type === 'CART' && !l.parent_id)
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(cart => (
                                        <button
                                            key={cart.id}
                                            onClick={() => {
                                                setActiveTab('CART');
                                                setSelectedCartId(cart.id);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className={`flex items-center gap-3 pl-12 pr-6 py-3 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap text-left border-l-4
                                            ${activeTab === 'CART' && selectedCartId === cart.id ? 'bg-clinical-100/50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/20 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-500 dark:text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full mr-1"
                                                style={{ backgroundColor: cart.color || '#bae6fd' }}
                                            />
                                            {cart.name}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Inventario */}
                    <button
                        onClick={() => { setActiveTab('INVENTORY'); setIsMobileMenuOpen(false); }}
                        className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-6'} py-4 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap
                        ${activeTab === 'INVENTORY' ? 'bg-clinical-50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/10 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        title={isSidebarCollapsed ? "Inventario" : ""}
                    >
                        <Package size={18} />
                        {!isSidebarCollapsed && <span>Inventario</span>}
                    </button>

                    {/* 3. Aparataje */}
                    <button
                        onClick={() => { setActiveTab('EQUIPMENT'); setIsMobileMenuOpen(false); }}
                        className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-6'} py-4 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap
                        ${activeTab === 'EQUIPMENT' ? 'bg-clinical-50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/10 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        title={isSidebarCollapsed ? "Aparataje" : ""}
                    >
                        <Monitor size={18} />
                        {!isSidebarCollapsed && <span>Aparataje</span>}
                    </button>

                    {/* 3.1 Ubicaciones */}
                    <button
                        onClick={() => { setActiveTab('LOCATIONS'); setIsMobileMenuOpen(false); }}
                        className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-6'} py-4 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap
                        ${activeTab === 'LOCATIONS' ? 'bg-clinical-50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/10 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        title={isSidebarCollapsed ? "Ubicaciones" : ""}
                    >
                        <Building2 size={18} />
                        {!isSidebarCollapsed && <span>Ubicaciones</span>}
                    </button>

                    {/* 4. Técnicas */}
                    <button
                        onClick={() => { setActiveTab('TECHNIQUES'); setIsMobileMenuOpen(false); }}
                        className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-6'} py-4 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap
                        ${activeTab === 'TECHNIQUES' ? 'bg-clinical-50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/10 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        title={isSidebarCollapsed ? "Técnicas" : ""}
                    >
                        <FilePlus size={18} />
                        {!isSidebarCollapsed && <span>Técnicas</span>}
                    </button>

                    {/* 5. Registros Dropdown */}
                    <div className="border-b md:border-b-0 border-transparent">
                        <button
                            onClick={() => {
                                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
                                setIsRegistrosOpen(!isRegistrosOpen);
                                setActiveTab('REGISTROS');
                            }}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-6'} py-4 text-sm font-medium transition-colors whitespace-nowrap
                            ${['REGISTROS', 'REGISTROS_STOCK', 'REGISTROS_FEEDBACK'].includes(activeTab) ? 'text-clinical-700 bg-clinical-50/50 dark:text-clinical-400 dark:bg-clinical-900/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            title={isSidebarCollapsed ? "Registros" : ""}
                        >
                            <div className="flex items-center gap-3">
                                <ClipboardList size={18} />
                                {!isSidebarCollapsed && <span>Registros</span>}
                            </div>
                            {!isSidebarCollapsed && (isRegistrosOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                        </button>

                        {isRegistrosOpen && (
                            <div className={`bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/50 flex flex-col ${isSidebarCollapsed ? 'hidden' : ''}`}>
                                <button
                                    onClick={() => { setActiveTab('REGISTROS_STOCK'); setIsMobileMenuOpen(false); }}
                                    className={`flex items-center gap-3 pl-12 pr-6 py-3 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap text-left
                                    ${activeTab === 'REGISTROS_STOCK' ? 'bg-clinical-100/50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/20 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-500 dark:text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                                >
                                    Stock y Caducidades
                                </button>
                                <button
                                    onClick={() => { setActiveTab('REGISTROS_FEEDBACK'); setIsMobileMenuOpen(false); }}
                                    className={`flex items-center gap-3 pl-12 pr-6 py-3 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap text-left
                                    ${activeTab === 'REGISTROS_FEEDBACK' ? 'bg-clinical-100/50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/20 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-500 dark:text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                                >
                                    Feedback
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 6. Usuarios */}
                    <button
                        onClick={() => { setActiveTab('USERS'); setIsMobileMenuOpen(false); }}
                        className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-6'} py-4 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap
                        ${activeTab === 'USERS' ? 'bg-clinical-50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/10 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        title={isSidebarCollapsed ? "Usuarios" : ""}
                    >
                        <Users size={18} />
                        {!isSidebarCollapsed && <span>Usuarios</span>}
                    </button>


                    {/* 7. Ajustes */}
                    <button
                        onClick={() => { setActiveTab('SETTINGS'); setIsMobileMenuOpen(false); }}
                        className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-6'} py-4 text-sm font-medium md:border-l-4 transition-colors whitespace-nowrap
                        ${activeTab === 'SETTINGS' ? 'bg-clinical-50 text-clinical-700 border-clinical-600 dark:bg-clinical-900/10 dark:text-clinical-400 dark:border-clinical-500' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        title={isSidebarCollapsed ? "Ajustes" : ""}
                    >
                        <Settings size={18} />
                        {!isSidebarCollapsed && <span>Ajustes</span>}
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-3 sm:p-6 overflow-y-auto w-full md:w-auto">


                    {/* Delete Confirmation Modal (Global) */}
                    {deleteConfirmation.isOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 border dark:border-slate-800">
                                <div className="text-center space-y-2">
                                    <div className="mx-auto bg-red-100 dark:bg-red-900/30 w-12 h-12 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                                        <Trash2 size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">¿Confirmar eliminación?</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {deleteConfirmation.type === 'ITEM' && 'Estás a punto de eliminar este material del inventario. Esta acción no se puede deshacer.'}
                                        {deleteConfirmation.type === 'LOCATION' && 'Estás a punto de eliminar esta ubicación y TODO su contenido. Esta acción no se puede deshacer.'}
                                        {deleteConfirmation.type === 'TECHNIQUE' && 'Estás a punto de eliminar esta técnica. Esta acción no se puede deshacer.'}
                                        {deleteConfirmation.type === 'EQUIPMENT' && 'Estás a punto de eliminar este equipo (aparataje). Esta acción no se puede deshacer.'}
                                        {!deleteConfirmation.type && 'Esta acción es irreversible. Se eliminará el elemento y todas sus asociaciones.'}
                                    </p>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleConfirmDelete}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors ring-offset-2 focus:ring-2 focus:ring-red-500 outline-none"
                                    >
                                        Eliminar
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmation({ isOpen: false, type: null, id: null })}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-2 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}








                    {activeTab === 'CART' && selectedCartId && (
                        <CartView
                            cartType={selectedCartId}
                            locations={savedLocations}
                            rootLocationId={selectedCartId}
                            cartItems={activeCartHook.cartItems}
                            loading={activeCartHook.loading}
                            onManageMaterials={(locationId, locationName) => alert(`Gestionar materiales para ${locationName} (Próximamente)`)}
                            onManageLocations={() => setActiveTab('LOCATIONS')}
                            onAddSubLocation={() => {
                                const cart = savedLocations.find(l => l.id === selectedCartId);
                                if (cart) {
                                    setSubLocationModal({ isOpen: true, parentId: cart.id, parentName: cart.name, parentType: 'CART' });
                                }
                            }}
                            onEditSubLocation={(loc) => setEditingLocation(loc)}
                            onDeleteSubLocation={(id) => handleDeleteLocation(id)}
                        />
                    )}

                    {/* Sub-location Modal (Rendered independently of tabs) */}
                    {subLocationModal.isOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-900">Nueva Sub-ubicación</h3>
                                    <button onClick={() => setSubLocationModal({ ...subLocationModal, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Creando ubicación dentro de: <span className="font-semibold text-slate-900">{subLocationModal.parentName}</span>
                                    </p>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-clinical-500 outline-none"
                                        placeholder="Ej: Bandeja Superior"
                                        autoFocus
                                        value={subLocationName}
                                        onChange={e => setSubLocationName(e.target.value)}
                                        onBlur={e => handleBlurCorrection(e.target.value, setSubLocationName)}
                                        onKeyDown={e => e.key === 'Enter' && handleSaveSubLocation()}
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button fullWidth onClick={handleSaveSubLocation}>Crear</Button>
                                    <Button fullWidth variant="ghost" onClick={() => setSubLocationModal({ ...subLocationModal, isOpen: false })}>Cancelar</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Editing Location Modal (Rendered independently of tabs) */}
                    {editingLocation && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 border dark:border-slate-800">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold dark:text-white">Editar Ubicación</h3>
                                    <button onClick={() => setEditingLocation(null)} className="dark:text-slate-400 dark:hover:text-white"><X size={20} /></button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-clinical-500 outline-none"
                                        value={editingLocation.name}
                                        onChange={e => setEditingLocation({ ...editingLocation, name: e.target.value })}
                                        autoFocus
                                    />
                                </div>

                                {editingLocation.type === 'CART' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color del Carro</label>
                                        <div className="flex flex-wrap gap-2">
                                            {LOCATION_COLORS.map(c => (
                                                <button
                                                    key={c.value}
                                                    onClick={() => setEditingLocation({ ...editingLocation, color: c.value === editingLocation.color ? undefined : c.value })}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all ${c.class} ${editingLocation.color === c.value ? 'border-slate-800 scale-110 shadow-lg ring-2 ring-slate-300' : 'border-transparent hover:scale-105'}`}
                                                    title={c.name}
                                                />
                                            ))}
                                            <button
                                                onClick={() => setEditingLocation({ ...editingLocation, color: undefined })}
                                                className={`w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all ${!editingLocation.color ? 'border-slate-800 dark:border-slate-200 ring-2 ring-slate-300 dark:ring-slate-600' : ''}`}
                                                title="Sin color"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <Button fullWidth onClick={handleUpdateLocation}>Guardar Cambios</Button>
                            </div>
                        </div>
                    )}



                    {activeTab === 'INVENTORY' && (
                        <InventoryTab
                            inventory={inventory}
                            inventorySearch={inventorySearch}
                            setInventorySearch={setInventorySearch}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            sortConfig={sortConfig}
                            handleSort={handleSort}
                            onSaveItem={handleSaveItem}
                            onDeleteItem={handleDeleteItem}
                            globalCartItems={globalCartItems}
                            savedLocations={savedLocations}
                        />
                    )}


                    {activeTab === 'TECHNIQUES' && (
                        <TechniquesTab
                            techniques={techniques}
                            liveTechniques={techniques}
                            techniqueSearch={techniqueSearch}
                            setTechniqueSearch={setTechniqueSearch}
                            onDeleteTechnique={handleDeleteTechnique}
                            savedLocations={savedLocations}
                            inventory={inventory}
                            equipment={equipment}
                            handleSaveTechnique={handleAddTechnique}
                        />
                    )}

                    {activeTab === 'EQUIPMENT' && (
                        <EquipmentTab
                            equipment={equipment}
                            equipmentMainSearch={equipmentMainSearch}
                            setEquipmentMainSearch={setEquipmentMainSearch}
                            onDeleteEquipment={handleDeleteEquipment}
                            savedLocations={savedLocations}
                            handleSaveEquipment={handleSaveEquipment}
                        />
                    )}
                    {activeTab === 'LOCATIONS' && (
                        <LocationsTab
                            savedLocations={savedLocations}
                            onSaveLocation={finalCreateLocation}
                            onUpdateLocation={handleUpdateLocation}
                            onDeleteLocation={handleDeleteLocation}
                            expandedLocations={expandedLocations}
                            toggleLocation={toggleLocation}
                        />
                    )}

                    {activeTab === 'USERS' && <UsersTab />}

                    {activeTab === 'SETTINGS' && <SettingsTab unitId={unitId} />}

                    {
                        ['REGISTROS', 'REGISTROS_STOCK', 'REGISTROS_FEEDBACK'].includes(activeTab) && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-bold">
                                        {activeTab === 'REGISTROS_STOCK' ? 'Registro de Stock y Caducidades' :
                                            activeTab === 'REGISTROS_FEEDBACK' ? 'Feedback de Usuarios' :
                                                'Registro de Actividad e Incidencias'}
                                    </h2>
                                    <Button size="sm" variant="outline" className="gap-2" onClick={() => { fetchIncidents(); fetchFeedbacks(); refreshRevisions(); }}>
                                        <Clock size={16} /> Actualizar
                                    </Button>
                                </div>


                                <div className="space-y-4">
                                    {activeTab === 'REGISTROS_STOCK' && (() => {
                                        // Calculate latest revision per location
                                        const latestRevisions = revisions.reduce((acc: any[], curr: any) => {
                                            if (!acc.find(item => item.location_id === curr.location_id) && curr.locations) {
                                                acc.push({
                                                    location_id: curr.location_id,
                                                    location_name: curr.locations.name,
                                                    location_color: curr.locations.color,
                                                    date: curr.created_at
                                                });
                                            }
                                            return acc;
                                        }, []).sort((a: any, b: any) => a.location_name.localeCompare(b.location_name));

                                        if (latestRevisions.length === 0) return null;

                                        return (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
                                                {latestRevisions.map((item: any) => (
                                                    <div
                                                        key={item.location_id}
                                                        className="bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex items-center"
                                                        style={{ borderColor: item.location_color || '#e2e8f0' }}
                                                    >
                                                        {/* Color accent bar */}
                                                        <div
                                                            className="absolute top-0 left-0 w-1.5 h-full"
                                                            style={{ backgroundColor: item.location_color || '#e2e8f0' }}
                                                        />

                                                        <div className="pl-3">
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate" title={item.location_name}>
                                                                {item.location_name}
                                                            </div>
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                                    {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {new Date(item.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>

                                <Card className="overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1000px] text-left text-sm">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400">Fecha</th>
                                                    {activeTab === 'REGISTROS_STOCK' ? (
                                                        <>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400">Revisor</th>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400">Ubicación</th>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400 hidden sm:table-cell">Caducidades</th>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400 text-right">Notas</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400">Valor/Estado</th>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400 hidden sm:table-cell">Técnica</th>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400">Incidencia</th>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 font-semibold text-slate-600 dark:text-slate-400 text-left">Descripción</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {(loadingIncidents || loadingFeedbacks || (activeTab === 'REGISTROS_STOCK' && loadingRevisions)) ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Cargando registros...</td>
                                                    </tr>
                                                ) : (() => {
                                                    if (activeTab === 'REGISTROS_STOCK') {
                                                        if (revisions.length === 0) return (
                                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No hay revisiones de stock.</td></tr>
                                                        );
                                                        return revisions.map((rev: any) => (
                                                            <tr key={rev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                                    <div className="text-xs sm:text-sm">
                                                                        {new Date(rev.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                                    </div>
                                                                    <div className="text-[10px] sm:hidden text-slate-400">
                                                                        {new Date(rev.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-900 dark:text-slate-200 text-xs sm:text-sm">{rev.reviewer_name}</td>
                                                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 dark:text-slate-400">
                                                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                                                        <span
                                                                            className="w-2 h-2 sm:w-3 sm:h-3 rounded-full shrink-0"
                                                                            style={{ backgroundColor: rev.locations?.color || '#cbd5e1' }}
                                                                        />
                                                                        <span className="truncate max-w-[80px] sm:max-w-none">{rev.locations?.name || 'Desconocida'}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                                                    {rev.expiry_checked ? (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">
                                                                            <Check size={12} /> Revisado
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-slate-400 text-xs">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-slate-500 dark:text-slate-400 italic max-w-[100px] sm:max-w-xs truncate text-xs sm:text-sm">
                                                                    {rev.notes || '-'}
                                                                </td>
                                                            </tr>
                                                        ));
                                                    }

                                                    let rows = [];

                                                    if (activeTab === 'REGISTROS_FEEDBACK') {
                                                        rows = feedbacks.map(feedback => ({
                                                            id: feedback.id,
                                                            created_at: feedback.created_at,
                                                            type: feedback.type,
                                                            description: feedback.description,
                                                            category: feedback.issue || feedback.category,
                                                            rating: feedback.rating,
                                                            related_technique_id: feedback.technique_id,
                                                            source: 'feedback'
                                                        }));
                                                    } else {
                                                        // ALL REGISTROS (Merged view if desired, or just incidents for now)
                                                        const incidentRows = incidents.map(i => ({
                                                            id: i.id,
                                                            created_at: i.created_at,
                                                            type: i.type === 'INCIDENCE' ? 'INCIDENCE' : 'OTHER',
                                                            description: i.description || '',
                                                            category: i.category,
                                                            status: i.status,
                                                            related_technique_id: i.related_technique_id,
                                                            source: 'incident'
                                                        }));
                                                        const feedbackRows = feedbacks.map(f => ({
                                                            id: f.id,
                                                            created_at: f.created_at,
                                                            type: f.type,
                                                            description: f.description,
                                                            category: f.issue || f.category,
                                                            rating: f.rating,
                                                            related_technique_id: f.technique_id,
                                                            source: 'feedback'
                                                        }));
                                                        rows = [...incidentRows, ...feedbackRows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                                                    }

                                                    if (rows.length === 0) {
                                                        return (
                                                            <tr>
                                                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No hay registros disponibles.</td>
                                                            </tr>
                                                        );
                                                    }

                                                    return rows.map((row: any) => (
                                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 whitespace-nowrap">
                                                                <div className="text-xs sm:text-sm">
                                                                    {new Date(row.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                                </div>
                                                                <div className="text-[10px] sm:hidden text-slate-400">
                                                                    {new Date(row.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                                {row.source === 'incident' ? (
                                                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium ${row.status === 'OPEN' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                        row.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                                            'bg-slate-50 text-slate-400 border border-slate-100'
                                                                        }`}>
                                                                        {row.status === 'OPEN' ? 'Pendiente' :
                                                                            row.status === 'RESOLVED' ? 'Resuelto' : 'Descartado'}
                                                                    </span>
                                                                ) : (
                                                                    row.rating ? (
                                                                        <div className="flex text-amber-400 text-[10px] sm:text-sm">
                                                                            {'★'.repeat(row.rating)}
                                                                            <span className="text-slate-200">{'★'.repeat(5 - row.rating)}</span>
                                                                        </div>
                                                                    ) : <span className="text-slate-400 text-xs">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 hidden sm:table-cell text-sm">
                                                                {row.related_technique_id ?
                                                                    (techniques.find((t: any) => t.id === row.related_technique_id)?.name || '-')
                                                                    : '-'
                                                                }
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${row.type === 'INCIDENCE' ? 'text-red-700' :
                                                                    row.type === 'RATING' ? 'text-indigo-700' :
                                                                        row.type === 'SUGGESTION' ? 'text-amber-700' :
                                                                            'text-slate-700'
                                                                    }`}>
                                                                    {row.category || (
                                                                        row.type === 'INCIDENCE' ? 'Incidencia' :
                                                                            row.type === 'RATING' ? 'Valoración' :
                                                                                row.type === 'SUGGESTION' ? 'Sugerencia' : 'Comentario'
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-900 min-w-[120px] sm:min-w-[200px] text-left">
                                                                <p className="font-medium text-xs sm:text-sm line-clamp-2 sm:line-clamp-none">{row.description}</p>
                                                                {row.category && <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase mt-0.5 sm:mt-1">{row.category}</p>}
                                                            </td>
                                                        </tr>
                                                    ));
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        )
                    }
                </div >
            </div >
            {/* Redundant modals removed */}





        </div >
    );
};