
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Incident } from '../types';

export function useIncidents() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchIncidents();
    }, []);

    async function fetchIncidents() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('incidents')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setIncidents(data as Incident[]);
        } catch (e: any) {
            console.error('Error fetching incidents:', e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function createIncident(incident: Omit<Incident, 'id' | 'created_at' | 'status'>) {
        try {
            const { data, error } = await supabase
                .from('incidents')
                .insert([incident])
                .select()
                .single();

            if (error) throw error;

            setIncidents(prev => [data as Incident, ...prev]);
            return data;
        } catch (e: any) {
            console.error('Error creating incident:', e);
            throw e;
        }
    }

    return { incidents, loading, error, fetchIncidents, createIncident };
}
