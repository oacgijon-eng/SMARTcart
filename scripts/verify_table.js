
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tdmetvfksdyrqsakjfnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbWV0dmZrc2R5cnFzYWtqZm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc5OTEsImV4cCI6MjA4MzgyMzk5MX0.scpwhggGzAszSuwHABFqxQohfslKGTaMoSawuHuBabo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Checking cart_contents table...');

    // Attempt to insert a dummy record to check if table exists (and fail if not), or select
    // selecting is safer
    const { error } = await supabase.from('cart_contents').select('count', { count: 'exact', head: true });

    if (error) {
        if (error.code === '42P01') { // undefined_table
            console.log('Result: TABLE_MISSING');
        } else {
            console.log('Result: ERROR', error.message);
            // If error is permission denied, table exists
        }
    } else {
        console.log('Result: TABLE_EXISTS');
    }
}

main();
