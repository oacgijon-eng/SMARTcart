-- 1. Create a secure function to check supervisor role
-- SECURITY DEFINER allows this function to bypass RLS when executed
CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'SUPERVISOR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Supervisors can view all profiles" ON public.profiles;

-- 3. Re-create the policy using the secure function
-- This avoids the infinite loop because the function runs with elevated privileges (bypassing the RLS check on the subquery)
CREATE POLICY "Supervisors can view all profiles" 
ON public.profiles FOR SELECT 
USING (
    public.is_supervisor()
);

-- Note: "Users can view own profile" prevents recursion because it doesn't query the table for other rows,
-- but we leave it as is since it was working.
