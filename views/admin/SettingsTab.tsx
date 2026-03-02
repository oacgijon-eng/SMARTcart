import React, { useState } from 'react';
import { Settings, Building2, Zap, ShieldCheck } from 'lucide-react';
import { Button, Card } from '../../components/UI';
import { useUnits } from '../../hooks/useUnits';
import { supabase } from '../../services/supabase';

interface SettingsTabProps {
    unitId: string;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ unitId }) => {
    const { units, updateUnit, refreshUnits } = useUnits();
    const currentUnitName = localStorage.getItem('SMARTCART_UNIT_NAME') || localStorage.getItem('SMARTCART_UNIT');
    const [newName, setNewName] = useState(currentUnitName || '');
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);

    const handleSavePrimary = async () => {
        if (!newName.trim() || newName === currentUnitName) return;

        try {
            setSaving(true);
            const unit = units.find(u => u.id === unitId);
            if (unit) {
                await updateUnit(unit.id, { name: newName.trim() });
                localStorage.setItem('SMARTCART_UNIT_NAME', newName.trim());
                localStorage.setItem('SMARTCART_UNIT', newName.trim());
                await refreshUnits();
                alert('Nombre de la unidad actualizado correctamente');
            } else {
                alert('Error: No se encontró la unidad en la base de datos.');
            }
        } catch (e: any) {
            alert('Error al actualizar: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleResetContents = async () => {
        if (!confirm('¿ESTÁS SEGURO? Esta acción vaciará TODOS los carros y ubicaciones de esta unidad. El catálogo de materiales, técnicas y usuarios permanecerán intactos.')) return;

        const secondConfirm = confirm('Confirma una segunda vez: Se borrarán todas las asignaciones de stock de los carros.');
        if (!secondConfirm) return;

        try {
            setResetting(true);

            // 1. Get all location IDs for this unit
            const { data: locations, error: locError } = await supabase
                .from('locations')
                .select('id')
                .eq('unit_id', unitId);

            if (locError) throw locError;

            if (locations && locations.length > 0) {
                const locationIds = locations.map(l => l.id);

                // 2. Delete from cart_contents
                const { error: delError } = await supabase
                    .from('cart_contents')
                    .delete()
                    .in('location_id', locationIds);

                if (delError) throw delError;
            }

            alert('Contenidos reseteados con éxito. Los carros están ahora vacíos.');
            window.location.reload(); // Refresh to ensure all states are cleared
        } catch (e: any) {
            alert('Error al resetear contenidos: ' + e.message);
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div>
                <h2 className="text-2xl font-bold font-heading text-deep-blue dark:text-white">Panel de Control</h2>
                <p className="text-slate-500 dark:text-slate-400">Configuración de la unidad y mantenimiento</p>
            </div>

            {/* Current Unit & Local Settings */}
            <section className="space-y-6">
                <h3 className="text-lg font-bold font-heading text-deep-blue dark:text-white flex items-center gap-2">
                    <Settings size={20} className="text-clinical-500" /> Identificación de la Unidad
                </h3>
                <Card className="p-4 sm:p-8 space-y-6 dark:bg-night-card dark:border-slate-700">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-white dark:bg-night-bg rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="p-3 bg-clinical-100 dark:bg-clinical-900/50 rounded-xl text-clinical-600">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre Actual</p>
                                <p className="text-lg font-bold text-deep-blue dark:text-white">
                                    {currentUnitName || 'Sin nombre'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Cambiar nombre público</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    className="flex-1 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-clinical-500 outline-none bg-white dark:bg-night-bg text-deep-blue dark:text-white"
                                    placeholder="Ej: UCI A, Planta 4, Emergencias..."
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                />
                                <Button onClick={handleSavePrimary} disabled={saving || !newName.trim() || newName === currentUnitName} className="whitespace-nowrap">
                                    {saving ? 'Guardando...' : 'Actualizar Nombre'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Maintenance / Reset */}
            <section className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Zap size={20} className="text-amber-500" /> Mantenimiento de Datos
                </h3>
                <Card className="p-8 border-amber-100 bg-amber-50/20 dark:bg-amber-900/5 dark:border-amber-900/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 flex-1">
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white underline decoration-amber-200">Resetear Contenidos de Carros</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                                Esta acción **borrará todos los materiales asignados** a los cajones y ubicaciones de esta unidad, dejándolos vacíos.
                                Útil si quieres empezar una nueva configuración de stock desde cero.
                            </p>
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <ShieldCheck size={14} /> El catálogo global y las técnicas NO se verán afectados.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleResetContents}
                            disabled={resetting}
                            className="bg-white hover:bg-red-50 text-red-600 border-red-200 shadow-sm whitespace-nowrap h-auto py-4 px-8"
                        >
                            {resetting ? 'Reseteando...' : 'Resetear Carros y Ubicaciones'}
                        </Button>
                    </div>
                </Card>

                <div className="pt-6">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Desvincular Dispositivo (Opcional)</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 px-1">
                        Si este dispositivo se va a usar en un servidor o entorno diferente, usa esta opción para limpiar la memoria local.
                    </p>
                    <button
                        onClick={() => {
                            if (confirm('¿Desvincular este dispositivo? Se cerrará la sesión y se reseteará la configuración inicial.')) {
                                localStorage.removeItem('SMARTCART_UNIT_ID');
                                localStorage.removeItem('SMARTCART_UNIT_NAME');
                                localStorage.removeItem('SMARTCART_UNIT');
                                window.location.reload();
                            }
                        }}
                        className="text-sm text-slate-400 hover:text-red-500 underline transition-colors"
                    >
                        Limpiar registro local y desvincular
                    </button>
                </div>
            </section>
        </div>
    );
};
