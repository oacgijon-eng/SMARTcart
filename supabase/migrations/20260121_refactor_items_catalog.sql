-- Refactor items table to be a Global Catalog
-- We are removing location-specific data from the master items table.

-- 1. Remove location-specific columns
ALTER TABLE items 
DROP COLUMN IF EXISTS location_type,
DROP COLUMN IF EXISTS cart_location,
DROP COLUMN IF EXISTS warehouse_location,
DROP COLUMN IF EXISTS stock_ideal;

-- 2. Ensure references exist (though we aren't changing the primary key 'id', so existing FKs work)

-- Notes:
-- The 'stock_ideal' and location info now lives exclusively in:
-- - cart_techniques_items
-- - cart_cures_items
-- - cart_crash_items
-- - (and potentially warehouse_items if we create that later)
