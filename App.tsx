import React, { useState } from 'react';
import { ViewState, Technique } from './types';

import { useItems, useTechniques, useEquipment } from './hooks/useSupabaseData';
import { useLocations } from './hooks/useLocations'; // Import useLocations
import { useGlobalCartItems } from './hooks/useCartItems'; // Import useGlobalCartItems
import { useAuth } from './hooks/useAuth';
import { Landing } from './views/Landing';

// Carga perezosa (Code Splitting) de vistas secundarias pesadas
const TechniqueSelector = React.lazy(() => import('./views/TechniqueSelector').then(m => ({ default: m.TechniqueSelector })));
const TechniqueDetail = React.lazy(() => import('./views/TechniqueDetail').then(m => ({ default: m.TechniqueDetail })));
const Restock = React.lazy(() => import('./views/Restock').then(m => ({ default: m.Restock })));
const StockRevision = React.lazy(() => import('./views/StockRevision').then(m => ({ default: m.StockRevision })));
const AdminLogin = React.lazy(() => import('./views/Admin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = React.lazy(() => import('./views/Admin').then(m => ({ default: m.AdminDashboard })));
import { useProfile } from './hooks/useProfile';
import { useUnits } from './hooks/useUnits';

import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-lg w-full text-center space-y-4 border border-red-100 dark:border-red-900/50">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Algo salió mal</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Ha ocurrido un error inesperado al cargar esta pantalla. Puedes volver a intentarlo o regresar al inicio.
        </p>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left overflow-hidden">
          <code className="text-xs text-red-600 dark:text-red-400 break-all">{error.message}</code>
        </div>
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-clinical-600 hover:bg-clinical-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
        >
          Recargar Pantalla
        </button>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Toaster position="bottom-right" richColors />
        <AppContent />
      </ErrorBoundary>
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
  const { locations, loading: locationsLoading, error: locationsError, fetchLocations: refreshLocations, createLocation, updateLocation, deleteLocation } = useLocations(selectedUnitId || undefined);
  const { allItems: cartContents, loading: cartLoading, refresh: refreshCartContents } = useGlobalCartItems();
  const { units, loading: unitsLoading, createUnit } = useUnits();
  const { equipment, loading: equipmentLoading, refreshEquipment, createEquipment, updateEquipment, deleteEquipment } = useEquipment(selectedUnitId || undefined);

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
      // If we are in the middle of a login, don't interfere
      if (view === 'ADMIN_LOGIN') return;

      // If units are still loading, wait
      if (unitsLoading) return;

      try {
        console.log("Single Unit Init: Checking existing units...");

        // Validation: If we have a selectedUnitId, verify it exists in the loaded units
        let effectiveUnitId = selectedUnitId;
        if (selectedUnitId && units && units.length > 0) {
          const isValid = units.find(u => u.id === selectedUnitId);
          if (!isValid) {
            console.warn(`Stored Unit ID ${selectedUnitId} not found in database. Resetting.`);
            effectiveUnitId = null; // Force re-selection
          }
        }

        if (effectiveUnitId) return; // We have a valid unit selected

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
    <div className="font-sans antialiased text-deep-blue bg-white dark:bg-night-bg dark:text-slate-100 min-h-screen">

      {/* Main Content Render */}
      <div className="w-full">
        {((items.length === 0 && itemsLoading) || 
           (techniques.length === 0 && techniquesLoading) || 
           (units.length === 0 && unitsLoading) || 
           (locations.length === 0 && locationsLoading) || 
           (cartContents.length === 0 && cartLoading) ||
           (equipment.length === 0 && equipmentLoading)) ? (
          <div className="min-h-screen bg-slate-50 dark:bg-night-bg flex flex-col p-6 items-center pt-24 space-y-12">
            {/* Header Skeleton */}
            <div className="animate-pulse flex flex-col items-center space-y-4">
              <div className="w-32 h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
              <div className="w-48 h-6 bg-slate-200 dark:bg-slate-800 rounded-full mt-6"></div>
              <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="animate-pulse w-full max-w-md space-y-4">
              <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
              <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
            </div>
          </div>
        ) : (itemsError || techniquesError || locationsError) ? (
          <div className="min-h-screen bg-white dark:bg-night-bg flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-night-card p-8 rounded-2xl shadow-lg border border-red-100 dark:border-red-900/50 text-center">
              <h2 className="text-xl font-bold text-red-600 mb-2">Error al cargar datos</h2>
              <p className="text-slate-500 mb-6">{itemsError || techniquesError || locationsError}</p>
              <button onClick={() => window.location.reload()} className="w-full py-3 bg-clinical-600 text-white rounded-xl font-bold">Reintentar</button>
            </div>
          </div>
        ) : (
          <>
            <React.Suspense fallback={
              <div className="min-h-screen bg-slate-50 dark:bg-night-bg flex flex-col p-6">
                {/* Page transition Skeleton */}
                <div className="animate-pulse space-y-6 pt-20">
                  <div className="w-3/4 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto"></div>
                  <div className="w-full h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                  <div className="w-full h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                </div>
              </div>
            }>
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
                    <div className="min-h-screen bg-white dark:bg-night-bg flex items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clinical-600"></div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Verificando permisos...</p>
                      </div>
                    </div>
                  ) : !profile || (profile.role !== 'SUPERVISOR' && profile.role !== 'ADMIN') ? (
                    <div className="min-h-screen bg-white dark:bg-night-bg flex items-center justify-center p-4">
                      <div className="max-w-md w-full bg-white dark:bg-night-card p-8 rounded-2xl shadow-lg border border-red-100 dark:border-red-900/50 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-deep-blue dark:text-white">Acceso Denegado</h2>
                          <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Esta cuenta no tiene permisos de supervisión.
                          </p>
                        </div>

                        <div className="pt-4 space-y-3">
                          <button
                            onClick={() => { signOut(); setView('ADMIN_LOGIN'); }}
                            className="w-full py-3 px-4 bg-deep-blue hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-deep-blue font-bold rounded-xl transition-colors"
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
            </React.Suspense>
          </>
        )}
      </div>
    </div>
  );
};

export default App;