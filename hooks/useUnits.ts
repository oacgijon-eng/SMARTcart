import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export interface Unit {
    id: string;
    name: string;
    description?: string;
}

export function useUnits() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUnits();
    }, []);

    async function fetchUnits() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('units')
                .select('*')
                .order('name');

            if (error) throw error;
            setUnits(data as Unit[]);
        } catch (e: any) {
            console.error('Error fetching units:', e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function createUnit(unit: Omit<Unit, 'id'>) {
        try {
            const { data, error } = await supabase
                .from('units')
                .insert([unit])
                .select()
                .single();

            if (error) throw error;
            setUnits(prev => [...prev, data as Unit]);
            return data;
        } catch (e: any) {
            console.error('Error creating unit:', e);
            throw e;
        }
    }

    async function updateUnit(id: string, updates: Partial<Omit<Unit, 'id'>>) {
        try {
            const { error } = await supabase
                .from('units')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            setUnits(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
        } catch (e: any) {
            console.error('Error updating unit:', e);
            throw e;
        }
    }

    async function deleteUnit(id: string) {
        try {
            const { error } = await supabase
                .from('units')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setUnits(prev => prev.filter(u => u.id !== id));
        } catch (e: any) {
            console.error('Error deleting unit:', e);
            throw e;
        }
    }

    return { units, loading, error, createUnit, updateUnit, deleteUnit, refreshUnits: fetchUnits };
}
