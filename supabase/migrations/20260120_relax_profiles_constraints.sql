-- Relax constraints on profiles table
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('NURSE', 'SUPERVISOR', 'ADMIN', 'USER'));

-- Remove foreign key constraint to allow 'USER' role without auth
-- First, find the constraint name if it's different, but standard is profiles_id_fkey
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
