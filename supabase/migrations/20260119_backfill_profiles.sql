-- Backfill existing users into profiles table if they don't exist
INSERT INTO public.profiles (id, name, role)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'name', email) as name, 
    COALESCE(raw_user_meta_data->>'role', 'NURSE') as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Optional: Ensure at least one supervisor exists (e.g. 'admin@hospital.com')
-- This is a heuristic to help the user not get locked out
UPDATE public.profiles
SET role = 'SUPERVISOR'
WHERE name ILIKE '%admin%' OR role = 'SUPERVISOR';
