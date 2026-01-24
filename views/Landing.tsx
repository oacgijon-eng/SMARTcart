import React from 'react';
import { Button } from '../components/UI';
import { Activity, ShieldCheck, Sun, Moon, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Modal } from '../components/UI';


interface LandingProps {
  onNurseStart: () => void;
  onAdminStart: () => void;
  onStockRevisionStart: () => void;
  unitName?: string;
  onChangeUnit?: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onNurseStart, onAdminStart, onStockRevisionStart, unitName, onChangeUnit }) => {
  const { theme, toggleTheme } = useTheme();
  const [isInfoModalOpen, setIsInfoModalOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-night-bg flex flex-col p-6 relative transition-colors duration-300 overflow-x-hidden">

      {/* Top Bar Actions */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start pt-[env(safe-area-inset-top)] z-20">
        <div className="flex gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-night-card text-slate-400 hover:text-yellow-500 dark:hover:text-yellow-400 shadow-sm border border-slate-100 dark:border-slate-700 transition-all active:scale-95"
            aria-label="Toggle Dark Mode"
          >
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          </button>

          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="p-2.5 rounded-xl bg-white dark:bg-night-card text-slate-400 hover:text-clinical-600 dark:hover:text-clinical-400 shadow-sm border border-slate-100 dark:border-slate-700 transition-all active:scale-95"
            aria-label="Información del Proyecto"
          >
            <Info size={22} />
          </button>
        </div>

        <button
          onClick={onAdminStart}
          className="flex items-center gap-2 text-slate-400 hover:text-clinical-600 transition-colors px-4 py-2.5 rounded-xl hover:bg-white dark:hover:bg-night-card border border-transparent hover:border-slate-100 dark:hover:border-slate-700 text-sm font-medium active:scale-95"
        >
          <ShieldCheck size={18} />
          <span className="hidden sm:inline">Acceso Supervisión</span>
        </button>
      </div>

      {/* Main Content Wrapper - Centers content but respects flow */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto space-y-10 pb-16 pt-20">


        {/* Logo Area */}
        <div className="text-center animate-fade-in-up">
          {/* Logo - Toggle based on Dark Mode */}
          <div className="flex justify-center">
            <img src="/SMARTcart Logo dia.png" alt="SMARTcart" className="h-80 md:h-[500px] w-auto dark:hidden transition-all duration-500" />
            <img src="/SMARTcart logo noche.png" alt="SMARTcart" className="h-80 md:h-[500px] w-auto hidden dark:block transition-all duration-500" />
          </div>
          <div className="-mt-6">
            <p className="text-slate-500 dark:text-slate-400 text-lg">Asistente de Carros de Técnicas</p>
            {unitName && (
              <p className="mt-2 text-sm font-medium text-clinical-600 dark:text-clinical-400 bg-clinical-50 dark:bg-clinical-900/30 px-3 py-1 rounded-full inline-block">
                {unitName}
              </p>
            )}
          </div>

        </div>

        {/* Main ActionButtons */}
        <div className="w-full space-y-4">
          <Button
            onClick={onNurseStart}
            size="xl"
            fullWidth
            className="shadow-xl shadow-clinical-100 dark:shadow-none flex flex-col items-center justify-center py-8 gap-2 h-auto"

          >
            <span className="text-xl font-bold">Iniciar Asistencia Técnica</span>
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

      {/* Project Info Modal */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Información del Proyecto"
        maxWidth="max-w-lg"
      >
        <div className="space-y-6">
          <div className="w-16 h-16 bg-clinical-100 dark:bg-clinical-900/30 rounded-2xl flex items-center justify-center text-clinical-600 dark:text-clinical-400 mx-auto">
            <Activity size={32} />
          </div>

          <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              <span className="font-bold text-deep-blue dark:text-white">SMARTcart</span> integra la logística con la asistencia a pie de cama para reducir la carga cognitiva y evitar interrupciones, permitiéndote centrarte únicamente en el cuidado del paciente.
            </p>
            <p>
              Nuestro objetivo prioritario es la <span className="font-semibold text-clinical-600 dark:text-clinical-400">seguridad clínica</span>, garantizando a través de este sistema que los carros estén siempre completos y libres de material caducado antes de cada técnica.
            </p>
            <p>
              Para ello, los registros de revisión y reposición se gestionan en un entorno seguro conforme a la normativa legal vigente (RGPD), utilizándose exclusivamente con fines de trazabilidad y calidad asistencial.
            </p>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-sm">
                Este proyecto de innovación tecnológica (TFG) ha sido desarrollado por <span className="font-medium text-slate-900 dark:text-white">Óscar Álvarez Carreño</span> (Enfermero) para optimizar nuestros flujos de trabajo.
              </p>
              <p className="mt-4 text-sm font-semibold text-clinical-600 dark:text-clinical-400 italic">
                Gracias por tu colaboración y profesionalidad para mantener la unidad segura.
              </p>
            </div>
          </div>

          <Button
            fullWidth
            onClick={() => setIsInfoModalOpen(false)}
            className="mt-2"
          >
            Entendido
          </Button>
        </div>
      </Modal>

      {/* Footer / Development Notice - Now flows naturally */}
      <div className="mt-auto pt-6 text-center animate-fade-in" style={{ animationDelay: '500ms' }}>
        <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">
          <span className="font-semibold opacity-70">Proyecto en Desarrollo:</span> Esta aplicación es parte de un Trabajo de Fin de Máster.
          Agradezco tu colaboración reportando errores o sugerencias a: <a href="mailto:oacgijon@gmail.com" className="hover:text-clinical-500 transition-colors">oacgijon@gmail.com</a>
        </p>
      </div>
    </div >
  );
};