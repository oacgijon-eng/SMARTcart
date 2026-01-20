-- Add cart_ids column to techniques table
ALTER TABLE techniques
ADD COLUMN cart_ids text[] DEFAULT '{}';
