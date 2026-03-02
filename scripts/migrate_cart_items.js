
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tdmetvfksdyrqsakjfnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbWV0dmZrc2R5cnFzYWtqZm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc5OTEsImV4cCI6MjA4MzgyMzk5MX0.scpwhggGzAszSuwHABFqxQohfslKGTaMoSawuHuBabo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Starting migration...');

    // 1. Fetch Items and Locations
    const { data: items, error: itemsError } = await supabase.from('items').select('*');
    if (itemsError) throw itemsError;

    const { data: locations, error: locError } = await supabase.from('locations').select('*');
    if (locError) throw locError;

    // Build Hierarchy Map
    const locMap = new Map(locations.map(l => [l.id, l]));
    const getRootName = (loc) => {
        let current = loc;
        while (current.parent_id && locMap.has(current.parent_id)) {
            current = locMap.get(current.parent_id);
        }
        return current.name.toLowerCase();
    };

    const techniquesItems = [];
    const curesItems = [];
    const crashItems = [];

    for (const item of items) {
        if (!item.cart_location) continue;

        // Find matching location(s)
        const matches = locations.filter(l => l.name.toLowerCase() === item.cart_location.toLowerCase() && l.type === 'CART');

        if (matches.length === 0) {
            console.warn(`No location found for item "${item.name}" at "${item.cart_location}"`);
            continue;
        }

        let targetLoc = matches[0];

        // Ambiguity resolution: Prefer Techniques Cart
        if (matches.length > 1) {
            const techniquesLoc = matches.find(l => getRootName(l).includes('técnicas') || getRootName(l).includes('tecnicas'));
            if (techniquesLoc) {
                targetLoc = techniquesLoc;
            }
        }

        const rootName = getRootName(targetLoc);
        const payload = {
            location_id: targetLoc.id,
            item_id: item.id,
            stock_ideal: item.stock_ideal
        };

        if (rootName.includes('técnicas') || rootName.includes('tecnicas')) {
            techniquesItems.push(payload);
        } else if (rootName.includes('curas')) {
            curesItems.push(payload);
        } else if (rootName.includes('paradas')) {
            crashItems.push(payload);
        } else {
            console.warn(`Unknown root cart "${rootName}" for item "${item.name}"`);
        }
    }

    // Insert batches
    if (techniquesItems.length > 0) {
        const { error } = await supabase.from('cart_techniques_items').insert(techniquesItems);
        if (error) console.error('Error inserting techniques items:', error);
        else console.log(`Migrated ${techniquesItems.length} items to Techniques Cart.`);
    }

    if (curesItems.length > 0) {
        const { error } = await supabase.from('cart_cures_items').insert(curesItems);
        if (error) console.error('Error inserting cures items:', error);
        else console.log(`Migrated ${curesItems.length} items to Cures Cart.`);
    }

    if (crashItems.length > 0) {
        const { error } = await supabase.from('cart_crash_items').insert(crashItems);
        if (error) console.error('Error inserting crash items:', error);
        else console.log(`Migrated ${crashItems.length} items to Crash Cart.`);
    }

    console.log('Migration complete.');
}

migrate();
