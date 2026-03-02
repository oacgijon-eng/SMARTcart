const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://tdmetvfksdyrqsakjfnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbWV0dmZrc2R5cnFzYWtqZm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc5OTEsImV4cCI6MjA4MzgyMzk5MX0.scpwhggGzAszSuwHABFqxQohfslKGTaMoSawuHuBabo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdateTechnique() {
    try {
        const { data: techniques } = await supabase.from('techniques').select('*').limit(1);
        const { data: items } = await supabase.from('items').select('id').limit(1);
        const { data: equipments } = await supabase.from('equipment').select('id').limit(1);

        if (!techniques.length) return;
        const id = techniques[0].id;
        console.log("Updating", id);

        const techniqueItems = items.length > 0 ? [{ technique_id: id, item_id: items[0].id, quantity: 2 }] : [];
        const techniqueEquipment = equipments.length > 0 ? [{ technique_id: id, equipment_id: equipments[0].id, quantity: 3 }] : [];

        // 3. Sync Equipment: Delete all existing and re-insert
        const { error: deleteEqError } = await supabase
            .from('technique_equipment')
            .delete()
            .eq('technique_id', id);

        if (deleteEqError) throw deleteEqError;

        if (techniqueEquipment.length > 0) {
            const { error: insertEqError } = await supabase
                .from('technique_equipment')
                .insert(techniqueEquipment);

            if (insertEqError) throw insertEqError;
        }

        console.log("Success update eq!");
    } catch (e) {
        console.error("failed", e);
    }
}

testUpdateTechnique();
