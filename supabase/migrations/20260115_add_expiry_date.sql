-- Add next_expiry_date column to cart items tables

ALTER TABLE cart_techniques_items 
ADD COLUMN IF NOT EXISTS next_expiry_date DATE;

ALTER TABLE cart_cures_items 
ADD COLUMN IF NOT EXISTS next_expiry_date DATE;

ALTER TABLE cart_crash_items 
ADD COLUMN IF NOT EXISTS next_expiry_date DATE;
