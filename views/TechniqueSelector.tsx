import React, { useState } from 'react';
import { PageHeader, Card, Badge } from '../components/UI';
import { Technique } from '../types';
import { Search, ChevronRight, Activity, Droplet, HeartPulse, Stethoscope } from 'lucide-react';

interface TechniqueSelectorProps {
  techniques: Technique[];
  onSelectTechnique: (t: Technique) => void;
  onBack: () => void;
}

export const TechniqueSelector: React.FC<TechniqueSelectorProps> = ({ techniques, onSelectTechnique, onBack }) => {
  const [search, setSearch] = useState('');

  const filtered = techniques.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  // Helper to render icon based on name
  const renderIcon = (name: string) => {
    switch (name) {
      case 'Activity': return <Activity className="text-clinical-600 dark:text-clinical-400" size={32} />;
      case 'Droplet': return <Droplet className="text-blue-500 dark:text-blue-400" size={32} />;
      case 'HeartPulse': return <HeartPulse className="text-red-500 dark:text-red-400" size={32} />;
      default: return <Stethoscope className="text-slate-500 dark:text-slate-400" size={32} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-6">

      <PageHeader
        title="Selector de Técnicas"
        subtitle="Selecciona el procedimiento a realizar"
        onBack={onBack}
      />

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg placeholder-slate-400 dark:text-white focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:border-transparent shadow-sm"
            placeholder="Buscar por nombre (ej: Vía central)..."

            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(technique => (
            <Card
              key={technique.id}
              onClick={() => onSelectTechnique(technique)}
              className="flex items-center gap-4 p-4 hover:shadow-md transition-shadow cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <div className="h-16 w-16 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center shrink-0">
                {renderIcon(technique.iconName)}

              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{technique.name}</h3>
                </div>
              </div>
              <ChevronRight className="text-slate-300 dark:text-slate-600" />
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500">
              <p>No se encontraron técnicas que coincidan con "<span className="text-slate-900 dark:text-white font-medium">{search}</span>"</p>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};