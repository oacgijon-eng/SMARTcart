const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://tdmetvfksdyrqsakjfnh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbWV0dmZrc2R5cnFzYWtqZm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc5OTEsImV4cCI6MjA4MzgyMzk5MX0.scpwhggGzAszSuwHABFqxQohfslKGTaMoSawuHuBabo');

async function run() {
    console.log("Fetching technique and equipment...");
    const { data: tech } = await supabase.from('techniques').select('id').limit(1).single();
    const { data: eq } = await supabase.from('equipment').select('id').limit(1).single();

    if (!tech || !eq) return console.log("Missing data", tech, eq);

    console.log("IDs:", tech.id, eq.id);
    const r = await supabase.from('technique_equipment').insert({ technique_id: tech.id, equipment_id: eq.id, quantity: 1 });
    console.log("Insert return:", r);
}
run();
