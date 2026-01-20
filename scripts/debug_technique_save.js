
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTechniqueSave() {
    console.log('Debugging Technique Save WITH ITEMS...');

    // 0. CREATE a dummy item to ensure we have one
    const testItemId = crypto.randomUUID();
    const testItem = {
        id: testItemId,
        name: `Debug Item ${Date.now()}`,
        stock_ideal: 10,
        cart_location: 'A1',
        category: 'material',
        location_type: 'CART'
    };

    const { data: itemData, error: itemError } = await supabase
        .from('items')
        .insert([testItem])
        .select()
        .single();

    if (itemError) {
        console.error('❌ Could not create dummy item:', itemError);
        return;
    }
    // const testItemId = itemData.id; // Already have it.
    console.log('✅ Created Dummy Item ID:', testItemId);

    // 1. Try to create a technique WITH items
    const testTechnique = {
        name: `Debug Tech items ${Date.now()}`,
        description: 'Testing protocol url save with items',
        protocol_url: 'https://example.com/test.pdf',
        category: 'General',
        icon_name: 'FileText'
    };

    console.log('Attempting to insert technique:', testTechnique);

    const { data: techData, error: techError } = await supabase
        .from('techniques')
        .insert([testTechnique])
        .select()
        .single();

    if (techError) {
        console.error('❌ Error creating technique:', JSON.stringify(techError, null, 2));
        return;
    }

    console.log('✅ Technique created:', techData.id);

    // 2. Insert items
    const techniqueItems = [{
        technique_id: techData.id,
        item_id: testItemId,
        quantity: 1
    }];

    console.log('Attempting to insert technique items:', techniqueItems);

    const { error: itemsError } = await supabase
        .from('technique_items')
        .insert(techniqueItems);

    if (itemsError) {
        console.error('❌ Error creating technique items:', JSON.stringify(itemsError, null, 2));
    } else {
        console.log('✅ Technique items created successfully.');
    }

    // Clean up
    // await supabase.from('technique_items').delete().eq('technique_id', techData.id);
    // await supabase.from('techniques').delete().eq('id', techData.id);
}

debugTechniqueSave();
