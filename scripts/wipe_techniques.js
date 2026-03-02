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

async function wipeTechniques() {
    console.log('--- STARTING TECHNIQUE WIPE ---');

    // 1. Delete all technique items (dependencies)
    console.log('Deleting all technique_items...');
    const { error: itemsError, count: itemsCount } = await supabase
        .from('technique_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Hack to delete all

    if (itemsError) {
        console.error('Error deleting technique_items:', itemsError);
    } else {
        console.log(`Deleted technique_items.`);
    }

    // 2. Delete all techniques
    console.log('Deleting all techniques...');
    const { error: techError, count: techCount } = await supabase
        .from('techniques')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (techError) {
        console.error('Error deleting techniques:', techError);
    } else {
        console.log(`Deleted techniques.`);
    }

    console.log('--- WIPE COMPLETE ---');
}

wipeTechniques();
