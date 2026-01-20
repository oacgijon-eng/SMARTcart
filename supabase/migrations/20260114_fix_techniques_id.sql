
-- Fix ID generation for techniques table
ALTER TABLE techniques
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Force schema cache reload just in case
NOTIFY pgrst, 'reload config';
