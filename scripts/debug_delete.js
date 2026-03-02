
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';


import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars manually
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim();
    }
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
    console.log('Checking constraints on locations table...');
    // We can't easily query information_schema with supabase-js unless we have a specialized function or permissions.
    // But we can try to DELETE a parent location and see the specific error.

    // 1. Create a dummy parent and child
    console.log('Creating dummy hierarchy...');
    const { data: parent, error: pErr } = await supabase.from('locations').insert({ name: 'Debug Parent', type: 'CART' }).select().single();
    if (pErr) { console.error('Parent create fail:', pErr); return; }

    const { data: child, error: cErr } = await supabase.from('locations').insert({ name: 'Debug Child', type: 'CART', parent_id: parent.id }).select().single();
    if (cErr) { console.error('Child create fail:', cErr); return; }

    console.log(`Created Parent (${parent.id}) and Child (${child.id})`);

    // 2. Try to DELETE Parent
    console.log('Attempting to delete Parent...');
    const { error: delError } = await supabase.from('locations').delete().eq('id', parent.id);

    if (delError) {
        console.error('DELETE FAILED with error:');
        console.error(JSON.stringify(delError, null, 2));
    } else {
        console.log('DELETE SUCCESSFUL! Cascade is working.');
    }
}

checkConstraints();
