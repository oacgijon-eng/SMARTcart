
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Feedback } from '../types';

export function useFeedbacks(unitId?: string) {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFeedbacks();
    }, [unitId]);

    async function fetchFeedbacks() {
        try {
            setLoading(true);
            let query = supabase
                .from('feedbacks')
                .select('*')
                .order('created_at', { ascending: false });

            if (unitId) {
                query = query.eq('unit_id', unitId);
            }

            const { data, error } = await query;

            if (error) throw error;

            setFeedbacks(data as Feedback[]);
        } catch (e: any) {
            console.error('Error fetching feedbacks:', e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return { feedbacks, loading, error, fetchFeedbacks };
}
