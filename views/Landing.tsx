import React from 'react';
import { Button } from '../components/UI';
import { Activity, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';


interface LandingProps {
  onNurseStart: () => void;
  onAdminStart: () => void;
  onStockRevisionStart: () => void;
  unitName?: string;
  onChangeUnit?: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onNurseStart, onAdminStart, onStockRevisionStart, unitName, onChangeUnit }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 relative transition-colors duration-300">

      {/* Theme Toggle */}
      <div className="absolute top-6 left-6">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-yellow-500 dark:hover:text-yellow-400 shadow-md transition-all"
          aria-label="Toggle Dark Mode"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <div className="w-full max-w-md text-center space-y-12">


        {/* Logo Area */}
        <div className="space-y-4 animate-fade-in-up">
          <div className="w-24 h-24 bg-clinical-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-clinical-200">
            <Activity size={48} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">SMARTcart</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Asistente de Carros de Técnicas</p>
            {unitName && (
              <button
                onClick={onChangeUnit}
                className="mt-2 text-sm font-medium text-clinical-600 dark:text-clinical-400 bg-clinical-50 dark:bg-clinical-900/30 px-3 py-1 rounded-full hover:bg-clinical-100 transition-colors"
              >
                {unitName}
              </button>
            )}
          </div>

        </div>

        {/* Main Action */}
        <div className="w-full space-y-4">
          <Button
            onClick={onNurseStart}
            size="xl"
            fullWidth
            className="shadow-xl shadow-clinical-100 dark:shadow-none flex flex-col items-center justify-center py-12 gap-2 h-auto"

          >
            <span className="text-2xl">Iniciar Asistencia Técnica</span>
          </Button>

          <Button
            onClick={onStockRevisionStart}
            variant="secondary"
            size="lg"
            fullWidth
            className="shadow-md"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} />
              <span>Revisión de Stock y Caducidades</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Admin Link */}
      <div className="absolute top-6 right-6">
        <button
          onClick={onAdminStart}
          className="flex items-center gap-2 text-slate-400 hover:text-clinical-600 transition-colors px-4 py-2 rounded-lg hover:bg-slate-100 text-sm font-medium"
        >
          <ShieldCheck size={16} />
          Acceso Supervisión
        </button>
      </div>
    </div>
  );
};