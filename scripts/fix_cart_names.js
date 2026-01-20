
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
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
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function fixNames() {
    console.log("Checking for carts with lowercase names...");

    // Fix "Carro de curas" -> "Carro de Curas"
    const { data: curas, error: errCuras } = await supabase
        .from('locations')
        .update({ name: 'Carro de Curas' })
        .ilike('name', 'carro de curas')
        .select();

    if (errCuras) console.error("Error updating Curas:", errCuras);
    else console.log(`Updated ${curas.length} instances of 'Carro de Curas'`);

    // Fix "Carro de paradas" -> "Carro de Paradas"
    const { data: paradas, error: errParadas } = await supabase
        .from('locations')
        .update({ name: 'Carro de Paradas' })
        .ilike('name', 'carro de paradas')
        .select();

    if (errParadas) console.error("Error updating Paradas:", errParadas);
    else console.log(`Updated ${paradas.length} instances of 'Carro de Paradas'`);

    // Fix "Carro técnicas" / "Carro de tecnicas" -> "Carro de Técnicas"
    const { data: tech, error: errTech } = await supabase
        .from('locations')
        .update({ name: 'Carro de Técnicas' })
        .or('name.ilike.carro de tecnicas,name.ilike.carro tecnicas,name.ilike.carro de técnicas')
        .select();

    if (errTech) console.error("Error updating Técnicas:", errTech);
    else console.log(`Updated ${tech.length} instances of 'Carro de Técnicas'`);
}

fixNames();
