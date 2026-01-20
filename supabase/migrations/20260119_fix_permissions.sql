-- Explicitly grant usage on the schema and table
-- This is often needed if the table was created by a superuser/admin and defaults are strict

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT ON TABLE public.profiles TO anon; -- Optional, but safe for select if RLS is on

-- Ensure RLS is active (just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Re-verify Policy exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" 
        ON public.profiles FOR SELECT 
        USING (auth.uid() = id);
    END IF;
END
$$;
