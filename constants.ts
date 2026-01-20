import { Item, LocationType, Technique } from './types';

// Mock Inventory Items
export const INVENTORY: Item[] = [
  {
    id: 'i1',
    name: 'Guantes Estériles 7.5',
    imageUrl: 'https://picsum.photos/100/100?random=1',
    category: 'Protección',
    locationType: LocationType.CART,
    ubicacion: 'Cajón 1 (Superior)',
    ubicacion_secundaria: 'Almacén A - Estante 2',
    stockIdeal: 50
  },
  {
    id: 'i2',
    name: 'Catéter Venoso 20G',
    imageUrl: 'https://picsum.photos/100/100?random=2',
    category: 'Vías',
    locationType: LocationType.CART,
    ubicacion: 'Cajón 2',
    ubicacion_secundaria: 'Almacén B - Estante 1',
    stockIdeal: 20
  },
  {
    id: 'i3',
    name: 'Apósito Transparente',
    imageUrl: 'https://picsum.photos/100/100?random=3',
    category: 'Curas',
    locationType: LocationType.CART,
    ubicacion: 'Cajón 2',
    ubicacion_secundaria: 'Almacén A - Estante 3',
    stockIdeal: 30
  },
  {
    id: 'i4',
    name: 'Clorhexidina 2%',
    imageUrl: 'https://picsum.photos/100/100?random=4',
    category: 'Desinfección',
    locationType: LocationType.CART,
    ubicacion: 'Botellero Lateral',
    ubicacion_secundaria: 'Almacén Farmacia',
    stockIdeal: 5
  },
  {
    id: 'i5',
    name: 'Morfina 10mg (Estupefaciente)',
    imageUrl: 'https://picsum.photos/100/100?random=5',
    category: 'Fármacos',
    locationType: LocationType.EXTERNAL,
    ubicacion: 'NO EN CARRO',
    ubicacion_secundaria: 'Farmacia (Requiere Llave)',
    stockIdeal: 0
  },
  {
    id: 'i6',
    name: 'Sonda Foley 16Fr',
    imageUrl: 'https://picsum.photos/100/100?random=6',
    category: 'Urología',
    locationType: LocationType.CART,
    ubicacion: 'Cajón 3',
    ubicacion_secundaria: 'Almacén B - Estante 4',
    stockIdeal: 10
  },
  {
    id: 'i7',
    name: 'Bolsa Colectora Orina',
    imageUrl: 'https://picsum.photos/100/100?random=7',
    category: 'Urología',
    locationType: LocationType.CART,
    ubicacion: 'Cajón 3',
    ubicacion_secundaria: 'Almacén B - Estante 5',
    stockIdeal: 10
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