
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tdmetvfksdyrqsakjfnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbWV0dmZrc2R5cnFzYWtqZm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc5OTEsImV4cCI6MjA4MzgyMzk5MX0.scpwhggGzAszSuwHABFqxQohfslKGTaMoSawuHuBabo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listLocations() {
    const { data: locations, error } = await supabase.from('locations').select('*');
    if (error) {
        console.error(error);
        return;
    }

    // Build a map of id -> location
    const locMap = new Map(locations.map(l => [l.id, l]));

    // Log hierarchy
    locations.forEach(l => {
        const parent = l.parent_id ? locMap.get(l.parent_id)?.name : 'ROOT';
        console.log(`[${l.type}] ${l.name} (Parent: ${parent})`);
    });
}

listLocations();
