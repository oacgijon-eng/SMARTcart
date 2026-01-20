
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tdmetvfksdyrqsakjfnh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbWV0dmZrc2R5cnFzYWtqZm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc5OTEsImV4cCI6MjA4MzgyMzk5MX0.scpwhggGzAszSuwHABFqxQohfslKGTaMoSawuHuBabo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpdate() {
    console.log("Starting UPDATE test for color persistence...");

    // 1. Create with NO color
    const newLocation = {
        name: 'Test_Update_Color_Cart',
        type: 'CART',
        color: null
    };

    console.log("Attempting CREATE (no color)...");
    const { data: created, error: createError } = await supabase
        .from('locations')
        .insert([newLocation])
        .select()
        .single();

    if (createError) {
        console.error("CREATE failed:", createError.message);
        return;
    }
    console.log("CREATE Success. ID:", created.id);

    // 2. Update to ADD color
    console.log("Attempting UPDATE to set color to #ef4444...");
    const { data: updated, error: updateError } = await supabase
        .from('locations')
        .update({ color: '#ef4444' })
        .eq('id', created.id)
        .select()
        .single();

    if (updateError) {
        console.error("UPDATE failed:", updateError.message);
        // Clean up
        await supabase.from('locations').delete().eq('id', created.id);
        return;
    }

    console.log("UPDATE Success:", updated);
    if (updated.color !== '#ef4444') {
        console.error("CRITICAL: Update returned incorrect color:", updated.color);
    } else {
        console.log("VERIFIED: Update persisted color correctly.");
    }

    // 3. Clean up
    await supabase.from('locations').delete().eq('id', created.id);
    console.log("Cleaned up.");
}

testUpdate();
