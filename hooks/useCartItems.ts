
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { CartItem, LocationType } from '../types';

export function useCartItems(cartType: string) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getTableName = useCallback(() => {
        return 'cart_contents';
    }, []);

    const fetchCartItems = useCallback(async () => {
        setLoading(true);
        try {
            const tableName = getTableName();

            let query = supabase
                .from(tableName)
                .select(`
                    id,
                    location_id,
                    item_id,
                    stock_ideal,
                    next_expiry_date,
                    items (
                        id,
                        name,
                        category,
                        image_url
                    )
                `);

            const { data: drawers } = await supabase.from('locations').select('id').eq('parent_id', cartType);
            const drawerIds = drawers?.map(d => d.id) || [];
            const locationIds = [...drawerIds, cartType];

            query = query.in('location_id', locationIds);

            const { data, error } = await query;

            if (error) throw error;

            const mapped: CartItem[] = (data || []).map((row: any) => ({
                id: row.id,
                locationId: row.location_id,
                itemId: row.item_id,
                stockIdeal: row.stock_ideal,
                nextExpiryDate: row.next_expiry_date,
                item: row.items ? {
                    id: row.items.id,
                    name: row.items.name,
                    stockIdeal: row.items.stock_ideal,
                    category: row.items.category,
                    imageUrl: row.items.image_url,
                    locationType: LocationType.CART
                } : undefined
            }));

            setCartItems(mapped);
        } catch (e: any) {
            console.error(`Error fetching ${cartType} items:`, e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [cartType, getTableName]);

    useEffect(() => {
        if (cartType) {
            fetchCartItems();
        }
    }, [cartType, fetchCartItems]);

    const updateCartItemStock = async (id: string, newStock: number) => {
        try {
            const tableName = getTableName();
            const { error } = await supabase
                .from(tableName)
                .update({ stock_ideal: newStock })
                .eq('id', id);

            if (error) throw error;
            setCartItems(prev => prev.map(i => i.id === id ? { ...i, stockIdeal: newStock } : i));
        } catch (e: any) {
            console.error('Error updating stock', e);
            alert('Error al actualizar stock');
        }
    };

    const addCartItem = async (locationId: string, itemId: string, stockIdeal: number, nextExpiryDate?: string) => {
        try {
            const tableName = getTableName();
            const { data, error } = await supabase
                .from(tableName)
                .upsert({
                    location_id: locationId,
                    item_id: itemId,
                    stock_ideal: stockIdeal,
                    next_expiry_date: nextExpiryDate || null
                }, { onConflict: 'location_id,item_id' })
                .select()
                .single();

            if (error) throw error;
            fetchCartItems();
        } catch (e: any) {
            console.error('Error adding item to cart', e);
            throw e;
        }
    }

    const syncCartItems = async (locationId: string, desiredItems: Record<string, { stockIdeal: number; nextExpiryDate: string }>) => {
        try {
            const tableName = getTableName();
            const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .eq('location_id', locationId);

            if (deleteError) throw deleteError;

            const desiredItemIds = Object.keys(desiredItems);
            if (desiredItemIds.length > 0) {
                const toInsert = desiredItemIds.map(itemId => ({
                    location_id: locationId,
                    item_id: itemId,
                    stock_ideal: desiredItems[itemId].stockIdeal,
                    next_expiry_date: desiredItems[itemId].nextExpiryDate || null
                }));

                const { error: insertError } = await supabase.from(tableName).insert(toInsert);
                if (insertError) throw insertError;
            }

            fetchCartItems();
        } catch (e: any) {
            console.error('Error syncing cart items', e);
            throw e;
        }
    }

    const removeCartItem = async (id: string) => {
        try {
            const tableName = getTableName();
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) throw error;
            setCartItems(prev => prev.filter(i => i.id !== id));
        } catch (e: any) {
            console.error('Error deleting cart item', e);
            throw e;
        }
    }

    return { cartItems, loading, error, refresh: fetchCartItems, updateCartItemStock, addCartItem, removeCartItem, syncCartItems };
}

export function useGlobalCartItems(unitId?: string) {
    const [allItems, setAllItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cart_contents')
                .select(`
                    id, location_id, item_id, stock_ideal, next_expiry_date,
                    items (id, name, category, image_url)
                `);

            if (error) throw error;

            const mapped: CartItem[] = (data || []).map((row: any) => ({
                id: row.id,
                locationId: row.location_id,
                itemId: row.item_id,
                stockIdeal: row.stock_ideal,
                nextExpiryDate: row.next_expiry_date,
                item: row.items ? {
                    id: row.items.id,
                    name: row.items.name,
                    stockIdeal: 0,
                    category: row.items.category,
                    imageUrl: row.items.image_url,
                    locationType: LocationType.CART
                } : undefined
            }));
            setAllItems(mapped);
        } catch (e) {
            console.error('Error fetching global cart items:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return { allItems, loading, refresh: fetchAll };
}
