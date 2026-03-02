
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

// Simple env parser
const envConfig = {};
try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) {
            envConfig[key.trim()] = val.trim();
        }
    });
} catch (e) {
    console.error('Could not read .env file');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || envConfig.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Listing tables...');
    // This is a bit hacky on client-side, but we can query information_schema if enabled, 
    // or just try to select from expected tables.

    const tablesToCheck = ['cart_items', 'cart_contents', 'locations', 'cart_techniques_items'];

    for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && error.code === '42P01') { // undefined_table
            console.log(`Table '${table}' DOES NOT exist.`);
        } else if (!error) {
            console.log(`Table '${table}' EXISTS.`);
        } else {
            console.log(`Table '${table}' status unknown (Error: ${error.message})`);
        }
    }

    // Also check locations for 'CART' type
    const { data: locations } = await supabase.from('locations').select('*').eq('type', 'CART');
    console.log('Generic Cart Locations:', locations?.map(l => ({ id: l.id, name: l.name })));
}

main();
