
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export interface Location {
    id: string;
    name: string;
    type: 'CART' | 'WAREHOUSE' | 'EXTERNAL';
    parent_id?: string | null;
    color?: string;
}

export function useLocations() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLocations();
    }, []);

    async function fetchLocations() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('locations')
                .select('*')
                .order('name');

            if (error) throw error;
            setLocations(data as Location[]);
        } catch (e: any) {
            console.error('Error fetching locations:', e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function createLocation(location: Omit<Location, 'id'>) {
        try {
            const { data, error } = await supabase
                .from('locations')
                .insert([{
                    name: location.name,
                    type: location.type,
                    parent_id: location.parent_id || null,
                    color: location.color || null
                }])
                .select()
                .single();

            if (error) throw error;
            setLocations(prev => [...prev, data as Location]);
            return data;
        } catch (e: any) {
            console.error('Error creating location:', e);
            throw e;
        }
    }

    async function deleteLocation(id: string) {
        try {
            // Manual Cascade: Delete children first
            // Note: This requires 'parent_id' to be visible in the API.
            // If the DB has ON DELETE CASCADE, this is redundant but safe.
            const { data: children } = await supabase
                .from('locations')
                .select('id')
                .eq('parent_id', id);

            if (children && children.length > 0) {
                // Recursively delete children
                await Promise.all(children.map(child => deleteLocation(child.id)));
            }

            // Delete the location itself
            const { error } = await supabase
                .from('locations')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setLocations(prev => prev.filter(l => l.id !== id));
        } catch (e: any) {
            console.error('Error deleting location:', e);
            throw e;
        }
    }

    async function updateLocation(id: string, updates: Partial<Omit<Location, 'id' | 'parent_id'>>) {
        try {
            const { error } = await supabase
                .from('locations')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            setLocations(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
        } catch (e: any) {
            console.error('Error updating location:', e);
            throw e;
        }
    }

    return { locations, loading, error, createLocation, updateLocation, deleteLocation, fetchLocations };
}
