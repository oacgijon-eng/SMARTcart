
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

async function createTechCart() {
    // 1. Check if exists
    const { data: existing } = await supabase
        .from('locations')
        .select('*')
        .ilike('name', '%Carro de T%cnicas%'); // Fuzzy match for T_cnicas

    if (existing && existing.length > 0) {
        console.log("Techniques cart already exists:", existing[0].id, existing[0].name);
        return existing[0].id;
    }

    // 2. Create if not
    console.log("Creating 'Carro de Técnicas'...");
    const { data, error } = await supabase
        .from('locations')
        .insert([{
            name: 'Carro de Técnicas',
            type: 'CART',
            parent_id: null,
            color: '#8b5cf6' // A nice purple for techniques
        }])
        .select()
        .single();

    if (error) {
        console.error("Error creating cart:", error);
        return null;
    }

    console.log("Created successfully:", data.id);
    return data.id;
}

createTechCart();
