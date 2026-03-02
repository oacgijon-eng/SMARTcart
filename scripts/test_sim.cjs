const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://tdmetvfksdyrqsakjfnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbWV0dmZrc2R5cnFzYWtqZm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc5OTEsImV4cCI6MjA4MzgyMzk5MX0.scpwhggGzAszSuwHABFqxQohfslKGTaMoSawuHuBabo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function extractFullPayload() {
    const { data: techniques } = await supabase
        .from('techniques')
        .select(`
        *,
        technique_items (
          quantity,
          items (*)
        ),
        technique_equipment (
          quantity,
          equipment (*)
        )
      `)
        .limit(1);

    const row = techniques[0];
    const items = (row.technique_items || []).map((ti) => ({
        itemId: ti.items?.id,
        quantity: ti.quantity,
    }));
    const equipment = (row.technique_equipment || []).map((te) => ({
        equipmentId: te.equipment?.id,
        quantity: te.quantity,
    }));

    const technique = {
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        protocolUrl: row.protocol_url,
        cartIds: row.cart_ids || [],
        items: items,
        equipment: equipment
    };

    // Simulate updating technique with exact payload shape
    const updates = {
        name: technique.name,
        description: technique.description,
        cart_ids: technique.cartIds || []
    };
    if (technique.protocolUrl !== undefined) {
        updates.protocol_url = technique.protocolUrl;
    }

    const { error: techError } = await supabase
        .from('techniques')
        .update(updates)
        .eq('id', technique.id);

    if (techError) {
        console.error("Update technique DB Error:", techError);
        return;
    }

    // items
    const { error: deleteError } = await supabase
        .from('technique_items')
        .delete()
        .eq('technique_id', technique.id);

    if (deleteError) {
        console.error("Update technique items delete error:", deleteError);
        return;
    }

    if (technique.items.length > 0) {
        const techniqueItems = technique.items.map(item => ({
            technique_id: technique.id,
            item_id: item.itemId,
            quantity: item.quantity
        }));

        const { error: insertError } = await supabase
            .from('technique_items')
            .insert(techniqueItems);

        if (insertError) {
            console.error("Update technique items insert error:", insertError);
            return;
        }
    }

    // equipment
    const { error: deleteEqError } = await supabase
        .from('technique_equipment')
        .delete()
        .eq('technique_id', technique.id);

    if (deleteEqError) {
        console.error("Update technique equipment delete error:", deleteEqError);
        return;
    }

    if (technique.equipment && technique.equipment.length > 0) {
        const techniqueEquipment = technique.equipment.map(eq => ({
            technique_id: technique.id,
            equipment_id: eq.equipmentId,
            quantity: eq.quantity
        }));

        const { error: insertEqError } = await supabase
            .from('technique_equipment')
            .insert(techniqueEquipment);

        if (insertEqError) {
            console.error("Update technique equipment insert error:", insertEqError);
            return;
        }
    }

    console.log("Simulated successfully.");
}
extractFullPayload();
