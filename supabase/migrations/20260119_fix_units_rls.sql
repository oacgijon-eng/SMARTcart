-- Migration to fix RLS permissions for the units table
-- This allows anyone to Read and Create units, which is necessary for the first-use setup.

-- 1. Enable RLS (just in case it wasn't enabled)
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Allow all access to units" ON public.units;

-- 3. Create a permissive policy for the prototype
CREATE POLICY "Allow all access to units"
ON public.units
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Grant access to service roles and anon roles
GRANT ALL ON TABLE public.units TO anon, authenticated, service_role;
