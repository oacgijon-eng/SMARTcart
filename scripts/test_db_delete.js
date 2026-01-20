import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

console.log(`Reading env from: ${envPath}`);
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} else {
    console.warn('Warning: .env.local file not found.');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDelete() {
    console.log('--- STARTING ROBUST DELETE TEST (Corrected Table + UUID) ---');

    // 1. Create a Helper Item
    console.log('Creating helper item...');
    const helperId = randomUUID();
    const { data: helperItem, error: helperError } = await supabase
        .from('items')
        .insert({
            id: helperId,
            name: 'DELETE_TEST_HELPER_ITEM_' + Date.now(),
            stock_ideal: 1,
            cart_location: 'TEMP',
            category: 'TEST',
            location_type: 'CART',
            image_url: 'http://placeholder.com'
        })
        .select()
        .single();

    if (helperError) {
        console.error('Failed to create helper item:', helperError);
        return;
    }
    console.log('Created helper item:', helperItem.id);

    // 2. Create a Dummy Technique
    console.log('Creating technique (assuming auto-ID works)...');
    const { data: tech, error: createError } = await supabase
        .from('techniques')
        .insert({ name: 'DELETE_TEST_TECHNIQUE_' + Date.now(), description: 'To be deleted' })
        .select()
        .single();

    if (createError) {
        console.error('Failed to create technique:', createError);
        // Attempt clean up of item
        await supabase.from('items').delete().eq('id', helperId);
        return;
    }
    console.log('Created technique:', tech.id);

    // 3. Link them
    console.log('Adding dependency (technique_items)...');
    const { error: itemError } = await supabase
        .from('technique_items')
        .insert({ technique_id: tech.id, item_id: helperItem.id, quantity: 1 });

    if (itemError) {
        console.error('Failed to add dependency:', itemError);
        return;
    }
    console.log('Dependency added. Technique now has items.');

    // 4. Delete the Technique
    console.log('Attempting DELETE on technique...');
    const { error: deleteError } = await supabase
        .from('techniques')
        .delete()
        .eq('id', tech.id);

    if (deleteError) {
        console.error('DELETE FAILED:', deleteError);
        console.error('Reason:', deleteError.message);
    } else {
        console.log('Delete command executed. Verifying existence...');
        const { data: check } = await supabase.from('techniques').select('id').eq('id', tech.id).maybeSingle();
        if (!check) {
            console.log('DELETE SUCCESSFUL! Technique is gone. Cascading works.');
        } else {
            console.error('DELETE SILENTLY FAILED! Technique still exists.');
        }
    }

    // 5. Cleanup helper item
    console.log('Cleaning up helper item...');
    await supabase.from('items').delete().eq('id', helperItem.id);
}

testDelete();
