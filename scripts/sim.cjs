const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://tdmetvfksdyrqsakjfnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbWV0dmZrc2R5cnFzYWtqZm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc5OTEsImV4cCI6MjA4MzgyMzk5MX0.scpwhggGzAszSuwHABFqxQohfslKGTaMoSawuHuBabo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimulate() {
    const id = '2468a445-2d43-4d72-aa3e-7d159bb6795c';
    const numEq = 1;
    const { data: eq } = await supabase.from('equipment').select('id').limit(1).single();

    const techniqueEquipment = [{ technique_id: id, equipment_id: eq.id, quantity: 2 }];

    // simulate code from useSupabaseData
    const updates = { name: 'test', description: 'test', cart_ids: [] };
    const { error: techError } = await supabase.from('techniques').update(updates).eq('id', id);
    if (techError) return console.log('techError', techError);

    const { error: deleteEqError } = await supabase.from('technique_equipment').delete().eq('technique_id', id);
    if (deleteEqError) return console.log('deleteEqError', deleteEqError);

    console.log("techniqueEquipment payload:", techniqueEquipment)

    const { error: insertEqError } = await supabase.from('technique_equipment').insert(techniqueEquipment);
    if (insertEqError) return console.log('insertEqError', insertEqError);

    console.log("Success update!");
}

testSimulate();
