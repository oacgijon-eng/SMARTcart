export type ViewState = 'LANDING' | 'SELECTOR' | 'DETAIL' | 'RESTOCK' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD' | 'STOCK_REVISION' | 'UNIT_SELECTION';

export enum LocationType {
  CART = 'CART',
  EXTERNAL = 'EXTERNAL', // e.g., Pharmacy, Septic Warehouse
}

export interface Location {
  id: string;
  name: string;
  type: LocationType | string;
  parent_id?: string;
  color?: string;
  unit_id?: string; // Tenant ID
}

export interface Item {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  // Global Catalog: No location or stock data here.
  // Those are now in cart_items / warehouse_items linked by unit.
  carts?: CartItem[]; // Example of hydration if needed, but risky if not filtered by unit.
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
  category: string;
  description: string;
  protocolUrl: string;
  iconName: string;
  cartIds?: string[];
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
  unit_id?: string;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  stockQuantity: number;
  maintenanceStatus: 'Operativo' | 'En Revisión' | 'Avariado';
  location?: string;
  requiresPower?: boolean;
  created_at?: string;
  unit_id?: string;
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
  unit_id?: string;
}

export interface Feedback {
  id: string;
  type: 'RATING' | 'SUGGESTION' | 'COMMENT';
  category?: string;
  issue?: string;
  description: string;
  rating?: number;
  created_at: string;
  user_name?: string;
  technique_id?: string;
  unit_id?: string;
}