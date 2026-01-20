
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tdmetvfksdyrqsakjfnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbWV0dmZrc2R5cnFzYWtqZm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc5OTEsImV4cCI6MjA4MzgyMzk5MX0.scpwhggGzAszSuwHABFqxQohfslKGTaMoSawuHuBabo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Listing Root Carts...');

    const { data: locations, error } = await supabase
        .from('locations')
        .select('id, name, type, parent_id')
        .eq('type', 'CART')
        .is('parent_id', null);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Found carts:', locations);
    }
}

main();
