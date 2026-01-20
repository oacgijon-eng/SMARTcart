export type ViewState = 'LANDING' | 'SELECTOR' | 'DETAIL' | 'RESTOCK' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD' | 'STOCK_REVISION' | 'UNIT_SELECTION';

export enum LocationType {
  CART = 'CART',
  EXTERNAL = 'EXTERNAL', // e.g., Pharmacy, Septic Warehouse
}

export interface Location {
  id: string;
  name: string;
  type: LocationType | string;
  parent_id?: string; // Changed from parentId to match DB
  color?: string; // e.g., "#3b82f6"
}

export interface Item {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  locationType: LocationType;
  ubicacion: string; // e.g., "Cajón 1"
  ubicacion_secundaria: string; // e.g., "Almacén General Estantería B"
  stockIdeal: number;
  carts?: CartItem[]; // Hydrated cart items for this item
  referencia_petitorio?: string;
}

export interface CartItem {
  id: string; // The cart_item id (uuid)
  locationId: string;
  itemId: string;
  stockIdeal: number;
  nextExpiryDate?: string; // YYYY-MM-DD
  item?: Item; // Hydrated Item details
}

export interface KitItem {
  itemId: string;
  quantity: number;
  item?: Item; // Hydrated item
}

export interface Technique {
  id: string;
  name: string;
  category: string; // e.g., "Vías", "Sondajes"
  description: string;
  protocolUrl: string; // Dummy URL for PDF
  iconName: string;
  cartIds?: string[]; // IDs of associated carts
  items: KitItem[];
  equipment?: TechniqueEquipment[];
}

export interface TechniqueEquipment {
  equipmentId: string;
  quantity: number;
  equipment?: Equipment;
}

export interface User {
  id: string;
  role: 'NURSE' | 'SUPERVISOR' | 'ADMIN' | 'USER';
  name: string;
}

export interface Incident {
  id: string;
  type: 'INCIDENCE' | 'RATING' | 'SUGGESTION';
  category?: string;
  description?: string;
  rating?: number;
  related_item_id?: string;
  related_technique_id?: string;
  created_at: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string; // 'Respiradores', 'Bombas', etc.
  stockQuantity: number;
  maintenanceStatus: 'Operativo' | 'En Revisión' | 'Avariado';
  location?: string;
  requiresPower?: boolean;
  created_at?: string;
}

export interface StockRevision {
  id: string;
  location_id: string;
  reviewer_name: string;
  created_at: string;
  notes?: string;
  expiry_checked: boolean;
  locations?: {
    name: string;
    color?: string;
  };
}

export interface Feedback {
  id: string;
  type: 'RATING' | 'SUGGESTION' | 'COMMENT';
  category?: string;
  issue?: string; // Specific issue reported
  description: string;
  rating?: number; // 1-5 stars
  created_at: string;
  user_name?: string; // Optional user identifier
  technique_id?: string;
}