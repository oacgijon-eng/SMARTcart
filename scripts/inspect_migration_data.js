
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const loadEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) return null;
        const content = fs.readFileSync(envPath, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        });
        return env;
    } catch (e) {
        return null;
    }
};

const env = loadEnv();
if (!env || !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    console.log("--- Locations (Cart IDs) ---");
    const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('id, name, type, parent_id')
        .in('name', ['Carro de curas', 'Carro de paradas', 'Carro de técnicas', 'Carro de Tecnicas', 'Carro de Curas', 'Carro de Paradas']);

    if (locError) console.error("Error fetching locations:", locError);
    else console.table(locations);

    console.log("\n--- Legacy Table Counts ---");
    const tables = ['cart_cures_items', 'cart_crash_items', 'cart_techniques_items'];
    for (const t of tables) {
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
        if (error) console.log(`${t}: Error ${error.message}`);
        else console.log(`${t}: ${count} rows`);
    }

    console.log("\n--- Schema Check (First Row) ---");
    const { data: sampleLegacy } = await supabase.from('cart_cures_items').select('*').limit(1);
    console.log("Legacy (cart_cures_items):", sampleLegacy?.[0] ? Object.keys(sampleLegacy[0]) : "Empty");

    const { data: sampleUnified } = await supabase.from('cart_contents').select('*').limit(1);
    console.log("Unified (cart_contents):", sampleUnified?.[0] ? Object.keys(sampleUnified[0]) : "Empty");
}

inspect();
