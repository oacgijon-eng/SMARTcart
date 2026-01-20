
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeItems() {
    console.log('--- STARTING ITEMS WIPE ---');

    // Delete all items
    console.log('Deleting all items...');
    const { error: itemsError, count: itemsCount } = await supabase
        .from('items') // Ensure this matches your table name
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (itemsError) {
        console.error('Error deleting items:', itemsError);
    } else {
        console.log(`Deleted items.`);
    }

    console.log('--- WIPE COMPLETE ---');
}

wipeItems();
