import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { User } from '../types';

export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createUser = async (email: string, pass: string, name: string, role: 'NURSE' | 'SUPERVISOR' | 'ADMIN' | 'USER') => {
        try {
            setError(null);

            // Strategy: For 'USER' role (no login), we insert directly into DB to avoid Edge Function issues.

            if (role === 'USER') {
                const { error: dbError } = await supabase
                    .from('profiles')
                    .insert({
                        id: crypto.randomUUID(),
                        name,
                        role
                    });

                if (dbError) throw dbError;
            } else {
                // Strategy 2: For Auth users (NURSE, SUPERVISOR), if Edge Function fails, we try a client-side workaround.
                // We create a temporary client that doesn't persist session (so we don't logout the admin)
                // and use public signUp.

                // Try Edge Function first (kept as legacy/ideal path)
                const { data, error } = await supabase.functions.invoke('manage-users', {
                    body: { action: 'create', email, password: pass, name, role }
                });

                if (error) {
                    console.warn("Edge Function failed, trying client-side fallback...", error);

                    // FALLBACK: Client-side SignUp (requires Email Confirm to be OFF or user to verify email)
                    // We need a fresh client to not affect current session
                    const { createClient } = await import('@supabase/supabase-js');
                    const tempClient = createClient(
                        import.meta.env.VITE_SUPABASE_URL,
                        import.meta.env.VITE_SUPABASE_ANON_KEY,
                        { auth: { persistSession: false } } // Don't logout admin
                    );

                    const { data: authData, error: authError } = await tempClient.auth.signUp({
                        email,
                        password: pass,
                        options: {
                            data: { name, role } // Trigger will handle profile creation
                        }
                    });

                    if (authError) {
                        alert("Error CREATING AUTH: " + authError.message);
                        throw new Error("Fallback creation failed: " + authError.message);
                    }

                    if (authData.user && !authData.session) {
                        alert("Usuario Auth Creado, pero requiere confirmación de email. Revisa la bandeja de entrada.");
                    } else if (authData.user) {
                        // alert("Usuario Auth Creado Correctamente. Si no aparece en la lista, el Trigger falló.");
                    }
                } else if (data.error) {
                    // If function returned logical error
                    throw new Error(data.error);
                }
            }

            // Refresh list (Profile trigger might take a ms, so we wait a tiny bit or just fetch)
            setTimeout(() => fetchUsers(), 1000);
            return { error: null };
        } catch (err: any) {
            console.error('Error creating user:', err);
            return { error: err.message || JSON.stringify(err) };
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            setError(null);

            // 1. Delete the PROFILE directly.
            // This is the source of truth for the list in the UI.
            const { error: dbError, count } = await supabase
                .from('profiles')
                .delete({ count: 'exact' })
                .eq('id', userId);

            if (dbError) throw new Error("Error en BD: " + dbError.message);
            if (count === 0) throw new Error("No se pudo borrar: Posible problema de permisos (RLS).");

            // 2. Cleanup Auth (Best effort)
            // Even if this fails (e.g. Edge Function offline), the user disappears from the UI.
            try {
                await supabase.functions.invoke('manage-users', {
                    body: { action: 'delete', userId }
                });
            } catch (e) {
                console.warn("Auth cleanup error (non-critical):", e);
            }

            await fetchUsers();
            return { error: null };
        } catch (err: any) {
            console.error('Error deleting user:', err);
            return { error: err.message };
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return {
        users,
        loading,
        error,
        refreshUsers: fetchUsers,
        createUser,
        deleteUser
    };
};
