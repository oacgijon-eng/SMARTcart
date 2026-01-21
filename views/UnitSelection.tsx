import React from 'react';
import { Button } from '../components/UI';
import { Building2, Activity, Hospital, Sparkles, Plus, ArrowLeft } from 'lucide-react';
import { useUnits } from '../hooks/useUnits';

interface UnitSelectionProps {
    onSelect: (unitId: string, unitName: string) => void;
}

export const UnitSelection: React.FC<UnitSelectionProps> = ({ onSelect }) => {
    const { units, loading, error, createUnit } = useUnits();
    const [unitNameInput, setUnitNameInput] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [localError, setLocalError] = React.useState<string | null>(null);
    const [showCreationForm, setShowCreationForm] = React.useState(false);

    const handleConfirmUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = unitNameInput.trim();
        if (!trimmedName) return;

        try {
            setIsSubmitting(true);
            setLocalError(null);

            // Timeout protection for the Supabase operation
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Tiempo de espera agotado. Revisa tu conexión.')), 8000)
            );

            const setupOperation = async () => {
                let targetUnitName = trimmedName;
                const existingUnit = units.find(u => u.name.toLowerCase() === trimmedName.toLowerCase());

                if (existingUnit) {
                    targetUnitName = existingUnit.name;
                    return { id: existingUnit.id, name: existingUnit.name };
                } else {
                    try {
                        const data = await createUnit({
                            name: trimmedName,
                            description: 'Unidad principal de SMARTcart'
                        });
                        return { id: (data as any).id, name: trimmedName };
                    } catch (createErr: any) {
                        const msg = createErr.message?.toLowerCase() || '';
                        if (!msg.includes('duplicate') && !msg.includes('already exists') && !msg.includes('unique_violation')) {
                            throw createErr;
                        }
                        const refetchedUnit = units.find(u => u.name.toLowerCase() === trimmedName.toLowerCase());
                        if (refetchedUnit) return { id: refetchedUnit.id, name: refetchedUnit.name };
                        throw new Error('La unidad ya existe pero no se pudo recuperar su ID. Recarga la página.');
                    }
                }
            };

            const result = await Promise.race([setupOperation(), timeoutPromise]) as { id: string, name: string };
            onSelect(result.id, result.name);
        } catch (err: any) {
            setLocalError(err.message || 'No se pudo conectar con el servidor.');
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clinical-600 mb-4"></div>
                <p className="font-medium animate-pulse text-clinical-600">SMARTcart está despertando...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-red-500 text-center">
                <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border border-red-200 dark:border-red-800 max-w-md">
                    <Activity className="mx-auto mb-4 text-red-600" size={48} />
                    <p className="font-bold text-2xl mb-2">Error de Conexión</p>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
                    <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                        Reintentar conexión
                    </Button>
                </div>
            </div>
        );
    }

    const unitsCount = units?.length || 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors font-sans overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-clinical-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-clinical-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-xl space-y-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-[3rem] text-clinical-600 shadow-2xl shadow-clinical-600/10 mb-2 border border-slate-100 dark:border-slate-800 relative group">
                        <Hospital size={80} strokeWidth={1.2} className="text-clinical-500 group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute -top-2 -right-2 p-3 bg-clinical-100 dark:bg-clinical-900/50 rounded-2xl text-clinical-600 animate-bounce delay-700">
                            <Sparkles size={24} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                            SMART<span className="text-clinical-600">cart</span>
                        </h1>
                        <div className="h-1.5 w-24 bg-clinical-500 mx-auto rounded-full" />
                    </div>
                </div>

                {(unitsCount > 0 && !showCreationForm) ? (
                    <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[3.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 space-y-10 relative overflow-hidden group">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Selecciona tu Unidad</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-tight">
                                Hemos encontrado unidades activas en este servidor.
                            </p>
                        </div>

                        <div className="grid gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {units.map((unit) => (
                                <button
                                    key={unit.id}
                                    onClick={() => onSelect(unit.id, unit.name)}
                                    className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-clinical-500 hover:bg-white dark:hover:bg-slate-700 transition-all text-left flex items-center justify-between group/item"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-clinical-50 dark:bg-clinical-900/30 rounded-2xl text-clinical-600">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold text-slate-900 dark:text-white">{unit.name}</div>
                                            {unit.description && <div className="text-sm text-slate-500 dark:text-slate-500">{unit.description}</div>}
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                        <Sparkles size={20} className="text-clinical-500" />
                                    </div>
                                </button>
                            ))}

                            <button
                                onClick={() => setShowCreationForm(true)}
                                className="p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-clinical-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left flex items-center gap-4 group/new"
                            >
                                <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-400 group-hover/new:text-clinical-500 group-hover/new:bg-clinical-50 transition-colors">
                                    <Plus size={24} />
                                </div>
                                <div className="text-xl font-bold text-slate-500 dark:text-slate-400">Crear otra unidad diferente</div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleConfirmUnit} className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-[3.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 space-y-10 relative overflow-hidden group">
                        <div className="space-y-4 relative z-10">
                            {unitsCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowCreationForm(false)}
                                    className="flex items-center gap-2 text-slate-400 hover:text-clinical-600 transition-colors mb-4 text-xs font-black uppercase tracking-widest"
                                >
                                    <ArrowLeft size={14} /> Volver a selección
                                </button>
                            )}
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                                <Building2 size={16} className="text-clinical-500" />
                                Nueva Identificación de Servicio
                            </label>
                            <input
                                type="text"
                                value={unitNameInput}
                                onChange={(e) => setUnitNameInput(e.target.value)}
                                placeholder="Ej: UCI, Coronarias, Planta 5..."
                                className="w-full px-8 py-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-clinical-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all text-2xl font-bold shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                autoFocus
                                required
                            />
                            <p className="text-sm text-slate-500 dark:text-slate-400 ml-2 font-medium">
                                Este nombre aparecerá en la carátula de la aplicación.
                            </p>
                        </div>

                        {localError && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-3xl border border-red-100 dark:border-red-900/50 text-center text-sm font-bold animate-in fade-in zoom-in-95">
                                <Activity className="inline-block mr-2 mb-1" size={16} />
                                {localError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || !unitNameInput.trim()}
                            className="w-full bg-clinical-600 hover:bg-clinical-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-7 rounded-[2rem] shadow-2xl shadow-clinical-600/30 transform active:scale-[0.97] transition-all flex items-center justify-center gap-4 text-2xl group"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <span>Comenzar Configuración</span>
                                    <Plus size={28} className="group-hover:rotate-90 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div className="space-y-2 text-center">
                    <p className="text-slate-400 dark:text-slate-600 text-sm font-bold uppercase tracking-widest">
                        Infraestructura SMARTcart
                    </p>
                    <p className="text-slate-400 dark:text-slate-600 text-xs px-12 italic">
                        Una vez configurado, este dispositivo quedará vinculado a la unidad especificada para compartir inventario y revisiones.
                    </p>
                </div>
            </div>
        </div>
    );
};
