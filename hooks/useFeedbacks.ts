
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Feedback } from '../types';

export function useFeedbacks() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    async function fetchFeedbacks() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('feedbacks')
                .select('*')
                .order('created_at', { ascending: false });

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
