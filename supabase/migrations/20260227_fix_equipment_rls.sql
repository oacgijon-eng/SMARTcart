-- Fix Row-Level Security policies for technique_equipment table

-- First, drop the restrictive policies that only apply to 'anon' users
DROP POLICY IF EXISTS "Enable read access for anon users" ON public.technique_equipment;
DROP POLICY IF EXISTS "Enable insert access for anon users" ON public.technique_equipment;
DROP POLICY IF EXISTS "Enable delete access for anon users" ON public.technique_equipment;

-- Create a blanket policy giving access to both authenticated and anon users,
-- matching the policy you already have on technique_items.
-- This will solve the "new row violates row-level security policy" error.
CREATE POLICY "Allow all access to technique_equipment" 
  ON public.technique_equipment 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
