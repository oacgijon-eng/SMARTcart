import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tdmetvfksdyrqsakjfnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbWV0dmZrc2R5cnFzYWtqZm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc5OTEsImV4cCI6MjA4MzgyMzk5MX0.scpwhggGzAszSuwHABFqxQohfslKGTaMoSawuHuBabo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying parent_id column...');
    const { data, error } = await supabase.from('locations').select('parent_id').limit(1);

    if (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } else {
        console.log('Success: parent_id column exists.');
        console.log('Data sample:', data);
    }
}

verify();
