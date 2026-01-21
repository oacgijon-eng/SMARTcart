
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Item, Technique, KitItem, Equipment, TechniqueEquipment } from '../types';

export function useItems() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchItems() {
        try {
            const { data, error } = await supabase.from('items').select('*');
            if (error) throw error;

            const mapped: Item[] = (data || []).map((row: any) => ({
                id: row.id,
                name: row.name,
                imageUrl: row.image_url,
                category: row.category,
                referencia_petitorio: row.referencia_petitorio
            }));

            setItems(mapped);
        } catch (e: any) {
            console.error('Error fetching items:', e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchItems();
    }, []);

    async function createItem(item: Omit<Item, 'id'>) {
        try {
            const { data, error } = await supabase
                .from('items')
                .insert([{
                    id: crypto.randomUUID(),
                    name: item.name,
                    category: item.category,
                    image_url: item.imageUrl,
                    referencia_petitorio: item.referencia_petitorio || ''
                }])
                .select()
                .single();

            if (error) throw error;
            fetchItems();
            return data;
        } catch (e: any) {
            console.error('Error creating item:', e);
            throw e;
        }
    }

    async function updateItem(id: string, updates: Partial<Item>) {
        try {
            // Map frontend keys to DB keys if necessary, or just rely on spread if keys match (they don't fully)
            const dbUpdates: any = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.category) dbUpdates.category = updates.category;
            if (updates.imageUrl) dbUpdates.image_url = updates.imageUrl;
            if (updates.referencia_petitorio !== undefined) dbUpdates.referencia_petitorio = updates.referencia_petitorio;

            const { error } = await supabase
                .from('items')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;
            fetchItems();
        } catch (e: any) {
            console.error('Error updating item:', e);
            throw e;
        }
    }

    async function deleteItem(id: string) {
        try {
            // Manual Cascade: Delete related technique_items first
            await supabase.from('technique_items').delete().eq('item_id', id);

            // Manual Cascade: Delete related cart_contents
            await supabase.from('cart_contents').delete().eq('item_id', id);

            // Manual Cascade: Legacy cart tables
            await supabase.from('cart_techniques_items').delete().eq('item_id', id);
            await supabase.from('cart_cures_items').delete().eq('item_id', id);
            await supabase.from('cart_crash_items').delete().eq('item_id', id);

            const { error } = await supabase.from('items').delete().eq('id', id);
            if (error) throw error;
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (e: any) {
            console.error('Error deleting item:', e);
            throw e;
        }
    }

    return { items, loading, error, refreshItems: fetchItems, createItem, updateItem, deleteItem };
}

export function useTechniques() {
    const [techniques, setTechniques] = useState<Technique[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchTechniques() {
        try {
            // Fetch techniques with their related items
            // Note: This relies on Supabase detecting the foreign keys
            // technique_items joins techniques and items
            const { data, error } = await supabase
                .from('techniques')
                .select(`
        *,
        technique_items (
          quantity,
          items (*)
        ),
        technique_equipment (
          quantity,
          equipment (*)
        )
      `);

            if (error) throw error;

            const mapped: Technique[] = (data || []).map((row: any) => {
                const items: KitItem[] = (row.technique_items || []).map((ti: any) => ({
                    itemId: ti.items.id,
                    quantity: ti.quantity,
                    item: {
                        id: ti.items.id,
                        name: ti.items.name,
                        imageUrl: ti.items.image_url,
                        category: ti.items.category,
                        referencia_petitorio: ti.items.referencia_petitorio
                    }
                }));

                const equipment: TechniqueEquipment[] = (row.technique_equipment || []).map((te: any) => ({
                    equipmentId: te.equipment.id,
                    quantity: te.quantity,
                    equipment: {
                        id: te.equipment.id,
                        name: te.equipment.name,
                        description: te.equipment.description,
                        imageUrl: te.equipment.image_url,
                        category: te.equipment.category,
                        stockQuantity: te.equipment.stock_quantity,
                        maintenanceStatus: te.equipment.maintenance_status,
                        location: te.equipment.location,
                        requiresPower: te.equipment.requires_power,
                        created_at: te.equipment.created_at
                    }
                }));

                return {
                    id: row.id,
                    name: row.name,
                    category: row.category,
                    description: row.description,
                    protocolUrl: row.protocol_url,
                    iconName: row.icon_name,
                    cartIds: row.cart_ids || [], // Map from DB
                    items: items,
                    equipment: equipment
                };
            });

            setTechniques(mapped);
        } catch (e: any) {
            console.error('Error fetching techniques:', e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTechniques();
    }, []);

    async function createTechnique(technique: { name: string; description: string; protocolUrl?: string; cartIds?: string[]; items: { itemId: string; quantity: number }[]; equipment: { equipmentId: string; quantity: number }[] }) {
        console.log('useTechniques: createTechnique called with', technique);
        try {
            // 1. Create Technique
            const { data: techData, error: techError } = await supabase
                .from('techniques')
                .insert([{
                    name: technique.name,
                    description: technique.description,
                    protocol_url: technique.protocolUrl || null,
                    category: 'General', // Default
                    icon_name: 'FileText', // Default
                    cart_ids: technique.cartIds || [] // Save cart_ids
                }])
                .select()
                .single();

            if (techError) throw techError;

            // 2. Create Technique Items
            if (technique.items.length > 0) {
                const techniqueItems = technique.items.map(item => ({
                    technique_id: techData.id,
                    item_id: item.itemId,
                    quantity: item.quantity
                }));

                const { error: itemsError } = await supabase
                    .from('technique_items')
                    .insert(techniqueItems);

                if (itemsError) throw itemsError;
            }

            // 3. Create Technique Equipment
            if (technique.equipment && technique.equipment.length > 0) {
                const techniqueEquipment = technique.equipment.map(eq => ({
                    technique_id: techData.id,
                    equipment_id: eq.equipmentId,
                    quantity: eq.quantity
                }));

                const { error: equipmentError } = await supabase
                    .from('technique_equipment')
                    .insert(techniqueEquipment);

                if (equipmentError) throw equipmentError;
            }

            fetchTechniques(); // Refresh list
            return techData;
        } catch (e: any) {
            console.error('Error creating technique:', e);
            throw e;
        }
    }

    async function deleteTechnique(id: string) {
        console.log('useTechniques: deleteTechnique called with ID', id);
        try {
            // Manual Cascade: Delete related items first
            await supabase.from('technique_items').delete().eq('technique_id', id);
            await supabase.from('technique_equipment').delete().eq('technique_id', id);

            // Unlink from Incidents and Feedbacks (set to null instead of delete)
            const { error: incError, count: incCount } = await supabase.from('incidents').update({ related_technique_id: null }).eq('related_technique_id', id).select();
            const { error: feedError, count: feedCount } = await supabase.from('feedbacks').update({ technique_id: null }).eq('technique_id', id).select();

            console.log('Unlinked incidents:', incCount, 'Error:', incError);
            console.log('Unlinked feedbacks:', feedCount, 'Error:', feedError);

            // Verify clean state
            const { count: remainingIncidents } = await supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('related_technique_id', id);
            const { count: remainingFeedbacks } = await supabase.from('feedbacks').select('*', { count: 'exact', head: true }).eq('technique_id', id);

            if ((remainingIncidents || 0) > 0 || (remainingFeedbacks || 0) > 0) {
                throw new Error(`PERMISION DENIED: Cannot unlink incidents/feedback. Remaining: ${remainingIncidents} incidents, ${remainingFeedbacks} feedbacks. Likely RLS issue.`);
            }

            // Supabase/Postgres usually needs CASCADE on foreign key or manual delete

            // Supabase/Postgres usually needs CASCADE on foreign key or manual delete
            // Trying direct delete first
            const { error } = await supabase.from('techniques').delete().eq('id', id);
            if (error) throw error;
            setTechniques(prev => prev.filter(t => t.id !== id));
        } catch (e: any) {
            console.error('Error deleting technique:', e);
            throw e;
        }
    }

    async function updateTechnique(id: string, technique: { name: string; description: string; protocolUrl?: string; cartIds?: string[]; items: { itemId: string; quantity: number }[]; equipment: { equipmentId: string; quantity: number }[] }) {
        try {
            // 1. Update Technique Details
            const updates: any = {
                name: technique.name,
                description: technique.description,
                cart_ids: technique.cartIds || []
            };
            if (technique.protocolUrl !== undefined) {
                updates.protocol_url = technique.protocolUrl;
            }

            const { error: techError } = await supabase
                .from('techniques')
                .update(updates)
                .eq('id', id);

            if (techError) throw techError;

            // 2. Sync Items: Delete all existing and re-insert
            // This is safer than diffing for this simple use case
            const { error: deleteError } = await supabase
                .from('technique_items')
                .delete()
                .eq('technique_id', id);

            if (deleteError) throw deleteError;

            if (technique.items.length > 0) {
                const techniqueItems = technique.items.map(item => ({
                    technique_id: id,
                    item_id: item.itemId,
                    quantity: item.quantity
                }));

                const { error: insertError } = await supabase
                    .from('technique_items')
                    .insert(techniqueItems);

                if (insertError) throw insertError;
            }

            // 3. Sync Equipment: Delete all existing and re-insert
            const { error: deleteEqError } = await supabase
                .from('technique_equipment')
                .delete()
                .eq('technique_id', id);

            if (deleteEqError) throw deleteEqError;

            if (technique.equipment && technique.equipment.length > 0) {
                const techniqueEquipment = technique.equipment.map(eq => ({
                    technique_id: id,
                    equipment_id: eq.equipmentId,
                    quantity: eq.quantity
                }));

                const { error: insertEqError } = await supabase
                    .from('technique_equipment')
                    .insert(techniqueEquipment);

                if (insertEqError) throw insertEqError;
            }

            fetchTechniques();
        } catch (e: any) {
            console.error('Error updating technique:', e);
            throw e;
        }
    }

    return { techniques, loading, error, refreshTechniques: fetchTechniques, createTechnique, updateTechnique, deleteTechnique };
}

export function useEquipment(unitId?: string) {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchEquipment() {
        try {
            let query = supabase.from('equipment').select('*').order('name');
            if (unitId) {
                query = query.eq('unit_id', unitId);
            }
            const { data, error } = await query;
            if (error) throw error;

            const mapped: Equipment[] = (data || []).map((row: any) => ({
                id: row.id,
                name: row.name,
                description: row.description,
                imageUrl: row.image_url,
                category: row.category,
                stockQuantity: row.stock_quantity,
                maintenanceStatus: row.maintenance_status,
                location: row.location,
                requiresPower: row.requires_power,
                created_at: row.created_at,
                unit_id: row.unit_id
            }));

            setEquipment(mapped);
        } catch (e: any) {
            console.error('Error fetching equipment:', e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchEquipment();
    }, [unitId]);

    async function createEquipment(data: Omit<Equipment, 'id'>) {
        try {
            const { error } = await supabase.from('equipment').insert([{
                name: data.name,
                description: data.description,
                image_url: data.imageUrl,
                category: data.category,
                stock_quantity: data.stockQuantity,
                maintenance_status: data.maintenanceStatus,
                location: data.location || '',
                requires_power: data.requiresPower,
                unit_id: data.unit_id || unitId
            }]);

            if (error) throw error;
            fetchEquipment();
        } catch (e: any) {
            console.error('Error creating equipment:', e);
            throw e;
        }
    }

    async function updateEquipment(id: string, updates: Partial<Equipment>) {
        try {
            const dbUpdates: any = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
            if (updates.category) dbUpdates.category = updates.category;
            if (updates.stockQuantity !== undefined) dbUpdates.stock_quantity = updates.stockQuantity;
            if (updates.maintenanceStatus) dbUpdates.maintenance_status = updates.maintenanceStatus;
            if (updates.location !== undefined) dbUpdates.location = updates.location;
            if (updates.requiresPower !== undefined) dbUpdates.requires_power = updates.requiresPower;

            const { error } = await supabase
                .from('equipment')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;
            fetchEquipment();
        } catch (e: any) {
            console.error('Error updating equipment:', e);
            throw e;
        }
    }

    async function deleteEquipment(id: string) {
        try {
            // Manual Cascade: Delete related technique_equipment first
            await supabase.from('technique_equipment').delete().eq('equipment_id', id);

            const { error } = await supabase.from('equipment').delete().eq('id', id);
            if (error) throw error;
            setEquipment(prev => prev.filter(e => e.id !== id));
        } catch (e: any) {
            console.error('Error deleting equipment:', e);
            throw e;
        }
    }

    return {
        equipment,
        loading,
        error,
        refreshEquipment: fetchEquipment,
        createEquipment,
        updateEquipment,
        deleteEquipment
    };
}

export function useStockRevisions(unitId?: string) {
    const [revisions, setRevisions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchRevisions() {
        try {
            setLoading(true);
            let query = supabase
                .from('stock_revisions')
                .select(`
                    *,
                    locations (
                        name,
                        color
                    )
                `)
                .order('created_at', { ascending: false });

            if (unitId) {
                query = query.eq('unit_id', unitId);
            }

            const { data, error } = await query;
            if (error) throw error;
            setRevisions(data || []);
        } catch (e: any) {
            console.error('Error fetching stock revisions:', e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchRevisions();
    }, [unitId]);

    return {
        revisions,
        loading,
        error,
        refreshRevisions: fetchRevisions
    };
}
