import React, { useState } from 'react';
import { ViewState, Technique } from './types';

import { useItems, useTechniques, useEquipment } from './hooks/useSupabaseData';
import { useLocations } from './hooks/useLocations'; // Import useLocations
import { useGlobalCartItems } from './hooks/useCartItems'; // Import useGlobalCartItems
import { useAuth } from './hooks/useAuth';
import { Landing } from './views/Landing';
import { TechniqueSelector } from './views/TechniqueSelector';
import { TechniqueDetail } from './views/TechniqueDetail';
import { Restock } from './views/Restock';
import { StockRevision } from './views/StockRevision';
import { AdminLogin, AdminDashboard } from './views/Admin';
import { useProfile } from './hooks/useProfile';
import { useUnits } from './hooks/useUnits';

import { ThemeProvider } from './context/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

const AppContent: React.FC = () => {

  const [view, setView] = useState<ViewState>('LANDING');
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);

  // Unit State
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(() => {
    return localStorage.getItem('SMARTCART_UNIT_ID');
  });

  // Derive unit name from ID
  const selectedUnit = React.useMemo(() => {
    // Check if units is available, if not fallback to localStorage name or null
    // We access 'units' from useUnits hook but need to be careful about order if useUnits depends on selectedUnitId
    // useUnits does NOT depend on selectedUnitId, so we can call it after.
    // BUT we need 'units' here. So 'units' must be defined before this useMemo!
    // Wait, 'units' is defined at line 37.
    // So I must move 'units' definition UP as well.
    return localStorage.getItem('SMARTCART_UNIT_NAME') || null;
  }, [selectedUnitId]);

  const { items, loading: itemsLoading, error: itemsError, refreshItems, createItem, updateItem, deleteItem } = useItems();
  const { techniques, loading: techniquesLoading, error: techniquesError, refreshTechniques, createTechnique, updateTechnique, deleteTechnique } = useTechniques();
  const { locations, fetchLocations: refreshLocations, createLocation, updateLocation, deleteLocation } = useLocations(selectedUnitId || undefined);
  const { allItems: cartContents, refresh: refreshCartContents } = useGlobalCartItems();
  const { units, loading: unitsLoading, createUnit } = useUnits();
  const { equipment, refreshEquipment, createEquipment, updateEquipment, deleteEquipment } = useEquipment(selectedUnitId || undefined);

  // Auth Hook
  const { session, signIn, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Navigation Handlers
  const handleNurseStart = () => setView('SELECTOR');
  const handleAdminStart = async () => {
    // Always sign out before entering admin login to ensure fresh credentials
    await signOut();
    setView('ADMIN_LOGIN');
  };
  const handleStockRevisionStart = () => setView('STOCK_REVISION');

  const handleSelectTechnique = (t: Technique) => {
    setSelectedTechnique(t);
    setView('DETAIL');
  };

  const handleStartRestock = () => setView('RESTOCK');
  const handleFinishRestock = () => {
    setSelectedTechnique(null);
    setView('LANDING');
  };

  // Admin login is now handled by passing signIn to AdminLogin component
  const handleAdminLoginSuccess = () => {
    // We rely on the useEffect or subsequent render to check profile, 
    // but to be snappy we can set view. However, if profile isn't ready, we might need to wait.
    // For now, let's allow setting it, and the effect below will kick them out if not supervisor.
    setView('ADMIN_DASHBOARD');
  };

  const handleBackToLanding = () => {
    // If we were in admin views, sign out
    if (view === 'ADMIN_LOGIN' || view === 'ADMIN_DASHBOARD') {
      signOut();
    }
    setSelectedTechnique(null);
    setView('LANDING');
  };

  const handleBackToSelector = () => {
    setSelectedTechnique(null);
    setView('SELECTOR');
  };

  // Route protection effect
  React.useEffect(() => {
    // Only redirect to login if NO session
    if (view === 'ADMIN_DASHBOARD' && !session) {
      setView('ADMIN_LOGIN');
    }
    // If session exists but role is wrong, we let the UI handle the error state below
  }, [view, session]);

  // Unit State Moved Up

  // Effect to handle single unit architecture (automatic selection/creation)
  React.useEffect(() => {
    const initUnit = async () => {
      // If we already have a unit ID, we're good
      if (selectedUnitId) return;

      // If we are in the middle of a login, don't interfere
      if (view === 'ADMIN_LOGIN') return;

      // If units are still loading, wait
      if (unitsLoading) return;

      try {
        console.log("Single Unit Init: Checking existing units...");
        if (units && units.length > 0) {
          // Auto-select the first available unit
          const firstUnit = units[0];
          console.log("Single Unit Init: Auto-selecting unit", firstUnit.name);
          handleUnitSelect(firstUnit.id, firstUnit.name);
        } else {
          // No units exist, create a default one
          console.log("Single Unit Init: Creating default 'Unidad Principal'...");
          const newUnit = await createUnit({
            name: 'Unidad Principal',
            description: 'Unidad configurada automáticamente'
          });
          if (newUnit) {
            handleUnitSelect((newUnit as any).id, 'Unidad Principal');
          }
        }
      } catch (err) {
        console.error("Error initializing default unit:", err);
      }
    };

    initUnit();
  }, [selectedUnitId, units, unitsLoading, view]);

  const handleUnitSelect = (unitId: string, unitName: string) => {
    try {
      localStorage.setItem('SMARTCART_UNIT_ID', unitId);
      localStorage.setItem('SMARTCART_UNIT_NAME', unitName);
      localStorage.setItem('SMARTCART_UNIT', unitName); // Consistency
    } catch (e) {
      console.warn('LocalStorage not available:', e);
    }
    setSelectedUnitId(unitId);
    setView('LANDING');
  };

  const handleChangeUnit = () => {
    // In single unit mode, this might not be needed, but we keep the handler
    // setView('UNIT_SELECTION'); 
  };

  // Render Logic
  return (
    <div className="font-sans antialiased text-slate-900 bg-slate-50 dark:bg-slate-900 dark:text-slate-50 min-h-screen">

      {/* Main Content Render */}
      <div className="w-full">
        <>
          {view === 'LANDING' && (
            <Landing
              onNurseStart={handleNurseStart}
              onAdminStart={handleAdminStart}
              onStockRevisionStart={handleStockRevisionStart}
              unitName={selectedUnit || undefined}
              onChangeUnit={handleChangeUnit}
            />
          )}

          {view === 'SELECTOR' && (
            <TechniqueSelector
              techniques={techniques}
              onSelectTechnique={handleSelectTechnique}
              onBack={handleBackToLanding}
            />
          )}

          {view === 'DETAIL' && selectedTechnique && (
            <TechniqueDetail
              technique={selectedTechnique}
              inventory={items}
              locations={locations}
              cartContents={cartContents}
              onBack={handleBackToSelector}
              onStartRestock={handleStartRestock}
              unitId={selectedUnitId || undefined}
            />
          )}

          {view === 'RESTOCK' && selectedTechnique && (
            <Restock
              technique={selectedTechnique}
              inventory={items}
              locations={locations}
              cartContents={cartContents}
              onFinish={handleFinishRestock}
              unitId={selectedUnitId || undefined}
            />
          )}

          {view === 'STOCK_REVISION' && (
            <StockRevision
              locations={locations}
              inventory={items}
              cartContents={cartContents}
              onRefresh={refreshCartContents}
              onBack={handleBackToLanding}
              unitId={selectedUnitId || undefined}
            />
          )}


          {view === 'ADMIN_LOGIN' && (
            <AdminLogin
              onLogin={signIn}
              onSuccess={handleAdminLoginSuccess}
              onBack={handleBackToLanding}
            />
          )}

          {view === 'ADMIN_DASHBOARD' && (
            <>
              {profileLoading ? (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clinical-600"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Verificando permisos...</p>
                  </div>
                </div>
              ) : !profile || (profile.role !== 'SUPERVISOR' && profile.role !== 'ADMIN') ? (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                  <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-red-100 dark:border-red-900/50 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acceso Denegado</h2>
                      <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Esta cuenta no tiene permisos de supervisión.
                      </p>
                    </div>

                    <div className="pt-4 space-y-3">
                      <button
                        onClick={() => { signOut(); setView('ADMIN_LOGIN'); }}
                        className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl transition-colors"
                      >
                        Cerrar Sesión
                      </button>
                      <button
                        onClick={handleBackToLanding}
                        className="w-full py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        Volver al Inicio
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <AdminDashboard
                  inventory={items}
                  techniques={techniques}
                  onLogout={() => {
                    signOut();
                    handleBackToLanding();
                  }}
                  onRefreshInventory={refreshItems}
                  onRefreshTechniques={refreshTechniques}
                  createItem={createItem}
                  updateItem={updateItem}
                  deleteItem={deleteItem}
                  equipmentData={equipment}
                  createEquipment={createEquipment}
                  updateEquipment={updateEquipment}
                  deleteEquipment={deleteEquipment}
                  onRefreshEquipment={refreshEquipment}
                  createTechnique={createTechnique}
                  updateTechnique={updateTechnique}
                  deleteTechnique={deleteTechnique}
                  locationsData={locations}
                  createLocation={createLocation}
                  updateLocation={updateLocation}
                  deleteLocation={deleteLocation}
                  unitId={selectedUnitId || undefined}
                />
              )}
            </>
          )}
        </>
      </div>
    </div>
  );
};

export default App;