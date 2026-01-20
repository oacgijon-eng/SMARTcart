
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Checking locations table...');
    const { data: locations, error } = await supabase
        .from('locations')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${locations.length} locations.`);

    // Check for "special" carts
    const specialCarts = locations.filter(l => ['CART', 'CURES', 'CRASH'].includes(l.type) || ['Carro de Técnicas', 'Carro de Curas', 'Carro de Paradas'].includes(l.name));
    console.log('Special/Cart Locations found:', specialCarts);
}

main();
