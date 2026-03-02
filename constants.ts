import { Item, LocationType, Technique } from './types';

export const LOCATION_TYPES: Record<string, string> = {
  CART: 'Carro',
  WAREHOUSE: 'Almacén',
  EXTERNAL: 'Externo'
};

export const LOCATION_COLORS = [
  { name: 'Rojo', value: '#ef4444', class: 'bg-red-500' },
  { name: 'Naranja', value: '#f97316', class: 'bg-orange-500' },
  { name: 'Ámbar', value: '#f59e0b', class: 'bg-amber-500' },
  { name: 'Verde', value: '#22c55e', class: 'bg-green-500' },
  { name: 'Esmeralda', value: '#10b981', class: 'bg-emerald-500' },
  { name: 'Teal', value: '#14b8a6', class: 'bg-teal-500' },
  { name: 'Cian', value: '#06b6d4', class: 'bg-cyan-500' },
  { name: 'Azul', value: '#3b82f6', class: 'bg-blue-500' },
  { name: 'Índigo', value: '#6366f1', class: 'bg-indigo-500' },
  { name: 'Violeta', value: '#8b5cf6', class: 'bg-violet-500' },
  { name: 'Púrpura', value: '#a855f7', class: 'bg-purple-500' },
  { name: 'Fucsia', value: '#d946ef', class: 'bg-fuchsia-500' },
  { name: 'Rosa', value: '#ec4899', class: 'bg-pink-500' },
  { name: 'Gris', value: '#64748b', class: 'bg-slate-500' },
];


// Mock Inventory Items
export const INVENTORY: Item[] = [
  {
    id: 'i1',
    name: 'Guantes Estériles 7.5',
    imageUrl: 'https://picsum.photos/100/100?random=1',
    category: 'Protección',
    referencia_petitorio: 'REF-G1'
  },
  {
    id: 'i2',
    name: 'Catéter Venoso 20G',
    imageUrl: 'https://picsum.photos/100/100?random=2',
    category: 'Vías',
    referencia_petitorio: 'REF-C1'
  },
  {
    id: 'i3',
    name: 'Apósito Transparente',
    imageUrl: 'https://picsum.photos/100/100?random=3',
    category: 'Curas',
    referencia_petitorio: 'REF-A1'
  },
  {
    id: 'i4',
    name: 'Clorhexidina 2%',
    imageUrl: 'https://picsum.photos/100/100?random=4',
    category: 'Desinfección',
    referencia_petitorio: 'REF-D1'
  },
  {
    id: 'i5',
    name: 'Morfina 10mg (Estupefaciente)',
    imageUrl: 'https://picsum.photos/100/100?random=5',
    category: 'Fármacos',
    referencia_petitorio: 'REF-F1'
  },
  {
    id: 'i6',
    name: 'Sonda Foley 16Fr',
    imageUrl: 'https://picsum.photos/100/100?random=6',
    category: 'Urología',
    referencia_petitorio: 'REF-S1'
  },
  {
    id: 'i7',
    name: 'Bolsa Colectora Orina',
    imageUrl: 'https://picsum.photos/100/100?random=7',
    category: 'Urología',
    referencia_petitorio: 'REF-B1'
  }
];

// Mock Techniques
export const TECHNIQUES: Technique[] = [
  {
    id: 't1',
    name: 'Canalización Vía Periférica',
    category: 'Accesos Vasculares',
    description: 'Protocolo estándar para inserción de catéter venoso periférico.',
    protocolUrl: '#',
    iconName: 'Activity',
    items: [
      { itemId: 'i1', quantity: 1 },
      { itemId: 'i2', quantity: 1 },
      { itemId: 'i3', quantity: 1 },
      { itemId: 'i4', quantity: 1 }
    ]
  },
  {
    id: 't2',
    name: 'Sondaje Vesical Masculino',
    category: 'Urología',
    description: 'Inserción de sonda urinaria permanente.',
    protocolUrl: '#',
    iconName: 'Droplet',
    items: [
      { itemId: 'i1', quantity: 2 },
      { itemId: 'i6', quantity: 1 },
      { itemId: 'i7', quantity: 1 },
      { itemId: 'i4', quantity: 1 }
    ]
  },
  {
    id: 't3',
    name: 'Drenaje Pericárdico',
    category: 'Cardiología',
    description: 'Técnica de urgencia para pericardiocentesis.',
    protocolUrl: '#',
    iconName: 'HeartPulse',
    items: [
      { itemId: 'i1', quantity: 2 },
      { itemId: 'i2', quantity: 1 },
      { itemId: 'i3', quantity: 1 },
      { itemId: 'i4', quantity: 1 }
    ]
  }
];